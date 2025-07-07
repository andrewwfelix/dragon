const fs = require('fs').promises;
const path = require('path');

async function cleanMonstersJsonAdvanced() {
    console.log('🧹 Advanced cleaning of monsters.json file...');
    
    try {
        // Read the original file
        const filePath = path.join('C:/temp/dragon_data/monsters.json');
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        console.log(`📊 Original count: ${data.results.length}`);
        
        // Create a Map to track unique monsters by slug
        const uniqueMonsters = new Map();
        const duplicates = [];
        const uniqueCount = new Map(); // Track how many times each monster appears
        
        data.results.forEach((monster, index) => {
            const slug = monster.slug || monster.name?.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            if (uniqueMonsters.has(slug)) {
                duplicates.push({
                    name: monster.name,
                    slug: slug,
                    index: index
                });
                uniqueCount.set(slug, uniqueCount.get(slug) + 1);
            } else {
                uniqueMonsters.set(slug, monster);
                uniqueCount.set(slug, 1);
            }
        });
        
        console.log(`📊 Unique monsters: ${uniqueMonsters.size}`);
        console.log(`📊 Duplicates found: ${duplicates.length}`);
        
        // Show some statistics about duplicates
        const duplicateStats = Array.from(uniqueCount.entries())
            .filter(([slug, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        console.log('\n📝 Top 10 most duplicated monsters:');
        duplicateStats.forEach(([slug, count]) => {
            const monster = uniqueMonsters.get(slug);
            console.log(`   - ${monster.name}: ${count} copies`);
        });
        
        // Check if we have monsters beyond the first 100
        const allMonsters = Array.from(uniqueMonsters.values());
        const first100 = allMonsters.slice(0, 100);
        const beyond100 = allMonsters.slice(100);
        
        console.log(`\n📊 Monsters in first 100: ${first100.length}`);
        console.log(`📊 Monsters beyond first 100: ${beyond100.length}`);
        
        if (beyond100.length > 0) {
            console.log('\n📝 Sample monsters beyond first 100:');
            beyond100.slice(0, 10).forEach(monster => {
                console.log(`   - ${monster.name} (${monster.slug})`);
            });
        }
        
        // Create cleaned data
        const cleanedData = {
            count: uniqueMonsters.size,
            next: null,
            previous: null,
            results: allMonsters
        };
        
        // Create backup of original file
        const backupPath = path.join('C:/temp/dragon_data/monsters_backup.json');
        await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        // Write cleaned file
        await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2));
        console.log(`✅ Cleaned file written: ${filePath}`);
        
        console.log(`\n🎉 Advanced cleaning completed!`);
        console.log(`📊 Original: ${data.results.length} monsters`);
        console.log(`📊 Cleaned: ${cleanedData.results.length} monsters`);
        console.log(`📊 Removed: ${data.results.length - cleanedData.results.length} duplicates`);
        
        // Verify the cleaned file
        const verifyData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        console.log(`📊 Verification: ${verifyData.results.length} monsters in cleaned file`);
        
    } catch (error) {
        console.error('❌ Error cleaning file:', error);
    }
}

cleanMonstersJsonAdvanced(); 