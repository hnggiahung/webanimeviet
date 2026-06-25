import urllib.request, json

# Test movie detail API - full structure dump
slug = "one-piece"
req = urllib.request.Request(
    f"https://ophim1.com/v1/api/phim/{slug}",
    headers={"User-Agent": "Mozilla/5.0"}
)
data = urllib.request.urlopen(req, timeout=15).read()
d = json.loads(data)
dd = d.get("data", {})

print("=== ALL DATA KEYS ===")
for key in dd.keys():
    val = dd[key]
    if isinstance(val, list):
        print(f"\n'{key}' is LIST with {len(val)} items")
        if len(val) > 0:
            print(f"  First item type: {type(val[0]).__name__}")
            if isinstance(val[0], dict):
                print(f"  First item keys: {list(val[0].keys())}")
    elif isinstance(val, dict):
        print(f"\n'{key}' is DICT with keys: {list(val.keys())}")
    else:
        print(f"\n'{key}' = {str(val)[:80]}")

# Check if episodes exists anywhere
print("\n\n=== CHECKING FOR EPISODES ===")
print(f"'episodes' in data: {'episodes' in dd}")
print(f"'episodes' in top level: {'episodes' in d}")

# Check item for episode info
item = dd.get("item", {})
print(f"\nitem has 'episodes': {'episodes' in item}")
print(f"item has 'episode': {'episode' in item}")
print(f"item keys with 'episode': {[k for k in item.keys() if 'episode' in k.lower()]}")