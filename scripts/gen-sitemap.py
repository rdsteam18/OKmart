#!/usr/bin/env python3
"""Regenerate sitemap.xml for OKmart (okmart.netlify.app).

WHAT IT DOES
  Reads the LIVE Firestore collections (public read, no key needed) and
  rebuilds sitemap.xml with:
    - all existing static / category / FAQ entries (kept verbatim from the
      previous sitemap.xml, so their lastmod/changefreq/priority never churn)
    - one URL per ACTIVE product:  https://okmart.netlify.app/product.html?id=<doc-id>
    - one URL per ACTIVE deal:     https://okmart.netlify.app/deal.html?id=<doc-id>

WHEN TO RE-RUN (required)
  Products are added/removed frequently, so the sitemap goes stale fast.
  Re-run this script after every product add/remove (and after new deals):
      cd ~/workspace/okmart-fresh && python3 scripts/gen-sitemap.py
  Then commit + push sitemap.xml with the same change. No other step needed.

REQUIREMENTS: python3 stdlib only, internet access to Firestore REST.
Data source: Firestore project okmart-e6219, collections "products" and
"deals" (both publicly readable, same data the site itself renders).
No product data is invented here — every URL comes from a real doc id.
"""

import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from xml.sax.saxutils import escape

BASE_URL = "https://okmart.netlify.app"
PROJECT = "okmart-e6219"
REST = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
TODAY = date.today().isoformat()


def fetch_collection(coll):
    """Fetch all docs of a collection via public Firestore REST (paginated)."""
    docs, page_token = [], None
    while True:
        url = f"{REST}/{coll}?pageSize=300"
        if page_token:
            url += f"&pageToken={page_token}"
        with urllib.request.urlopen(url, timeout=60) as resp:
            data = json.load(resp)
        docs.extend(data.get("documents", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return docs


def is_active(doc):
    """A doc counts only if its 'active' field is true or absent."""
    fields = doc.get("fields", {})
    if "active" not in fields:
        return True
    return fields["active"].get("booleanValue", False) is True


def doc_id(doc):
    return doc["name"].rsplit("/", 1)[-1]


def static_entries(path):
    """Keep every existing sitemap entry verbatim (raw text, NOT re-serialized,
    so no namespace prefixes creep in) except product/deal detail URLs,
    which are regenerated fresh below."""
    import re
    with open(path, encoding="utf-8") as f:
        text = f.read()
    kept = []
    for entry in re.findall(r"<url>.*?</url>", text, re.DOTALL):
        if "product.html?id=" in entry or "deal.html?id=" in entry:
            continue
        kept.append("  " + entry.strip() + "\n")
    return kept


def url_entry(loc, lastmod, changefreq, priority):
    return (
        f"  <url><loc>{escape(loc)}</loc><lastmod>{lastmod}</lastmod>"
        f"<changefreq>{changefreq}</changefreq><priority>{priority}</priority></url>\n"
    )


def main():
    import os

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sitemap_path = os.path.join(repo_root, "sitemap.xml")

    products = [d for d in fetch_collection("products") if is_active(d)]
    deals = [d for d in fetch_collection("deals") if is_active(d)]
    products.sort(key=doc_id)
    deals.sort(key=doc_id)

    static = static_entries(sitemap_path)

    parts = ['<?xml version="1.0" encoding="UTF-8"?>\n',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n']
    parts.extend(static)
    for d in products:
        parts.append(url_entry(f"{BASE_URL}/product.html?id={doc_id(d)}",
                               TODAY, "weekly", "0.7"))
    for d in deals:
        parts.append(url_entry(f"{BASE_URL}/deal.html?id={doc_id(d)}",
                               TODAY, "daily", "0.8"))
    parts.append("</urlset>\n")

    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.writelines(parts)

    # Validate: the written file must parse as XML with the right URL count.
    tree = ET.parse(sitemap_path)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    parsed = len(tree.getroot().findall("s:url", ns))
    assert parsed == len(static) + len(products) + len(deals), (
        f"sitemap URL count mismatch: parsed {parsed}")

    print(f"static entries kept: {len(static)}")
    print(f"product URLs added: {len(products)}")
    print(f"deal URLs added: {len(deals)}")
    print(f"total URLs: {len(static) + len(products) + len(deals)}")
    print(f"wrote {sitemap_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — fail loudly, never write partial
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
