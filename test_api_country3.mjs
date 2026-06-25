import axios from 'axios';
import fs from 'fs';

async function test() {
  const output = [];
  function log(msg) { output.push(msg); console.log(msg); }
  
  try {
    // Test: danh-sach/hoat-hinh endpoint
    const list = await axios.get('https://ophim1.com/v1/api/danh-sach/hoat-hinh', { params: { page: 1, limit: 5 } });
    log('=== danh-sach/hoat-hinh status: ' + list.status);
    const items = list.data?.data?.items || [];
    log('Total items from param: ' + JSON.stringify(list.data?.data?.params?.totalItems));
    log('\n=== First 5 items ===');
    items.slice(0, 5).forEach((item, i) => {
      log('Item ' + i + ' (' + (item.name || 'unknown') + '):');
      log('  country = ' + JSON.stringify(item.country));
      log('  category = ' + JSON.stringify(item.category));
      log('  lang = ' + item.lang);
      log('  slug = ' + item.slug);
    });
    
    // Test: quoc-gia/nhat-ban
    try {
      const qg = await axios.get('https://ophim1.com/v1/api/quoc-gia/nhat-ban', { params: { page: 1, limit: 5 } });
      log('\n=== quoc-gia/nhat-ban status: ' + qg.status);
      const qgItems = qg.data?.data?.items || [];
      log('Total: ' + qgItems.length);
      qgItems.slice(0, 3).forEach((item, i) => {
        log('Item ' + i + ' (' + (item.name || 'unknown') + '):');
        log('  category = ' + JSON.stringify(item.category));
        log('  lang = ' + item.lang);
        log('  slug = ' + item.slug);
      });
    } catch(e) {
      log('\n=== quoc-gia/nhat-ban error: ' + e.message + ' ' + (e.response?.status || ''));
    }
    
    // Test: tim-kiem with keyword
    const tk = await axios.get('https://ophim1.com/v1/api/tim-kiem', { params: { keyword: 'hoat hinh', page: 1, limit: 5 } });
    log('\n=== tim-kiem/hoat hinh ===');
    const tkItems = tk.data?.data?.items || [];
    tkItems.slice(0, 5).forEach((item, i) => {
      log('Item ' + i + ' (' + (item.name || 'unknown') + '):');
      log('  country = ' + JSON.stringify(item.country));
      log('  category = ' + JSON.stringify(item.category));
      log('  lang = ' + item.lang);
      log('  slug = ' + item.slug);
    });
    
  } catch(e) {
    log('Error: ' + e.message + ' ' + (e.response?.status || ''));
  }
  
  fs.writeFileSync('test_output.txt', output.join('\n'), 'utf8');
}

test();