const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
    console.log('🔍 Checking database contents...\n');

    const tables = [
        'monsters',
        'spells', 
        'magic_items',
        'races',
        'feats',
        'weapons',
        'armor'
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: Error - ${error.message}`);
            } else {
                console.log(`✅ ${table}: ${count} records`);
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }

    console.log('\n📊 Sample data from monsters:');
    try {
        const { data, error } = await supabase
            .from('monsters')
            .select('name, slug, challenge_rating')
            .limit(5);

        if (error) {
            console.log(`Error: ${error.message}`);
        } else {
            data.forEach(monster => {
                console.log(`  - ${monster.name} (CR: ${monster.challenge_rating})`);
            });
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }

    console.log('\n🔍 Checking for potential issues...');
    
    // Check for null slugs
    try {
        const { count, error } = await supabase
            .from('monsters')
            .select('*', { count: 'exact', head: true })
            .is('slug', null);

        if (error) {
            console.log(`Error checking null slugs: ${error.message}`);
        } else {
            console.log(`Monsters with null slugs: ${count}`);
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }

    // Check for duplicate slugs
    try {
        const { data, error } = await supabase
            .from('monsters')
            .select('slug')
            .limit(1000);

        if (error) {
            console.log(`Error checking duplicates: ${error.message}`);
        } else {
            const slugs = data.map(m => m.slug);
            const uniqueSlugs = new Set(slugs);
            console.log(`Total slugs: ${slugs.length}, Unique slugs: ${uniqueSlugs.size}`);
            console.log(`Potential duplicates: ${slugs.length - uniqueSlugs.size}`);
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

checkDatabase().catch(console.error); 