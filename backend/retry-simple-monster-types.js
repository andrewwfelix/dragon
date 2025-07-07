require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple, neutral prompts to avoid content policy issues
const SIMPLE_PROMPTS = {
  'ooze': 'A simple blue and purple blob shape on black background, 2x2 inch icon style',
  'plant': 'A green plant with blue leaves and yellow flowers on black background, 2x2 inch icon style',
  'swarm': 'Multiple small flying creatures in blue and purple colors on black background, 2x2 inch icon style',
  'undead': 'A simple ghostly figure in white and blue on black background, 2x2 inch icon style'
};

async function generateImage(prompt, size = '1024x1024') {
  try {
    const requestBody = {
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      quality: "standard",
      n: 1,
    };
    console.log('   📤 Prompt:', prompt);
    console.log('   📦 Request Body:', JSON.stringify(requestBody, null, 2));
    const response = await openai.images.generate(requestBody);
    return response.data[0].url;
  } catch (error) {
    console.error('   ❌ Error generating image:');
    if (error.response) {
      console.error('   🔴 Error Response:', error.response.status, error.response.data);
    } else if (error.data) {
      console.error('   🔴 Error Data:', error.data);
    } else {
      console.error('   🔴 Error:', error);
    }
    throw error;
  }
}

async function updateMonsterTypeImage(typeId, imageUrl, status = 'ok') {
  const updateData = {
    icon_image: imageUrl,
    icon_filename: imageUrl ? `monster-type-${Date.now()}.png` : null,
    icon_mime_type: imageUrl ? 'image/png' : null,
    image_generation_status: status
  };
  const { error } = await supabase
    .from('monster_types')
    .update(updateData)
    .eq('id', typeId);
  if (error) throw error;
  return true;
}

async function retryWithSimplePrompts() {
  console.log('🔄 Retrying with simple prompts...\n');
  
  for (const [typeName, simplePrompt] of Object.entries(SIMPLE_PROMPTS)) {
    console.log(`📝 Retrying: ${typeName}`);
    
    // Get the monster type record
    const { data: types, error } = await supabase
      .from('monster_types')
      .select('id, type_name')
      .eq('type_name', typeName)
      .limit(1);
    
    if (error || !types.length) {
      console.log(`   ❌ Could not find ${typeName} in database`);
      continue;
    }
    
    const monsterType = types[0];
    
    try {
      const imageUrl = await generateImage(simplePrompt, '1024x1024');
      await updateMonsterTypeImage(monsterType.id, imageUrl, 'ok');
      console.log('   ✅ Success');
    } catch (error) {
      const errorDetails = {
        message: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown',
        status: error.status || 'unknown'
      };
      const errorStatus = `error: ${errorDetails.type} - ${errorDetails.message}`;
      await updateMonsterTypeImage(monsterType.id, null, errorStatus);
      console.log('   ❌ Error:', errorDetails);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n✨ Simple prompt retry completed!');
}

if (require.main === module) {
  retryWithSimplePrompts()
    .then(() => process.exit(0))
    .catch((error) => { console.error(error); process.exit(1); });
} 