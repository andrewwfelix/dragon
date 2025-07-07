import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Characters from './pages/Characters';
import Monsters from './pages/Monsters';
import Spells from './pages/Spells';
import Encounters from './pages/Encounters';
import CharacterBuilder from './pages/CharacterBuilder';
import Combat from './pages/Combat';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/characters/build" element={<CharacterBuilder />} />
              <Route path="/monsters" element={<Monsters />} />
              <Route path="/spells" element={<Spells />} />
              <Route path="/encounters" element={<Encounters />} />
              <Route path="/combat" element={<Combat />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 