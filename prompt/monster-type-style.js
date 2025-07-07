/**
 * Monster Type Visual Description Style Configuration
 * This file contains all styling directives for monster type descriptions
 * Optimized for DALL-E icon generation (2x2 inch)
 */

const MONSTER_TYPE_STYLE = {
  // Core styling approach
  approach: {
    tone: "vivid and iconic",
    perspective: "present tense, as if describing what is seen right now",
    length: "2-3 sentences, concise but evocative",
    focus: "most iconic and recognizable features of the type"
  },

  // DALL-E specific formatting rules
  formatting: {
    startPhrase: "Draw a",
    imperativeLanguage: {
      allowed: ["Draw a"],
      forbidden: ["Make sure to", "Illustrate", "Create a", "should be", "that looks like this:"]
    },
    style: "descriptive paragraph optimized for DALL-E image generation"
  },

  // DALL-E specific image requirements
  imageSpecs: {
    size: "2x2 inch icon",
    background: "black background",
    complexity: "icon with greater degree of complexity than simple icons",
    style: "detailed but clear enough for small format"
  },

  // Color palette (matching Cursor/application theme)
  colorPalette: {
    primary: "deep blues, purples, and teals",
    accent: "golden yellows and warm oranges",
    highlights: "bright whites and light blues",
    shadows: "deep blacks and dark purples",
    description: "Use a color palette of deep blues, purples, teals, with golden yellow and warm orange accents, bright white highlights, and deep black shadows"
  },

  // Content focus areas for icons
  focusAreas: [
    "Most iconic and recognizable features of the type",
    "Clear silhouette that works at 2x2 inch size",
    "Complex details that add visual interest",
    "Strong contrast against black background",
    "Centered composition suitable for icon format"
  ],

  // Guidelines for different scenarios
  guidelines: {
    broadTypes: "If the type is broad (e.g., 'beast'), focus on the most iconic or archetypal example",
    noSpecificNames: "Do NOT refer to specific named monsters, only the general type",
    genericDescription: "Create a vivid, iconic visual description of a generic {monsterType}",
    iconOptimization: "Design for 2x2 inch icon format with black background and high contrast"
  },

  // Quality standards for DALL-E
  quality: {
    vivid: "Vivid and sensory, appealing to all senses",
    iconic: "Focused on the most iconic and recognizable features of the type",
    suitable: "Suitable for use as a 2x2 inch icon with black background",
    recognizable: "Instantly recognizable to players and artists at small size"
  },

  // Example output format for DALL-E
  example: {
    dragon: "Draw a dragon with massive, leathery wings, a long sinuous neck, and scales that shimmer in shades of deep blue and teal with golden accents. Its eyes burn with bright white light, and wisps of purple smoke curl from its nostrils. The creature stands centered against a black background, its form creating a striking silhouette with high contrast details."
  }
};

module.exports = MONSTER_TYPE_STYLE; 