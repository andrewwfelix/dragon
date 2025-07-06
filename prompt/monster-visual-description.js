const OpenAI = require('openai');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a visual description for a D&D monster
 * @param {string} monsterName - The name of the monster
 * @param {Object} monsterData - Optional monster data for context
 * @returns {Promise<string>} - The generated visual description
 */
async function generateMonsterVisualDescription(monsterName, monsterData = null) {
  const systemPrompt = `You are a master D&D dungeon master and fantasy artist who specializes in creating vivid, atmospheric visual descriptions of monsters. Your descriptions should be:

1. **Vivid and Sensory**: Use rich, descriptive language that appeals to all senses
2. **Atmospheric**: Create a sense of mood and presence
3. **Detailed but Concise**: 2-4 sentences maximum, focusing on the most striking visual elements
4. **D&D Authentic**: Capture the essence of the monster as it would appear in a D&D setting
5. **Immersive**: Make players feel like they're actually seeing the creature

Focus on:
- Physical appearance (size, shape, distinctive features)
- Movement and posture
- Most intimidating or memorable visual elements
- Any magical or supernatural visual effects
- The overall impression it makes

Write in present tense, as if describing what the players see right now.`;

  const userPrompt = monsterData 
    ? `Describe the visual appearance of a ${monsterName} (${monsterData.size || 'medium'} ${monsterData.type || 'creature'}, ${monsterData.alignment || 'unaligned'}). ${monsterData.armor_desc ? `It has ${monsterData.armor_desc}.` : ''} Focus on what makes this creature visually striking and memorable.`
    : `Describe the visual appearance of a ${monsterName} in a D&D setting. Focus on what makes this creature visually striking and memorable.`;

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
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating visual description:', error);
    throw error;
  }
}

/**
 * Enhanced prompt for more detailed monster descriptions
 * @param {string} monsterName - The name of the monster
 * @param {Object} monsterData - Monster data for context
 * @returns {Promise<string>} - The generated visual description
 */
async function generateDetailedMonsterDescription(monsterName, monsterData) {
  const systemPrompt = `You are a legendary D&D storyteller who creates cinematic, immersive descriptions of monsters. Your goal is to make players feel like they're watching a scene from an epic fantasy film.

Guidelines:
- **Cinematic**: Write like a movie director describing a scene
- **Sensory Rich**: Include sight, sound, movement, and atmosphere
- **Emotional Impact**: Convey the creature's presence and threat level
- **Concise**: 3-5 sentences maximum
- **Action-Oriented**: Describe how the creature moves and behaves
- **Memorable**: Focus on the most distinctive and frightening aspects

Use vivid, dynamic language that creates immediate visual impact.`;

  const contextInfo = [
    monsterData.size && `Size: ${monsterData.size}`,
    monsterData.type && `Type: ${monsterData.type}`,
    monsterData.alignment && `Alignment: ${monsterData.alignment}`,
    monsterData.challenge_rating && `Challenge Rating: ${monsterData.challenge_rating}`,
    monsterData.armor_desc && `Armor: ${monsterData.armor_desc}`,
    monsterData.hit_points && `HP: ${monsterData.hit_points}`,
  ].filter(Boolean).join(', ');

  const userPrompt = `Create a cinematic visual description of a ${monsterName} (${contextInfo}). 
  
Describe what the players see when this creature appears - its physical form, how it moves, its most intimidating features, and the overall impression it creates. Make it feel like a scene from an epic fantasy encounter.`;

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
      max_tokens: 200,
      temperature: 0.8,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating detailed description:', error);
    throw error;
  }
}

/**
 * Test function to demonstrate the prompt
 */
async function testMonsterDescription() {
  console.log('🧙‍♂️ Testing monster visual description generation...\n');
  
  const testMonsters = [
    { name: 'Dragon', data: { size: 'huge', type: 'dragon', alignment: 'chaotic evil', challenge_rating: '20', armor_desc: 'natural armor', hit_points: 400 } },
    { name: 'Goblin', data: { size: 'small', type: 'humanoid', alignment: 'neutral evil', challenge_rating: '1/4', armor_desc: 'leather armor', hit_points: 7 } },
    { name: 'Beholder', data: { size: 'large', type: 'aberration', alignment: 'lawful evil', challenge_rating: '13', armor_desc: 'natural armor', hit_points: 180 } }
  ];

  for (const monster of testMonsters) {
    console.log(`\n🦖 ${monster.name.toUpperCase()}:`);
    console.log('─'.repeat(50));
    
    try {
      const description = await generateMonsterVisualDescription(monster.name, monster.data);
      console.log(description);
    } catch (error) {
      console.error(`❌ Error with ${monster.name}:`, error.message);
    }
  }
}

// Export functions
module.exports = {
  generateMonsterVisualDescription,
  generateDetailedMonsterDescription,
  testMonsterDescription
};

// Run test if called directly
if (require.main === module) {
  require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env.local') });
  testMonsterDescription()
    .then(() => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
} 