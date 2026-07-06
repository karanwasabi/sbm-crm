#!/usr/bin/env python3
"""Prepare a Zoho-style leads export for import-zoho-leads."""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import Counter
from pathlib import Path

OUTPUT_COLUMNS = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Lead Source",
    "Tag",
    "Created Time",
    "Modified Time",
]

E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")

COUNTRY_DIAL = {
    "india": "91",
    "united states": "1",
    "usa": "1",
    "us": "1",
    "united kingdom": "44",
    "uk": "44",
    "canada": "1",
    "australia": "61",
    "singapore": "65",
    "uae": "971",
    "united arab emirates": "971",
    "netherlands": "31",
    "germany": "49",
    "france": "33",
    "ireland": "353",
    "new zealand": "64",
    "qatar": "974",
    "saudi arabia": "966",
    "oman": "968",
    "bahrain": "973",
    "kuwait": "965",
}


def split_name(deal_name: str) -> tuple[str, str]:
    deal_name = deal_name.strip()
    if not deal_name:
        return "", ""
    parts = deal_name.split(None, 1)
    first = parts[0]
    last = parts[1] if len(parts) > 1 else ""
    if not first and last:
        first, last = last, ""
    return first, last


def digits_only(phone: str) -> str:
    return re.sub(r"\D", "", phone)


def normalize_country(country: str) -> str:
    country = country.strip()
    if "(" in country:
        country = country.split("(", 1)[0].strip()
    return country.lower()


def normalize_phone(phone: str, country: str) -> tuple[str, str]:
    """Return (normalized_phone, note). note is empty on success."""
    phone = phone.strip()
    if not phone:
        return "", ""

    if E164_PATTERN.match(phone):
        return phone, ""

    country_key = normalize_country(country)
    dial = COUNTRY_DIAL.get(country_key, "")
    digits = digits_only(phone)

    if not digits:
        return "", "no_digits"

    if phone.startswith("+"):
        candidate = "+" + digits
        if E164_PATTERN.match(candidate):
            return candidate, ""
        return phone, "invalid_e164"

    if dial and digits.startswith(dial) and len(digits) > len(dial):
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if digits.startswith("91") and len(digits) == 12:
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if len(digits) == 10 and digits[0] in "6789" and dial == "91":
        candidate = f"+91{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if digits.startswith("1") and len(digits) == 11:
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if dial == "44" and len(digits) == 10 and digits[0] == "7":
        candidate = f"+44{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if dial == "44" and digits.startswith("44") and len(digits) >= 11:
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if dial and not digits.startswith(dial) and len(digits) >= 8:
        candidate = f"+{dial}{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if len(digits) >= 10:
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    return phone, "unfixable"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--lead-source", default="Old Students")
    parser.add_argument("--tag", default="Old-Students-Jan-2026")
    parser.add_argument("--name-column", default="Deal Name")
    parser.add_argument("--phone-column", default="Phone Number")
    parser.add_argument("--country-column", default="Country")
    parser.add_argument("--email-column", default="Email")
    args = parser.parse_args()

    stem = args.output.stem
    out_dir = args.output.parent
    name_summary = out_dir / f"{stem.replace('-prepared', '')}-name-fix-summary.csv"
    phone_summary = out_dir / f"{stem.replace('-prepared', '')}-phone-fix-summary.csv"
    report_path = out_dir / f"{stem.replace('-prepared', '')}-prep-report.txt"

    with args.input.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    name_changes: list[dict] = []
    phone_changes: list[dict] = []
    prepared: list[dict] = []
    email_counts: Counter[str] = Counter()
    stats = {
        "rows": 0,
        "names_swapped": 0,
        "phones_normalized": 0,
        "empty_phones": 0,
        "invalid_phones": 0,
        "duplicate_emails": 0,
    }

    for line_no, row in enumerate(rows, start=2):
        stats["rows"] += 1
        email = (row.get(args.email_column) or "").strip().lower()
        deal_name = (row.get(args.name_column) or "").strip()
        raw_phone = (row.get(args.phone_column) or "").strip()
        country = (row.get(args.country_column) or "").strip()

        first, last = split_name(deal_name)
        old_first, old_last = first, last
        if not first and last:
            first, last = last, ""
            stats["names_swapped"] += 1
            name_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "old_first": old_first,
                    "old_last": old_last,
                    "new_first": first,
                    "new_last": last,
                }
            )

        phone, note = normalize_phone(raw_phone, country)
        if not raw_phone:
            stats["empty_phones"] += 1
        elif phone != raw_phone:
            stats["phones_normalized"] += 1
            phone_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "old_phone": raw_phone,
                    "new_phone": phone,
                    "country": country,
                    "note": note or "normalized",
                }
            )
        elif note:
            stats["invalid_phones"] += 1
            phone_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "old_phone": raw_phone,
                    "new_phone": phone,
                    "country": country,
                    "note": note,
                }
            )

        email_counts[email] += 1
        prepared.append(
            {
                "First Name": first,
                "Last Name": last,
                "Email": email,
                "Phone": phone,
                "Lead Source": args.lead_source,
                "Tag": args.tag,
                "Created Time": "",
                "Modified Time": "",
            }
        )

    stats["duplicate_emails"] = sum(1 for c in email_counts.values() if c > 1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(prepared)

    if name_changes:
        with name_summary.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["line", "email", "old_first", "old_last", "new_first", "new_last"],
            )
            writer.writeheader()
            writer.writerows(name_changes)
    else:
        name_summary.write_text("line,email,old_first,old_last,new_first,new_last\n", encoding="utf-8")

    with phone_summary.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["line", "email", "old_phone", "new_phone", "country", "note"],
        )
        writer.writeheader()
        writer.writerows(phone_changes)

    report = "\n".join(
        [
            f"Input: {args.input}",
            f"Output: {args.output}",
            f"Rows: {stats['rows']}",
            f"Unique emails: {len(email_counts)}",
            f"Duplicate emails in file: {stats['duplicate_emails']}",
            f"Names swapped (blank first): {stats['names_swapped']}",
            f"Phones normalized: {stats['phones_normalized']}",
            f"Empty phones: {stats['empty_phones']}",
            f"Invalid/unfixable phones: {stats['invalid_phones']}",
            f"Lead source: {args.lead_source}",
            f"Tag: {args.tag}",
        ]
    )
    report_path.write_text(report + "\n", encoding="utf-8")

    print(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
