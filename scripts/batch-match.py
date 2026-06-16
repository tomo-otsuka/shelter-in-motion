#!/usr/bin/env python3
"""
batch-match.py — Match photos from Google Photos takeout to trip stops.

Uses EXIF GPS coordinates and timestamps to assign each photo to the
closest stop (by date range + geographic distance).

Handles Google Photos Takeout's "sidecar JSON" format, where GPS and
timestamp data are stored in companion .json files rather than embedded
in the image's EXIF header.

Usage:
    python3 scripts/batch-match.py [takeout_dir] [stops_file] [--stage staging_dir]

Defaults:
    takeout_dir = ./takeout
    stops_file  = assets/data/stops.json
"""

import argparse
import json
import math
import os
import shutil
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


def read_sidecar_json(filepath):
    """
    Attempt to read Google Photos Takeout JSON sidecar for geo and date data.
    Sidecars are usually named 'filename.jpg.json' or sometimes 'filename.json'.
    """
    json_paths = [
        filepath + ".json",
        os.path.splitext(filepath)[0] + ".json"
    ]
    
    for jp in json_paths:
        if os.path.exists(jp):
            try:
                with open(jp, 'r') as f:
                    data = json.load(f)
                
                coords = None
                dt_str = None
                
                # Check geoData
                geo = data.get("geoData", {})
                lat = geo.get("latitude", 0.0)
                lon = geo.get("longitude", 0.0)
                if lat != 0.0 and lon != 0.0:
                    coords = (lat, lon)
                
                # Check timestamp
                taken = data.get("photoTakenTime", {})
                ts = taken.get("timestamp")
                if ts:
                    # Convert timestamp to EXIF format: YYYY:MM:DD HH:MM:SS
                    dt_obj = datetime.fromtimestamp(int(ts))
                    dt_str = dt_obj.strftime("%Y:%m:%d %H:%M:%S")
                    
                return coords, dt_str
            except Exception:
                continue
    
    return None, None


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
            lat, lon, stop["coordinates"][0], stop["coordinates"][1]
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
            exif = img._getexif() or {}

            dt = exif.get(0x0132)  # DateTime tag
            gps_info = exif.get(0x8825)
            coords = parse_gps(gps_info) if gps_info else None
            camera = exif.get(0x0110, "unknown")

            # Fallback to JSON sidecar if EXIF is missing coords or date
            if not coords or not dt:
                json_coords, json_dt = read_sidecar_json(filepath)
                if not coords and json_coords:
                    coords = json_coords
                if not dt and json_dt:
                    dt = json_dt

            if not dt:
                no_exif.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                    }
                )
                continue

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
                                stop["coordinates"][0],
                                stop["coordinates"][1],
                            ),
                            1,
                        ),
                        "score": round(score, 1),
                        "camera": camera,
                    }
                )
            else:
                unmatched.append(
                    {
                        "file": os.path.basename(filepath),
                        "path": filepath,
                        "date": dt,
                        "gps": coords,
                        "camera": camera,
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


def copy_to_staging(match_data, staging_dir):
    """Copy matched photos into staging directories by stop ID."""
    print("=" * 80)
    print(f"COPYING TO STAGING: {staging_dir}")
    print("=" * 80)
    results = match_data["results"]
    
    os.makedirs(staging_dir, exist_ok=True)
    
    for stop_id, photos in results.items():
        if not photos:
            continue
            
        stop_dir = os.path.join(staging_dir, stop_id)
        os.makedirs(stop_dir, exist_ok=True)
        
        copied = 0
        for p in photos:
            src_path = p["path"]
            filename = p["file"]
            dest_path = os.path.join(stop_dir, filename)
            
            # Avoid re-copying if it already exists
            if not os.path.exists(dest_path):
                try:
                    shutil.copy2(src_path, dest_path)
                    copied += 1
                except Exception as e:
                    print(f"  Error copying {src_path}: {e}")
                    
        print(f"  {stop_id:25s} : copied {copied} new files")


def main():
    parser = argparse.ArgumentParser(description="Match photos to trip stops.")
    parser.add_argument("takeout_dir", nargs="?", default="./takeout", help="Directory containing Takeout photos")
    parser.add_argument("stops_file", nargs="?", default="", help="Path to stops.json")
    parser.add_argument("--stage", dest="staging_dir", help="Directory to copy matched photos into (organized by stop)")
    args = parser.parse_args()

    takeout_dir = args.takeout_dir
    stops_file = args.stops_file
    if not stops_file:
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
    if args.staging_dir:
        print(f"Staging directory : {args.staging_dir}")
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

    # Copy to staging if requested
    if args.staging_dir:
        print()
        copy_to_staging(match_data, args.staging_dir)


if __name__ == "__main__":
    main()
