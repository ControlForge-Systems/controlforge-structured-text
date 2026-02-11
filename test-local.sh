#!/bin/bash
# Quick test script for local extension verification

set -e

echo "🧪 ControlForge Structured Text - Local Test Script"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check dependencies
echo "📦 Step 1: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, running npm install...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi
echo ""

# Step 2: Compile TypeScript
echo "🔨 Step 2: Compiling TypeScript..."
npm run compile
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Compilation successful${NC}"
else
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi
echo ""

# Step 3: Check output files
echo "📂 Step 3: Verifying compiled files..."
if [ -f "out/extension.js" ] && [ -f "out/server/server.js" ]; then
    echo -e "${GREEN}✅ Extension compiled ($(wc -l < out/extension.js) lines)${NC}"
    echo -e "${GREEN}✅ LSP server compiled ($(wc -l < out/server/server.js) lines)${NC}"
else
    echo -e "${RED}❌ Missing compiled files${NC}"
    exit 1
fi
echo ""

# Step 4: Validate package.json
echo "📋 Step 4: Validating extension manifest..."
if command -v vsce &> /dev/null; then
    npx vsce ls > /tmp/vsce-files.txt 2>&1
    FILE_COUNT=$(wc -l < /tmp/vsce-files.txt)
    echo -e "${GREEN}✅ Extension package will include ${FILE_COUNT} files${NC}"
    
    # Check for critical files
    if grep -q "iec61131-definitions" /tmp/vsce-files.txt; then
        echo -e "${GREEN}✅ iec61131-definitions/ will be included${NC}"
    else
        echo -e "${RED}⚠️  iec61131-definitions/ NOT in package (Issue #39)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  vsce not installed, skipping package validation${NC}"
fi
echo ""

# Step 5: Summary
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}✅ TypeScript compilation: PASS${NC}"
echo -e "${GREEN}✅ Extension bundle: READY${NC}"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open this project in VS Code: code ."
echo "   2. Press F5 to launch Extension Development Host"
echo "   3. Create a test.st file"
echo "   4. Test completions (see test-local.md for details)"
echo ""
echo "📝 Or build .vsix package:"
echo "   npx vsce package"
echo "   code --install-extension controlforge-structured-text-1.2.4.vsix"
echo ""
