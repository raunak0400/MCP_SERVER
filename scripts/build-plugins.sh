#!/usr/bin/env bash
# Build script for compiling C and C++ plugins

set -e

echo "Building C and C++ plugins..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
C_DIR="src/plugins/external/c"
CPP_DIR="src/plugins/external/cpp"

# Check for compilers
if ! command -v gcc &> /dev/null; then
    echo -e "${RED}Error: GCC not found. Please install GCC.${NC}"
    exit 1
fi

if ! command -v g++ &> /dev/null; then
    echo -e "${RED}Error: G++ not found. Please install G++.${NC}"
    exit 1
fi

echo -e "${YELLOW}Compiler versions:${NC}"
gcc --version | head -1
g++ --version | head -1
echo ""

# Build C plugins
echo -e "${YELLOW}Building C plugins...${NC}"

if [ -f "$C_DIR/echo.c" ]; then
    echo "  Building echo.c..."
    gcc -O2 -Wall -Wextra -o "$C_DIR/echo" "$C_DIR/echo.c"
    echo -e "  ${GREEN}✓${NC} echo.c compiled successfully"
fi

if [ -f "$C_DIR/utils.c" ]; then
    echo "  Building utils.c..."
    gcc -O2 -Wall -Wextra -std=c11 -lm -o "$C_DIR/utils" "$C_DIR/utils.c"
    echo -e "  ${GREEN}✓${NC} utils.c compiled successfully"
fi

# Build C++ plugins
echo -e "${YELLOW}Building C++ plugins...${NC}"

if [ -f "$CPP_DIR/echo.cpp" ]; then
    echo "  Building echo.cpp..."
    g++ -O2 -Wall -Wextra -std=c++17 -o "$CPP_DIR/echo" "$CPP_DIR/echo.cpp"
    echo -e "  ${GREEN}✓${NC} echo.cpp compiled successfully"
fi

if [ -f "$CPP_DIR/processor.cpp" ]; then
    echo "  Building processor.cpp..."
    g++ -O2 -Wall -Wextra -std=c++17 -pthread -o "$CPP_DIR/processor" "$CPP_DIR/processor.cpp"
    echo -e "  ${GREEN}✓${NC} processor.cpp compiled successfully"
fi

echo ""
echo -e "${GREEN}Build completed successfully!${NC}"
echo ""
echo "Built plugins:"
ls -lh "$C_DIR"/*.exe "$C_DIR"/echo "$C_DIR"/utils 2>/dev/null || true
ls -lh "$CPP_DIR"/*.exe "$CPP_DIR"/echo "$CPP_DIR"/processor 2>/dev/null || true

echo ""
echo "To test plugins:"
echo "  C utils:    $C_DIR/utils '{\"test\":\"data\"}'"
echo "  C++ proc:   $CPP_DIR/processor '{\"action\":\"stats\"}'"
