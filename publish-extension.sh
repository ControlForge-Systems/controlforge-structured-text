#!/bin/bash
# Script for securely publishing VS Code extension

# Check if PAT is provided
if [ -z "$1" ]; then
  echo "Error: Personal Access Token (PAT) is required"
  echo "Usage: ./publish-extension.sh <your-pat>"
  exit 1
fi

# Export PAT as environment variable
export VSCE_PAT="$1"

# Package and publish
npm run compile
npm run package
vsce publish -p "$VSCE_PAT"

# Clear the PAT from environment after publishing
unset VSCE_PAT

echo "Extension published successfully!"
