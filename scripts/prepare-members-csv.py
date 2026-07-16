#!/usr/bin/env python3
"""Prepare a Zoho members export for import-offline-members."""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import Counter
from pathlib import Path

OUTPUT_COLUMNS = [
    "Email",
    "First Name",
    "Last Name",
    "Phone",
    "Country Code",
    "Timezone ID",
    "Sex",
    "Renewal Months",
    "Program Interest",
    "Batch",
    "Lead Source",
    "Manual Tag",
    "Created Time",
]

E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")

COUNTRY_NAME_TO_ISO = {
    "india": "IN",
    "united states": "US",
    "united kingdom": "GB",
    "canada": "CA",
    "singapore": "SG",
    "australia": "AU",
    "united arab emirates": "AE",
    "germany": "DE",
    "new zealand": "NZ",
    "netherlands": "NL",
    "denmark": "DK",
    "spain": "ES",
    "bhutan": "BT",
    "sweden": "SE",
    "qatar": "QA",
    "ireland": "IE",
    "luxembourg": "LU",
    "belgium": "BE",
    "afghanistan": "AF",
    "jordan": "JO",
}

COUNTRY_DIAL = {
    "india": "91",
    "united states": "1",
    "united kingdom": "44",
    "canada": "1",
    "australia": "61",
    "singapore": "65",
    "uae": "971",
    "united arab emirates": "971",
    "germany": "49",
    "ireland": "353",
    "new zealand": "64",
    "netherlands": "31",
    "denmark": "45",
    "spain": "34",
    "bhutan": "975",
    "sweden": "46",
    "qatar": "974",
    "luxembourg": "352",
    "belgium": "32",
    "afghanistan": "93",
    "jordan": "962",
}

ZOHO_TZ_TO_IANA = {
    "India — Kolkata (UTC+05:30)": "Asia/Kolkata",
    "United States — New York (UTC-04:00)": "America/New_York",
    "Canada — Toronto (UTC-04:00)": "America/Toronto",
    "United Kingdom (UK) — London (UTC+00:00)": "Europe/London",
    "United States — Los Angeles (UTC-07:00)": "America/Los_Angeles",
    "United States — Chicago (UTC-05:00)": "America/Chicago",
    "Singapore — Singapore (UTC+08:00)": "Asia/Singapore",
    "United Arab Emirates — Dubai (UTC+04:00)": "Asia/Dubai",
    "Germany — Berlin (UTC+01:00)": "Europe/Berlin",
    "New Zealand — Auckland (UTC+13:00)": "Pacific/Auckland",
    "Netherlands — Amsterdam (UTC+01:00)": "Europe/Amsterdam",
    "Australia — Sydney (UTC+11:00)": "Australia/Sydney",
    "Spain — Madrid (UTC+01:00)": "Europe/Madrid",
    "Denmark — Copenhagen (UTC+01:00)": "Europe/Copenhagen",
    "Australia — Melbourne (UTC+11:00)": "Australia/Melbourne",
    "Australia — Brisbane (UTC+10:00)": "Australia/Brisbane",
    "Bhutan — Thimphu (UTC+06:00)": "Asia/Thimphu",
    "Sweden — Stockholm (UTC+01:00)": "Europe/Stockholm",
    "Belgium — Brussels (UTC+01:00)": "Europe/Brussels",
    "Australia — Perth (UTC+08:00)": "Australia/Perth",
    "Afghanistan — Kabul (UTC+04:30)": "Asia/Kabul",
    "United States — Detroit (UTC-04:00)": "America/Detroit",
    "Qatar — Qatar (UTC+03:00)": "Asia/Qatar",
    "Ireland — Dublin (UTC+00:00)": "Europe/Dublin",
    "Luxembourg — Luxembourg (UTC+01:00)": "Europe/Luxembourg",
    "Jordan — Amman (UTC+03:00)": "Asia/Amman",
}

COUNTRY_DEFAULT_TZ = {
    "IN": "Asia/Kolkata",
    "US": "America/New_York",
    "GB": "Europe/London",
    "CA": "America/Toronto",
    "SG": "Asia/Singapore",
    "AU": "Australia/Sydney",
    "AE": "Asia/Dubai",
    "DE": "Europe/Berlin",
    "NZ": "Pacific/Auckland",
    "NL": "Europe/Amsterdam",
    "DK": "Europe/Copenhagen",
    "ES": "Europe/Madrid",
    "BT": "Asia/Thimphu",
    "SE": "Europe/Stockholm",
    "QA": "Asia/Qatar",
    "IE": "Europe/Dublin",
    "LU": "Europe/Luxembourg",
    "BE": "Europe/Brussels",
    "AF": "Asia/Kabul",
    "JO": "Asia/Amman",
}

RENEWAL_MONTHS = {
    "1 month": 1,
    "3 months": 3,
    "6 months": 6,
    "12 months": 12,
}


def normalize_country_key(country: str) -> str:
    country = country.strip()
    if "(" in country:
        country = country.split("(", 1)[0].strip()
    return country.lower()


def country_name_to_iso(country: str) -> str:
    return COUNTRY_NAME_TO_ISO.get(normalize_country_key(country), "")


def digits_only(phone: str) -> str:
    return re.sub(r"\D", "", phone)


def normalize_phone(phone: str, country: str) -> tuple[str, str]:
    phone = phone.strip()
    if not phone:
        return "", ""

    if E164_PATTERN.match(phone):
        return phone, ""

    country_key = normalize_country_key(country)
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

    if dial and not digits.startswith(dial) and len(digits) >= 8:
        candidate = f"+{dial}{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    if len(digits) >= 10:
        candidate = f"+{digits}"
        if E164_PATTERN.match(candidate):
            return candidate, ""

    return phone, "unfixable"


def map_timezone(raw_tz: str, country_code: str) -> tuple[str, str]:
    raw_tz = raw_tz.strip()
    if raw_tz in ZOHO_TZ_TO_IANA:
        return ZOHO_TZ_TO_IANA[raw_tz], ""
    if country_code and country_code in COUNTRY_DEFAULT_TZ:
        return COUNTRY_DEFAULT_TZ[country_code], "country_default"
    return "", "unmapped"


def map_sex(raw: str) -> str:
    raw = raw.strip().lower()
    if raw == "female":
        return "female"
    if raw == "male":
        return "male"
    return ""


def map_renewal_months(raw: str) -> tuple[int, str]:
    key = raw.strip().lower()
    if key in RENEWAL_MONTHS:
        return RENEWAL_MONTHS[key], ""
    return 0, "invalid_renewal"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--lead-source", default="Old Students")
    parser.add_argument("--tag", default="Old-Students-Jul-2026")
    parser.add_argument("--program", default="Take Control")
    parser.add_argument("--batch", default="Jul 2026")
    args = parser.parse_args()

    stem = args.output.stem
    out_dir = args.output.parent
    phone_summary = out_dir / f"{stem.replace('-prepared', '')}-phone-fix-summary.csv"
    country_summary = out_dir / f"{stem.replace('-prepared', '')}-country-fix-summary.csv"
    timezone_summary = out_dir / f"{stem.replace('-prepared', '')}-timezone-fix-summary.csv"
    report_path = out_dir / f"{stem.replace('-prepared', '')}-prep-report.txt"

    with args.input.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    prepared: list[dict] = []
    phone_changes: list[dict] = []
    country_changes: list[dict] = []
    timezone_changes: list[dict] = []
    email_counts: Counter[str] = Counter()
    stats = {
        "rows": 0,
        "missing_email": 0,
        "invalid_renewal": 0,
        "phones_normalized": 0,
        "empty_phones": 0,
        "invalid_phones": 0,
        "country_fallback_phone": 0,
        "timezone_fallback": 0,
        "timezone_unmapped": 0,
    }

    for line_no, row in enumerate(rows, start=2):
        stats["rows"] += 1
        email = (row.get("Email") or "").strip().lower()
        if not email:
            stats["missing_email"] += 1
            continue

        first = (row.get("First name") or "").strip()
        last = (row.get("Last name") or "").strip()
        country = (row.get("Country") or "").strip()
        raw_tz = (row.get("Time Zone") or "").strip()
        raw_phone = (row.get("Phone Number") or "").strip()
        created = (row.get("Created Time") or "").strip()

        country_code = country_name_to_iso(country)
        if not country_code and raw_phone:
            # crude fallback from + prefix
            digits = digits_only(raw_phone)
            if digits.startswith("91"):
                country_code = "IN"
                stats["country_fallback_phone"] += 1
                country_changes.append(
                    {
                        "line": line_no,
                        "email": email,
                        "country_name": country,
                        "country_code": country_code,
                        "note": "inferred_from_phone",
                    }
                )

        if country and not country_code:
            country_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "country_name": country,
                    "country_code": "",
                    "note": "unmapped",
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

        tz_id, tz_note = map_timezone(raw_tz, country_code)
        if tz_note == "country_default":
            stats["timezone_fallback"] += 1
            timezone_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "raw_timezone": raw_tz,
                    "timezone_id": tz_id,
                    "note": tz_note,
                }
            )
        elif tz_note == "unmapped":
            stats["timezone_unmapped"] += 1
            timezone_changes.append(
                {
                    "line": line_no,
                    "email": email,
                    "raw_timezone": raw_tz,
                    "timezone_id": "",
                    "note": tz_note,
                }
            )

        renewal_months, renewal_note = map_renewal_months(row.get("Renewal Period") or "")
        if renewal_note:
            stats["invalid_renewal"] += 1

        email_counts[email] += 1
        prepared.append(
            {
                "Email": email,
                "First Name": first,
                "Last Name": last,
                "Phone": phone,
                "Country Code": country_code,
                "Timezone ID": tz_id,
                "Sex": map_sex(row.get("Gender") or ""),
                "Renewal Months": str(renewal_months) if renewal_months else "",
                "Program Interest": args.program,
                "Batch": args.batch,
                "Lead Source": args.lead_source,
                "Manual Tag": args.tag,
                "Created Time": created,
            }
        )

    stats["duplicate_emails"] = sum(1 for c in email_counts.values() if c > 1)
    stats["unique_emails"] = len(email_counts)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(prepared)

    for path, rows_out, fields in [
        (phone_summary, phone_changes, ["line", "email", "old_phone", "new_phone", "country", "note"]),
        (country_summary, country_changes, ["line", "email", "country_name", "country_code", "note"]),
        (timezone_summary, timezone_changes, ["line", "email", "raw_timezone", "timezone_id", "note"]),
    ]:
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows_out)

    report = "\n".join(
        [
            f"Input: {args.input}",
            f"Output: {args.output}",
            f"Rows read: {stats['rows']}",
            f"Prepared rows: {len(prepared)}",
            f"Unique emails: {stats['unique_emails']}",
            f"Duplicate emails in file: {stats['duplicate_emails']}",
            f"Missing email: {stats['missing_email']}",
            f"Invalid renewal period: {stats['invalid_renewal']}",
            f"Phones normalized: {stats['phones_normalized']}",
            f"Empty phones: {stats['empty_phones']}",
            f"Invalid/unfixable phones: {stats['invalid_phones']}",
            f"Country inferred from phone: {stats['country_fallback_phone']}",
            f"Timezone country fallback: {stats['timezone_fallback']}",
            f"Timezone unmapped: {stats['timezone_unmapped']}",
            f"Lead source: {args.lead_source}",
            f"Manual tag: {args.tag}",
            f"Program: {args.program}",
            f"Batch: {args.batch}",
        ]
    )
    report_path.write_text(report + "\n", encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
