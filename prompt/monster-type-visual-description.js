const OpenAI = require('../backend/node_modules/openai');
const path = require('path');
const MONSTER_TYPE_STYLE = require('./monster-type-style');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a visual description for a D&D monster type
 * @param {string} monsterType - The monster type (e.g., 'dragon', 'fiend', 'beast')
 * @returns {Promise<string>} - The generated visual description
 */
async function generateMonsterTypeVisualDescription(monsterType) {
  const systemPrompt = `You are a master D&D narrator and fantasy artist specializing in DALL-E icon generation. Your job is to create a ${MONSTER_TYPE_STYLE.approach.tone} visual description of a generic {monsterType} optimized for ${MONSTER_TYPE_STYLE.imageSpecs.size} with ${MONSTER_TYPE_STYLE.imageSpecs.background}. Your description should be:

1. ${MONSTER_TYPE_STYLE.quality.vivid}.
2. ${MONSTER_TYPE_STYLE.quality.iconic}.
3. ${MONSTER_TYPE_STYLE.quality.suitable}.
4. ${MONSTER_TYPE_STYLE.approach.length}.
5. ${MONSTER_TYPE_STYLE.approach.perspective}.

CRITICAL INSTRUCTIONS:
- Every description must begin with '${MONSTER_TYPE_STYLE.formatting.startPhrase} ...' and keep this style consistent for every type.
- ${MONSTER_TYPE_STYLE.formatting.style}
- ${MONSTER_TYPE_STYLE.colorPalette.description}
- ${MONSTER_TYPE_STYLE.guidelines.iconOptimization}
- Do NOT use imperative language except for the initial '${MONSTER_TYPE_STYLE.formatting.startPhrase} ...'.
- ${MONSTER_TYPE_STYLE.guidelines.noSpecificNames}
- ${MONSTER_TYPE_STYLE.guidelines.broadTypes}

Focus on:
${MONSTER_TYPE_STYLE.focusAreas.map(area => `- ${area}`).join('\n')}`;

  const userPrompt = `Describe the visual appearance of a ${monsterType} in a D&D setting optimized for ${MONSTER_TYPE_STYLE.imageSpecs.size} with ${MONSTER_TYPE_STYLE.imageSpecs.background}. Begin your description with '${MONSTER_TYPE_STYLE.formatting.startPhrase} ...' and keep this style consistent for every type. Focus on the most iconic features that would make this type instantly recognizable as a ${MONSTER_TYPE_STYLE.imageSpecs.complexity}. Use ${MONSTER_TYPE_STYLE.colorPalette.description} for the color scheme.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt.replace('{monsterType}', monsterType)
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating monster type visual description:', error);
    throw error;
  }
}

/**
 * Test function to demonstrate the prompt
 */
async function testMonsterTypeDescription() {
  console.log('🧙‍♂️ Testing monster type visual description generation...\n');

  const testTypes = [
    'dragon',
    'fiend',
    'beast',
    'undead',
    'construct',
    'elemental',
    'ooze',
    'plant',
    'celestial',
    'aberration'
  ];

  for (const type of testTypes) {
    console.log(`\n🗂️  ${type.toUpperCase()}:`);
    console.log('─'.repeat(50));
    try {
      const description = await generateMonsterTypeVisualDescription(type);
      console.log(description);
    } catch (error) {
      console.error(`❌ Error with ${type}:`, error.message);
    }
  }
}

module.exports = {
  generateMonsterTypeVisualDescription,
  testMonsterTypeDescription
};

// Run test if called directly
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
  testMonsterTypeDescription()
    .then(() => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
} 