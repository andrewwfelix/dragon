const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndRemigrateSpells() {
    console.log('🧹 Clearing and remigrating spells...');
    
    // Step 1: Clear the spells table
    console.log('\n🗑️  Clearing spells table...');
    const { error: deleteError } = await supabase
        .from('spells')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
        console.log(`❌ Error clearing table:`, deleteError);
        return;
    }
    
    console.log('✅ Table cleared');
    
    // Step 2: Read the spells file
    console.log('\n📁 Reading spells file...');
    const filePath = path.join('C:/temp/dragon_data/spells.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const spells = data.results || data;
    
    console.log(`📊 Total spells in file: ${spells.length}`);
    
    // Step 3: Transform function with duplicate handling
    const usedSlugs = new Set();
    const transformSpell = (spell, index) => {
        let slug = spell.slug || spell.key || spell.name?.toLowerCase().replace(/[^a-z0-9]/g, '-');
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
            name: spell.name,
            slug: slug,
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
        };
    };
    
    // Step 4: Insert in smaller batches with detailed logging
    const batchSize = 100;
    let totalInserted = 0;
    for (let i = 0; i < spells.length; i += batchSize) {
        const batch = spells.slice(i, i + batchSize).map((spell, index) => transformSpell(spell, i + index));
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(spells.length / batchSize);
        console.log(`\n📝 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
        console.log(`   Range: ${i + 1} to ${Math.min(i + batchSize, spells.length)}`);
        console.log(`   Sample: ${batch[0].name} to ${batch[batch.length - 1].name}`);
        const { data: insertData, error: insertError } = await supabase
            .from('spells')
            .insert(batch);
        if (insertError) {
            console.log(`❌ Batch ${batchNumber} error:`, insertError);
            return;
        }
        totalInserted += batch.length;
        console.log(`✅ Batch ${batchNumber} inserted successfully`);
        // Check count after each batch
        const { count, error: countError } = await supabase
            .from('spells')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.log(`❌ Count error after batch ${batchNumber}:`, countError);
        } else {
            console.log(`📊 Current total in database: ${count}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total inserted: ${totalInserted}`);
    // Final count check
    const { count: finalCount, error: finalCountError } = await supabase
        .from('spells')
        .select('*', { count: 'exact', head: true });
    if (finalCountError) {
        console.log(`❌ Final count error:`, finalCountError);
    } else {
        console.log(`📊 Final database count: ${finalCount}`);
    }
    // Test fetching some records
    console.log(`\n🔍 Testing data retrieval...`);
    const { data: testData, error: testError } = await supabase
        .from('spells')
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

clearAndRemigrateSpells().catch(console.error); 