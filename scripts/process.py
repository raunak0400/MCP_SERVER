import sys
import json

def process_data(data):
    return {"processed": data}

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    result = process_data(input_data)
    print(json.dumps(result))
