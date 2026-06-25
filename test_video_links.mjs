import axios from 'axios';
import fs from 'fs';

async function test() {
  const output = [];
  function log(msg) { output.push(msg); console.log(msg); }
  
  try {
    // Test video links from One Piece
    const detail = await axios.get('https://ophim1.com/v1/api/phim/one-piece');
    const movie = detail.data?.data?.item;
    const episodes = movie?.episodes || [];
    
    log('=== ONE PIECE EPISODES ===');
    log('Number of server groups: ' + episodes.length);
    
    episodes.forEach((server, si) => {
      log('\nServer ' + si + ': ' + server.server_name);
      const data = server.server_data || [];
      log('  Episodes: ' + data.length);
      // Show first 3 episodes
      data.slice(0, 3).forEach((ep, ei) => {
        log('  Ep ' + (ei+1) + ' (' + ep.name + '):');
        log('    link_embed: ' + (ep.link_embed ? ep.link_embed.substring(0, 120) : 'null'));
        log('    link_m3u8: ' + (ep.link_m3u8 ? ep.link_m3u8.substring(0, 120) : 'null'));
        log('    link_direct: ' + (ep.link_direct ? ep.link_direct.substring(0, 120) : 'null'));
      });
    });
    
  } catch(e) {
    log('Error: ' + e.message + ' ' + (e.response?.status || ''));
  }
  
  fs.writeFileSync('test_video_links.txt', output.join('\n'), 'utf8');
}

test();