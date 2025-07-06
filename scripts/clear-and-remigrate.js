const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndRemigrate() {
    console.log('🧹 Clearing and remigrating monsters...');
    
    // Step 1: Clear the monsters table
    console.log('\n🗑️  Clearing monsters table...');
    const { error: deleteError } = await supabase
        .from('monsters')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
        console.log(`❌ Error clearing table:`, deleteError);
        return;
    }
    
    console.log('✅ Table cleared');
    
    // Step 2: Read the monsters file
    console.log('\n📁 Reading monsters file...');
    const filePath = path.join('C:/temp/dragon_data/monsters.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const monsters = data.results || data;
    
    console.log(`📊 Total monsters in file: ${monsters.length}`);
    
    // Step 3: Transform function with duplicate handling
    const usedSlugs = new Set();
    const transformMonster = (monster, index) => {
        let slug = monster.slug || monster.key || monster.name?.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Handle duplicate slugs by adding a number
        if (usedSlugs.has(slug)) {
            let counter = 1;
            let newSlug = `${slug}-${counter}`;
            while (usedSlugs.has(newSlug)) {
                counter++;
                newSlug = `${slug}-${counter}`;
            }
            slug = newSlug;
        }
        usedSlugs.add(slug);
        
        return {
            name: monster.name,
            slug: slug,
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
        };
    };
    
    // Step 4: Insert in smaller batches with detailed logging
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < monsters.length; i += batchSize) {
        const batch = monsters.slice(i, i + batchSize).map((monster, index) => transformMonster(monster, i + index));
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(monsters.length / batchSize);
        
        console.log(`\n📝 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
        console.log(`   Range: ${i + 1} to ${Math.min(i + batchSize, monsters.length)}`);
        console.log(`   Sample: ${batch[0].name} to ${batch[batch.length - 1].name}`);
        
        const { data: insertData, error: insertError } = await supabase
            .from('monsters')
            .insert(batch);
        
        if (insertError) {
            console.log(`❌ Batch ${batchNumber} error:`, insertError);
            return;
        }
        
        totalInserted += batch.length;
        console.log(`✅ Batch ${batchNumber} inserted successfully`);
        
        // Check count after each batch
        const { count, error: countError } = await supabase
            .from('monsters')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.log(`❌ Count error after batch ${batchNumber}:`, countError);
        } else {
            console.log(`📊 Current total in database: ${count}`);
        }
        
        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total inserted: ${totalInserted}`);
    
    // Final count check
    const { count: finalCount, error: finalCountError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
    
    if (finalCountError) {
        console.log(`❌ Final count error:`, finalCountError);
    } else {
        console.log(`📊 Final database count: ${finalCount}`);
    }
    
    // Test fetching some records
    console.log(`\n🔍 Testing data retrieval...`);
    const { data: testData, error: testError } = await supabase
        .from('monsters')
        .select('name, slug')
        .order('name')
        .limit(10);
    
    if (testError) {
        console.log(`❌ Test fetch error:`, testError);
    } else {
        console.log(`📊 Test fetch: ${testData.length} records`);
        console.log(`📊 Sample:`, testData.map(m => m.name));
    }
}

clearAndRemigrate().catch(console.error); 