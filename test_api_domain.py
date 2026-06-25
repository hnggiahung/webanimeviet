import urllib.request, json

# Test the domain the user mentioned
req = urllib.request.Request(
    "https://ophim1.com/the-loai/hoat-hinh?page=1",
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
)
try:
    data = urllib.request.urlopen(req, timeout=15).read()
    d = json.loads(data)
    print("Top keys:", list(d.keys()))
    dd = d.get("data", {})
    print("Data type:", type(dd).__name__)
    if isinstance(dd, dict):
        print("Data keys:", list(dd.keys()))
        items = dd.get("items", [])
        print("Items:", len(items))
        if items:
            item = items[0]
            print("First item keys:", list(item.keys()))
            print("slug:", item.get("slug"))
            print("lang:", item.get("lang"))
            print("category:", item.get("category"))
    else:
        print("Data is not a dict:", str(dd)[:200])
except Exception as e:
    print("ERROR:", e)