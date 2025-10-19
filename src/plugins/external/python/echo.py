import json,sys
payload = {}
if len(sys.argv) > 1:
    try:
        payload = json.loads(sys.argv[1])
    except Exception:
        payload = {"raw": sys.argv[1]}
print(json.dumps({"echo": payload}))
