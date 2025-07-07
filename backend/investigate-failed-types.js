require('dotenv').config();
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FAILED_TYPES = ['undead', 'ooze', 'swarm', 'plant'];

async function investigateFailedTypes() {
  try {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/monster_types?select=*&type_name=in.(${FAILED_TYPES.map(t => `"${t}"`).join(',')})`;
    
    const { data } = await axios.get(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    console.log('🔍 Investigating Failed Monster Types:');
    console.log('='.repeat(60));
    
    data.forEach(type => {
      console.log(`\n📝 Type: ${type.type_name}`);
      console.log(`🔗 ID: ${type.id}`);
      console.log(`📊 Status: ${type.image_generation_status || 'No status'}`);
      console.log(`🖼️  Has Image: ${type.image_url ? 'Yes' : 'No'}`);
      
      if (type.visual_description) {
        console.log(`\n📄 Visual Description:`);
        console.log(`Length: ${type.visual_description.length} characters`);
        console.log(`Content: "${type.visual_description}"`);
        
        // Check for potential problematic words
        const problematicWords = [
          'ghastly', 'skeletal', 'undead', 'haunting', 'dread', 'death', 'victims', 
          'half-digested', 'claw-like', 'menace', 'uncanny', 'ghostly', 'eerie',
          'pulsating', 'seeping', 'swirling', 'ethereal', 'spectral', 'chaotic'
        ];
        
        const foundWords = problematicWords.filter(word => 
          type.visual_description.toLowerCase().includes(word)
        );
        
        if (foundWords.length > 0) {
          console.log(`⚠️  Potentially problematic words: ${foundWords.join(', ')}`);
        }
        
        // Check for special characters or formatting
        const hasSpecialChars = /[^\w\s.,!?-]/.test(type.visual_description);
        if (hasSpecialChars) {
          console.log(`⚠️  Contains special characters`);
        }
        
        // Check for line breaks or unusual formatting
        const hasLineBreaks = /\n|\r/.test(type.visual_description);
        if (hasLineBreaks) {
          console.log(`⚠️  Contains line breaks`);
        }
        
      } else {
        console.log(`❌ No visual description found`);
      }
      
      console.log('-'.repeat(40));
    });

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

investigateFailedTypes(); 