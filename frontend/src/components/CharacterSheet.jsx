import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function CharacterSheet() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCharacter = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll use the character data directly
      // Later this could come from an API
      const characterData = {
        name: "Halibur",
        race: "Halfling",
        class: "Guard",
        level: 3,
        xp: 900,
        personality: ["Humorless", "Considerate"],
        languages: ["Common", "Halfling", "Draconic"],
        features_traits: ["Alert", "Brave", "Halfling-nimble", "Luck (Reroll)", "Stealthy"],
        armor_class: 16,
        armor_class_notes: "Chain Mail AC is fixed at 16; Dexterity modifier is +0",
        initiative: 0,
        hit_dice: 24,
        speed: 30,
        proficiency_bonus: 2,
        ability_scores: {
          Strength: { score: 17, modifier: 3, saving_throw_proficient: true },
          Dexterity: { score: 11, modifier: 0, saving_throw_proficient: false },
          Constitution: { score: 13, modifier: 1, saving_throw_proficient: true },
          Intelligence: { score: 16, modifier: 3, saving_throw_proficient: false },
          Wisdom: { score: 10, modifier: 0, saving_throw_proficient: false },
          Charisma: { score: 8, modifier: -1, saving_throw_proficient: false }
        },
        proficiencies: {
          skills: ["Athletics", "History", "Animal Handling", "Perception", "Survival"]
        },
        class_features: {
          "Second Wind": "Bonus action to regain 1d10 + fighter level HP once per short/long rest",
          "Action Surge": "Take one extra action (not magical) once per short/long rest"
        },
        maneuvers: [
          {
            name: "Menacing Attack",
            effect: "Add Superiority Die to damage; target must make Wisdom save or be frightened until end of next turn"
          },
          {
            name: "Disarming Attack",
            effect: "Add Superiority Die to damage; next attack against target before your next turn has Advantage"
          },
          {
            name: "Trip Attack",
            effect: "Add Superiority Die to damage; target must make Strength save or be knocked prone"
          }
        ],
        equipment: {
          armor: ["Chain Mail"],
          weapons: [
            {
              name: "Greatsword",
              ability: "Strength",
              proficiency_bonus: 2,
              attack_bonus: 5,
              damage: "2d6 + 3",
              notes: "Melee only"
            },
            {
              name: "Spear",
              ability: "Strength",
              proficiency_bonus: 2,
              attack_bonus: 5,
              damage: "1d8 + 3",
              notes: "Can be thrown (20/60), or used one-handed or two-handed"
            },
            {
              name: "Light Crossbow",
              ability: "Dexterity",
              proficiency_bonus: 2,
              attack_bonus: 2,
              damage: "1d8",
              notes: "Ranged weapon (80/320 ft)"
            },
            {
              name: "Sunpiercer",
              ability: "Strength",
              magic_bonus: 1,
              proficiency_bonus: 2,
              attack_bonus: 6,
              damage: "2d8 radiant",
              charges: 3,
              regain_per_day: "1d3",
              light_radius: { bright: 10, dim: 10, type: "sunlight" },
              can_suppress_light: true,
              is_magical: true,
              can_overcome_resistance: true,
              description: "Sunpiercer is a rare, magical spear crafted from polished white ash with silver inlays and tipped with a radiant crystal spearhead. It glows with a warm, inner light."
            }
          ],
          other: ["Flail", "Dungeoneer's pack"]
        },
        resources: {
          "Superiority Dice": { uses: 4, reset: "Short Rest" },
          "Action Surge": { uses: 1, reset: "Short or Long Rest" },
          "Second Wind": { uses: 2, reset: "R1S/R2L" }
        }
      };
      
      setCharacter(characterData);
    } catch (error) {
      console.error('Error loading character:', error);
      setError('Failed to load character data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacter();
  }, []);

  const getModifier = (score) => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <span className="text-gray-300">Loading character...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">No character found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      {/* Character Header */}
      <div className="bg-gray-800 border border-gray-700 rounded p-2 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{character.name}</h1>
              <p className="text-gray-300 text-sm">{character.race} {character.class} {character.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Left 1/4, Right 3/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2">
        {/* Left Column - Stats and Skills (1/4 width) */}
        <div className="space-y-2">
          {/* Combat Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Combat</h2>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">HP:</span>
                <span className="text-white font-bold">{character.hit_dice}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">AC:</span>
                <span className="text-white font-bold">{character.armor_class}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Initiative:</span>
                <span className="text-white font-bold">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Speed:</span>
                <span className="text-white font-bold">{character.speed} ft.</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Proficiency:</span>
                <span className="text-white font-bold">+{character.proficiency_bonus}</span>
              </div>
            </div>
          </div>

                    {/* Ability Scores with Saves */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Abilities & Saves</h2>
            <div className="grid grid-cols-2 gap-2">
              {/* Abilities Table */}
              <div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-600 rounded mb-1">
                  <div className="text-gray-300 text-xs font-medium">Ability</div>
                  <div className="text-gray-300 text-xs font-medium text-center">Score</div>
                  <div className="text-gray-300 text-xs font-medium text-center">Mod</div>
                </div>
                <div className="space-y-1">
                  {Object.entries(character.ability_scores).map(([ability, data]) => (
                    <div key={ability} className="grid grid-cols-3 gap-2 p-1 bg-gray-700 rounded">
                      <div className="font-bold text-sm text-blue-400">{ability.slice(0, 3).toUpperCase()}</div>
                      <div className="text-white font-bold text-sm text-center">{data.score}</div>
                      <div className="text-gray-400 text-sm text-center">{getModifier(data.score)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saves Table */}
              <div>
                <div className="p-1 bg-gray-600 rounded mb-1">
                  <div className="text-gray-300 text-xs font-medium text-center">Saves</div>
                </div>
                <div className="space-y-1">
                  {Object.entries(character.ability_scores).map(([ability, data]) => (
                    <div key={ability} className="p-1 bg-gray-700 rounded">
                      <div className="text-blue-400 text-sm font-bold text-center">
                        {data.saving_throw_proficient ? `+${character.proficiency_bonus + data.modifier}` : getModifier(data.score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {character.proficiencies.skills && character.proficiencies.skills.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Skills</h2>
              <div className="grid grid-cols-1 gap-1">
                {character.proficiencies.skills.map((skill) => (
                  <div key={skill} className="p-1 bg-gray-700 rounded">
                    <span className="text-gray-300 text-sm capitalize">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {character.resources && Object.keys(character.resources).length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Resources</h2>
              <div className="space-y-1">
                {Object.entries(character.resources).map(([resource, data]) => (
                  <div key={resource} className="p-1 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{resource}: </span>
                      <span>{data.uses} uses ({data.reset})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality and Traits */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-white mb-2 font-bold text-sm">Personality & Traits</h2>
            <div className="text-gray-300 text-sm leading-relaxed">
              <div className="mb-3">
                <span className="text-blue-400 font-bold">Personality: </span>
                <span>{character.personality.join(', ')}</span>
              </div>
              <div className="mb-3">
                <span className="text-blue-400 font-bold">Languages: </span>
                <span>{character.languages.join(', ')}</span>
              </div>
              <div>
                <span className="text-blue-400 font-bold">Features & Traits: </span>
                <span>{character.features_traits.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Equipment and Details (3/4 width) */}
        <div className="lg:col-span-3 space-y-2">

          {/* Class Features Section */}
          {character.class_features && Object.keys(character.class_features).length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-3">
              <h2 className="text-white mb-2 font-bold text-sm">Class Features</h2>
              <div className="space-y-2">
                {Object.entries(character.class_features).map(([feature, description]) => (
                  <div key={feature} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{feature}: </span>
                      <span>{description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maneuvers Section */}
          {character.maneuvers && character.maneuvers.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-3">
              <h2 className="text-white mb-2 font-bold text-sm">Combat Maneuvers</h2>
              <div className="space-y-2">
                {character.maneuvers.map((maneuver, index) => (
                  <div key={index} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{maneuver.name}: </span>
                      <span>{maneuver.effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weapons */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Weapons</h2>
            <div className="space-y-1">
              {character.equipment.weapons.map((weapon, index) => (
                <div key={index} className="p-1 bg-gray-700 rounded">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-sm">{weapon.name}</span>
                      {weapon.is_magical && (
                        <span className="text-purple-300 text-xs bg-purple-900 px-1 rounded">Magical</span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-blue-400 font-bold">+{weapon.attack_bonus}</span>
                      <span className="text-gray-300"> to hit, </span>
                      <span className="text-white">{weapon.damage}</span>
                      <span className="text-gray-300"> damage</span>
                      {weapon.ability && (
                        <span className="text-gray-400"> ({weapon.ability})</span>
                      )}
                    </div>
                  </div>
                  {weapon.notes && (
                    <div className="text-gray-300 text-sm mt-1">
                      <span className="text-blue-400">Notes:</span> {weapon.notes}
                    </div>
                  )}
                  {weapon.description && (
                    <div className="text-gray-300 text-sm mt-1">
                      <span className="text-blue-400">Description:</span> {weapon.description}
                    </div>
                  )}
                  {weapon.is_magical && weapon.charges && (
                    <div className="text-purple-200 text-xs mt-1">
                      Charges: {weapon.charges} ({weapon.regain_per_day} per day)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Armor and Equipment */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-white mb-3 font-bold text-sm">Armor & Equipment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h3 className="text-blue-400 font-bold mb-2">Armor</h3>
                <div className="space-y-1">
                  {character.equipment.armor.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-700 rounded">
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-blue-400 font-bold mb-2">Other Equipment</h3>
                <div className="space-y-1">
                  {character.equipment.other.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-700 rounded">
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterSheet; 