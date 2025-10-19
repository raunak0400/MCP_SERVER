import json
import sys
from datetime import datetime

def analyze(payload):
    return {
        "analyzed": True,
        "timestamp": datetime.now().isoformat(),
        "data": payload
    }

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = analyze(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
