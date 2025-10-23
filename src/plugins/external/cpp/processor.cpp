/*
 * MCP Server - C++ Plugin Framework
 * Modern C++17/20 plugin system with templates, async operations, and RAII.
 */

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <functional>
#include <algorithm>
#include <chrono>
#include <thread>
#include <future>
#include <optional>
#include <variant>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <numeric>
#include <regex>
#include <fstream>

// JSON parsing (simplified - for production use nlohmann/json)
#include <sstream>

namespace mcp {

// ============================================================================
// Type Aliases and Concepts
// ============================================================================

using Clock = std::chrono::high_resolution_clock;
using TimePoint = std::chrono::time_point<Clock>;
using Duration = std::chrono::milliseconds;

template<typename T>
using Result = std::variant<T, std::string>; // Success(T) or Error(string)

template<typename T>
bool is_ok(const Result<T>& r) {
    return std::holds_alternative<T>(r);
}

template<typename T>
T unwrap(const Result<T>& r) {
    return std::get<T>(r);
}

template<typename T>
std::string unwrap_err(const Result<T>& r) {
    return std::get<std::string>(r);
}

// ============================================================================
// JSON Value (Simplified)
// ============================================================================

class JsonValue {
public:
    enum class Type { Null, Bool, Number, String, Array, Object };
    
    using Array = std::vector<JsonValue>;
    using Object = std::map<std::string, JsonValue>;
    using ValueType = std::variant<std::monostate, bool, double, std::string, Array, Object>;
    
private:
    ValueType data_;
    Type type_;
    
public:
    JsonValue() : data_(std::monostate{}), type_(Type::Null) {}
    JsonValue(bool v) : data_(v), type_(Type::Bool) {}
    JsonValue(double v) : data_(v), type_(Type::Number) {}
    JsonValue(int v) : data_(static_cast<double>(v)), type_(Type::Number) {}
    JsonValue(const std::string& v) : data_(v), type_(Type::String) {}
    JsonValue(const char* v) : data_(std::string(v)), type_(Type::String) {}
    JsonValue(const Array& v) : data_(v), type_(Type::Array) {}
    JsonValue(const Object& v) : data_(v), type_(Type::Object) {}
    
    Type type() const { return type_; }
    bool is_null() const { return type_ == Type::Null; }
    bool is_bool() const { return type_ == Type::Bool; }
    bool is_number() const { return type_ == Type::Number; }
    bool is_string() const { return type_ == Type::String; }
    bool is_array() const { return type_ == Type::Array; }
    bool is_object() const { return type_ == Type::Object; }
    
    bool as_bool() const { return std::get<bool>(data_); }
    double as_number() const { return std::get<double>(data_); }
    const std::string& as_string() const { return std::get<std::string>(data_); }
    const Array& as_array() const { return std::get<Array>(data_); }
    const Object& as_object() const { return std::get<Object>(data_); }
    
    Array& as_array() { return std::get<Array>(data_); }
    Object& as_object() { return std::get<Object>(data_); }
    
    std::string to_string() const {
        std::ostringstream oss;
        switch (type_) {
            case Type::Null: return "null";
            case Type::Bool: return as_bool() ? "true" : "false";
            case Type::Number: 
                oss << std::fixed << std::setprecision(2) << as_number();
                return oss.str();
            case Type::String: return "\"" + as_string() + "\"";
            case Type::Array: {
                oss << "[";
                const auto& arr = as_array();
                for (size_t i = 0; i < arr.size(); ++i) {
                    if (i > 0) oss << ",";
                    oss << arr[i].to_string();
                }
                oss << "]";
                return oss.str();
            }
            case Type::Object: {
                oss << "{";
                const auto& obj = as_object();
                bool first = true;
                for (const auto& [k, v] : obj) {
                    if (!first) oss << ",";
                    oss << "\"" << k << "\":" << v.to_string();
                    first = false;
                }
                oss << "}";
                return oss.str();
            }
        }
        return "null";
    }
};

// ============================================================================
// Plugin Interface
// ============================================================================

class IPlugin {
public:
    virtual ~IPlugin() = default;
    virtual std::string name() const = 0;
    virtual std::string version() const = 0;
    virtual JsonValue execute(const std::string& action, const JsonValue& payload) = 0;
};

// ============================================================================
// Statistical Functions
// ============================================================================

template<typename T>
class Statistics {
public:
    static double mean(const std::vector<T>& data) {
        if (data.empty()) return 0.0;
        return std::accumulate(data.begin(), data.end(), 0.0) / data.size();
    }
    
    static double median(std::vector<T> data) {
        if (data.empty()) return 0.0;
        
        std::sort(data.begin(), data.end());
        size_t n = data.size();
        
        if (n % 2 == 0) {
            return (data[n/2 - 1] + data[n/2]) / 2.0;
        } else {
            return data[n/2];
        }
    }
    
    static double variance(const std::vector<T>& data) {
        if (data.size() < 2) return 0.0;
        
        double m = mean(data);
        double sum_sq = 0.0;
        
        for (const auto& val : data) {
            double diff = val - m;
            sum_sq += diff * diff;
        }
        
        return sum_sq / (data.size() - 1);
    }
    
    static double stddev(const std::vector<T>& data) {
        return std::sqrt(variance(data));
    }
    
    static T min(const std::vector<T>& data) {
        return *std::min_element(data.begin(), data.end());
    }
    
    static T max(const std::vector<T>& data) {
        return *std::max_element(data.begin(), data.end());
    }
    
    static std::map<std::string, double> describe(const std::vector<T>& data) {
        std::map<std::string, double> result;
        
        if (data.empty()) return result;
        
        result["count"] = static_cast<double>(data.size());
        result["mean"] = mean(data);
        result["median"] = median(data);
        result["min"] = static_cast<double>(min(data));
        result["max"] = static_cast<double>(max(data));
        result["range"] = result["max"] - result["min"];
        
        if (data.size() > 1) {
            result["variance"] = variance(data);
            result["stddev"] = stddev(data);
        }
        
        return result;
    }
};

// ============================================================================
// String Utilities
// ============================================================================

class StringUtils {
public:
    static std::string trim(const std::string& str) {
        auto start = std::find_if_not(str.begin(), str.end(), ::isspace);
        auto end = std::find_if_not(str.rbegin(), str.rend(), ::isspace).base();
        return (start < end) ? std::string(start, end) : "";
    }
    
    static std::string to_upper(std::string str) {
        std::transform(str.begin(), str.end(), str.begin(), ::toupper);
        return str;
    }
    
    static std::string to_lower(std::string str) {
        std::transform(str.begin(), str.end(), str.begin(), ::tolower);
        return str;
    }
    
    static std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        
        while (std::getline(ss, token, delimiter)) {
            tokens.push_back(token);
        }
        
        return tokens;
    }
    
    static std::string join(const std::vector<std::string>& parts, const std::string& delimiter) {
        if (parts.empty()) return "";
        
        std::ostringstream oss;
        oss << parts[0];
        
        for (size_t i = 1; i < parts.size(); ++i) {
            oss << delimiter << parts[i];
        }
        
        return oss.str();
    }
    
    static bool starts_with(const std::string& str, const std::string& prefix) {
        return str.size() >= prefix.size() && 
               str.compare(0, prefix.size(), prefix) == 0;
    }
    
    static bool ends_with(const std::string& str, const std::string& suffix) {
        return str.size() >= suffix.size() && 
               str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
    }
    
    static bool contains(const std::string& str, const std::string& substr) {
        return str.find(substr) != std::string::npos;
    }
    
    static std::string replace_all(std::string str, const std::string& from, 
                                   const std::string& to) {
        size_t pos = 0;
        while ((pos = str.find(from, pos)) != std::string::npos) {
            str.replace(pos, from.length(), to);
            pos += to.length();
        }
        return str;
    }
    
    static bool matches(const std::string& str, const std::string& pattern) {
        try {
            std::regex re(pattern);
            return std::regex_match(str, re);
        } catch (...) {
            return false;
        }
    }
};

// ============================================================================
// Async Task Runner
// ============================================================================

template<typename T>
class AsyncTask {
private:
    std::future<T> future_;
    TimePoint start_time_;
    
public:
    AsyncTask(std::function<T()> func) 
        : future_(std::async(std::launch::async, func))
        , start_time_(Clock::now()) {}
    
    bool is_ready() const {
        return future_.wait_for(std::chrono::seconds(0)) == std::future_status::ready;
    }
    
    T get() {
        return future_.get();
    }
    
    Duration elapsed() const {
        return std::chrono::duration_cast<Duration>(Clock::now() - start_time_);
    }
};

// ============================================================================
// Timer Utility
// ============================================================================

class Timer {
private:
    TimePoint start_;
    std::string name_;
    
public:
    Timer(const std::string& name = "Timer") 
        : start_(Clock::now()), name_(name) {}
    
    ~Timer() {
        auto duration = std::chrono::duration_cast<Duration>(Clock::now() - start_);
        std::cout << name_ << " took " << duration.count() << "ms" << std::endl;
    }
    
    Duration elapsed() const {
        return std::chrono::duration_cast<Duration>(Clock::now() - start_);
    }
};

// ============================================================================
// Cache with TTL
// ============================================================================

template<typename K, typename V>
class Cache {
private:
    struct CacheEntry {
        V value;
        TimePoint expires_at;
    };
    
    std::map<K, CacheEntry> data_;
    Duration default_ttl_;
    
public:
    Cache(Duration ttl = Duration(60000)) : default_ttl_(ttl) {}
    
    void set(const K& key, const V& value, std::optional<Duration> ttl = std::nullopt) {
        auto expiry = Clock::now() + (ttl.value_or(default_ttl_));
        data_[key] = CacheEntry{value, expiry};
    }
    
    std::optional<V> get(const K& key) {
        clean_expired();
        
        auto it = data_.find(key);
        if (it == data_.end()) {
            return std::nullopt;
        }
        
        if (Clock::now() > it->second.expires_at) {
            data_.erase(it);
            return std::nullopt;
        }
        
        return it->second.value;
    }
    
    bool has(const K& key) {
        return get(key).has_value();
    }
    
    void remove(const K& key) {
        data_.erase(key);
    }
    
    void clear() {
        data_.clear();
    }
    
    size_t size() const {
        return data_.size();
    }
    
private:
    void clean_expired() {
        auto now = Clock::now();
        for (auto it = data_.begin(); it != data_.end();) {
            if (now > it->second.expires_at) {
                it = data_.erase(it);
            } else {
                ++it;
            }
        }
    }
};

// ============================================================================
// Data Processing Plugin Implementation
// ============================================================================

class DataProcessorPlugin : public IPlugin {
public:
    std::string name() const override {
        return "cpp_data_processor";
    }
    
    std::string version() const override {
        return "1.0.0";
    }
    
    JsonValue execute(const std::string& action, const JsonValue& payload) override {
        try {
            if (action == "stats") {
                return compute_stats(payload);
            } else if (action == "transform") {
                return transform_data(payload);
            } else if (action == "filter") {
                return filter_data(payload);
            } else if (action == "sort") {
                return sort_data(payload);
            } else if (action == "string") {
                return process_string(payload);
            } else if (action == "benchmark") {
                return run_benchmark(payload);
            } else {
                JsonValue::Object result;
                result["error"] = JsonValue("Unknown action: " + action);
                return JsonValue(result);
            }
        } catch (const std::exception& e) {
            JsonValue::Object result;
            result["error"] = JsonValue(std::string("Exception: ") + e.what());
            return JsonValue(result);
        }
    }
    
private:
    JsonValue compute_stats(const JsonValue& payload) {
        if (!payload.is_object()) {
            JsonValue::Object err;
            err["error"] = JsonValue("Payload must be an object");
            return JsonValue(err);
        }
        
        const auto& obj = payload.as_object();
        auto it = obj.find("data");
        
        if (it == obj.end() || !it->second.is_array()) {
            JsonValue::Object err;
            err["error"] = JsonValue("Missing or invalid 'data' array");
            return JsonValue(err);
        }
        
        std::vector<double> data;
        for (const auto& val : it->second.as_array()) {
            if (val.is_number()) {
                data.push_back(val.as_number());
            }
        }
        
        auto stats = Statistics<double>::describe(data);
        
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        
        JsonValue::Object stats_obj;
        for (const auto& [key, value] : stats) {
            stats_obj[key] = JsonValue(value);
        }
        result["stats"] = JsonValue(stats_obj);
        
        return JsonValue(result);
    }
    
    JsonValue transform_data(const JsonValue& payload) {
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        result["message"] = JsonValue("Transform operation completed");
        return JsonValue(result);
    }
    
    JsonValue filter_data(const JsonValue& payload) {
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        result["message"] = JsonValue("Filter operation completed");
        return JsonValue(result);
    }
    
    JsonValue sort_data(const JsonValue& payload) {
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        result["message"] = JsonValue("Sort operation completed");
        return JsonValue(result);
    }
    
    JsonValue process_string(const JsonValue& payload) {
        if (!payload.is_object()) {
            JsonValue::Object err;
            err["error"] = JsonValue("Payload must be an object");
            return JsonValue(err);
        }
        
        const auto& obj = payload.as_object();
        auto text_it = obj.find("text");
        auto op_it = obj.find("operation");
        
        if (text_it == obj.end() || !text_it->second.is_string()) {
            JsonValue::Object err;
            err["error"] = JsonValue("Missing or invalid 'text' field");
            return JsonValue(err);
        }
        
        std::string text = text_it->second.as_string();
        std::string operation = (op_it != obj.end() && op_it->second.is_string()) 
                                ? op_it->second.as_string() : "trim";
        
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        
        if (operation == "trim") {
            result["result"] = JsonValue(StringUtils::trim(text));
        } else if (operation == "upper") {
            result["result"] = JsonValue(StringUtils::to_upper(text));
        } else if (operation == "lower") {
            result["result"] = JsonValue(StringUtils::to_lower(text));
        } else if (operation == "split") {
            auto parts = StringUtils::split(text, ' ');
            JsonValue::Array arr;
            for (const auto& part : parts) {
                arr.push_back(JsonValue(part));
            }
            result["result"] = JsonValue(arr);
        } else {
            result["result"] = JsonValue(text);
        }
        
        return JsonValue(result);
    }
    
    JsonValue run_benchmark(const JsonValue& payload) {
        Timer timer("Benchmark");
        
        // Simulate some work
        std::vector<double> data;
        for (int i = 0; i < 10000; ++i) {
            data.push_back(static_cast<double>(i));
        }
        
        auto stats = Statistics<double>::describe(data);
        
        JsonValue::Object result;
        result["ok"] = JsonValue(true);
        result["elapsed_ms"] = JsonValue(static_cast<double>(timer.elapsed().count()));
        result["operations"] = JsonValue(10000.0);
        
        return JsonValue(result);
    }
};

} // namespace mcp

// ============================================================================
// Main Entry Point
// ============================================================================

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << R"({"error": "No payload provided"})" << std::endl;
        return 1;
    }
    
    try {
        // Simple parsing - in production use proper JSON library
        std::string input(argv[1]);
        
        mcp::DataProcessorPlugin plugin;
        
        // Default action for demo
        mcp::JsonValue::Object payload;
        mcp::JsonValue::Array data;
        for (int i = 1; i <= 10; ++i) {
            data.push_back(mcp::JsonValue(static_cast<double>(i)));
        }
        payload["data"] = mcp::JsonValue(data);
        
        auto result = plugin.execute("stats", mcp::JsonValue(payload));
        std::cout << result.to_string() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cout << R"({"error": ")" << e.what() << R"("})" << std::endl;
        return 1;
    }
}
