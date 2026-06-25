const axios = require('axios');

async function test() {
  try {
    // Test 1: Get detail of a known Japanese anime
    const detail = await axios.get('https://ophim1.com/v1/api/phim/one-piece');
    const movie = detail.data?.data?.item;
    console.log('=== COUNTRY FIELD for one-piece ===');
    console.log(JSON.stringify(movie?.country, null, 2));
    console.log('=== CATEGORY FIELD for one-piece ===');
    console.log(JSON.stringify(movie?.category, null, 2));
    console.log('=== LANG ===');
    console.log(movie?.lang);
    
    // Test 2: Get detail of a non-Japanese cartoon (Mechamato)
    const detail2 = await axios.get('https://ophim1.com/v1/api/phim/mechamato');
    const movie2 = detail2.data?.data?.item;
    console.log('\n=== COUNTRY FIELD for mechamato ===');
    console.log(JSON.stringify(movie2?.country, null, 2));
    console.log('=== CATEGORY FIELD for mechamato ===');
    console.log(JSON.stringify(movie2?.category, null, 2));
    
    // Test 3: Check if the list API returns country data
    const list = await axios.get('https://ophim1.com/v1/api/tim-kiem', { params: { keyword: 'hoat hinh', page: 1, limit: 5 } });
    const items = list.data?.data?.items || [];
    console.log('\n=== LIST API: first 3 items country field ===');
    items.slice(0, 3).forEach((item, i) => {
      console.log('Item ' + i + ' (' + item.name + '): country =', JSON.stringify(item.country));
    });
    
    // Test 4: Also test the danh-sach endpoint
    const list2 = await axios.get('https://ophim1.com/v1/api/danh-sach/hoat-hinh', { params: { page: 1, limit: 5 } });
    const items2 = list2.data?.data?.items || [];
    console.log('\n=== DANH-SACH/HOAT-HINH API: first 3 items country field ===');
    items2.slice(0, 3).forEach((item, i) => {
      console.log('Item ' + i + ' (' + item.name + '): country =', JSON.stringify(item.country));
    });
    
    // Test 5: naruto detail
    const detail3 = await axios.get('https://ophim1.com/v1/api/phim/naruto');
    const movie3 = detail3.data?.data?.item;
    console.log('\n=== COUNTRY FIELD for naruto ===');
    console.log(JSON.stringify(movie3?.country, null, 2));
    console.log('=== CATEGORY FIELD for naruto ===');
    console.log(JSON.stringify(movie3?.category, null, 2));
    console.log('=== LANG ===');
    console.log(movie3?.lang);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();