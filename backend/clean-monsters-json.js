const fs = require('fs').promises;
const path = require('path');

async function cleanMonstersJson() {
    console.log('🧹 Cleaning monsters.json file...');
    
    try {
        // Read the original file
        const filePath = path.join('C:/temp/dragon_data/monsters.json');
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        console.log(`📊 Original count: ${data.results.length}`);
        
        // Create a Map to track unique monsters by slug
        const uniqueMonsters = new Map();
        const duplicates = [];
        
        data.results.forEach((monster, index) => {
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
            duplicates.slice(0, 10).forEach(dup => {
                console.log(`   - ${dup.name} (${dup.slug}) at index ${dup.index}`);
            });
        }
        
        // Create cleaned data
        const cleanedData = {
            count: uniqueMonsters.size,
            next: null,
            previous: null,
            results: Array.from(uniqueMonsters.values())
        };
        
        // Create backup of original file
        const backupPath = path.join('C:/temp/dragon_data/monsters_backup.json');
        await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        // Write cleaned file
        await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2));
        console.log(`✅ Cleaned file written: ${filePath}`);
        
        console.log(`\n🎉 Cleaning completed!`);
        console.log(`📊 Original: ${data.results.length} monsters`);
        console.log(`📊 Cleaned: ${cleanedData.results.length} monsters`);
        console.log(`📊 Removed: ${data.results.length - cleanedData.results.length} duplicates`);
        
    } catch (error) {
        console.error('❌ Error cleaning file:', error);
    }
}

cleanMonstersJson(); 