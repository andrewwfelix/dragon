const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test with just monsters first
async function debugMonstersMigration() {
    console.log('🔍 Debugging monsters migration...');
    
    // Read the monsters file
    const filePath = path.join('C:/temp/dragon_data/monsters.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const monsters = data.results || data;
    
    console.log(`📊 Total monsters in file: ${monsters.length}`);
    console.log(`📊 First 3 monsters:`, monsters.slice(0, 3).map(m => ({ name: m.name, slug: m.slug })));
    
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
    
    // Test with first 10 monsters
    const testMonsters = monsters.slice(0, 10).map(transformMonster);
    console.log(`\n🧪 Testing with first 10 monsters...`);
    console.log(`Sample transformed monster:`, testMonsters[0]);
    
    // Clear the table first
    console.log(`\n🗑️  Clearing monsters table...`);
    const { error: deleteError } = await supabase
        .from('monsters')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
        console.log(`❌ Error clearing table:`, deleteError);
        return;
    }
    
    console.log(`✅ Table cleared`);
    
    // Insert test batch
    console.log(`\n📝 Inserting test batch...`);
    const { data: insertData, error: insertError } = await supabase
        .from('monsters')
        .insert(testMonsters);
    
    if (insertError) {
        console.log(`❌ Insert error:`, insertError);
        return;
    }
    
    console.log(`✅ Inserted ${insertData?.length || 0} records`);
    
    // Check count
    const { count, error: countError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.log(`❌ Count error:`, countError);
    } else {
        console.log(`📊 Current count: ${count}`);
    }
    
    // Now try a larger batch
    console.log(`\n📝 Testing with 100 monsters...`);
    const largerBatch = monsters.slice(0, 100).map(transformMonster);
    
    const { data: largeInsertData, error: largeInsertError } = await supabase
        .from('monsters')
        .upsert(largerBatch, { 
            onConflict: 'slug',
            ignoreDuplicates: true 
        });
    
    if (largeInsertError) {
        console.log(`❌ Large insert error:`, largeInsertError);
        return;
    }
    
    console.log(`✅ Large batch inserted`);
    
    // Check count again
    const { count: finalCount, error: finalCountError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
    
    if (finalCountError) {
        console.log(`❌ Final count error:`, finalCountError);
    } else {
        console.log(`📊 Final count: ${finalCount}`);
    }
}

debugMonstersMigration().catch(console.error); 