import urllib.request, json

# Test movie detail API - focus on structure
slugs = ["one-piece", "nhung-ban-di-chuc-phan-1"]

for slug in slugs:
    try:
        req = urllib.request.Request(
            f"https://ophim1.com/v1/api/phim/{slug}",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        data = urllib.request.urlopen(req, timeout=15).read()
        d = json.loads(data)
        print(f"\n=== SLUG: {slug} ===")
        print(f"Top keys: {list(d.keys())}")
        dd = d.get("data", {})
        print(f"Data type: {type(dd).__name__}")
        print(f"Data keys: {list(dd.keys())}")
        
        # Check what's inside data
        for key in dd.keys():
            val = dd[key]
            if isinstance(val, dict):
                print(f"  data['{key}'] is dict with keys: {list(val.keys())[:8]}")
            elif isinstance(val, list):
                print(f"  data['{key}'] is list with len={len(val)}")
            else:
                print(f"  data['{key}'] = {str(val)[:60]}")
        
        # Check if 'item' exists with movie info
        item = dd.get("item") or dd.get("movie") or {}
        if isinstance(item, dict):
            print(f"  item/movie keys: {list(item.keys())[:12]}")
            print(f"  name: {item.get('name')}")
            print(f"  slug: {item.get('slug')}")
    except Exception as e:
        print(f"\n=== SLUG: {slug} === ERROR: {e}")