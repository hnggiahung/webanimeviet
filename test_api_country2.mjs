import axios from 'axios';

async function test() {
  try {
    // Test: danh-sach/hoat-hinh endpoint
    const list = await axios.get('https://ophim1.com/v1/api/danh-sach/hoat-hinh', { params: { page: 1, limit: 5 } });
    console.log('=== danh-sach/hoat-hinh status:', list.status);
    const items = list.data?.data?.items || [];
    console.log('Total items:', list.data?.data?.params?.totalItems || items.length);
    console.log('\n=== First 5 items country ===');
    items.slice(0, 5).forEach((item, i) => {
      console.log('Item ' + i + ' (' + item.name + '):');
      console.log('  country =', JSON.stringify(item.country));
      console.log('  category =', JSON.stringify(item.category));
      console.log('  lang =', item.lang);
    });
    
    // Test: Also try quoc-gia/nhat-ban
    try {
      const qg = await axios.get('https://ophim1.com/v1/api/quoc-gia/nhat-ban', { params: { page: 1, limit: 5 } });
      console.log('\n=== quoc-gia/nhat-ban status:', qg.status);
      const qgItems = qg.data?.data?.items || [];
      console.log('First 3 items:');
      qgItems.slice(0, 3).forEach((item, i) => {
        console.log('Item ' + i + ' (' + item.name + '):');
        console.log('  category =', JSON.stringify(item.category));
        console.log('  lang =', item.lang);
      });
    } catch(e) {
      console.log('\n=== quoc-gia/nhat-ban error:', e.message, e.response?.status);
    }
    
  } catch(e) {
    console.error('Error:', e.message, e.response?.status);
  }
}

test();