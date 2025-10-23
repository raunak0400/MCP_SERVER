# Plugin Development Guide

## Overview

This MCP Server supports three types of plugins:

1. **Python Plugins** - Dynamic, interpreted plugins for data processing
2. **C Plugins** - High-performance compiled plugins for system-level operations
3. **C++ Plugins** - Modern C++ plugins with OOP and template support

## Python Plugins

### Location
`src/plugins/external/python/`

### Available Plugins

#### data_processor.py (~500 lines)
Comprehensive data analysis and processing plugin with:

- **Validation**: Email, URL, regex, type checking, range validation
- **Statistical Analysis**: Mean, median, variance, stddev, correlation, outliers (IQR method)
- **Data Transformation**: Min-max normalization, z-score standardization, log transforms, binning, pivot tables
- **String Processing**: Text cleaning, tokenization, n-grams, Levenshtein distance
- **Cryptography**: Hashing (MD5, SHA256, SHA512), Base64 encoding/decoding

**Usage:**
```bash
python src/plugins/external/python/data_processor.py '{"action":"analyze","data":[1,2,3,4,5]}'
```

**Actions:**
- `validate` - Validate data against rules
- `analyze` - Statistical analysis (describe, correlation, moving_average, outliers)
- `transform` - Data transformations (normalize, zscore, log, bin)
- `aggregate` - Aggregate data with pivot tables
- `text` - Text processing (clean, extract_numbers, tokenize, ngrams, distance)
- `crypto` - Cryptographic operations (hash, encode, decode)

## C Plugins

### Location
`src/plugins/external/c/`

### Available Plugins

#### utils.c (~500 lines)
Low-level utility library featuring:

- **Data Structures**: Dynamic Vector, HashMap with chaining, StringBuilder
- **String Processing**: Trim, case conversion, split, replace, prefix/suffix checking
- **JSON Parser**: Simplified JSON parser supporting all JSON types
- **Memory Management**: RAII-style cleanup, efficient allocation

**Building:**
```bash
# Linux/Mac
gcc -O2 -Wall -std=c11 -o src/plugins/external/c/utils src/plugins/external/c/utils.c

# Windows (MinGW)
gcc -O2 -Wall -std=c11 -o src/plugins/external/c/utils.exe src/plugins/external/c/utils.c
```

**Usage:**
```bash
./src/plugins/external/c/utils '{"test":"data"}'
```

## C++ Plugins

### Location
`src/plugins/external/cpp/`

### Available Plugins

#### processor.cpp (~500 lines)
Modern C++17/20 plugin framework with:

- **OOP Design**: Abstract plugin interface, RAII resources
- **Templates**: Generic statistics, result types with variant
- **Statistics**: Mean, median, variance, stddev, describe
- **String Utilities**: Trim, case conversion, split/join, regex matching
- **Async Tasks**: Future-based async execution, timer utilities
- **Cache**: TTL-based cache with automatic expiration
- **JSON**: Simplified JSON value type with variant storage

**Building:**
```bash
# Linux/Mac
g++ -O2 -Wall -std=c++17 -pthread -o src/plugins/external/cpp/processor src/plugins/external/cpp/processor.cpp

# Windows (MinGW)
g++ -O2 -Wall -std=c++17 -o src/plugins/external/cpp/processor.exe src/plugins/external/cpp/processor.cpp
```

**Usage:**
```bash
./src/plugins/external/cpp/processor '{"action":"stats","data":[1,2,3,4,5]}'
```

**Actions:**
- `stats` - Compute statistical summary
- `transform` - Transform data
- `filter` - Filter data by criteria
- `sort` - Sort data
- `string` - String operations (trim, upper, lower, split)
- `benchmark` - Performance benchmarking

## Build Scripts

### Automated Build

**Linux/Mac:**
```bash
npm run build:plugins
# or
bash scripts/build-plugins.sh
```

**Windows:**
```bash
npm run build:plugins:win
# or
scripts\build-plugins.bat
```

The build scripts will:
1. Detect available compilers (GCC, G++, MSVC)
2. Compile all C plugins with optimization flags
3. Compile all C++ plugins with C++17 standard
4. Report build status for each plugin

## Plugin Manifest

Plugins are registered in `src/plugins/manifest.json`:

```json
[
  {
    "name": "py_data_processor",
    "command": "python",
    "args": ["src/plugins/external/python/data_processor.py"]
  },
  {
    "name": "c_utils",
    "command": "src/plugins/external/c/utils.exe"
  },
  {
    "name": "cpp_processor",
    "command": "src/plugins/external/cpp/processor.exe"
  }
]
```

## Testing Plugins

### Via MCP Server API

```bash
curl -X POST http://localhost:3000/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "plugin": "py_data_processor",
    "action": "analyze",
    "payload": {
      "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "type": "describe"
    }
  }'
```

### Via npm Script

```bash
npm run plugin:run -- --plugin py_data_processor --action analyze --payload '{"data":[1,2,3]}'
```

### Direct Execution

**Python:**
```bash
python src/plugins/external/python/data_processor.py '{"action":"stats","data":[1,2,3]}'
```

**C:**
```bash
./src/plugins/external/c/utils '{"key":"value"}'
```

**C++:**
```bash
./src/plugins/external/cpp/processor '{"action":"benchmark"}'
```

## Performance Comparison

Approximate performance characteristics:

| Language | Startup | Throughput | Memory | Use Case |
|----------|---------|------------|--------|----------|
| Python   | ~50ms   | Medium     | High   | Data science, ML, rapid development |
| C        | ~1ms    | Very High  | Low    | System utils, parsers, embedded |
| C++      | ~2ms    | Very High  | Medium | Complex algorithms, OOP design |

## Adding New Plugins

1. Create plugin file in appropriate language directory
2. Implement required interface:
   - Python: Accept JSON via `sys.argv[1]`, print JSON result
   - C/C++: Accept JSON via `argv[1]`, print JSON to stdout
3. Add entry to `src/plugins/manifest.json`
4. For C/C++: Update build scripts
5. Test via MCP API or direct execution

## Dependencies

### Python
- Python 3.8+
- Standard library only (no external packages required for base plugins)

### C
- GCC 7+ or Clang 8+ or MSVC 2019+
- C11 standard support

### C++
- G++ 7+ or Clang 8+ or MSVC 2019+
- C++17 standard support
- pthread (Linux/Mac)

## Best Practices

1. **Error Handling**: Always return JSON with error field on failure
2. **Input Validation**: Validate all inputs before processing
3. **Memory Safety**: Use RAII in C++, check all allocations in C
4. **Performance**: Profile before optimizing, use appropriate data structures
5. **Security**: Sanitize inputs, avoid shell injection, validate file paths
6. **Documentation**: Comment complex algorithms, document public APIs

## Troubleshooting

### Plugin Not Found
- Check `manifest.json` has correct paths
- Verify plugin file exists and has execute permissions (Linux/Mac)
- For compiled plugins, ensure build was successful

### Compilation Errors
- Verify compiler is installed and in PATH
- Check compiler version meets minimum requirements
- Review build output for specific error messages

### Runtime Errors
- Test plugin directly with sample JSON input
- Check plugin logs/stdout for error messages
- Verify JSON payload format matches plugin expectations

## Resources

- [Python JSON Module](https://docs.python.org/3/library/json.html)
- [C Programming](https://en.cppreference.com/w/c)
- [C++ Reference](https://en.cppreference.com/w/)
- [Modern C++ Best Practices](https://isocpp.github.io/CppCoreGuidelines/)
