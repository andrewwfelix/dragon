import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function SpellViewer() {
  const [currentSpell, setCurrentSpell] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spellCount, setSpellCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const fetchRandomSpell = async () => {
    setLoading(true);
    setError(null);
    setLastRequestTime(Date.now());
    
    try {
      const response = await fetch('/api/spells');
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait 30 seconds before trying again.');
        }
        throw new Error('Failed to fetch random spell');
      }
      const spell = await response.json();
      setCurrentSpell(spell);
      
      // Only fetch count if we don't have it yet
      if (spellCount === 0) {
        const countResponse = await fetch('/api/spells?limit=1');
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setSpellCount(countData.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching spell:', error);
      setError(error.message || 'Failed to load spell');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomSpell();
  }, []);

  const getLevelText = (level) => {
    if (level === 0) return 'Cantrip';
    if (level === 1) return '1st Level';
    if (level === 2) return '2nd Level';
    if (level === 3) return '3rd Level';
    return `${level}th Level`;
  };

  const formatComponents = (components) => {
    if (!components || !Array.isArray(components)) return '';
    return components.join(', ');
  };

  const extractSchoolName = (school) => {
    if (!school) return '';
    
    // If it's already a simple string (not a URL), return it
    if (!school.includes('http')) {
      return school;
    }
    
    // Extract school name from URL like "https://api.open5e.com/v2/spellschools/conjuration/"
    const match = school.match(/spellschools\/([^\/]+)/);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1); // Capitalize first letter
    }
    
    return school;
  };

  const getSchoolColor = (school) => {
    const schoolName = extractSchoolName(school);
    const colors = {
      'Abjuration': 'text-blue-400',
      'Conjuration': 'text-green-400',
      'Divination': 'text-purple-400',
      'Enchantment': 'text-pink-400',
      'Evocation': 'text-red-400',
      'Illusion': 'text-yellow-400',
      'Necromancy': 'text-gray-400',
      'Transmutation': 'text-orange-400'
    };
    return colors[schoolName] || 'text-white';
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

  if (!currentSpell) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">No spell found</div>
      </div>
    );
  }

  const schoolName = extractSchoolName(currentSpell.school);

  return (
    <div className="w-full p-2">
      {/* Single Top Container */}
      <div className="bg-gray-800 border border-gray-700 rounded p-2 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">{currentSpell.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-blue-400 font-bold">{getLevelText(currentSpell.level)}</span>
                <span className="text-gray-400">•</span>
                <span className={`font-bold ${getSchoolColor(currentSpell.school)}`}>
                  {schoolName}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{currentSpell.casting_time}</span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchRandomSpell}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Next Spell
          </button>
        </div>
      </div>

      {/* Spell Description */}
      {currentSpell.desc && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
          <div className="text-gray-300 text-sm leading-relaxed">
            <ReactMarkdown>{currentSpell.desc}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Higher Level Effects */}
      {currentSpell.higher_level && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
          <div className="text-gray-300 text-sm leading-relaxed">
            <span className="text-blue-400 font-bold">At Higher Levels: </span>
            <div className="inline">
              <ReactMarkdown>{currentSpell.higher_level}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout - Left 1/4, Right 3/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2">
        {/* Left Column - Spell Details (1/4 width) */}
        <div className="space-y-2">
          {/* Spell Details */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Spell Details</h2>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Level:</span>
                <span className="text-white font-bold">{getLevelText(currentSpell.level)}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">School:</span>
                <span className={`font-bold text-sm ${getSchoolColor(currentSpell.school)}`}>
                  {schoolName}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Casting Time:</span>
                <span className="text-white text-sm text-right">
                  {currentSpell.casting_time}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Range:</span>
                <span className="text-white text-sm text-right">
                  {currentSpell.range}
                </span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-700 rounded">
                <span className="text-gray-300 text-sm">Duration:</span>
                <span className="text-white text-sm text-right">
                  {currentSpell.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Components */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Components</h2>
            <div className="space-y-1">
              <div className="p-1 bg-gray-700 rounded">
                <div className="text-gray-300 text-sm">
                  <span className="text-blue-400">Components:</span> {formatComponents(currentSpell.components)}
                </div>
              </div>
              {currentSpell.material && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-blue-400">Material:</span> {currentSpell.material}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h2 className="text-white mb-2 font-bold text-sm">Requirements</h2>
            <div className="space-y-1">
              {currentSpell.concentration && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-red-400">Concentration</span>
                  </div>
                </div>
              )}
              {currentSpell.ritual && (
                <div className="p-1 bg-gray-700 rounded">
                  <div className="text-gray-300 text-sm">
                    <span className="text-purple-400">Ritual</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Information (3/4 width) */}
        <div className="lg:col-span-3 space-y-2">
          {/* Additional spell information can go here */}
          {currentSpell.desc && currentSpell.desc.length > 500 && (
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <h2 className="text-white mb-2 font-bold text-sm">Full Description</h2>
              <div className="text-gray-300 text-sm leading-relaxed">
                <ReactMarkdown>{currentSpell.desc}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Counter */}
      <div className="text-center">
        <div className="text-gray-400 text-xs">
          {spellCount > 0 && `${spellCount} total spells`} • {currentSpell.name}
        </div>
      </div>
    </div>
  );
}

export default SpellViewer; 