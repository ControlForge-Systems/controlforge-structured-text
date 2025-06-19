#!/bin/bash

# Script to package and publish the ControlForge Structured Text extension

# Ensure script exits on error
set -e

# Display info
echo "=== ControlForge Structured Text Extension Packaging ==="
echo "Building and packaging extension..."

# Compile the extension
npm run compile

# Package the extension with correct image URLs
vsce package --baseContentUrl=https://github.com/ControlForge-Systems/controlforge-structured-text/raw/main --baseImagesUrl=https://github.com/ControlForge-Systems/controlforge-structured-text/raw/main/images

# Ask if user wants to publish
read -p "Do you want to publish the extension to VS Code Marketplace? (y/n): " PUBLISH

if [[ $PUBLISH == "y" || $PUBLISH == "Y" ]]; then
    echo "Publishing extension to VS Code Marketplace..."
    vsce publish --baseContentUrl=https://github.com/ControlForge-Systems/controlforge-structured-text/raw/main --baseImagesUrl=https://github.com/ControlForge-Systems/controlforge-structured-text/raw/main/images
    echo "Extension published successfully!"
else
    echo "Extension packaged but not published."
    echo "To publish manually, run: npm run publish"
fi

echo "Done!"
