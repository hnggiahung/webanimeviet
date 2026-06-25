import urllib.request, json  
url = 'https://ophim1.com/v1/api/danh-sach?page=1'  
data = urllib.request.urlopen(url, timeout=10).read()  
d = json.loads(data)  
print('Top keys:', list(d.keys()))  
if 'data' in d:  
    print('Data type:', type(d['data']))  
    if isinstance(d['data'], dict):  
        print('Data keys:', list(d['data'].keys()))  
        if 'items' in d['data']:  
            print('Items count:', len(d['data']['items']))  
            if d['data']['items']:  
                print('First item keys:', list(d['data']['items'][0].keys()))  
elif 'items' in d:  
    print('Items count:', len(d['items']))  
else:  
    print('No items found, first 500 chars:')  
    print(str(d)[:500])  
