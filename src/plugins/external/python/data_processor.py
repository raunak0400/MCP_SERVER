#!/usr/bin/env python3
"""
Comprehensive data processing and analysis plugin for MCP Server.
Provides statistical analysis, data transformation, file I/O, and validation utilities.
"""

import sys
import json
import math
import statistics
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import re
from datetime import datetime, timedelta
import hashlib
import base64


class DataType(Enum):
    """Supported data types for processing."""
    NUMERIC = "numeric"
    STRING = "string"
    BOOLEAN = "boolean"
    DATE = "date"
    MIXED = "mixed"


class AggregateFunction(Enum):
    """Statistical aggregate functions."""
    SUM = "sum"
    MEAN = "mean"
    MEDIAN = "median"
    MODE = "mode"
    MIN = "min"
    MAX = "max"
    STDDEV = "stddev"
    VARIANCE = "variance"
    COUNT = "count"
    DISTINCT = "distinct"


@dataclass
class ValidationRule:
    """Data validation rule configuration."""
    field: str
    rule_type: str  # required, type, range, regex, custom
    params: Dict[str, Any]
    error_message: str


@dataclass
class ProcessingResult:
    """Result container for data processing operations."""
    success: bool
    data: Any
    metadata: Dict[str, Any]
    errors: List[str]
    warnings: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DataValidator:
    """Validates data against defined rules."""
    
    @staticmethod
    def validate_required(value: Any) -> bool:
        """Check if value is not None or empty."""
        if value is None:
            return False
        if isinstance(value, (str, list, dict)) and len(value) == 0:
            return False
        return True
    
    @staticmethod
    def validate_type(value: Any, expected_type: str) -> bool:
        """Validate value type."""
        type_map = {
            'string': str,
            'number': (int, float),
            'boolean': bool,
            'list': list,
            'dict': dict,
        }
        expected = type_map.get(expected_type)
        if expected is None:
            return False
        return isinstance(value, expected)
    
    @staticmethod
    def validate_range(value: Union[int, float], min_val: Optional[float] = None, 
                      max_val: Optional[float] = None) -> bool:
        """Validate numeric value is within range."""
        if not isinstance(value, (int, float)):
            return False
        if min_val is not None and value < min_val:
            return False
        if max_val is not None and value > max_val:
            return False
        return True
    
    @staticmethod
    def validate_regex(value: str, pattern: str) -> bool:
        """Validate string matches regex pattern."""
        if not isinstance(value, str):
            return False
        try:
            return bool(re.match(pattern, value))
        except re.error:
            return False
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return DataValidator.validate_regex(email, pattern)
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format."""
        pattern = r'^https?://[^\s<>"]+$'
        return DataValidator.validate_regex(url, pattern)


class StatisticalAnalyzer:
    """Performs statistical analysis on datasets."""
    
    @staticmethod
    def describe(data: List[Union[int, float]]) -> Dict[str, float]:
        """Generate descriptive statistics."""
        if not data:
            return {}
        
        sorted_data = sorted(data)
        n = len(data)
        
        result = {
            'count': n,
            'sum': sum(data),
            'mean': statistics.mean(data),
            'median': statistics.median(data),
            'min': min(data),
            'max': max(data),
            'range': max(data) - min(data),
        }
        
        if n > 1:
            result['variance'] = statistics.variance(data)
            result['stddev'] = statistics.stdev(data)
            result['stderr'] = result['stddev'] / math.sqrt(n)
        
        # Quartiles
        result['q1'] = statistics.median(sorted_data[:n//2])
        result['q3'] = statistics.median(sorted_data[(n+1)//2:])
        result['iqr'] = result['q3'] - result['q1']
        
        # Skewness approximation (Pearson's)
        if result.get('stddev', 0) > 0:
            result['skewness'] = 3 * (result['mean'] - result['median']) / result['stddev']
        
        return result
    
    @staticmethod
    def correlation(x: List[float], y: List[float]) -> Optional[float]:
        """Calculate Pearson correlation coefficient."""
        if len(x) != len(y) or len(x) < 2:
            return None
        
        n = len(x)
        mean_x = sum(x) / n
        mean_y = sum(y) / n
        
        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        denominator_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
        denominator_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))
        
        if denominator_x == 0 or denominator_y == 0:
            return None
        
        return numerator / (denominator_x * denominator_y)
    
    @staticmethod
    def moving_average(data: List[float], window: int) -> List[float]:
        """Calculate moving average with specified window."""
        if window <= 0 or window > len(data):
            return []
        
        result = []
        for i in range(len(data) - window + 1):
            window_avg = sum(data[i:i+window]) / window
            result.append(window_avg)
        return result
    
    @staticmethod
    def outliers_iqr(data: List[float], multiplier: float = 1.5) -> Dict[str, Any]:
        """Detect outliers using IQR method."""
        if len(data) < 4:
            return {'outliers': [], 'lower_bound': None, 'upper_bound': None}
        
        sorted_data = sorted(data)
        n = len(sorted_data)
        q1 = statistics.median(sorted_data[:n//2])
        q3 = statistics.median(sorted_data[(n+1)//2:])
        iqr = q3 - q1
        
        lower_bound = q1 - multiplier * iqr
        upper_bound = q3 + multiplier * iqr
        
        outliers = [x for x in data if x < lower_bound or x > upper_bound]
        
        return {
            'outliers': outliers,
            'outlier_count': len(outliers),
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'q1': q1,
            'q3': q3,
            'iqr': iqr,
        }


class DataTransformer:
    """Transforms and normalizes data."""
    
    @staticmethod
    def normalize_minmax(data: List[float], target_min: float = 0.0, 
                        target_max: float = 1.0) -> List[float]:
        """Normalize data to target range using min-max scaling."""
        if not data:
            return []
        
        data_min = min(data)
        data_max = max(data)
        
        if data_min == data_max:
            return [target_min] * len(data)
        
        scale = (target_max - target_min) / (data_max - data_min)
        return [target_min + (x - data_min) * scale for x in data]
    
    @staticmethod
    def normalize_zscore(data: List[float]) -> List[float]:
        """Standardize data using z-score normalization."""
        if len(data) < 2:
            return data
        
        mean = statistics.mean(data)
        stddev = statistics.stdev(data)
        
        if stddev == 0:
            return [0.0] * len(data)
        
        return [(x - mean) / stddev for x in data]
    
    @staticmethod
    def apply_log_transform(data: List[float], base: float = math.e) -> List[float]:
        """Apply logarithmic transformation."""
        result = []
        for x in data:
            if x <= 0:
                result.append(None)
            else:
                result.append(math.log(x, base))
        return result
    
    @staticmethod
    def bin_data(data: List[float], bins: int) -> Dict[str, Any]:
        """Bin continuous data into discrete intervals."""
        if not data or bins <= 0:
            return {}
        
        data_min = min(data)
        data_max = max(data)
        bin_width = (data_max - data_min) / bins
        
        bin_edges = [data_min + i * bin_width for i in range(bins + 1)]
        bin_counts = [0] * bins
        
        for value in data:
            bin_idx = min(int((value - data_min) / bin_width), bins - 1)
            bin_counts[bin_idx] += 1
        
        return {
            'bins': bins,
            'edges': bin_edges,
            'counts': bin_counts,
            'width': bin_width,
        }
    
    @staticmethod
    def pivot_table(data: List[Dict[str, Any]], index: str, columns: str, 
                   values: str, aggfunc: str = 'sum') -> Dict[str, Any]:
        """Create a pivot table from list of dictionaries."""
        pivot = {}
        
        for row in data:
            idx = row.get(index)
            col = row.get(columns)
            val = row.get(values)
            
            if idx is None or col is None or val is None:
                continue
            
            if idx not in pivot:
                pivot[idx] = {}
            if col not in pivot[idx]:
                pivot[idx][col] = []
            
            pivot[idx][col].append(val)
        
        # Apply aggregation function
        agg_map = {
            'sum': sum,
            'mean': statistics.mean,
            'median': statistics.median,
            'min': min,
            'max': max,
            'count': len,
        }
        
        agg_func = agg_map.get(aggfunc, sum)
        
        result = {}
        for idx, cols in pivot.items():
            result[idx] = {col: agg_func(vals) for col, vals in cols.items()}
        
        return result


class StringProcessor:
    """Advanced string processing utilities."""
    
    @staticmethod
    def clean_text(text: str, lowercase: bool = True, 
                  remove_punctuation: bool = True,
                  remove_digits: bool = False) -> str:
        """Clean and normalize text."""
        if lowercase:
            text = text.lower()
        
        if remove_punctuation:
            text = re.sub(r'[^\w\s]', '', text)
        
        if remove_digits:
            text = re.sub(r'\d+', '', text)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text
    
    @staticmethod
    def extract_numbers(text: str) -> List[float]:
        """Extract all numeric values from text."""
        pattern = r'-?\d+\.?\d*'
        matches = re.findall(pattern, text)
        return [float(m) for m in matches]
    
    @staticmethod
    def tokenize(text: str, delimiter: Optional[str] = None) -> List[str]:
        """Tokenize text into words or by delimiter."""
        if delimiter:
            return text.split(delimiter)
        return text.split()
    
    @staticmethod
    def ngrams(tokens: List[str], n: int) -> List[str]:
        """Generate n-grams from token list."""
        if n <= 0 or n > len(tokens):
            return []
        return [' '.join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]
    
    @staticmethod
    def levenshtein_distance(s1: str, s2: str) -> int:
        """Calculate Levenshtein edit distance between two strings."""
        if len(s1) < len(s2):
            return StringProcessor.levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]


class CryptoHelper:
    """Cryptographic and encoding utilities."""
    
    @staticmethod
    def hash_data(data: str, algorithm: str = 'sha256') -> str:
        """Hash data using specified algorithm."""
        algorithms = {
            'md5': hashlib.md5,
            'sha1': hashlib.sha1,
            'sha256': hashlib.sha256,
            'sha512': hashlib.sha512,
        }
        
        hash_func = algorithms.get(algorithm.lower())
        if not hash_func:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        return hash_func(data.encode()).hexdigest()
    
    @staticmethod
    def encode_base64(data: str) -> str:
        """Encode string to base64."""
        return base64.b64encode(data.encode()).decode()
    
    @staticmethod
    def decode_base64(data: str) -> str:
        """Decode base64 string."""
        return base64.b64decode(data.encode()).decode()


class DataProcessor:
    """Main data processing orchestrator."""
    
    def __init__(self):
        self.validator = DataValidator()
        self.analyzer = StatisticalAnalyzer()
        self.transformer = DataTransformer()
        self.string_processor = StringProcessor()
        self.crypto = CryptoHelper()
    
    def process(self, action: str, payload: Dict[str, Any]) -> ProcessingResult:
        """Process data based on action type."""
        errors = []
        warnings = []
        
        try:
            if action == 'validate':
                result = self._validate_data(payload)
            elif action == 'analyze':
                result = self._analyze_data(payload)
            elif action == 'transform':
                result = self._transform_data(payload)
            elif action == 'aggregate':
                result = self._aggregate_data(payload)
            elif action == 'text':
                result = self._process_text(payload)
            elif action == 'crypto':
                result = self._crypto_operation(payload)
            else:
                return ProcessingResult(
                    success=False,
                    data=None,
                    metadata={'action': action},
                    errors=[f"Unknown action: {action}"],
                    warnings=[]
                )
            
            return ProcessingResult(
                success=True,
                data=result,
                metadata={'action': action, 'timestamp': datetime.now().isoformat()},
                errors=errors,
                warnings=warnings
            )
        
        except Exception as e:
            return ProcessingResult(
                success=False,
                data=None,
                metadata={'action': action},
                errors=[str(e)],
                warnings=warnings
            )
    
    def _validate_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data against rules."""
        data = payload.get('data', {})
        rules = payload.get('rules', [])
        
        validation_results = []
        is_valid = True
        
        for rule_dict in rules:
            rule = ValidationRule(**rule_dict)
            field_value = data.get(rule.field)
            valid = False
            
            if rule.rule_type == 'required':
                valid = self.validator.validate_required(field_value)
            elif rule.rule_type == 'type':
                valid = self.validator.validate_type(field_value, rule.params.get('type', 'string'))
            elif rule.rule_type == 'range':
                valid = self.validator.validate_range(
                    field_value,
                    rule.params.get('min'),
                    rule.params.get('max')
                )
            elif rule.rule_type == 'regex':
                valid = self.validator.validate_regex(field_value, rule.params.get('pattern', ''))
            elif rule.rule_type == 'email':
                valid = self.validator.validate_email(field_value)
            elif rule.rule_type == 'url':
                valid = self.validator.validate_url(field_value)
            
            validation_results.append({
                'field': rule.field,
                'valid': valid,
                'error': rule.error_message if not valid else None
            })
            
            if not valid:
                is_valid = False
        
        return {
            'valid': is_valid,
            'results': validation_results
        }
    
    def _analyze_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Perform statistical analysis."""
        data = payload.get('data', [])
        analysis_type = payload.get('type', 'describe')
        
        if analysis_type == 'describe':
            return self.analyzer.describe(data)
        elif analysis_type == 'correlation':
            x = payload.get('x', [])
            y = payload.get('y', [])
            return {'correlation': self.analyzer.correlation(x, y)}
        elif analysis_type == 'moving_average':
            window = payload.get('window', 3)
            return {'moving_average': self.analyzer.moving_average(data, window)}
        elif analysis_type == 'outliers':
            return self.analyzer.outliers_iqr(data, payload.get('multiplier', 1.5))
        else:
            return {'error': f'Unknown analysis type: {analysis_type}'}
    
    def _transform_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Transform data."""
        data = payload.get('data', [])
        transform_type = payload.get('type', 'normalize')
        
        if transform_type == 'normalize':
            return {'normalized': self.transformer.normalize_minmax(data)}
        elif transform_type == 'zscore':
            return {'standardized': self.transformer.normalize_zscore(data)}
        elif transform_type == 'log':
            base = payload.get('base', math.e)
            return {'log_transformed': self.transformer.apply_log_transform(data, base)}
        elif transform_type == 'bin':
            bins = payload.get('bins', 10)
            return self.transformer.bin_data(data, bins)
        else:
            return {'error': f'Unknown transform type: {transform_type}'}
    
    def _aggregate_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregate data."""
        data = payload.get('data', [])
        
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            # Pivot table
            index = payload.get('index')
            columns = payload.get('columns')
            values = payload.get('values')
            aggfunc = payload.get('aggfunc', 'sum')
            
            return self.transformer.pivot_table(data, index, columns, values, aggfunc)
        else:
            # Simple aggregation
            return self.analyzer.describe(data)
    
    def _process_text(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process text data."""
        text = payload.get('text', '')
        operation = payload.get('operation', 'clean')
        
        if operation == 'clean':
            return {'cleaned': self.string_processor.clean_text(text)}
        elif operation == 'extract_numbers':
            return {'numbers': self.string_processor.extract_numbers(text)}
        elif operation == 'tokenize':
            return {'tokens': self.string_processor.tokenize(text)}
        elif operation == 'ngrams':
            tokens = self.string_processor.tokenize(text)
            n = payload.get('n', 2)
            return {'ngrams': self.string_processor.ngrams(tokens, n)}
        elif operation == 'distance':
            s2 = payload.get('compare_to', '')
            return {'distance': self.string_processor.levenshtein_distance(text, s2)}
        else:
            return {'error': f'Unknown text operation: {operation}'}
    
    def _crypto_operation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Perform cryptographic operations."""
        data = payload.get('data', '')
        operation = payload.get('operation', 'hash')
        
        if operation == 'hash':
            algorithm = payload.get('algorithm', 'sha256')
            return {'hash': self.crypto.hash_data(data, algorithm)}
        elif operation == 'encode':
            return {'encoded': self.crypto.encode_base64(data)}
        elif operation == 'decode':
            return {'decoded': self.crypto.decode_base64(data)}
        else:
            return {'error': f'Unknown crypto operation: {operation}'}


def main():
    """Main entry point for the plugin."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No payload provided'}))
        sys.exit(1)
    
    try:
        payload = json.loads(sys.argv[1])
        action = payload.get('action', 'analyze')
        
        processor = DataProcessor()
        result = processor.process(action, payload)
        
        print(json.dumps(result.to_dict()))
        sys.exit(0)
    
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON: {str(e)}'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': f'Processing failed: {str(e)}'}))
        sys.exit(1)


if __name__ == '__main__':
    main()
