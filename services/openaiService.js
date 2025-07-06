const OpenAI = require('openai');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a visual description for a D&D monster based on its name and existing description
 * @param {string} monsterName - The name of the monster
 * @param {string} existingDescription - The existing monster description/lore
 * @param {Object} options - Additional options for generation
 * @returns {Promise<string>} - The generated visual description
 */
async function generateMonsterVisualDescription(monsterName, existingDescription, options = {}) {
  const {
    style = 'cinematic', // 'cinematic', 'atmospheric', 'detailed'
    length = 'medium',   // 'short', 'medium', 'long'
    focus = 'visual'     // 'visual', 'threatening', 'mysterious'
  } = options;

  const systemPrompt = `You are a master D&D dungeon master who specializes in creating vivid, detailed visual descriptions of monsters. Your goal is to describe exactly what a monster looks like based on its established lore, focusing purely on physical appearance and visual characteristics.

Guidelines:
- **Detailed Physical Description**: Focus on size, shape, color, texture, and distinctive features
- **Visual Accuracy**: Stay true to the monster's established D&D characteristics
- **Sensory Details**: Describe what can be seen, touched, and observed
- **Distinctive Elements**: Highlight unique visual traits that make this monster recognizable
- **No Artistic Style**: Avoid describing how something should be drawn or rendered

Description Approaches:
- **Cinematic**: Describe the monster as if seen in a clear, well-lit environment
- **Atmospheric**: Emphasize the visual impact and presence of the creature
- **Detailed**: Comprehensive breakdown of all visible features and characteristics

Length Guidelines:
- **Short**: 1-2 sentences, essential visual elements only
- **Medium**: 2-3 sentences, balanced detail
- **Long**: 3-4 sentences, comprehensive visual description

Focus Areas:
- **Visual**: Emphasize appearance, form, and distinctive features
- **Threatening**: Highlight intimidating visual aspects
- **Mysterious**: Focus on enigmatic visual qualities

Write in present tense, describing the monster's actual physical appearance.`;

  const lengthTokens = {
    short: 100,
    medium: 150,
    long: 200
  };

  const userPrompt = `Create a ${style} visual description of a ${monsterName} based on this existing lore:

"${existingDescription}"

Focus on: ${focus === 'visual' ? 'physical appearance, size, shape, color, and distinctive features' : focus === 'threatening' ? 'intimidating visual aspects and frightening appearance' : 'mysterious visual qualities and otherworldly features'}

Generate a ${length} description that accurately describes what this monster looks like physically. Focus on concrete visual details that could be used to identify or recognize the creature.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: lengthTokens[length],
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating visual description:', error);
    throw error;
  }
}

/**
 * Generate multiple visual descriptions with different styles for comparison
 * @param {string} monsterName - The name of the monster
 * @param {string} existingDescription - The existing monster description
 * @returns {Promise<Object>} - Object with different style descriptions
 */
async function generateMultipleVisualDescriptions(monsterName, existingDescription) {
  const styles = ['cinematic', 'atmospheric', 'detailed'];
  const results = {};

  for (const style of styles) {
    try {
      results[style] = await generateMonsterVisualDescription(monsterName, existingDescription, { style });
    } catch (error) {
      console.error(`Error generating ${style} description:`, error);
      results[style] = `Error generating ${style} description`;
    }
  }

  return results;
}

/**
 * Batch generate visual descriptions for multiple monsters
 * @param {Array} monsters - Array of monster objects with name and desc properties
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} - Array of monsters with generated visual descriptions
 */
async function batchGenerateVisualDescriptions(monsters, options = {}) {
  const results = [];
  
  for (const monster of monsters) {
    try {
      console.log(`Generating visual description for ${monster.name}...`);
      
      const visualDescription = await generateMonsterVisualDescription(
        monster.name, 
        monster.desc || '', 
        options
      );
      
      results.push({
        ...monster,
        visual_description: visualDescription
      });
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${monster.name}:`, error);
      results.push({
        ...monster,
        visual_description: null,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Test function to demonstrate the service
 */
async function testVisualDescriptionService() {
  console.log('🧙‍♂️ Testing OpenAI Visual Description Service...\n');
  
  const testMonsters = [
    {
      name: 'Adult Bronze Dragon',
      desc: 'Bronze dragons are coastal dwellers that feed primarily on aquatic plants and fish. They are the most social of the metallic dragons, and they often work together with other bronze dragons to protect their territory. They are also known for their love of water and their ability to breathe underwater.'
    },
    {
      name: 'Beholder',
      desc: 'A beholder is an aberration that appears as a floating orb of flesh with a large mouth, single central eye, and many smaller eyestalks on top of its body. Each eyestalk can fire a different type of magical ray, and the central eye can create an antimagic cone.'
    }
  ];

  for (const monster of testMonsters) {
    console.log(`\n🦖 ${monster.name.toUpperCase()}:`);
    console.log('─'.repeat(60));
    console.log(`📖 Original: ${monster.desc}`);
    console.log('\n🎨 Generated Visual Descriptions:');
    
    try {
      const descriptions = await generateMultipleVisualDescriptions(monster.name, monster.desc);
      
      Object.entries(descriptions).forEach(([style, description]) => {
        console.log(`\n${style.toUpperCase()}:`);
        console.log(description);
      });
      
    } catch (error) {
      console.error(`❌ Error with ${monster.name}:`, error.message);
    }
  }
}

// Export functions
module.exports = {
  generateMonsterVisualDescription,
  generateMultipleVisualDescriptions,
  batchGenerateVisualDescriptions,
  testVisualDescriptionService
};

// Run test if called directly
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
  testVisualDescriptionService()
    .then(() => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
} 