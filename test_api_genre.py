import urllib.request, json

# Test the genre-based API endpoint
urls = [
    "https://ophim1.com/v1/api/the-loai/hoat-hinh?page=1",
    "https://ophim1.com/v1/api/danh-sach?page=1",
]

for url in urls:
    print(f"\n=== URL: {url} ===")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=15).read()
        d = json.loads(data)
        print(f"Status: {d.get('status')}")
        print(f"Message: {d.get('message')}")
        dd = d.get("data", {})
        if isinstance(dd, dict):
            print(f"Data keys: {list(dd.keys())}")
            items = dd.get("items", [])
            print(f"Items count: {len(items)}")
            if items:
                item = items[0]
                print(f"First item slug: {item.get('slug')}")
                print(f"First item lang: {item.get('lang')}")
                cats = item.get("category", [])
                print(f"First item categories: {[c.get('name','') for c in cats][:3]}")
        else:
            print(f"Data is not dict: {type(dd).__name__} = {str(dd)[:100]}")
    except Exception as e:
        print(f"ERROR: {e}")