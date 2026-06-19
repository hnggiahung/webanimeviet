// Quick debug script to check the API response - VERIFY TYPE FILTER
async function main() {
    // Check across multiple pages
    for (let page = 1; page <= 3; page++) {
        const url = `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`;
        console.log(`\n========== PAGE ${page} ==========`);
        
        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                console.error('HTTP Error:', resp.status);
                continue;
            }
            const data = await resp.json();
            const items = data?.data?.items || data?.items || [];
            console.log(`Total items: ${items.length}`);
            
            // Group by type field
            const typeGroups = {};
            items.forEach(m => {
                const t = m.type || 'unknown';
                if (!typeGroups[t]) typeGroups[t] = [];
                typeGroups[t].push(m.name || m.title || 'Unknown');
            });
            
            console.log('\n=== GROUPED BY TYPE ===');
            Object.entries(typeGroups).forEach(([type, names]) => {
                console.log(`\n[${type.toUpperCase()}] (${names.length} movies):`);
                names.forEach(n => console.log(`  - ${n}`));
            });
            
        } catch (err) {
            console.error(`Page ${page} error:`, err.message);
        }
    }
}
main();