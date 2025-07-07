const fs = require('fs').promises;
const path = require('path');

async function combineMonsterFiles() {
    console.log('🔗 Combining monster files...');
    
    try {
        // Read the main monsters file
        const mainFile = path.join('C:/temp/dragon_data/monsters.json');
        const mainData = JSON.parse(await fs.readFile(mainFile, 'utf8'));
        
        // Read the remaining monsters file
        const remainingFile = path.join('C:/temp/dragon_data/monsters_remaining.json');
        const remainingData = JSON.parse(await fs.readFile(remainingFile, 'utf8'));
        
        console.log(`📊 Main file: ${mainData.results.length} monsters`);
        console.log(`📊 Remaining file: ${remainingData.results.length} monsters`);
        
        // Combine all monsters
        const allMonsters = [...mainData.results, ...remainingData.results];
        console.log(`📊 Combined total: ${allMonsters.length} monsters`);
        
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
            duplicates.slice(0, 10).forEach(dup => {
                console.log(`   - ${dup.name} (${dup.slug})`);
            });
        }
        
        // Create the final complete data structure
        const completeData = {
            count: uniqueMonsters.size,
            next: null,
            previous: null,
            results: Array.from(uniqueMonsters.values())
        };
        
        // Create backup of current main file
        const backupPath = path.join('C:/temp/dragon_data/monsters_complete_backup.json');
        await fs.writeFile(backupPath, JSON.stringify(mainData, null, 2));
        console.log(`💾 Main file backed up to: ${backupPath}`);
        
        // Write the complete data to the main file
        await fs.writeFile(mainFile, JSON.stringify(completeData, null, 2));
        console.log(`✅ Complete monster data written to: ${mainFile}`);
        
        console.log(`\n🎉 Combination completed successfully!`);
        console.log(`📊 Original main: ${mainData.results.length} monsters`);
        console.log(`📊 Additional: ${remainingData.results.length} monsters`);
        console.log(`📊 Complete total: ${completeData.results.length} monsters`);
        console.log(`📊 Duplicates removed: ${duplicates.length}`);
        
        // Show some sample monsters from different parts of the alphabet
        const sampleMonsters = completeData.results.filter(monster => 
            monster.name.startsWith('A') || 
            monster.name.startsWith('M') || 
            monster.name.startsWith('Z')
        ).slice(0, 15);
        
        console.log('\n📝 Sample monsters from complete database:');
        sampleMonsters.forEach(monster => {
            console.log(`   - ${monster.name} (${monster.slug})`);
        });
        
        // Show the last few monsters
        console.log('\n📝 Last few monsters in complete database:');
        completeData.results.slice(-5).forEach(monster => {
            console.log(`   - ${monster.name} (${monster.slug})`);
        });
        
    } catch (error) {
        console.error('❌ Error combining files:', error);
    }
}

combineMonsterFiles(); 