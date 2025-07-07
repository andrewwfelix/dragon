const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', 'env.local');
require('dotenv').config({ path: envPath });

// Debug environment variables
console.log('🔧 Environment Variables:');
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST ? 'Set' : 'Not set');
console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE ? 'Set' : 'Not set');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER ? 'Set' : 'Not set');
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? 'Set' : 'Not set');

// Check if environment variables are available
if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_DATABASE || !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD) {
  console.error('❌ Missing required environment variables for Vercel Postgres');
  console.error('Please ensure these are set in your Vercel environment:');
  console.error('- POSTGRES_HOST');
  console.error('- POSTGRES_DATABASE');
  console.error('- POSTGRES_USER');
  console.error('- POSTGRES_PASSWORD');
  process.exit(1);
}

// Check if we're using Supabase or Vercel Postgres
const hasSupabase = process.env.SUPABASE_URL && process.env.POSTGRES_HOST && process.env.POSTGRES_HOST.includes('supabase');

// Initialize database connection
let postgresPool;

if (hasSupabase) {
  console.log('🗄️ Using Supabase PostgreSQL connection...');
  
  // Try using POSTGRES_URL first, then fall back to individual parameters
  if (process.env.POSTGRES_URL) {
    console.log('🔗 Using POSTGRES_URL connection string...');
    postgresPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    console.log('🔗 Using individual connection parameters...');
    postgresPool = new Pool({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: 5432,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    });
  }
} else {
  console.log('🗄️ Using Vercel PostgreSQL connection...');
  postgresPool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

// Data directory path
const DATA_DIR = path.join(__dirname, '..', '..', 'dragon_data');

// Migration functions
async function migrateMonsters() {
  console.log('🦖 Migrating monsters...');
  
  const filePath = path.join(DATA_DIR, 'monsters.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const client = await postgresPool.connect();
  
  try {
    // Create monsters table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS monsters (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        size TEXT,
        type TEXT,
        subtype TEXT,
        alignment TEXT,
        challenge_rating TEXT,
        armor_class INTEGER,
        armor_desc TEXT,
        hit_points INTEGER,
        hit_dice TEXT,
        speed JSONB,
        strength INTEGER,
        dexterity INTEGER,
        constitution INTEGER,
        intelligence INTEGER,
        wisdom INTEGER,
        charisma INTEGER,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters USING gin(to_tsvector('english', name));
      CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
      CREATE INDEX IF NOT EXISTS idx_monsters_cr ON monsters(challenge_rating);
      CREATE INDEX IF NOT EXISTS idx_monsters_data ON monsters USING gin(data);
    `);
    
    // Insert monsters
    for (const monster of data.results) {
      await client.query(`
        INSERT INTO monsters (
          name, slug, size, type, subtype, alignment, challenge_rating,
          armor_class, armor_desc, hit_points, hit_dice, speed,
          strength, dexterity, constitution, intelligence, wisdom, charisma, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = NOW()
      `, [
        monster.name,
        monster.slug,
        monster.size,
        monster.type,
        monster.subtype || null,
        monster.alignment,
        monster.challenge_rating,
        monster.armor_class,
        monster.armor_desc,
        monster.hit_points,
        monster.hit_dice,
        JSON.stringify(monster.speed),
        monster.strength,
        monster.dexterity,
        monster.constitution,
        monster.intelligence,
        monster.wisdom,
        monster.charisma,
        JSON.stringify(monster)
      ]);
    }
    
    console.log(`✅ Migrated ${data.results.length} monsters`);
    
  } catch (error) {
    console.error('Error migrating monsters:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function migrateSpells() {
  console.log('✨ Migrating spells...');
  
  const filePath = path.join(DATA_DIR, 'spells.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const client = await postgresPool.connect();
  
  try {
    // Create spells table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spells (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        level INTEGER,
        school TEXT,
        casting_time TEXT,
        range TEXT,
        duration TEXT,
        concentration BOOLEAN,
        ritual BOOLEAN,
        components TEXT[],
        material TEXT,
        desc TEXT,
        higher_level TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_spells_name ON spells USING gin(to_tsvector('english', name));
      CREATE INDEX IF NOT EXISTS idx_spells_level ON spells(level);
      CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);
      CREATE INDEX IF NOT EXISTS idx_spells_data ON spells USING gin(data);
    `);
    
    // Insert spells
    for (const spell of data.results) {
      await client.query(`
        INSERT INTO spells (
          name, slug, level, school, casting_time, range, duration,
          concentration, ritual, components, material, desc, higher_level, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = NOW()
      `, [
        spell.name,
        spell.slug,
        spell.level_int,
        spell.school,
        spell.casting_time,
        spell.range,
        spell.duration,
        spell.concentration,
        spell.ritual,
        spell.components,
        spell.material,
        spell.desc,
        spell.higher_level,
        JSON.stringify(spell)
      ]);
    }
    
    console.log(`✅ Migrated ${data.results.length} spells`);
    
  } catch (error) {
    console.error('Error migrating spells:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function migrateMagicItems() {
  console.log('🔮 Migrating magic items...');
  
  const filePath = path.join(DATA_DIR, 'magicitems.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const client = await postgresPool.connect();
  
  try {
    // Create magic_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS magic_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        type TEXT,
        rarity TEXT,
        attunement BOOLEAN,
        desc TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_magic_items_name ON magic_items USING gin(to_tsvector('english', name));
      CREATE INDEX IF NOT EXISTS idx_magic_items_rarity ON magic_items(rarity);
      CREATE INDEX IF NOT EXISTS idx_magic_items_data ON magic_items USING gin(data);
    `);
    
    // Insert magic items
    for (const item of data.results) {
      await client.query(`
        INSERT INTO magic_items (name, slug, type, rarity, attunement, desc, data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = NOW()
      `, [
        item.name,
        item.slug,
        item.type,
        item.rarity,
        item.attunement,
        item.desc,
        JSON.stringify(item)
      ]);
    }
    
    console.log(`✅ Migrated ${data.results.length} magic items`);
    
  } catch (error) {
    console.error('Error migrating magic items:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Open5e data migration to Vercel Postgres...');
  console.log(`📁 Data directory: ${DATA_DIR}`);
  
  try {
    await migrateMonsters();
    await migrateSpells();
    await migrateMagicItems();
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await postgresPool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  migrateMonsters,
  migrateSpells,
  migrateMagicItems
}; 