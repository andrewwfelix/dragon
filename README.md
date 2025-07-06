# Dragon - D&D 5e Application

A comprehensive D&D 5e application with React frontend, Node.js backend, and Supabase database integration.

## Features

- **Monster Manual**: Browse through all D&D 5e monsters with detailed stats
- **Spell Compendium**: Complete spell database (coming soon)
- **Character Builder**: Create and manage characters (coming soon)
- **Encounter Builder**: Build and manage combat encounters (coming soon)

## Quick Start

### Option 1: Using the batch file (Recommended for Windows)
```bash
# Double-click or run:
start.bat
```

### Option 2: Using PowerShell script
```bash
# Run in PowerShell:
.\start.ps1
```

### Option 3: Manual start
```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend  
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## Project Structure

```
dragon/
├── frontend/          # React application
├── backend/           # Node.js API server
├── services/          # Business logic layer
├── data/             # Open5e dataset
└── scripts/          # Database migration scripts
```

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Data Source**: Open5e API

## Dark Theme

The application features a beautiful dark theme inspired by Cursor's UI design with:
- Dark backgrounds (gray-800, gray-900)
- Blue accents for primary actions
- Purple highlights for special elements
- Clean, modern typography

## API Endpoints

- `GET /api/monsters` - List monsters with pagination and filtering
- `GET /api/monsters/:slug` - Get monster by slug
- `GET /api/spells` - List spells (coming soon)
- `GET /api/health` - Health check

## Development

To fix PowerShell execution policy issues:
1. Run PowerShell as Administrator
2. Execute: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Or use the provided batch file/scripts

## 📊 Data Integration

- **6,767+ items** from Open5e API
- **3,300+ monsters** with complete stats
- **1,500+ spells** with detailed descriptions
- **1,600+ magic items** and equipment
- **Complete SRD content** under OGL 1.0a license

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/andrewwfelix/dragon.git
   cd dragon
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

## 📁 Project Structure

```
dragon/
├── backend/                 # Express.js API server
│   ├── config/             # Database and app configuration
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   └── server.js           # Main server file
├── services/               # Business logic layer
│   ├── characterService.js # Character management logic
│   ├── monsterService.js   # Monster data processing
│   └── spellService.js     # Spell management
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── data/                   # Open5e data files
└── docs/                   # Documentation
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run install:all` - Install dependencies for all tiers
- `npm test` - Run all tests

### Backend
- `npm run dev:backend` - Start backend with nodemon
- `npm run test:backend` - Run backend tests

### Frontend
- `npm run dev:frontend` - Start frontend development server
- `npm run build` - Build for production
- `npm run test:frontend` - Run frontend tests

## 🗄️ Database Schema

The application uses a hybrid approach with structured columns for fast queries and JSONB for complex nested data:

```sql
-- Monsters table
CREATE TABLE monsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    size TEXT,
    type TEXT,
    challenge_rating TEXT,
    armor_class INTEGER,
    hit_points INTEGER,
    data JSONB NOT NULL, -- Full monster data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `PORT` - Backend server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## 📚 Features

### Character Management
- Character creation and leveling
- Ability score calculations
- Hit point management
- Experience tracking

### Monster Database
- Search and filter monsters
- Challenge rating filtering
- Type-based categorization
- Complete monster stats

### Spell Reference
- Spell lookup and search
- Casting information
- School and level filtering
- Detailed descriptions

### Encounter Builder
- Balanced encounter creation
- XP calculation
- Difficulty assessment
- Combat management

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:backend
npm run test:frontend
npm run test:services
```

## 📦 Deployment

### Backend (Vercel/Heroku)
```bash
npm run build:backend
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
```

## 📄 License

This project uses Open5e data which is licensed under:
- Open Game License (OGL 1.0a)
- Creative Commons Attribution 4.0

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for the D&D community** 
