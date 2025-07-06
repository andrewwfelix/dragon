import React from 'react';
import MonsterViewer from '../components/MonsterViewer';

function Monsters() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Monster Manual</h1>
      </div>
      
      <MonsterViewer />
    </div>
  );
}

export default Monsters; 