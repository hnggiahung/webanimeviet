import urllib.request, json
req = urllib.request.Request(
    "https://ophim1.com/v1/api/danh-sach?page=1",
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
)
data = urllib.request.urlopen(req, timeout=15).read()
d = json.loads(data)
print("Top keys:", list(d.keys()))
if "data" in d:
    print("Data type:", type(d["data"]))
    if isinstance(d["data"], dict):
        print("Data keys:", list(d["data"].keys()))
        if "items" in d["data"]:
            print("Items count:", len(d["data"]["items"]))
            if d["data"]["items"]:
                item = d["data"]["items"][0]
                print("First item keys:", list(item.keys()))
                print("Lang:", item.get("lang"))
                print("Category:", item.get("category"))
                print("Type:", item.get("type"))