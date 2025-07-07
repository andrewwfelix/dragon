import React, { useState, useEffect } from 'react';

function CombatArena() {
  const [combatState, setCombatState] = useState({
    round: 1,
    turn: 'character', // 'character' or 'monster'
    character: {
      name: 'Halibur',
      currentHP: 24,
      maxHP: 24,
      ac: 16,
      initiative: 0
    },
    monster: {
      name: 'Goblin',
      currentHP: 7,
      maxHP: 7,
      ac: 15,
      attackBonus: 4,
      damage: '1d6+2'
    },
    combatLog: [],
    selectedWeapon: null,
    selectedManeuver: null
  });

  const weapons = [
    { name: 'Greatsword', attackBonus: 5, damage: '2d6+3', ability: 'Strength' },
    { name: 'Spear', attackBonus: 5, damage: '1d8+3', ability: 'Strength' },
    { name: 'Sunpiercer', attackBonus: 6, damage: '2d8 radiant', ability: 'Strength', magical: true }
  ];

  const maneuvers = [
    { name: 'Menacing Attack', effect: 'Target makes Wisdom save or frightened' },
    { name: 'Trip Attack', effect: 'Target makes Strength save or knocked prone' },
    { name: 'Disarming Attack', effect: 'Next attack against target has advantage' }
  ];

  const rollDice = (diceNotation) => {
    // Simple dice roller for "XdY+Z" format
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return 0;
    
    const [, num, sides, modifier] = match;
    const modifierValue = modifier ? parseInt(modifier) : 0;
    
    let total = 0;
    for (let i = 0; i < parseInt(num); i++) {
      total += Math.floor(Math.random() * parseInt(sides)) + 1;
    }
    return total + modifierValue;
  };

  const rollAttack = () => {
    const weapon = weapons.find(w => w.name === combatState.selectedWeapon);
    if (!weapon) return;

    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const totalAttack = attackRoll + weapon.attackBonus;
    const hit = totalAttack >= combatState.monster.ac;
    
    let damage = 0;
    if (hit) {
      damage = rollDice(weapon.damage);
    }

    const logEntry = {
      id: Date.now(),
      type: 'attack',
      attacker: 'Halibur',
      weapon: weapon.name,
      roll: attackRoll,
      total: totalAttack,
      hit: hit,
      damage: damage,
      targetHP: hit ? combatState.monster.currentHP - damage : combatState.monster.currentHP
    };

    setCombatState(prev => ({
      ...prev,
      combatLog: [...prev.combatLog, logEntry],
      monster: {
        ...prev.monster,
        currentHP: hit ? Math.max(0, prev.monster.currentHP - damage) : prev.monster.currentHP
      },
      turn: 'monster'
    }));
  };

  const monsterTurn = () => {
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const totalAttack = attackRoll + combatState.monster.attackBonus;
    const hit = totalAttack >= combatState.character.ac;
    
    let damage = 0;
    if (hit) {
      damage = rollDice(combatState.monster.damage);
    }

    const logEntry = {
      id: Date.now(),
      type: 'attack',
      attacker: combatState.monster.name,
      weapon: 'Attack',
      roll: attackRoll,
      total: totalAttack,
      hit: hit,
      damage: damage,
      targetHP: hit ? combatState.character.currentHP - damage : combatState.character.currentHP
    };

    setCombatState(prev => ({
      ...prev,
      combatLog: [...prev.combatLog, logEntry],
      character: {
        ...prev.character,
        currentHP: hit ? Math.max(0, prev.character.currentHP - damage) : prev.character.currentHP
      },
      turn: 'character',
      round: prev.round + 1
    }));
  };

  useEffect(() => {
    if (combatState.turn === 'monster') {
      const timer = setTimeout(() => {
        monsterTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatState.turn]);

  const getHealthBarColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthBarWidth = (current, max) => {
    return Math.max(0, (current / max) * 100);
  };

  const isCombatOver = () => {
    return combatState.character.currentHP <= 0 || combatState.monster.currentHP <= 0;
  };

  const getWinner = () => {
    if (combatState.character.currentHP <= 0) return 'monster';
    if (combatState.monster.currentHP <= 0) return 'character';
    return null;
  };

  if (isCombatOver()) {
    const winner = getWinner();
    return (
      <div className="w-full p-2">
        <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {winner === 'character' ? 'Victory!' : 'Defeat!'}
          </h2>
          <p className="text-gray-300 mb-4">
            {winner === 'character' 
              ? `${combatState.character.name} defeated ${combatState.monster.name}!`
              : `${combatState.monster.name} defeated ${combatState.character.name}!`
            }
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Fight Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 space-y-3">
      {/* Round and Turn Indicator */}
      <div className="bg-gray-800 border border-gray-700 rounded p-2">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold">Round {combatState.round}</span>
          <span className={`font-bold ${combatState.turn === 'character' ? 'text-blue-400' : 'text-red-400'}`}>
            {combatState.turn === 'character' ? "Halibur's Turn" : `${combatState.monster.name}'s Turn`}
          </span>
        </div>
      </div>

      {/* Character and Monster Stats */}
      <div className="grid grid-cols-2 gap-2">
        {/* Character Card */}
        <div className="bg-gray-800 border border-gray-700 rounded p-2">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <h3 className="text-white font-bold text-sm">{combatState.character.name}</h3>
            <div className="text-gray-300 text-xs">
              HP: {combatState.character.currentHP}/{combatState.character.maxHP}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full ${getHealthBarColor(combatState.character.currentHP, combatState.character.maxHP)}`}
                style={{ width: `${getHealthBarWidth(combatState.character.currentHP, combatState.character.maxHP)}%` }}
              ></div>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              AC: {combatState.character.ac}
            </div>
          </div>
        </div>

        {/* Monster Card */}
        <div className="bg-gray-800 border border-gray-700 rounded p-2">
          <div className="text-center">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-1">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h3 className="text-white font-bold text-sm">{combatState.monster.name}</h3>
            <div className="text-gray-300 text-xs">
              HP: {combatState.monster.currentHP}/{combatState.monster.maxHP}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full ${getHealthBarColor(combatState.monster.currentHP, combatState.monster.maxHP)}`}
                style={{ width: `${getHealthBarWidth(combatState.monster.currentHP, combatState.monster.maxHP)}%` }}
              ></div>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              AC: {combatState.monster.ac}
            </div>
          </div>
        </div>
      </div>

      {/* Character Turn Actions */}
      {combatState.turn === 'character' && (
        <div className="space-y-2">
          {/* Weapons */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h3 className="text-white font-bold text-sm mb-2">Weapons</h3>
            <div className="grid grid-cols-1 gap-1">
              {weapons.map((weapon) => (
                <button
                  key={weapon.name}
                  onClick={() => setCombatState(prev => ({ ...prev, selectedWeapon: weapon.name }))}
                  className={`p-2 rounded text-left transition-colors ${
                    combatState.selectedWeapon === weapon.name 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{weapon.name}</span>
                    <span className="text-xs">+{weapon.attackBonus} to hit</span>
                  </div>
                  <div className="text-xs opacity-75">{weapon.damage} damage</div>
                </button>
              ))}
            </div>
          </div>

          {/* Maneuvers */}
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <h3 className="text-white font-bold text-sm mb-2">Maneuvers</h3>
            <div className="grid grid-cols-1 gap-1">
              {maneuvers.map((maneuver) => (
                <button
                  key={maneuver.name}
                  onClick={() => setCombatState(prev => ({ ...prev, selectedManeuver: maneuver.name }))}
                  className={`p-2 rounded text-left transition-colors ${
                    combatState.selectedManeuver === maneuver.name 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-sm">{maneuver.name}</div>
                  <div className="text-xs opacity-75">{maneuver.effect}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Attack Button */}
          <button
            onClick={rollAttack}
            disabled={!combatState.selectedWeapon}
            className={`w-full p-3 rounded font-bold transition-colors ${
              combatState.selectedWeapon
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {combatState.selectedWeapon ? `Attack with ${combatState.selectedWeapon}` : 'Select a weapon to attack'}
          </button>
        </div>
      )}

      {/* Combat Log */}
      <div className="bg-gray-800 border border-gray-700 rounded p-2">
        <h3 className="text-white font-bold text-sm mb-2">Combat Log</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {combatState.combatLog.map((entry) => (
            <div key={entry.id} className="text-xs p-1 bg-gray-700 rounded">
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-bold">{entry.attacker}</span>
                <span className={`font-bold ${entry.hit ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.hit ? 'HIT!' : 'MISS!'}
                </span>
              </div>
              <div className="text-gray-300">
                {entry.weapon} +{entry.total - entry.roll} ({entry.roll} + {entry.total - entry.roll})
              </div>
              {entry.hit && (
                <div className="text-white font-bold">
                  {entry.damage} damage
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CombatArena; 