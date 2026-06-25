import requests, json

# Test 1: One Piece detail
r = requests.get('https://ophim1.com/v1/api/phim/one-piece')
movie = r.json().get('data', {}).get('item', {})
print('=== COUNTRY FIELD for one-piece ===')
print(json.dumps(movie.get('country'), indent=2, ensure_ascii=False))
print('=== CATEGORY FIELD for one-piece ===')
print(json.dumps(movie.get('category'), indent=2, ensure_ascii=False))
print('=== LANG ===')
print(movie.get('lang'))

# Test 2: Mechamato detail
r2 = requests.get('https://ophim1.com/v1/api/phim/mechamato')
movie2 = r2.json().get('data', {}).get('item', {})
print('\n=== COUNTRY FIELD for mechamato ===')
print(json.dumps(movie2.get('country'), indent=2, ensure_ascii=False))
print('=== CATEGORY FIELD for mechamato ===')
print(json.dumps(movie2.get('category'), indent=2, ensure_ascii=False))
print('=== LANG ===')
print(movie2.get('lang'))

# Test 3: List API - does it include country?
r3 = requests.get('https://ophim1.com/v1/api/tim-kiem', params={'keyword': 'hoat hinh', 'page': 1, 'limit': 5})
items = r3.json().get('data', {}).get('items', [])
print('\n=== LIST/tim-kiem API: first 3 items country ===')
for i, item in enumerate(items[:3]):
    print('Item %d (%s): country = %s' % (i, item.get('name'), json.dumps(item.get('country'), ensure_ascii=False)))

# Test 4: danh-sach/hoat-hinh
r4 = requests.get('https://ophim1.com/v1/api/danh-sach/hoat-hinh', params={'page': 1, 'limit': 5})
items4 = r4.json().get('data', {}).get('items', [])
print('\n=== DANH-SACH/HOAT-HINH: first 3 items country ===')
for i, item in enumerate(items4[:3]):
    print('Item %d (%s): country = %s' % (i, item.get('name'), json.dumps(item.get('country'), ensure_ascii=False)))
    print('  category = %s' % json.dumps(item.get('category'), ensure_ascii=False))

# Test 5: Naruto detail
r5 = requests.get('https://ophim1.com/v1/api/phim/naruto')
movie5 = r5.json().get('data', {}).get('item', {})
print('\n=== COUNTRY FIELD for naruto ===')
print(json.dumps(movie5.get('country'), indent=2, ensure_ascii=False))
print('=== CATEGORY FIELD for naruto ===')
print(json.dumps(movie5.get('category'), indent=2, ensure_ascii=False))
print('=== LANG ===')
print(movie5.get('lang'))