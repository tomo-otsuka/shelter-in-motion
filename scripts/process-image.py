#!/usr/bin/env python3
import os
import argparse
import sys
from PIL import Image, ImageOps

def main():
    parser = argparse.ArgumentParser(description="Process an image: convert to WebP, resize, and strip EXIF.")
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path to output WebP image")
    parser.add_argument("--size", type=int, default=1200, help="Maximum dimension for resizing (default: 1200)")
    parser.add_argument("--quality", type=int, default=80, help="WebP quality (default: 80)")
    
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' does not exist.")
        sys.exit(1)

    try:
        with Image.open(args.input) as img:
            # Re-orient based on EXIF before stripping it so it's not upside down
            img = ImageOps.exif_transpose(img)
            
            # Convert to RGB to ensure compatibility with WebP format
            img = img.convert("RGB")
            
            # Resize while maintaining aspect ratio
            img.thumbnail((args.size, args.size))
            
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
            
            # Save as WebP without EXIF
            img.save(args.output, "webp", quality=args.quality)
            print(f"Successfully processed: {args.output}")
            
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
