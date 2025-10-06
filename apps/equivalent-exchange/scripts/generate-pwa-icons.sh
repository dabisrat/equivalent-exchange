#!/bin/bash

# PWA Icon Generator Script
# This script creates placeholder PNG icons from the SVG
# You should replace these with proper high-quality icons

echo "Creating PWA icons..."

# Define icon sizes
sizes=(16 32 72 96 128 144 152 192 384 512)

# Source SVG file
svg_file="/Users/davidbisrat/Workspace/equivalent-exchange/apps/equivalent-exchange/public/icons/icon.svg"
output_dir="/Users/davidbisrat/Workspace/equivalent-exchange/apps/equivalent-exchange/public/icons"

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Please install it to generate PNG icons:"
    echo "brew install imagemagick"
    echo ""
    echo "For now, creating placeholder files..."
    
    # Create placeholder files
    for size in "${sizes[@]}"; do
        touch "$output_dir/icon-${size}x${size}.png"
        echo "Created placeholder: icon-${size}x${size}.png"
    done
    
    # Create apple touch icon
    touch "$output_dir/apple-touch-icon.png"
    echo "Created placeholder: apple-touch-icon.png"
    
else
    # Generate PNG icons from SVG
    for size in "${sizes[@]}"; do
        convert "$svg_file" -resize "${size}x${size}" "$output_dir/icon-${size}x${size}.png"
        echo "Generated: icon-${size}x${size}.png"
    done
    
    # Create apple touch icon (180x180)
    convert "$svg_file" -resize "180x180" "$output_dir/apple-touch-icon.png"
    echo "Generated: apple-touch-icon.png"
fi

echo "PWA icons setup complete!"
echo ""
echo "Note: For production, you should replace the placeholder icons with:"
echo "- High-quality branded icons for your app"
echo "- Icons that follow PWA maskable icon guidelines"
echo "- Screenshots for app store listings"