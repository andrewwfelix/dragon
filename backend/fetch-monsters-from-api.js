const fs = require('fs').promises;
const path = require('path');

// Open5e API base URL
const OPEN5E_API_BASE = 'https://api.open5e.com';

async function fetchMonstersFromAPI() {
    console.log('🦖 Fetching fresh monster data from Open5e API...');
    
    try {
        let allMonsters = [];
        let nextUrl = `${OPEN5E_API_BASE}/monsters/`;
        let pageCount = 0;
        
        console.log('📡 Starting API fetch...');
        
        while (nextUrl) {
            pageCount++;
            console.log(`📄 Fetching page ${pageCount}...`);
            
            const response = await fetch(nextUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.results || !Array.isArray(data.results)) {
                console.log('⚠️  No results array found in response');
                break;
            }
            
            console.log(`   📊 Found ${data.results.length} monsters on this page`);
            
            // Add monsters from this page
            allMonsters = allMonsters.concat(data.results);
            
            // Check for next page
            nextUrl = data.next;
            
            // Add a small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Safety check - don't fetch more than 50 pages
            if (pageCount > 50) {
                console.log('⚠️  Reached maximum page limit (50), stopping...');
                break;
            }
        }
        
        console.log(`\n📊 Total monsters fetched: ${allMonsters.length}`);
        
        if (allMonsters.length === 0) {
            console.log('❌ No monsters were fetched!');
            return;
        }
        
        // Check for duplicates
        const uniqueMonsters = new Map();
        const duplicates = [];
        
        allMonsters.forEach((monster, index) => {
            const slug = monster.slug || monster.name?.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            if (uniqueMonsters.has(slug)) {
                duplicates.push({
                    name: monster.name,
                    slug: slug,
                    index: index
                });
            } else {
                uniqueMonsters.set(slug, monster);
            }
        });
        
        console.log(`📊 Unique monsters: ${uniqueMonsters.size}`);
        console.log(`📊 Duplicates found: ${duplicates.length}`);
        
        if (duplicates.length > 0) {
            console.log('\n📝 Sample duplicates:');
            duplicates.slice(0, 5).forEach(dup => {
                console.log(`   - ${dup.name} (${dup.slug})`);
            });
        }
        
        // Create the final data structure
        const finalData = {
            count: uniqueMonsters.size,
            next: null,
            previous: null,
            results: Array.from(uniqueMonsters.values())
        };
        
        // Create backup of current file
        const currentFile = path.join('C:/temp/dragon_data/monsters.json');
        try {
            const currentData = await fs.readFile(currentFile, 'utf8');
            const backupPath = path.join('C:/temp/dragon_data/monsters_old_backup.json');
            await fs.writeFile(backupPath, currentData);
            console.log(`💾 Current file backed up to: ${backupPath}`);
        } catch (error) {
            console.log('⚠️  Could not backup current file (might not exist)');
        }
        
        // Write the new data
        await fs.writeFile(currentFile, JSON.stringify(finalData, null, 2));
        console.log(`✅ New monsters data written to: ${currentFile}`);
        
        console.log(`\n🎉 Fetch completed successfully!`);
        console.log(`📊 Total fetched: ${allMonsters.length}`);
        console.log(`📊 Unique monsters: ${finalData.results.length}`);
        console.log(`📊 Duplicates removed: ${duplicates.length}`);
        
        // Show some sample monsters
        console.log('\n📝 Sample monsters:');
        finalData.results.slice(0, 10).forEach(monster => {
            console.log(`   - ${monster.name} (${monster.slug})`);
        });
        
    } catch (error) {
        console.error('❌ Error fetching monsters:', error);
    }
}

fetchMonstersFromAPI(); 