const OpenAI = require('openai');
const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

  const systemPrompt = `You are an experienced D&D dungeon master who translates monster descriptions into clear instructions for artists. Your goal is to take the D&D monster lore and convert it into specific visual instructions for creating small 2"x2" icon-style images.

Guidelines:
- **Artist Instructions Format**: Write as "Draw a [monster name] that looks like this..."
- **Icon-Sized Focus**: These are small 2"x2" icons, so focus on the most recognizable, essential elements
- **Silhouette-Friendly**: Emphasize distinctive shapes and forms that work well at small sizes
- **Color-Critical**: Include the most important colors that define the creature
- **Accurate to Lore**: Stay true to the monster's established D&D characteristics
- **No Artistic Style**: Don't tell the artist HOW to draw it, just WHAT to draw

What to Include (Icon-Sized Priority):
- Most distinctive physical feature (head shape, body type, wings, etc.)
- Primary colors and patterns that define the creature
- Key distinguishing features (horns, spikes, scales, etc.)
- Overall silhouette and proportions
- Any unique visual elements that make it recognizable

What NOT to Include:
- Fine details that won't be visible at 2"x2"
- Artistic style or rendering technique
- Lighting or mood
- Environmental context
- Action or pose
- Background elements
- Minor details or textures

Length Guidelines:
- **Short**: Essential recognizable elements only (1 short sentence)
- **Medium**: Key visual elements for small icons (1 sentence)
- **Long**: Comprehensive but icon-appropriate details (1-2 short sentences)

Focus Areas:
- **Visual**: Emphasize the most recognizable appearance elements
- **Threatening**: Highlight intimidating visual aspects that work at small size
- **Mysterious**: Focus on enigmatic visual qualities visible in icons

Write as clear instructions for creating a small, recognizable icon of the monster.`;

  const lengthTokens = {
    short: 50,
    medium: 75,
    long: 100
  };

  const userPrompt = `Create artist instructions for drawing a small 2"x2" icon of a ${monsterName} based on this existing lore:

"${existingDescription}"

Focus on: ${focus === 'visual' ? 'the most recognizable visual elements that work at small size' : focus === 'threatening' ? 'intimidating visual aspects visible in icons' : 'mysterious visual qualities that stand out at small size'}

Generate a ${length} set of instructions for creating a small, recognizable icon. Start with "Draw a [monster name] that looks like this..." and then provide ONLY the most essential visual details that would make this creature recognizable at 2"x2" size. Keep it very brief and focus on distinctive shapes, key colors, and defining features. Do not include fine details, artistic direction, lighting, mood, or environmental context.`;

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
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
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