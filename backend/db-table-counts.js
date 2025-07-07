const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const tables = [
  'monsters',
  'spells',
  'magic_items',
  'races',
  'feats',
  'weapons',
  'armor',
];

async function getTableCounts() {
  console.log('📊 Table counts:');
  for (const table of tables) {
    try {
      // Use pagination to get the true count
      let totalCount = 0;
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
          break;
        }
        
        if (!data || data.length === 0) {
          break;
        }
        
        totalCount += data.length;
        from += pageSize;
        
        // If we got less than pageSize, we've reached the end
        if (data.length < pageSize) {
          break;
        }
      }
      
      console.log(`✅ ${table}: ${totalCount} records`);
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

getTableCounts().catch(console.error); 