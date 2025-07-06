import React from 'react';
import { Link } from 'react-router-dom';
import { Sword, Users, BookOpen, Zap, Plus, Search } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Users,
      title: 'Character Builder',
      description: 'Create and manage your D&D characters with our comprehensive character builder.',
      path: '/characters/build',
      color: 'bg-blue-600'
    },
    {
      icon: Sword,
      title: 'Monster Database',
      description: 'Browse and search through thousands of monsters from the D&D 5e universe.',
      path: '/monsters',
      color: 'bg-red-600'
    },
    {
      icon: Zap,
      title: 'Spell Reference',
      description: 'Quick access to all spells with detailed descriptions and casting information.',
      path: '/spells',
      color: 'bg-purple-600'
    },
    {
      icon: BookOpen,
      title: 'Encounter Builder',
      description: 'Design balanced encounters and manage combat with our encounter tools.',
      path: '/encounters',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white">
          Welcome to <span className="text-red-500">Dragon D&D</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your comprehensive D&D 5e companion app. Build characters, browse monsters, 
          manage spells, and create epic encounters all in one place.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/characters/build"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Character</span>
          </Link>
          <Link
            to="/monsters"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Browse Monsters</span>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              to={feature.path}
              className="group block"
            >
              <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Powered by Open5e Data
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-red-500">3,300+</div>
            <div className="text-gray-400">Monsters</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-500">1,500+</div>
            <div className="text-gray-400">Spells</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-500">1,600+</div>
            <div className="text-gray-400">Magic Items</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">6,700+</div>
            <div className="text-gray-400">Total Items</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 