const OpenAI = require('openai');
const path = require('path');
const MONSTER_STYLE = require('./monster-style');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a visual description for a D&D monster
 * @param {string} monsterName - The name of the monster
 * @param {string} monsterDescription - The existing description of the monster
 * @param {Object} options - Options for generation
 * @param {string} options.style - Style of description (cinematic, atmospheric, etc.)
 * @param {string} options.length - Length of description (short, medium, long)
 * @param {string} options.focus - Focus of description (visual, threatening, etc.)
 * @param {string} options.type - Monster type (dragon, humanoid, aberration, etc.)
 * @param {Array} options.actions - Monster actions and attacks
 * @param {Array} options.specialAbilities - Monster special abilities
 * @returns {Promise<string>} - The generated visual description
 */
async function generateMonsterVisualDescription(monsterName, monsterDescription, options = {}) {
  const systemPrompt = `You are a master D&D dungeon master who creates ${MONSTER_STYLE.approach.tone} visual descriptions of monsters for players to read. Your descriptions should be:

1. **${MONSTER_STYLE.quality.vivid}**
2. **${MONSTER_STYLE.quality.atmospheric}**
3. **${MONSTER_STYLE.quality.authentic}**
4. **${MONSTER_STYLE.quality.immersive}**
5. **${MONSTER_STYLE.approach.length}, focusing on the ${MONSTER_STYLE.approach.focus}**

CRITICAL INSTRUCTIONS:
- Every description must begin with '${MONSTER_STYLE.formatting.startPhrase} ...' and keep this style consistent for every monster.
- ${MONSTER_STYLE.formatting.style}
- DO NOT use imperative language like "${MONSTER_STYLE.formatting.imperativeLanguage.forbidden.join('", "')}"
- Write as if you are describing what a person sees in front of them, not as instructions to an artist
- Use descriptive language that paints a picture in the reader's mind

IMPORTANT GUIDELINES:
- ${MONSTER_STYLE.guidelines.noDescription}
- ${MONSTER_STYLE.guidelines.minimalDescription}
- ${MONSTER_STYLE.guidelines.incorporateAbilities}
- ${MONSTER_STYLE.guidelines.visualEffects}

Focus on:
${MONSTER_STYLE.focusAreas.map(area => `- ${area}`).join('\n')}

${MONSTER_STYLE.approach.perspective}.`;

  const monsterType = options.type || 'creature';
  const actions = options.actions || [];
  const specialAbilities = options.specialAbilities || [];
  
  // Build context sections
  const contextSections = [];
  
  if (monsterDescription && monsterDescription.trim()) {
    contextSections.push(`Description: ${monsterDescription}`);
  }
  
  if (actions.length > 0) {
    const actionList = actions.map(action => `${action.name}: ${action.desc}`).join('; ');
    contextSections.push(`Actions: ${actionList}`);
  }
  
  if (specialAbilities.length > 0) {
    const abilityList = specialAbilities.map(ability => `${ability.name}: ${ability.desc}`).join('; ');
    contextSections.push(`Special Abilities: ${abilityList}`);
  }
  
  const context = contextSections.length > 0 ? contextSections.join('\n\n') : 'No detailed information available.';
  
  const userPrompt = `Describe the visual appearance of a ${monsterName} (${monsterType}). 

Context:
${context}

Write a ${MONSTER_STYLE.approach.tone} description of what this ${monsterType} looks like when encountered. Focus on what makes it visually striking and memorable. Always begin your description with '${MONSTER_STYLE.formatting.startPhrase} ...' and keep this style consistent for every monster. Consider the typical characteristics of ${monsterType}s in D&D lore while creating a ${MONSTER_STYLE.approach.tone} description. If the description is minimal, expand upon it using the monster type's typical characteristics and any visual cues from its abilities.

Example of good description: "${MONSTER_STYLE.example.dragon}"

Remember: Write as if describing what you see, not as instructions to create an image.`;

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
      max_tokens: 300,
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
    { 
      name: 'Adult Bronze Dragon', 
      desc: 'Bronze dragons are coastal dwellers that feed primarily on aquatic plants and fish. They are known for their metallic bronze scales and affinity for water.',
      type: 'dragon',
      actions: [
        { name: 'Bite', desc: 'Melee Weapon Attack: +14 to hit, reach 10 ft., one target.' },
        { name: 'Breath Weapon', desc: 'The dragon exhales acid in a 60-foot line.' }
      ],
      specialAbilities: [
        { name: 'Amphibious', desc: 'The dragon can breathe air and water.' },
        { name: 'Legendary Resistance', desc: 'If the dragon fails a saving throw, it can choose to succeed instead.' }
      ]
    },
    { 
      name: 'Goblin', 
      desc: 'Goblins are small, black-hearted humanoids that lair in caves, abandoned mines, despoiled dungeons, and other dismal settings.',
      type: 'humanoid',
      actions: [
        { name: 'Scimitar', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target.' },
        { name: 'Shortbow', desc: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target.' }
      ],
      specialAbilities: [
        { name: 'Nimble Escape', desc: 'The goblin can take the Disengage or Hide action as a bonus action.' }
      ]
    },
    { 
      name: 'Beholder', 
      desc: 'A beholder is an aberration that appears as a floating orb of flesh with a large mouth, single central eye, and many smaller eyestalks.',
      type: 'aberration',
      actions: [
        { name: 'Eye Ray', desc: 'The beholder shoots one of the following magical eye rays.' },
        { name: 'Bite', desc: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target.' }
      ],
      specialAbilities: [
        { name: 'Antimagic Cone', desc: 'The beholder\'s central eye creates an area of antimagic.' },
        { name: 'Levitate', desc: 'The beholder can hover and fly without wings.' }
      ]
    },
    { 
      name: 'Shadow Demon', 
      desc: '', // Minimal description to test fallback
      type: 'fiend',
      actions: [
        { name: 'Claw', desc: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target.' },
        { name: 'Shadow Stealth', desc: 'While in dim light or darkness, the shadow demon can take the Hide action as a bonus action.' }
      ],
      specialAbilities: [
        { name: 'Shadow Stealth', desc: 'While in dim light or darkness, the shadow demon can take the Hide action as a bonus action.' },
        { name: 'Incorporeal Movement', desc: 'The shadow demon can move through other creatures and objects as if they were difficult terrain.' }
      ]
    }
  ];

  for (const monster of testMonsters) {
    console.log(`\n🦖 ${monster.name.toUpperCase()} (${monster.type}):`);
    console.log('─'.repeat(50));
    
    try {
      const description = await generateMonsterVisualDescription(
        monster.name, 
        monster.desc,
        { 
          type: monster.type, 
          style: 'cinematic', 
          length: 'medium',
          actions: monster.actions,
          specialAbilities: monster.specialAbilities
        }
      );
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
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
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