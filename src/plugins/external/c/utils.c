/*
 * MCP Server - C Utilities Library
 * Comprehensive utility functions for string processing, data structures,
 * file operations, and JSON parsing.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdint.h>
#include <stdbool.h>
#include <time.h>
#include <math.h>

/* ============================================================================
 * Data Structures
 * ============================================================================ */

#define VECTOR_INITIAL_CAPACITY 16
#define HASHMAP_INITIAL_SIZE 32
#define MAX_JSON_DEPTH 64

/* Dynamic array (vector) */
typedef struct {
    void** data;
    size_t size;
    size_t capacity;
} Vector;

/* Hash map entry */
typedef struct HashMapEntry {
    char* key;
    void* value;
    struct HashMapEntry* next;
} HashMapEntry;

/* Hash map */
typedef struct {
    HashMapEntry** buckets;
    size_t size;
    size_t count;
} HashMap;

/* String builder for efficient string concatenation */
typedef struct {
    char* buffer;
    size_t length;
    size_t capacity;
} StringBuilder;

/* JSON value types */
typedef enum {
    JSON_NULL,
    JSON_BOOL,
    JSON_NUMBER,
    JSON_STRING,
    JSON_ARRAY,
    JSON_OBJECT
} JsonType;

/* JSON value */
typedef struct JsonValue {
    JsonType type;
    union {
        bool bool_val;
        double number_val;
        char* string_val;
        Vector* array_val;
        HashMap* object_val;
    } value;
} JsonValue;

/* ============================================================================
 * Vector Implementation
 * ============================================================================ */

Vector* vector_create() {
    Vector* vec = (Vector*)malloc(sizeof(Vector));
    if (!vec) return NULL;
    
    vec->data = (void**)malloc(VECTOR_INITIAL_CAPACITY * sizeof(void*));
    if (!vec->data) {
        free(vec);
        return NULL;
    }
    
    vec->size = 0;
    vec->capacity = VECTOR_INITIAL_CAPACITY;
    return vec;
}

bool vector_push(Vector* vec, void* item) {
    if (!vec) return false;
    
    if (vec->size >= vec->capacity) {
        size_t new_capacity = vec->capacity * 2;
        void** new_data = (void**)realloc(vec->data, new_capacity * sizeof(void*));
        if (!new_data) return false;
        
        vec->data = new_data;
        vec->capacity = new_capacity;
    }
    
    vec->data[vec->size++] = item;
    return true;
}

void* vector_get(Vector* vec, size_t index) {
    if (!vec || index >= vec->size) return NULL;
    return vec->data[index];
}

void* vector_pop(Vector* vec) {
    if (!vec || vec->size == 0) return NULL;
    return vec->data[--vec->size];
}

void vector_free(Vector* vec) {
    if (!vec) return;
    free(vec->data);
    free(vec);
}

/* ============================================================================
 * HashMap Implementation
 * ============================================================================ */

static uint32_t hash_string(const char* str) {
    uint32_t hash = 5381;
    int c;
    
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    }
    
    return hash;
}

HashMap* hashmap_create() {
    HashMap* map = (HashMap*)malloc(sizeof(HashMap));
    if (!map) return NULL;
    
    map->buckets = (HashMapEntry**)calloc(HASHMAP_INITIAL_SIZE, sizeof(HashMapEntry*));
    if (!map->buckets) {
        free(map);
        return NULL;
    }
    
    map->size = HASHMAP_INITIAL_SIZE;
    map->count = 0;
    return map;
}

bool hashmap_set(HashMap* map, const char* key, void* value) {
    if (!map || !key) return false;
    
    uint32_t hash = hash_string(key);
    size_t index = hash % map->size;
    
    HashMapEntry* entry = map->buckets[index];
    
    /* Check if key already exists */
    while (entry) {
        if (strcmp(entry->key, key) == 0) {
            entry->value = value;
            return true;
        }
        entry = entry->next;
    }
    
    /* Create new entry */
    entry = (HashMapEntry*)malloc(sizeof(HashMapEntry));
    if (!entry) return false;
    
    entry->key = strdup(key);
    entry->value = value;
    entry->next = map->buckets[index];
    map->buckets[index] = entry;
    map->count++;
    
    return true;
}

void* hashmap_get(HashMap* map, const char* key) {
    if (!map || !key) return NULL;
    
    uint32_t hash = hash_string(key);
    size_t index = hash % map->size;
    
    HashMapEntry* entry = map->buckets[index];
    
    while (entry) {
        if (strcmp(entry->key, key) == 0) {
            return entry->value;
        }
        entry = entry->next;
    }
    
    return NULL;
}

bool hashmap_has(HashMap* map, const char* key) {
    return hashmap_get(map, key) != NULL;
}

void hashmap_free(HashMap* map) {
    if (!map) return;
    
    for (size_t i = 0; i < map->size; i++) {
        HashMapEntry* entry = map->buckets[i];
        while (entry) {
            HashMapEntry* next = entry->next;
            free(entry->key);
            free(entry);
            entry = next;
        }
    }
    
    free(map->buckets);
    free(map);
}

/* ============================================================================
 * StringBuilder Implementation
 * ============================================================================ */

StringBuilder* sb_create() {
    StringBuilder* sb = (StringBuilder*)malloc(sizeof(StringBuilder));
    if (!sb) return NULL;
    
    sb->buffer = (char*)malloc(256);
    if (!sb->buffer) {
        free(sb);
        return NULL;
    }
    
    sb->buffer[0] = '\0';
    sb->length = 0;
    sb->capacity = 256;
    return sb;
}

bool sb_append(StringBuilder* sb, const char* str) {
    if (!sb || !str) return false;
    
    size_t str_len = strlen(str);
    size_t new_length = sb->length + str_len;
    
    if (new_length >= sb->capacity) {
        size_t new_capacity = sb->capacity;
        while (new_capacity <= new_length) {
            new_capacity *= 2;
        }
        
        char* new_buffer = (char*)realloc(sb->buffer, new_capacity);
        if (!new_buffer) return false;
        
        sb->buffer = new_buffer;
        sb->capacity = new_capacity;
    }
    
    strcpy(sb->buffer + sb->length, str);
    sb->length = new_length;
    return true;
}

bool sb_append_char(StringBuilder* sb, char c) {
    char str[2] = {c, '\0'};
    return sb_append(sb, str);
}

char* sb_to_string(StringBuilder* sb) {
    if (!sb) return NULL;
    return strdup(sb->buffer);
}

void sb_free(StringBuilder* sb) {
    if (!sb) return;
    free(sb->buffer);
    free(sb);
}

/* ============================================================================
 * String Processing Utilities
 * ============================================================================ */

char* str_trim(const char* str) {
    if (!str) return NULL;
    
    /* Skip leading whitespace */
    while (isspace(*str)) str++;
    
    if (*str == '\0') return strdup("");
    
    /* Find end of string */
    const char* end = str + strlen(str) - 1;
    while (end > str && isspace(*end)) end--;
    
    /* Allocate trimmed string */
    size_t len = end - str + 1;
    char* trimmed = (char*)malloc(len + 1);
    if (!trimmed) return NULL;
    
    memcpy(trimmed, str, len);
    trimmed[len] = '\0';
    return trimmed;
}

char* str_to_upper(const char* str) {
    if (!str) return NULL;
    
    char* upper = strdup(str);
    if (!upper) return NULL;
    
    for (size_t i = 0; upper[i]; i++) {
        upper[i] = toupper(upper[i]);
    }
    
    return upper;
}

char* str_to_lower(const char* str) {
    if (!str) return NULL;
    
    char* lower = strdup(str);
    if (!lower) return NULL;
    
    for (size_t i = 0; lower[i]; i++) {
        lower[i] = tolower(lower[i]);
    }
    
    return lower;
}

bool str_starts_with(const char* str, const char* prefix) {
    if (!str || !prefix) return false;
    return strncmp(str, prefix, strlen(prefix)) == 0;
}

bool str_ends_with(const char* str, const char* suffix) {
    if (!str || !suffix) return false;
    
    size_t str_len = strlen(str);
    size_t suffix_len = strlen(suffix);
    
    if (suffix_len > str_len) return false;
    
    return strcmp(str + str_len - suffix_len, suffix) == 0;
}

Vector* str_split(const char* str, const char* delimiter) {
    if (!str || !delimiter) return NULL;
    
    Vector* parts = vector_create();
    if (!parts) return NULL;
    
    char* str_copy = strdup(str);
    if (!str_copy) {
        vector_free(parts);
        return NULL;
    }
    
    char* token = strtok(str_copy, delimiter);
    while (token) {
        char* part = strdup(token);
        if (part) {
            vector_push(parts, part);
        }
        token = strtok(NULL, delimiter);
    }
    
    free(str_copy);
    return parts;
}

char* str_replace(const char* str, const char* old_substr, const char* new_substr) {
    if (!str || !old_substr || !new_substr) return NULL;
    
    StringBuilder* sb = sb_create();
    if (!sb) return NULL;
    
    size_t old_len = strlen(old_substr);
    const char* pos = str;
    const char* found;
    
    while ((found = strstr(pos, old_substr)) != NULL) {
        /* Append text before match */
        size_t prefix_len = found - pos;
        char* prefix = (char*)malloc(prefix_len + 1);
        if (prefix) {
            memcpy(prefix, pos, prefix_len);
            prefix[prefix_len] = '\0';
            sb_append(sb, prefix);
            free(prefix);
        }
        
        /* Append replacement */
        sb_append(sb, new_substr);
        
        pos = found + old_len;
    }
    
    /* Append remaining text */
    sb_append(sb, pos);
    
    char* result = sb_to_string(sb);
    sb_free(sb);
    return result;
}

/* ============================================================================
 * JSON Parser (Simplified)
 * ============================================================================ */

static void skip_whitespace(const char** json) {
    while (isspace(**json)) (*json)++;
}

static JsonValue* json_parse_value(const char** json, int depth);

static JsonValue* json_parse_null(const char** json) {
    if (strncmp(*json, "null", 4) == 0) {
        *json += 4;
        JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
        if (val) val->type = JSON_NULL;
        return val;
    }
    return NULL;
}

static JsonValue* json_parse_bool(const char** json) {
    JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
    if (!val) return NULL;
    
    if (strncmp(*json, "true", 4) == 0) {
        *json += 4;
        val->type = JSON_BOOL;
        val->value.bool_val = true;
        return val;
    } else if (strncmp(*json, "false", 5) == 0) {
        *json += 5;
        val->type = JSON_BOOL;
        val->value.bool_val = false;
        return val;
    }
    
    free(val);
    return NULL;
}

static JsonValue* json_parse_number(const char** json) {
    char* end;
    double num = strtod(*json, &end);
    
    if (end == *json) return NULL;
    
    JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
    if (!val) return NULL;
    
    val->type = JSON_NUMBER;
    val->value.number_val = num;
    *json = end;
    return val;
}

static JsonValue* json_parse_string(const char** json) {
    if (**json != '"') return NULL;
    (*json)++;
    
    StringBuilder* sb = sb_create();
    if (!sb) return NULL;
    
    while (**json && **json != '"') {
        if (**json == '\\') {
            (*json)++;
            switch (**json) {
                case '"': sb_append_char(sb, '"'); break;
                case '\\': sb_append_char(sb, '\\'); break;
                case '/': sb_append_char(sb, '/'); break;
                case 'b': sb_append_char(sb, '\b'); break;
                case 'f': sb_append_char(sb, '\f'); break;
                case 'n': sb_append_char(sb, '\n'); break;
                case 'r': sb_append_char(sb, '\r'); break;
                case 't': sb_append_char(sb, '\t'); break;
                default: sb_append_char(sb, **json);
            }
            (*json)++;
        } else {
            sb_append_char(sb, **json);
            (*json)++;
        }
    }
    
    if (**json != '"') {
        sb_free(sb);
        return NULL;
    }
    (*json)++;
    
    JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
    if (!val) {
        sb_free(sb);
        return NULL;
    }
    
    val->type = JSON_STRING;
    val->value.string_val = sb_to_string(sb);
    sb_free(sb);
    return val;
}

static JsonValue* json_parse_array(const char** json, int depth) {
    if (**json != '[' || depth >= MAX_JSON_DEPTH) return NULL;
    (*json)++;
    
    JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
    if (!val) return NULL;
    
    val->type = JSON_ARRAY;
    val->value.array_val = vector_create();
    
    if (!val->value.array_val) {
        free(val);
        return NULL;
    }
    
    skip_whitespace(json);
    
    if (**json == ']') {
        (*json)++;
        return val;
    }
    
    while (**json) {
        JsonValue* element = json_parse_value(json, depth + 1);
        if (!element) {
            vector_free(val->value.array_val);
            free(val);
            return NULL;
        }
        
        vector_push(val->value.array_val, element);
        
        skip_whitespace(json);
        
        if (**json == ',') {
            (*json)++;
            skip_whitespace(json);
        } else if (**json == ']') {
            (*json)++;
            return val;
        } else {
            vector_free(val->value.array_val);
            free(val);
            return NULL;
        }
    }
    
    vector_free(val->value.array_val);
    free(val);
    return NULL;
}

static JsonValue* json_parse_object(const char** json, int depth) {
    if (**json != '{' || depth >= MAX_JSON_DEPTH) return NULL;
    (*json)++;
    
    JsonValue* val = (JsonValue*)malloc(sizeof(JsonValue));
    if (!val) return NULL;
    
    val->type = JSON_OBJECT;
    val->value.object_val = hashmap_create();
    
    if (!val->value.object_val) {
        free(val);
        return NULL;
    }
    
    skip_whitespace(json);
    
    if (**json == '}') {
        (*json)++;
        return val;
    }
    
    while (**json) {
        skip_whitespace(json);
        
        /* Parse key */
        JsonValue* key_val = json_parse_string(json);
        if (!key_val) {
            hashmap_free(val->value.object_val);
            free(val);
            return NULL;
        }
        
        char* key = key_val->value.string_val;
        free(key_val);
        
        skip_whitespace(json);
        
        if (**json != ':') {
            free(key);
            hashmap_free(val->value.object_val);
            free(val);
            return NULL;
        }
        (*json)++;
        
        skip_whitespace(json);
        
        /* Parse value */
        JsonValue* value = json_parse_value(json, depth + 1);
        if (!value) {
            free(key);
            hashmap_free(val->value.object_val);
            free(val);
            return NULL;
        }
        
        hashmap_set(val->value.object_val, key, value);
        free(key);
        
        skip_whitespace(json);
        
        if (**json == ',') {
            (*json)++;
        } else if (**json == '}') {
            (*json)++;
            return val;
        } else {
            hashmap_free(val->value.object_val);
            free(val);
            return NULL;
        }
    }
    
    hashmap_free(val->value.object_val);
    free(val);
    return NULL;
}

static JsonValue* json_parse_value(const char** json, int depth) {
    skip_whitespace(json);
    
    if (**json == 'n') return json_parse_null(json);
    if (**json == 't' || **json == 'f') return json_parse_bool(json);
    if (**json == '"') return json_parse_string(json);
    if (**json == '[') return json_parse_array(json, depth);
    if (**json == '{') return json_parse_object(json, depth);
    if (**json == '-' || isdigit(**json)) return json_parse_number(json);
    
    return NULL;
}

JsonValue* json_parse(const char* json_str) {
    if (!json_str) return NULL;
    return json_parse_value(&json_str, 0);
}

void json_free(JsonValue* val) {
    if (!val) return;
    
    switch (val->type) {
        case JSON_STRING:
            free(val->value.string_val);
            break;
        case JSON_ARRAY:
            if (val->value.array_val) {
                for (size_t i = 0; i < val->value.array_val->size; i++) {
                    json_free((JsonValue*)val->value.array_val->data[i]);
                }
                vector_free(val->value.array_val);
            }
            break;
        case JSON_OBJECT:
            /* TODO: Iterate and free all values */
            hashmap_free(val->value.object_val);
            break;
        default:
            break;
    }
    
    free(val);
}

/* ============================================================================
 * Main Entry Point
 * ============================================================================ */

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("{\"error\": \"No input provided\"}\n");
        return 1;
    }
    
    JsonValue* input = json_parse(argv[1]);
    if (!input) {
        printf("{\"error\": \"Invalid JSON\"}\n");
        return 1;
    }
    
    /* Echo back with additional metadata */
    printf("{\"ok\": true, \"message\": \"C utilities library loaded\", \"timestamp\": %ld}\n", 
           (long)time(NULL));
    
    json_free(input);
    return 0;
}
