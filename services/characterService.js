const Joi = require('joi');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

// Character validation schema
const characterSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  race: Joi.string().required(),
  class: Joi.string().required(),
  level: Joi.number().integer().min(1).max(20).default(1),
  background: Joi.string().optional(),
  alignment: Joi.string().valid('LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE').optional(),
  experience: Joi.number().integer().min(0).default(0),
  hitPoints: Joi.number().integer().min(1).required(),
  maxHitPoints: Joi.number().integer().min(1).required(),
  armorClass: Joi.number().integer().min(0).default(10),
  initiative: Joi.number().integer().default(0),
  speed: Joi.number().integer().min(0).default(30),
  abilities: Joi.object({
    strength: Joi.number().integer().min(1).max(20).required(),
    dexterity: Joi.number().integer().min(1).max(20).required(),
    constitution: Joi.number().integer().min(1).max(20).required(),
    intelligence: Joi.number().integer().min(1).max(20).required(),
    wisdom: Joi.number().integer().min(1).max(20).required(),
    charisma: Joi.number().integer().min(1).max(20).required()
  }).required(),
  skills: Joi.array().items(Joi.string()).default([]),
  spells: Joi.array().items(Joi.string()).default([]),
  equipment: Joi.array().items(Joi.string()).default([]),
  features: Joi.array().items(Joi.string()).default([])
});

class CharacterService {
  constructor() {
    this.experienceLevels = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
      85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
    ];
  }

  // Create a new character
  createCharacter(characterData) {
    try {
      const validatedData = characterSchema.validate(characterData);
      if (validatedData.error) {
        throw new Error(`Validation error: ${validatedData.error.details[0].message}`);
      }

      const character = {
        id: uuidv4(),
        ...validatedData.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return character;
    } catch (error) {
      throw new Error(`Failed to create character: ${error.message}`);
    }
  }

  // Calculate ability modifier
  calculateAbilityModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  // Calculate proficiency bonus
  calculateProficiencyBonus(level) {
    return Math.floor((level - 1) / 4) + 2;
  }

  // Add experience and check for level up
  addExperience(character, experience) {
    const newExperience = character.experience + experience;
    const newLevel = this.calculateLevel(newExperience);
    
    const leveledUp = newLevel > character.level;
    
    return {
      ...character,
      experience: newExperience,
      level: newLevel,
      leveledUp,
      updatedAt: new Date().toISOString()
    };
  }

  // Calculate level from experience
  calculateLevel(experience) {
    for (let i = this.experienceLevels.length - 1; i >= 0; i--) {
      if (experience >= this.experienceLevels[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Calculate hit points with constitution modifier
  calculateHitPoints(level, hitDie, constitutionModifier) {
    let totalHP = hitDie + constitutionModifier; // First level
    
    for (let i = 2; i <= level; i++) {
      const roll = Math.floor(Math.random() * hitDie) + 1;
      totalHP += roll + constitutionModifier;
    }
    
    return Math.max(1, totalHP); // Minimum 1 HP
  }

  // Validate character for combat
  validateForCombat(character) {
    const errors = [];
    
    if (character.hitPoints <= 0) {
      errors.push('Character is unconscious or dead');
    }
    
    if (!character.name || !character.race || !character.class) {
      errors.push('Character missing required information');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get character statistics
  getCharacterStats(character) {
    const abilityModifiers = {};
    Object.keys(character.abilities).forEach(ability => {
      abilityModifiers[ability] = this.calculateAbilityModifier(character.abilities[ability]);
    });

    return {
      ...character,
      abilityModifiers,
      proficiencyBonus: this.calculateProficiencyBonus(character.level),
      passivePerception: 10 + abilityModifiers.wisdom,
      passiveInsight: 10 + abilityModifiers.wisdom,
      passiveInvestigation: 10 + abilityModifiers.intelligence
    };
  }
}

module.exports = new CharacterService(); 