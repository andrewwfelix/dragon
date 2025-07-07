const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected counts from your data files
const expectedCounts = {
    monsters: 3300,
    spells: 1500,
    magic_items: 1618,
    races: 55,
    feats: 89,
    weapons: 37,
    armor: 12,
    classes: 0, // No classes.json file
    backgrounds: 0, // No backgrounds.json file
    characters: 0, // User data table
    encounters: 0  // User data table
};

async function getFileCount(filePath) {
    try {
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        return (data.results || data).length;
    } catch (error) {
        return 0; // File doesn't exist or can't be read
    }
}

async function getDatabaseCount(tableName) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`❌ Error counting ${tableName}: ${error.message}`);
            return -1;
        }
        return count;
    } catch (error) {
        console.log(`❌ Exception counting ${tableName}: ${error.message}`);
        return -1;
    }
}

async function finalVerification() {
    console.log('🔍 FINAL VERIFICATION REPORT');
    console.log('=' .repeat(50));
    
    // Check file counts first
    console.log('\n📁 SOURCE FILE COUNTS:');
    const dataDir = 'C:/temp/dragon_data';
    const fileCounts = {};
    
    const files = [
        { name: 'monsters', file: 'monsters.json' },
        { name: 'spells', file: 'spells.json' },
        { name: 'magic_items', file: 'magicitems.json' },
        { name: 'races', file: 'races.json' },
        { name: 'feats', file: 'feats.json' },
        { name: 'weapons', file: 'weapons.json' },
        { name: 'armor', file: 'armor.json' }
    ];
    
    for (const { name, file } of files) {
        const count = await getFileCount(path.join(dataDir, file));
        fileCounts[name] = count;
        console.log(`📊 ${name}: ${count} records`);
    }
    
    // Check database counts
    console.log('\n🗄️  DATABASE COUNTS:');
    const databaseCounts = {};
    
    for (const tableName of Object.keys(expectedCounts)) {
        const count = await getDatabaseCount(tableName);
        databaseCounts[tableName] = count;
        
        if (count >= 0) {
            console.log(`📊 ${tableName}: ${count} records`);
        }
    }
    
    // Compare and report
    console.log('\n📊 COMPARISON REPORT:');
    console.log('=' .repeat(50));
    
    let allMatch = true;
    let totalExpected = 0;
    let totalActual = 0;
    
    for (const tableName of Object.keys(expectedCounts)) {
        const expected = expectedCounts[tableName];
        const actual = databaseCounts[tableName];
        const fileCount = fileCounts[tableName] || 0;
        
        totalExpected += expected;
        if (actual >= 0) totalActual += actual;
        
        let status = '❌';
        let details = '';
        
        if (actual === expected) {
            status = '✅';
        } else if (actual === fileCount && fileCount > 0) {
            status = '✅';
            details = ` (file count: ${fileCount})`;
        } else if (actual === -1) {
            status = '❌';
            details = ' (error reading table)';
        } else {
            status = '⚠️';
            details = ` (expected: ${expected}, file: ${fileCount})`;
        }
        
        console.log(`${status} ${tableName}: ${actual} records${details}`);
        
        if (actual !== expected && actual !== fileCount) {
            allMatch = false;
        }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Total Expected: ${totalExpected} records`);
    console.log(`Total Actual: ${totalActual} records`);
    
    if (allMatch) {
        console.log('🎉 ALL TABLES MATCH EXPECTED COUNTS!');
    } else {
        console.log('⚠️  SOME TABLES HAVE MISMATCHES');
    }
    
    // Sample data verification
    console.log('\n🔍 SAMPLE DATA VERIFICATION:');
    console.log('=' .repeat(50));
    
    const sampleTables = ['monsters', 'spells', 'magic_items'];
    for (const tableName of sampleTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('name, slug')
                .limit(3);
            
            if (error) {
                console.log(`❌ ${tableName}: Error - ${error.message}`);
            } else {
                console.log(`📊 ${tableName} samples: ${data.map(r => r.name).join(', ')}`);
            }
        } catch (error) {
            console.log(`❌ ${tableName}: Exception - ${error.message}`);
        }
    }
    
    console.log('\n🏁 VERIFICATION COMPLETE');
}

finalVerification().catch(console.error); 