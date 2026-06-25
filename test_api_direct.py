import urllib.request, json

# The API the user says works: https://ophim1.com/the-loai/hoat-hinh?page=1
# But our code uses /v1/api/ prefix. Let's test what the actual Ophim API structure is.

# Test 1: Without /v1/api/ - user's exact URL
print("=== Test 1: User's exact URL (no /v1/api/) ===")
try:
    req = urllib.request.Request(
        "https://ophim1.com/the-loai/hoat-hinh?page=1",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json"}
    )
    data = urllib.request.urlopen(req, timeout=15).read()
    d = json.loads(data)
    print("SUCCESS - Response:", str(d)[:200])
except Exception as e:
    print(f"ERROR: {e}")
    # Try with different Accept header
    print("\n=== Test 1b: With text/html accept ===")
    try:
        req = urllib.request.Request(
            "https://ophim1.com/the-loai/hoat-hinh?page=1",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        data = urllib.request.urlopen(req, timeout=15).read()
        print("Response length:", len(data))
        print("First 300 chars:", data.decode()[:300])
    except Exception as e2:
        print(f"ERROR: {e2}")

# Test 2: With /v1/api/ and the-loai
print("\n=== Test 2: /v1/api/the-loai/hoat-hinh ===")
try:
    req = urllib.request.Request(
        "https://ophim1.com/v1/api/the-loai/hoat-hinh?page=1",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    data = urllib.request.urlopen(req, timeout=15).read()
    d = json.loads(data)
    print(f"Status: {d.get('status')}, Message: {d.get('message')[:80]}")
    dd = d.get('data',{})
    items = dd.get('items',[]) if isinstance(dd,dict) else []
    print(f"Items: {len(items)}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: Try search endpoint
print("\n=== Test 3: /v1/api/tim-kiem?keyword=hoat+hinh ===")
try:
    req = urllib.request.Request(
        "https://ophim1.com/v1/api/tim-kiem?keyword=hoat+hinh",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    data = urllib.request.urlopen(req, timeout=15).read()
    d = json.loads(data)
    print(f"Status: {d.get('status')}")
    dd = d.get('data',{})
    items = dd.get('items',[]) if isinstance(dd,dict) else []
    print(f"Items: {len(items)}")
    if items:
        print(f"First: {items[0].get('name')}")
except Exception as e:
    print(f"ERROR: {e}")