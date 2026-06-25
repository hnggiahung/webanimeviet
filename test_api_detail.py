import urllib.request, json

# Test movie detail API
slugs = ["one-piece", "nhung-ban-di-chuc-phan-1", "needy-girl-overdose", "hac-mieu-va-lop-hoc-phu-thuy"]

for slug in slugs:
    try:
        req = urllib.request.Request(
            f"https://ophim1.com/v1/api/phim/{slug}",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        data = urllib.request.urlopen(req, timeout=15).read()
        d = json.loads(data)
        print(f"\n=== SLUG: {slug} ===")
        print(f"Status: {d.get('status')}")
        dd = d.get("data", {})
        print(f"Data keys: {list(dd.keys())}")
        movie = dd.get("movie", {})
        print(f"Movie keys: {list(movie.keys())[:10]}")
        print(f"Name: {movie.get('name')}")
        print(f"Has episodes: {'episodes' in dd}")
        episodes = dd.get("episodes", [])
        print(f"Episodes count: {len(episodes)}")
        if episodes:
            print(f"First ep keys: {list(episodes[0].keys())}")
            server_data = episodes[0].get("server_data", [])
            print(f"Server data count: {len(server_data)}")
    except Exception as e:
        print(f"\n=== SLUG: {slug} === ERROR: {e}")