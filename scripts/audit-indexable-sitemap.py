#!/usr/bin/env python3
"""Check that every sitemap URL returns an indexable, self-canonical 200 page."""

import argparse
import concurrent.futures
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlsplit, urlunsplit


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.robots = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href")
        if tag == "meta" and values.get("name", "").lower() in ("robots", "googlebot"):
            self.robots.append(values.get("content", ""))


def fetch(url):
    result = subprocess.run(
        ["curl", "--silent", "--show-error", "--max-time", "20", "--retry", "2",
         "--retry-all-errors", "--retry-delay", "1", "--dump-header", "-",
         "--write-out", "\n__AUDIT_STATUS__%{http_code}", url],
        capture_output=True,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.decode("utf-8", errors="replace").strip())
    payload, marker, status_text = result.stdout.rpartition(b"\n__AUDIT_STATUS__")
    if not marker:
        raise RuntimeError("curl did not return a status marker")
    headers = {}
    while payload.startswith(b"HTTP/"):
        match = re.search(rb"\r?\n\r?\n", payload)
        if not match:
            raise RuntimeError("HTTP headers were incomplete")
        block, payload = payload[:match.start()], payload[match.end():]
        headers = {}
        for line in block.splitlines()[1:]:
            if b":" in line:
                name, value = line.split(b":", 1)
                headers[name.decode("ascii", errors="ignore").lower()] = value.decode("utf-8", errors="replace").strip()
    return int(status_text), headers, payload


def inspect(entry, base_url):
    url = entry
    if base_url:
        original = urlsplit(entry)
        base = urlsplit(base_url)
        url = urlunsplit((base.scheme, base.netloc, original.path, original.query, ""))
    try:
        status, headers, body = fetch(url)
        parser = MetadataParser()
        if status == 200:
            parser.feed(body.decode("utf-8", errors="replace"))
        issues = []
        if status != 200:
            issues.append(f"HTTP {status}")
        canonical_matches = parser.canonical == entry or (
            parser.canonical == entry.rstrip("/") and urlsplit(entry).path == "/"
        )
        if status == 200 and not canonical_matches:
            issues.append(f"canonical={parser.canonical!r}")
        robots = " ".join(parser.robots + [headers.get("x-robots-tag", "")])
        if "noindex" in robots.lower():
            issues.append("noindex")
        return {"url": entry, "status": status, "canonical": parser.canonical, "issues": issues}
    except Exception as error:
        return {"url": entry, "status": None, "canonical": None, "issues": [str(error)]}


def main():
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("--sitemap", default="https://cowinmachine.com/sitemap.xml")
    argument_parser.add_argument("--base-url", help="Fetch pages from this origin while comparing their production canonicals")
    argument_parser.add_argument("--json", action="store_true", help="Print all per-URL results as JSON")
    args = argument_parser.parse_args()

    status, _, xml = fetch(args.sitemap)
    if status != 200:
        raise SystemExit(f"Sitemap returned HTTP {status}")
    root = ET.fromstring(xml)
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [element.text for element in root.findall("sm:url/sm:loc", namespace)]
    if not urls or len(urls) != len(set(urls)):
        raise SystemExit("Sitemap has no URLs or contains duplicates")

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda url: inspect(url, args.base_url), urls))
    failures = [result for result in results if result["issues"]]
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(f"Checked {len(results)} sitemap URLs; {len(failures)} failed.")
        for result in failures:
            print(f"{result['url']}: {', '.join(result['issues'])}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
