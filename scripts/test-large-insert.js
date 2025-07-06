const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLargeInsert() {
    console.log('🧪 Testing large insert...');
    
    // Read the monsters file
    const filePath = path.join('C:/temp/dragon_data/monsters.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const monsters = data.results || data;
    
    // Transform function
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
    
    // Test with 500 monsters
    console.log(`\n📝 Testing with 500 monsters...`);
    const largeBatch = monsters.slice(0, 500).map(transformMonster);
    
    const { data: insertData, error: insertError } = await supabase
        .from('monsters')
        .upsert(largeBatch, { 
            onConflict: 'slug',
            ignoreDuplicates: true 
        });
    
    if (insertError) {
        console.log(`❌ Insert error:`, insertError);
        return;
    }
    
    console.log(`✅ Large batch inserted`);
    
    // Check count
    const { count, error: countError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.log(`❌ Count error:`, countError);
    } else {
        console.log(`📊 Final count: ${count}`);
    }
    
    // Try to get all records to see what's actually there
    console.log(`\n🔍 Fetching all records to verify...`);
    const { data: allData, error: fetchError } = await supabase
        .from('monsters')
        .select('name, slug')
        .order('name');
    
    if (fetchError) {
        console.log(`❌ Fetch error:`, fetchError);
    } else {
        console.log(`📊 Actually fetched: ${allData.length} records`);
        console.log(`📊 First 5:`, allData.slice(0, 5).map(m => m.name));
        console.log(`📊 Last 5:`, allData.slice(-5).map(m => m.name));
    }
}

testLargeInsert().catch(console.error); 