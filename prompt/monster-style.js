/**
 * Monster Visual Description Style Configuration
 * This file contains all styling directives for individual monster descriptions
 */

const MONSTER_STYLE = {
  // Core styling approach
  approach: {
    tone: "vivid and atmospheric",
    perspective: "present tense, as if describing what the players see right now",
    length: "3-5 sentences maximum",
    focus: "most striking visual elements"
  },

  // Critical formatting rules
  formatting: {
    startPhrase: "Draw a",
    imperativeLanguage: {
      allowed: ["Draw a"],
      forbidden: ["Make sure to", "Illustrate", "Create a", "should be", "that looks like this:"]
    },
    style: "descriptive paragraph in prose form, NOT image generation instructions"
  },

  // Content focus areas
  focusAreas: [
    "Physical appearance (size, shape, distinctive features)",
    "Movement and posture", 
    "Most intimidating or memorable visual elements",
    "Any magical or supernatural visual effects",
    "The overall impression it makes"
  ],

  // Guidelines for different scenarios
  guidelines: {
    noDescription: "use the monster's TYPE as a starting point and embellish as much as possible based on other attributes",
    minimalDescription: "expand upon it using the monster type's typical characteristics",
    incorporateAbilities: "Incorporate visual elements from the monster's actions and special abilities when relevant",
    visualEffects: "Consider how the monster's abilities would manifest visually (magical effects, movement patterns, etc.)"
  },

  // Quality standards
  quality: {
    vivid: "Use rich, descriptive language that appeals to all senses",
    atmospheric: "Create a sense of mood and presence",
    authentic: "Capture the essence of the monster as it would appear in a D&D setting",
    immersive: "Make players feel like they're actually seeing the creature"
  },

  // Example output format
  example: {
    dragon: "Draw an ancient red dragon emerging from the shadows, its massive scaled body gleaming like polished copper in the torchlight. Twin horns curve back from its angular head, framing eyes that burn with malevolent intelligence. Its wings, when spread, span the width of a small house, and its tail lashes with barely contained fury. The creature's very presence seems to make the air shimmer with heat, and wisps of smoke curl from its nostrils as it surveys its domain."
  }
};

module.exports = MONSTER_STYLE; 