const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Data directory path
const DATA_DIR = 'C:/temp/dragon_data';

// Helper function to read JSON files
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

// Helper function to insert data with error handling
async function insertData(tableName, data, transformFn = null) {
    try {
        // Handle the Open5e API response structure
        const items = data.results || data;
        const transformedData = transformFn ? items.map(transformFn) : items;
        
        console.log(`Inserting ${transformedData.length} records into ${tableName}...`);
        
        // Insert in batches of 1000 to avoid limits
        const batchSize = 1000;
        let successCount = 0;
        
        for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize);
            console.log(`  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedData.length/batchSize)} (${batch.length} records)...`);
            
            const { data: result, error } = await supabase
                .from(tableName)
                .upsert(batch, { 
                    onConflict: 'slug',
                    ignoreDuplicates: true 
                });

            if (error) {
                console.error(`Error inserting batch into ${tableName}:`, error);
                return false;
            }
            
            successCount += batch.length;
        }

        console.log(`✅ Successfully inserted ${successCount} records into ${tableName}`);
        return true;
    } catch (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        return false;
    }
}

// Transform functions for different data types
const transformMonster = (monster) => ({
    name: monster.name,
    slug: monster.slug || monster.key || monster.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    size: monster.size,
    type: monster.type,
    subtype: monster.subtype,
    alignment: monster.alignment,
    challenge_rating: monster.challenge_rating,
    armor_class: monster.armor_class,
    armor_desc: monster.armor_desc,
    hit_points: monster.hit_points,
    hit_dice: monster.hit_dice,
    speed: monster.speed,
    strength: monster.strength,
    dexterity: monster.dexterity,
    constitution: monster.constitution,
    intelligence: monster.intelligence,
    wisdom: monster.wisdom,
    charisma: monster.charisma,
    data: monster
});

const transformSpell = (spell) => ({
    name: spell.name,
    slug: spell.slug || spell.key || spell.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    level: spell.level,
    school: spell.school,
    casting_time: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    components: spell.components,
    material: spell.material,
    desc: spell.desc,
    higher_level: spell.higher_level,
    data: spell
});

const transformMagicItem = (item) => ({
    name: item.name,
    slug: item.slug || item.key || item.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    type: item.type,
    rarity: item.rarity,
    attunement: item.attunement,
    desc: item.desc,
    data: item
});

const transformClass = (cls) => ({
    name: cls.name,
    slug: cls.slug,
    hit_die: cls.hit_die,
    data: cls
});

const transformRace = (race) => ({
    name: race.name,
    slug: race.slug || race.key || race.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    is_subrace: race.is_subrace || false,
    parent_race: race.parent_race,
    data: race
});

const transformBackground = (bg) => ({
    name: bg.name,
    slug: bg.slug,
    data: bg
});

const transformFeat = (feat) => ({
    name: feat.name,
    slug: feat.slug || feat.key || feat.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    data: feat
});

const transformWeapon = (weapon) => ({
    name: weapon.name,
    slug: weapon.slug || weapon.key || weapon.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    category: weapon.category,
    damage_dice: weapon.damage_dice,
    damage_type: weapon.damage_type,
    data: weapon
});

const transformArmor = (armor) => ({
    name: armor.name,
    slug: armor.slug || armor.key || armor.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    category: armor.category,
    ac_base: armor.ac_base,
    ac_add_dexmod: armor.ac_add_dexmod,
    ac_cap_dexmod: armor.ac_cap_dexmod,
    data: armor
});

// Main migration function
async function migrateData() {
    console.log('🚀 Starting Supabase migration...');
    console.log('Data directory:', DATA_DIR);

    // Check if data directory exists
    try {
        await fs.access(DATA_DIR);
    } catch (error) {
        console.error(`Data directory not found: ${DATA_DIR}`);
        process.exit(1);
    }

    const migrationTasks = [
        {
            file: 'monsters.json',
            table: 'monsters',
            transform: transformMonster
        },
        {
            file: 'spells.json',
            table: 'spells',
            transform: transformSpell
        },
        {
            file: 'magicitems.json',
            table: 'magic_items',
            transform: transformMagicItem
        },
        {
            file: 'races.json',
            table: 'races',
            transform: transformRace
        },
        {
            file: 'feats.json',
            table: 'feats',
            transform: transformFeat
        },
        {
            file: 'weapons.json',
            table: 'weapons',
            transform: transformWeapon
        },
        {
            file: 'armor.json',
            table: 'armor',
            transform: transformArmor
        }
    ];

    let successCount = 0;
    let totalCount = 0;

    for (const task of migrationTasks) {
        const filePath = path.join(DATA_DIR, task.file);
        
        console.log(`\n📁 Processing ${task.file}...`);
        
        const data = await readJsonFile(filePath);
        if (!data) {
            console.log(`⚠️  Skipping ${task.file} - file not found or invalid`);
            continue;
        }

        totalCount++;
        const success = await insertData(task.table, data, task.transform);
        if (success) {
            successCount++;
        }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated ${successCount}/${totalCount} data types`);
    
    if (successCount < totalCount) {
        console.log(`⚠️  Some migrations failed. Check the logs above for details.`);
        process.exit(1);
    }
}

// Test connection first
async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }

        console.log('✅ Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
}

// Run the migration
async function main() {
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.error('Cannot proceed without database connection');
        process.exit(1);
    }

    await migrateData();
}

main().catch(console.error); 