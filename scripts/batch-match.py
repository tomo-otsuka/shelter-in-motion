#!/usr/bin/env python3
"""
batch-match.py — Match photos from Google Photos takeout to trip stops.

Uses EXIF GPS coordinates and timestamps to assign each photo to the
closest stop (by date range + geographic distance).

Usage:
    python3 scripts/batch-match.py [takeout_dir] [stops_file]

Defaults:
    takeout_dir = ./takeout
    stops_file  = assets/data/stops.json
"""

import json
import math
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from fractions import Fraction
from PIL import Image


def parse_gps(gps):
    """Convert PIL GPS dict to (lat, lon) decimal degrees."""
    if not gps:
        return None
    try:
        lat_deg = float(gps[2][0]) + float(gps[2][1]) / 60 + float(gps[2][2]) / 3600
        lon_deg = float(gps[4][0]) + float(gps[4][1]) / 60 + float(gps[4][2]) / 3600
    except (KeyError, TypeError, IndexError):
        return None
    lat = lat_deg if gps.get(1) == "N" else -lat_deg
    lon = -lon_deg if gps.get(3) == "W" else lon_deg
    return (lat, lon)


def haversine(lat1, lon1, lat2, lon2):
    """Distance in km between two lat/lon points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def match_to_stop(lat, lon, date_str, stops):
    """
    Match a photo to the best stop by date range + geographic distance.

    Strategy:
      1. Filter stops by date window (photo date within 7 days of stop range).
      2. Among those, pick the one with lowest (distance + days_away * 100).

    Returns (stop, score) or (None, inf).
    """
    date_part = date_str.split(" ")[0].replace(":", "-")
    try:
        photo_date = datetime.strptime(date_part, "%Y-%m-%d")
    except ValueError:
        return None, float("inf")

    best_stop = None
    best_score = float("inf")

    # Max distance threshold: if a photo is > MAX_DIST km from ALL stops,
    # it's likely from a different location (e.g., post-trip travel) and
    # should not be matched by date alone.
    MAX_DIST = 500  # km — trip was cross-country US, photos should be within
                    # ~500km of a stop to be considered a match

    for stop in stops:
        start_date = datetime.strptime(stop["dateStart"], "%Y-%m-%d")
        end_date = datetime.strptime(stop["dateEnd"], "%Y-%m-%d")

        # Date window: allow 7 days before start and 7 days after end
        buffer_start = start_date - timedelta(days=7)
        buffer_end = end_date + timedelta(days=7)

        if not (buffer_start <= photo_date <= buffer_end):
            continue

        dist = haversine(
            lat, lon, stop["coordinates"][1], stop["coordinates"][0]
        )

        # If distance to this stop is huge, skip — likely from a different
        # location entirely (e.g., post-trip Iceland trip).
        if dist > MAX_DIST:
            continue

        if start_date <= photo_date <= end_date:
            days_away = 0
        elif photo_date < start_date:
            days_away = (start_date - photo_date).days
        else:
            days_away = (photo_date - end_date).days

        score = dist + (days_away * 100)
        if score < best_score:
            best_score = score
            best_stop = stop

    return best_stop, best_score


def collect_photo_files(takeout_dir):
    """
    Walk the Google Photos takeout structure and collect image files.

    Excludes supplemental metadata files, videos, and special formats
    (PORTRAIT, PANO, NIGHT, MP) that are Google Photos variants.
    """
    photo_extensions = (".jpg", ".jpeg", ".png", ".webp")
    exclude_suffixes = (
        ".supplemental",
        ".MP",
        ".MP.jpg",
        ".PANO",
        ".NIGHT",
        ".PORTRAIT",
    )

    photos = []
    for root, dirs, files in os.walk(takeout_dir):
        for fname in files:
            lower = fname.lower()
            # Skip non-image files
            if not any(lower.endswith(ext) for ext in photo_extensions):
                continue
            # Skip Google Photos variants
            if any(lower.endswith(suf) for suf in exclude_suffixes):
                continue
            photos.append(os.path.join(root, fname))

    return photos


def process_photos(photo_files, stops, max_photos=None):
    """Process photos and return match results."""
    results = defaultdict(list)
    unmatched = []
    no_gps = []
    no_exif = []

    limit = max_photos or len(photo_files)

    for i, filepath in enumerate(photo_files[:limit]):
        if i % 100 == 0:
            print(f"  Processing {i}/{len(photo_files)}...", end="\r")

        try:
            img = Image.open(filepath)
            exif = img._getexif()
            if not exif:
                no_exif.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                    }
                )
                continue

            dt = exif.get(0x0132)  # DateTime tag
            if not dt:
                no_exif.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                    }
                )
                continue

            gps_info = exif.get(0x8825)
            coords = parse_gps(gps_info) if gps_info else None
            if not coords:
                no_gps.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                        "date": dt,
                    }
                )
                continue

            stop, score = match_to_stop(coords[0], coords[1], dt, stops)
            if stop:
                results[stop["id"]].append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                        "date": dt,
                        "gps": coords,
                        "distance_km": round(
                            haversine(
                                coords[0],
                                coords[1],
                                stop["coordinates"][1],
                                stop["coordinates"][0],
                            ),
                            1,
                        ),
                        "score": round(score, 1),
                        "camera": exif.get(0x0110, "unknown"),
                    }
                )
            else:
                unmatched.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                        "date": dt,
                        "gps": coords,
                        "camera": exif.get(0x0110, "unknown"),
                    }
                )

        except Exception:
            continue

    print()  # newline after progress
    return {
        "results": dict(results),
        "unmatched": unmatched,
        "no_gps": no_gps,
        "no_exif": no_exif,
    }


def print_summary(match_data, stops):
    """Print a human-readable summary."""
    results = match_data["results"]
    unmatched = match_data["unmatched"]
    no_gps = match_data["no_gps"]
    no_exif = match_data["no_exif"]

    total = len(results) + len(unmatched) + len(no_gps) + len(no_exif)

    print("=" * 80)
    print("MATCH SUMMARY")
    print("=" * 80)
    print(f"  Total photos scanned : {total}")
    print(f"  Matched to stops     : {len(results)}")
    print(f"  No GPS data          : {len(no_gps)}")
    print(f"  No EXIF data         : {len(no_exif)}")
    print(f"  Unmatched (no stop)  : {len(unmatched)}")
    print()

    # Per-stop breakdown
    print("=" * 80)
    print("PHOTOS PER STOP:")
    print("=" * 80)
    for stop in stops:
        sid = stop["id"]
        count = len(results.get(sid, []))
        if count > 0:
            stop_data = results[sid]
            min_dist = min(p["distance_km"] for p in stop_data)
            max_dist = max(p["distance_km"] for p in stop_data)
            print(f"  {sid:25s} {count:4d} photos  (range: {min_dist}-{max_dist} km from center)")

    # Unmatched summary
    if unmatched:
        print()
        print("=" * 80)
        print(f"UNMATCHED PHOTOS ({len(unmatched)}):")
        print("=" * 80)
        for u in unmatched[:50]:
            print(
                f"  {u['file']} | {u['date']} | {u['gps']} | {u['camera']}"
            )
        if len(unmatched) > 50:
            print(f"  ... and {len(unmatched) - 50} more (see JSON for full list)")

    # No-GPS summary
    if no_gps:
        print()
        print("=" * 80)
        print(f"PHOTOS WITHOUT GPS ({len(no_gps)}):")
        print("=" * 80)
        for ng in no_gps[:30]:
            print(f"  {ng['file']} | {ng['date']}")
        if len(no_gps) > 30:
            print(f"  ... and {len(no_gps) - 30} more (see JSON for full list)")


def main():
    if len(sys.argv) > 1:
        takeout_dir = sys.argv[1]
    else:
        takeout_dir = "./takeout"

    if len(sys.argv) > 2:
        stops_file = sys.argv[2]
    else:
        stops_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "assets",
            "data",
            "stops.json",
        )

    # Load stops
    with open(stops_file) as f:
        data = json.load(f)
    stops = data["stops"]

    print(f"Takeout directory : {takeout_dir}")
    print(f"Stops file        : {stops_file}")
    print(f"Stops loaded      : {len(stops)}")
    print()

    # Collect photo files
    print("Collecting photo files...")
    photo_files = collect_photo_files(takeout_dir)
    print(f"  Found {len(photo_files)} photos")
    print()

    # Process
    print("Processing photos...")
    match_data = process_photos(photo_files, stops)

    # Summary
    print_summary(match_data, stops)

    # Save JSON results
    output_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "assets",
        "data",
        "photo_matches.json",
    )
    with open(output_file, "w") as f:
        json.dump(match_data, f, indent=2)
    print()
    print(f"Results saved to {output_file}")


if __name__ == "__main__":
    main()
