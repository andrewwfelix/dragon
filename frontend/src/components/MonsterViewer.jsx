import React, { useState, useEffect } from 'react';

function MonsterViewer() {
  const [currentMonster, setCurrentMonster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monsterCount, setMonsterCount] = useState(0);

  const fetchRandomMonster = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch random monster directly from the base endpoint
      const response = await fetch('/api/monsters');
      if (!response.ok) {
        throw new Error('Failed to fetch random monster');
      }
      const monster = await response.json();
      setCurrentMonster(monster);
      
      // Get total count for display
      const countResponse = await fetch('/api/monsters?limit=1');
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setMonsterCount(countData.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching monster:', error);
      setError('Failed to load monster');
    } finally {
      setLoading(false);
    }
  };

  const nextMonster = () => {
    fetchRandomMonster();
  };

  useEffect(() => {
    fetchRandomMonster();
  }, []);

  // Helper function to get ability modifier
  const getModifier = (score) => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  // Helper function to format speed
  const formatSpeed = (speed) => {
    if (typeof speed === 'object') {
      return Object.entries(speed).map(([type, value]) => `${type} ${value} ft.`).join(', ');
    }
    return `${speed} ft.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-gray-300">Loading monster...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!currentMonster) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-gray-400">No monster found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      {/* Monster Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="mb-2 lg:mb-0">
            <h1 className="text-white mb-1 font-bold">{currentMonster.name}</h1>
            <div className="text-gray-300">
              <span className="text-blue-400 font-medium">{currentMonster.type}</span>
              {currentMonster.subtype && (
                <span className="text-gray-400"> ({currentMonster.subtype})</span>
              )}
              <span className="mx-3 text-gray-500">•</span>
              <span className="text-purple-400">{currentMonster.alignment}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold">
              CR {currentMonster.challenge_rating}
            </div>
            <div className="px-3 py-1 bg-gray-600 text-gray-200 rounded-lg font-medium">
              {currentMonster.size}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {currentMonster.desc && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Description</h2>
          <div className="text-gray-300 whitespace-pre-line">{currentMonster.desc}</div>
        </div>
      )}

      {/* Monster Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Combat Stats */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-white mb-4 font-bold">Combat Stats</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
              <span className="text-gray-300 font-medium">Hit Points:</span>
              <span className="text-white font-bold">{currentMonster.hit_points}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
              <span className="text-gray-300 font-medium">Hit Dice:</span>
              <span className="text-white font-bold">{currentMonster.hit_dice}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
              <span className="text-gray-300 font-medium">Armor Class:</span>
              <span className="text-white font-bold">{currentMonster.armor_class}</span>
            </div>
            {currentMonster.armor_desc && (
              <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
                <span className="text-gray-300 font-medium">Armor Type:</span>
                <span className="text-white font-medium">{currentMonster.armor_desc}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
              <span className="text-gray-300 font-medium">Speed:</span>
              <span className="text-white font-medium text-right">
                {formatSpeed(currentMonster.speed)}
              </span>
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-white mb-4 font-bold">Ability Scores</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'STR', value: currentMonster.strength, color: 'text-red-400' },
              { name: 'DEX', value: currentMonster.dexterity, color: 'text-green-400' },
              { name: 'CON', value: currentMonster.constitution, color: 'text-yellow-400' },
              { name: 'INT', value: currentMonster.intelligence, color: 'text-blue-400' },
              { name: 'WIS', value: currentMonster.wisdom, color: 'text-purple-400' },
              { name: 'CHA', value: currentMonster.charisma, color: 'text-pink-400' }
            ].map(ability => (
              <div key={ability.name} className="text-center p-2 bg-gray-700 rounded-lg">
                <div className={`font-bold ${ability.color}`}>{ability.name}</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-white font-bold">{ability.value}</div>
                  <div className="text-gray-400">{getModifier(ability.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-white mb-4 font-bold">Details</h2>
          <div className="space-y-2">
            {currentMonster.languages && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Languages:</div>
                <div className="text-white">{currentMonster.languages}</div>
              </div>
            )}
            {currentMonster.senses && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Senses:</div>
                <div className="text-white">{currentMonster.senses}</div>
              </div>
            )}
            {currentMonster.damage_vulnerabilities && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Vulnerabilities:</div>
                <div className="text-red-400">{currentMonster.damage_vulnerabilities}</div>
              </div>
            )}
            {currentMonster.damage_resistances && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Resistances:</div>
                <div className="text-blue-400">{currentMonster.damage_resistances}</div>
              </div>
            )}
            {currentMonster.damage_immunities && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Immunities:</div>
                <div className="text-purple-400">{currentMonster.damage_immunities}</div>
              </div>
            )}
            {currentMonster.condition_immunities && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Condition Immunities:</div>
                <div className="text-purple-400">{currentMonster.condition_immunities}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills and Saves */}
      {(currentMonster.skills || currentMonster.strength_save || currentMonster.dexterity_save || currentMonster.constitution_save || currentMonster.intelligence_save || currentMonster.wisdom_save || currentMonster.charisma_save) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Skills & Saves</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skills */}
            {currentMonster.skills && Object.keys(currentMonster.skills).length > 0 && (
              <div>
                <div className="text-gray-300 font-medium mb-2">Skills:</div>
                <div className="space-y-1">
                  {Object.entries(currentMonster.skills).map(([skill, bonus]) => (
                    <div key={skill} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
                      <span className="text-gray-300 capitalize">{skill}:</span>
                      <span className="text-white font-bold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Saving Throws */}
            {(currentMonster.strength_save || currentMonster.dexterity_save || currentMonster.constitution_save || currentMonster.intelligence_save || currentMonster.wisdom_save || currentMonster.charisma_save) && (
              <div>
                <div className="text-gray-300 font-medium mb-2">Saving Throws:</div>
                <div className="space-y-1">
                  {[
                    { name: 'STR', save: currentMonster.strength_save },
                    { name: 'DEX', save: currentMonster.dexterity_save },
                    { name: 'CON', save: currentMonster.constitution_save },
                    { name: 'INT', save: currentMonster.intelligence_save },
                    { name: 'WIS', save: currentMonster.wisdom_save },
                    { name: 'CHA', save: currentMonster.charisma_save }
                  ].filter(ability => ability.save !== null).map(ability => (
                    <div key={ability.name} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
                      <span className="text-gray-300">{ability.name}:</span>
                      <span className="text-white font-bold">{ability.save >= 0 ? `+${ability.save}` : ability.save}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Section */}
      {currentMonster.actions && currentMonster.actions.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Actions</h2>
          <div className="space-y-2">
            {currentMonster.actions.map((action, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="text-white font-bold mb-1">{action.name}</div>
                <div className="text-gray-300">{action.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions Section */}
      {currentMonster.legendary_actions && currentMonster.legendary_actions.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Legendary Actions</h2>
          <div className="space-y-2">
            {currentMonster.legendary_actions.map((action, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="text-white font-bold mb-1">{action.name}</div>
                <div className="text-gray-300">{action.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Abilities Section */}
      {currentMonster.special_abilities && currentMonster.special_abilities.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Special Abilities</h2>
          <div className="space-y-2">
            {currentMonster.special_abilities.map((ability, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="text-white font-bold mb-1">{ability.name}</div>
                <div className="text-gray-300">{ability.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Actions Section */}
      {currentMonster.bonus_actions && currentMonster.bonus_actions.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Bonus Actions</h2>
          <div className="space-y-2">
            {currentMonster.bonus_actions.map((action, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="text-white font-bold mb-1">{action.name}</div>
                <div className="text-gray-300">{action.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reactions Section */}
      {currentMonster.reactions && currentMonster.reactions.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Reactions</h2>
          <div className="space-y-2">
            {currentMonster.reactions.map((reaction, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="text-white font-bold mb-1">{reaction.name}</div>
                <div className="text-gray-300">{reaction.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell List Section */}
      {currentMonster.spell_list && currentMonster.spell_list.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Spells</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {currentMonster.spell_list.map((spell, index) => (
              <div key={index} className="p-2 bg-gray-700 rounded-lg text-center">
                <div className="text-white font-medium">{spell}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environment Section */}
      {currentMonster.environments && currentMonster.environments.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Environments</h2>
          <div className="flex flex-wrap gap-2">
            {currentMonster.environments.map((env, index) => (
              <span key={index} className="px-3 py-1 bg-gray-700 text-white rounded-lg">
                {env}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source Information */}
      {(currentMonster.document__title || currentMonster.page_no) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h2 className="text-white mb-4 font-bold">Source</h2>
          <div className="space-y-2">
            {currentMonster.document__title && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Source:</div>
                <div className="text-white">{currentMonster.document__title}</div>
              </div>
            )}
            {currentMonster.page_no && (
              <div>
                <div className="text-gray-300 font-medium mb-1">Page:</div>
                <div className="text-white">{currentMonster.page_no}</div>
              </div>
            )}
            {currentMonster.document__url && (
              <div>
                <div className="text-gray-300 font-medium mb-1">URL:</div>
                <div className="text-blue-400">
                  <a href={currentMonster.document__url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {currentMonster.document__url}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center">
        <button
          onClick={nextMonster}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Random Monster</span>
          <span>→</span>
        </button>
      </div>

      {/* Monster Counter */}
      <div className="text-center mt-4">
        <div className="text-gray-400 text-sm">
          {monsterCount > 0 && `${monsterCount} total monsters`} • {currentMonster.name}
        </div>
      </div>
    </div>
  );
}

export default MonsterViewer; 