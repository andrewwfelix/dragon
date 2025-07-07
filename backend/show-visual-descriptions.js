const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showVisualDescriptions() {
  console.log('🎨 Showing generated visual descriptions...\n');
  
  try {
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('name, visual_description')
      .not('visual_description', 'is', null)
      .limit(10);
    
    if (error) throw error;
    
    console.log(`📊 Found ${monsters.length} monsters with visual descriptions:\n`);
    
    monsters.forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name}:`);
      console.log(`   "${monster.visual_description}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error fetching visual descriptions:', error);
  }
}

showVisualDescriptions()
  .then(() => {
    console.log('✨ Display completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  }); 