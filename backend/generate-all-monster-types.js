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

// Rate limit: 5 images per minute = 12 seconds between requests
const RATE_LIMIT_DELAY = 12000; // 12 seconds

// Simple, neutral prompts for each monster type
const MONSTER_PROMPTS = {
  'beast': 'A fierce animal with sharp teeth and claws, brown and black colors on black background, simple icon style',
  'fey': 'A magical fairy creature with wings, glowing in green and gold colors on black background, simple icon style',
  'giant': 'A large humanoid figure, muscular and tall, wearing simple clothing in earth tones on black background, simple icon style',
  'humanoid': 'A human-like figure with armor and weapons, metallic silver and gold colors on black background, simple icon style',
  'dragon': 'A majestic dragon with scales, wings, and horns, red and gold colors on black background, simple icon style',
  'elemental': 'A creature made of fire and energy, glowing orange and yellow colors on black background, simple icon style',
  'celestial': 'A divine being with wings and halo, glowing white and gold colors on black background, simple icon style',
  'aberration': 'A strange alien creature with tentacles, purple and blue colors on black background, simple icon style',
  'construct': 'A mechanical golem made of stone and metal, gray and silver colors on black background, simple icon style',
  'monstrosity': 'A large monster with multiple heads or limbs, dark green and brown colors on black background, simple icon style',
  'fiend': 'A demonic creature with horns and wings, dark red and black colors on black background, simple icon style',
  'ooze': 'A blue and purple blob shape on black background, simple icon style',
  'plant': 'A green plant with blue leaves and yellow flowers on black background, simple icon style',
  'swarm': 'Multiple small flying creatures in blue and purple colors on black background, simple icon style',
  'undead': 'A simple ghostly figure in white and blue on black background, simple icon style'
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
    const response = await openai.images.generate(requestBody);
    return response.data[0].url;
  } catch (error) {
    console.error('   ❌ Error generating image:', error.message);
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

async function generateAllMonsterTypes() {
  console.log('🎨 Generating images for all monster types...\n');
  console.log(`⏱️  Rate limit: 5 images per minute (${RATE_LIMIT_DELAY/1000} seconds between requests)\n`);
  
  // Get all monster types
  const { data: allTypes, error } = await supabase
    .from('monster_types')
    .select('id, type_name, image_generation_status, icon_image')
    .order('type_name');
  
  if (error) {
    console.error('Error fetching monster types:', error);
    return;
  }
  
  // Filter to only process types that don't have images yet
  const typesToProcess = allTypes.filter(type => !type.icon_image);
  
  console.log(`📊 Found ${allTypes.length} total monster types`);
  console.log(`🎯 Processing ${typesToProcess.length} types without images\n`);
  
  for (let i = 0; i < typesToProcess.length; i++) {
    const monsterType = typesToProcess[i];
    console.log(`📝 Processing ${i + 1}/${typesToProcess.length}: ${monsterType.type_name}`);
    
    const prompt = MONSTER_PROMPTS[monsterType.type_name];
    if (!prompt) {
      console.log(`   ⚠️  No prompt found for ${monsterType.type_name}, skipping`);
      continue;
    }
    
    try {
      const imageUrl = await generateImage(prompt, '1024x1024');
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
    
    // Wait between requests to respect rate limits
    if (i < typesToProcess.length - 1) {
      console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY/1000} seconds for rate limit...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }
  
  console.log('\n✨ Image generation completed!');
  
  // Show final status
  const { data: finalStatus } = await supabase
    .from('monster_types')
    .select('type_name, image_generation_status, icon_image')
    .order('type_name');
  
  console.log('\n📊 Final Status:');
  console.log('='.repeat(50));
  finalStatus.forEach(type => {
    const status = type.image_generation_status || 'No status';
    const hasUrl = type.icon_image ? '✅ Has URL' : '❌ No URL';
    console.log(`${type.type_name.padEnd(15)} | ${status.padEnd(30)} | ${hasUrl}`);
  });
}

if (require.main === module) {
  generateAllMonsterTypes()
    .then(() => process.exit(0))
    .catch((error) => { console.error(error); process.exit(1); });
} 