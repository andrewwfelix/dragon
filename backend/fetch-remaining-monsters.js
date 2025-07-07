const fs = require('fs').promises;
const path = require('path');

// Open5e API base URL
const OPEN5E_API_BASE = 'https://api.open5e.com';

async function fetchRemainingMonsters() {
    console.log('🦖 Fetching remaining monster data from Open5e API (page 51+)...');
    
    try {
        let allMonsters = [];
        let nextUrl = `${OPEN5E_API_BASE}/monsters/?page=51`;
        let pageCount = 50; // Start from page 51
        
        console.log('📡 Starting API fetch from page 51...');
        
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
            
            // Safety check - don't fetch more than 100 pages total
            if (pageCount > 100) {
                console.log('⚠️  Reached maximum page limit (100), stopping...');
                break;
            }
        }
        
        console.log(`\n📊 Total additional monsters fetched: ${allMonsters.length}`);
        
        if (allMonsters.length === 0) {
            console.log('❌ No additional monsters were fetched!');
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
        
        console.log(`📊 Unique additional monsters: ${uniqueMonsters.size}`);
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
        
        // Write to a separate file
        const outputFile = path.join('C:/temp/dragon_data/monsters_remaining.json');
        await fs.writeFile(outputFile, JSON.stringify(finalData, null, 2));
        console.log(`✅ Additional monsters data written to: ${outputFile}`);
        
        console.log(`\n🎉 Fetch completed successfully!`);
        console.log(`📊 Total fetched: ${allMonsters.length}`);
        console.log(`📊 Unique monsters: ${finalData.results.length}`);
        console.log(`📊 Duplicates removed: ${duplicates.length}`);
        
        // Show some sample monsters
        console.log('\n📝 Sample additional monsters:');
        finalData.results.slice(0, 10).forEach(monster => {
            console.log(`   - ${monster.name} (${monster.slug})`);
        });
        
        // Show the last few monsters
        console.log('\n📝 Last few monsters fetched:');
        finalData.results.slice(-5).forEach(monster => {
            console.log(`   - ${monster.name} (${monster.slug})`);
        });
        
    } catch (error) {
        console.error('❌ Error fetching remaining monsters:', error);
    }
}

fetchRemainingMonsters(); 