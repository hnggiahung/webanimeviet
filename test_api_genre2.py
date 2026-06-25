import urllib.request, json

# Test the exact URL the user provided (without /v1/api/)
# and also test with /v1/api/ prefix
urls = [
    "https://ophim1.com/the-loai/hoat-hinh?page=1",        # User's URL - NO /v1/api/
    "https://ophim1.com/v1/api/the-loai/hoat-hinh?page=1", # With /v1/api/
    "https://ophim1.com/v1/api/danh-sach?page=1",          # Working endpoint
    "https://ophim1.com/danh-sach?page=1",                 # Without /v1/api/
]

for url in urls:
    print(f"\n=== URL: {url} ===")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=15).read()
        d = json.loads(data)
        print(f"Status: {d.get('status')}")
        print(f"Message: {d.get('message','')[:80]}")
        dd = d.get("data", {})
        if isinstance(dd, dict):
            items = dd.get("items", [])
            print(f"Items: {len(items)}")
            if items:
                item = items[0]
                print(f"First: slug={item.get('slug')} lang={item.get('lang')}")
        else:
            print(f"Data: {type(dd).__name__}")
    except Exception as e:
        print(f"ERROR: {e}")