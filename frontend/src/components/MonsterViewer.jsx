import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function MonsterViewer() {
  const [currentMonster, setCurrentMonster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monsterCount, setMonsterCount] = useState(0);
  const [typeIconUrl, setTypeIconUrl] = useState(null);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const fetchRandomMonster = async () => {
    setLoading(true);
    setError(null);
    setLastRequestTime(Date.now());
    
    try {
      const response = await fetch('/api/monsters');
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait 30 seconds before trying again.');
        }
        throw new Error('Failed to fetch random monster');
      }
      const monster = await response.json();
      setCurrentMonster(monster);
      
      // Only fetch count if we don't have it yet
      if (monsterCount === 0) {
        const countResponse = await fetch('/api/monsters?limit=1');
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setMonsterCount(countData.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching monster:', error);
      setError(error.message || 'Failed to load monster');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchRandomMonster();
  }, []);

  // Fetch the icon image for the current monster type
  useEffect(() => {
    async function fetchTypeIcon(type) {
      if (!type) {
        return setTypeIconUrl(null);
      }
      
      // Rate limiting: ensure at least 1 second between icon requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < 1000) {
        const waitTime = 1000 - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      try {
        const url = `/api/monsters/type-icon/${encodeURIComponent(type)}`;
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 429) {
            console.log('Rate limited on icon fetch, skipping...');
            return setTypeIconUrl(null);
          }
          return setTypeIconUrl(null);
        }
        const data = await res.json();
        setTypeIconUrl(data.icon_image || null);
      } catch (error) {
        console.error('Error fetching type icon:', error);
        setTypeIconUrl(null);
      }
    }
    if (currentMonster && currentMonster.type) {
      fetchTypeIcon(currentMonster.type);
    } else {
      setTypeIconUrl(null);
    }
  }, [currentMonster?.type, lastRequestTime]);

  const getModifier = (score) => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const formatSpeed = (speed) => {
    if (typeof speed === 'object') {
      return Object.entries(speed).map(([type, value]) => `${type} ${value} ft.`).join(', ');
    }
    return `${speed} ft.`;
  };

  const parseDescription = (desc) => {
    if (!desc) return { mainDescription: '', traits: [] };
    
    // Split by bold markers (**Trait Name.**)
    const parts = desc.split(/\*\*(.*?)\*\*\./);
    const mainDescription = parts[0].trim();
    const traits = [];
    
    // Extract traits (every odd index after splitting)
    for (let i = 1; i < parts.length; i += 2) {
      if (parts[i] && parts[i + 1]) {
        traits.push({
          name: parts[i].trim(),
          description: parts[i + 1].trim()
        });
      }
    }
    
    return { mainDescription, traits };
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <span className="text-gray-300">Loading...</span>
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

  if (!currentMonster) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">No monster found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      {/* Single Top Container */}
      <div className="bg-gray-800 border border-gray-700 rounded p-2 mb-2">
        <div className="flex items-center gap-3">
          {/* Monster Type Icon */}
          {typeIconUrl && (
            <div className="flex-shrink-0">
              <img
                src={typeIconUrl}
                alt={`${currentMonster.type} icon`}
                className="w-12 h-12 object-contain rounded shadow-lg border border-gray-700 bg-black"
                style={{ background: 'black' }}
                onError={(e) => {
                  console.log('❌ Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{currentMonster.name}</h1>
          </div>
        </div>
      </div>

      {/* Monster Description */}
      {((currentMonster.desc && currentMonster.desc !== 'False') || currentMonster.legendary_desc) && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
          <div className="text-gray-300 text-sm leading-relaxed">
            {currentMonster.desc && currentMonster.desc !== 'False' && (
              <div className="mb-3">
                <span className="text-blue-400 font-bold">Description: </span>
                <div className="inline">
                  <ReactMarkdown>{currentMonster.desc}</ReactMarkdown>
                </div>
              </div>
            )}
            {currentMonster.legendary_desc && (
              <div>
                <span className="text-blue-400 font-bold">Legendary: </span>
                <div className="inline">
                  <ReactMarkdown>{currentMonster.legendary_desc}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Traits Section */}
      {currentMonster.special_traits && currentMonster.special_traits.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
          <h2 className="text-white mb-2 font-bold text-sm">Special Traits</h2>
          <div className="space-y-2">
            {currentMonster.special_traits.map((trait, index) => (
              <div key={index} className="p-2 bg-gray-700 rounded">
                <div className="text-gray-300 text-sm">
                  <span className="text-blue-400 font-bold">{trait.name}: </span>
                  <div className="inline">
                    <ReactMarkdown>{trait.description}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <span className="text-white font-bold">{currentMonster.hit_points}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">AC:</span>
                <span className="text-white font-bold">{currentMonster.armor_class}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Type:</span>
                <span className="text-white font-bold text-sm">
                  {currentMonster.type}
                  {currentMonster.subtype && <span className="text-gray-200"> ({currentMonster.subtype})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">CR:</span>
                <span className="text-white font-bold">{currentMonster.challenge_rating}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Size:</span>
                <span className="text-white font-bold">{currentMonster.size}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Speed:</span>
                <span className="text-white text-sm text-right">
                  {formatSpeed(currentMonster.speed)}
                </span>
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
                  {[
                    { name: 'STR', value: currentMonster.strength, color: 'text-red-400' },
                    { name: 'DEX', value: currentMonster.dexterity, color: 'text-green-400' },
                    { name: 'CON', value: currentMonster.constitution, color: 'text-yellow-400' },
                    { name: 'INT', value: currentMonster.intelligence, color: 'text-blue-400' },
                    { name: 'WIS', value: currentMonster.wisdom, color: 'text-purple-400' },
                    { name: 'CHA', value: currentMonster.charisma, color: 'text-pink-400' }
                  ].map(ability => (
                    <div key={ability.name} className="grid grid-cols-3 gap-2 p-1 bg-gray-700 rounded">
                      <div className={`font-bold text-sm ${ability.color}`}>{ability.name}</div>
                      <div className="text-white font-bold text-sm text-center">{ability.value}</div>
                      <div className="text-gray-400 text-sm text-center">{getModifier(ability.value)}</div>
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
                  {[
                    { name: 'STR', save: currentMonster.strength_save },
                    { name: 'DEX', save: currentMonster.dexterity_save },
                    { name: 'CON', save: currentMonster.constitution_save },
                    { name: 'INT', save: currentMonster.intelligence_save },
                    { name: 'WIS', save: currentMonster.wisdom_save },
                    { name: 'CHA', save: currentMonster.charisma_save }
                  ].map(ability => (
                    <div key={ability.name} className="p-1 bg-gray-700 rounded">
                      <div className="text-blue-400 text-sm font-bold text-center">
                        {ability.save !== null ? (ability.save >= 0 ? `+${ability.save}` : ability.save) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Details */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Details</h2>
            <div className="space-y-1">
              {currentMonster.languages && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-blue-400">Languages:</span> {currentMonster.languages}
                  </div>
                </div>
              )}
              {currentMonster.senses && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-blue-400">Senses:</span> {currentMonster.senses}
                  </div>
                </div>
              )}
              {currentMonster.damage_vulnerabilities && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-red-400">Vulnerabilities:</span> {currentMonster.damage_vulnerabilities}
                  </div>
                </div>
              )}
              {currentMonster.damage_resistances && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-blue-400">Resistances:</span> {currentMonster.damage_resistances}
                  </div>
                </div>
              )}
              {currentMonster.damage_immunities && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-purple-400">Immunities:</span> {currentMonster.damage_immunities}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {currentMonster.skills && Object.keys(currentMonster.skills).length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Skills</h2>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(currentMonster.skills).map(([skill, bonus]) => (
                  <div key={skill} className="flex justify-between items-center p-1 bg-gray-700 rounded">
                    <span className="text-gray-300 text-sm capitalize">{skill}:</span>
                    <span className="text-white font-bold text-sm">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions and Abilities (3/4 width) */}
        <div className="lg:col-span-3 space-y-2">
          {/* Actions */}
          {currentMonster.actions && currentMonster.actions.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Actions</h2>
              <div className="space-y-1">
                {currentMonster.actions.map((action, index) => (
                  <div key={index} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{action.name}: </span>
                      <div className="inline">
                        <ReactMarkdown>{action.desc}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legendary Actions */}
          {currentMonster.legendary_actions && currentMonster.legendary_actions.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Legendary Actions</h2>
              <div className="space-y-1">
                {currentMonster.legendary_actions.map((action, index) => (
                  <div key={index} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{action.name}: </span>
                      <div className="inline">
                        <ReactMarkdown>{action.desc}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Abilities */}
          {currentMonster.special_abilities && currentMonster.special_abilities.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Special Abilities</h2>
              <div className="space-y-1">
                {currentMonster.special_abilities.map((ability, index) => (
                  <div key={index} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 text-sm">
                      <span className="text-blue-400 font-bold">{ability.name}: </span>
                      <div className="inline">
                        <ReactMarkdown>{ability.desc}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Counter */}
      <div className="text-center">
        <div className="text-gray-400 text-xs">
          {monsterCount > 0 && `${monsterCount} total monsters`} • {currentMonster.name}
        </div>
      </div>
    </div>
  );
}

export default MonsterViewer;