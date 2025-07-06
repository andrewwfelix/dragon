-- D&D 5e Application Database Schema
-- This schema uses a hybrid approach with structured columns for fast queries
-- and JSONB columns for complex nested data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Monsters table
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
    data JSONB NOT NULL, -- Full monster data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spells table
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
    data JSONB NOT NULL, -- Full spell data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Magic Items table
CREATE TABLE IF NOT EXISTS magic_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT,
    rarity TEXT,
    attunement BOOLEAN,
    desc TEXT,
    data JSONB NOT NULL, -- Full item data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    hit_die INTEGER,
    data JSONB NOT NULL, -- Full class data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_subrace BOOLEAN DEFAULT FALSE,
    parent_race TEXT,
    data JSONB NOT NULL, -- Full race data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backgrounds table
CREATE TABLE IF NOT EXISTS backgrounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL, -- Full background data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feats table
CREATE TABLE IF NOT EXISTS feats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL, -- Full feat data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weapons table
CREATE TABLE IF NOT EXISTS weapons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    damage_dice TEXT,
    damage_type TEXT,
    data JSONB NOT NULL, -- Full weapon data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Armor table
CREATE TABLE IF NOT EXISTS armor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    ac_base INTEGER,
    ac_add_dexmod BOOLEAN,
    ac_cap_dexmod INTEGER,
    data JSONB NOT NULL, -- Full armor data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table (for user-created characters)
CREATE TABLE IF NOT EXISTS characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    background TEXT,
    alignment TEXT,
    experience INTEGER DEFAULT 0,
    hit_points INTEGER NOT NULL,
    max_hit_points INTEGER NOT NULL,
    armor_class INTEGER DEFAULT 10,
    initiative INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 30,
    abilities JSONB NOT NULL, -- {strength, dexterity, constitution, intelligence, wisdom, charisma}
    skills TEXT[],
    spells TEXT[],
    equipment TEXT[],
    features TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encounters table (for encounter management)
CREATE TABLE IF NOT EXISTS encounters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT,
    experience_reward INTEGER,
    monsters JSONB, -- Array of monster data
    characters JSONB, -- Array of character data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
CREATE INDEX IF NOT EXISTS idx_monsters_cr ON monsters(challenge_rating);
CREATE INDEX IF NOT EXISTS idx_monsters_data ON monsters USING gin(data);

CREATE INDEX IF NOT EXISTS idx_spells_name ON spells USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_spells_level ON spells(level);
CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);
CREATE INDEX IF NOT EXISTS idx_spells_data ON spells USING gin(data);

CREATE INDEX IF NOT EXISTS idx_magic_items_name ON magic_items USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_magic_items_rarity ON magic_items(rarity);
CREATE INDEX IF NOT EXISTS idx_magic_items_data ON magic_items USING gin(data);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON encounters(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_monsters_updated_at BEFORE UPDATE ON monsters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spells_updated_at BEFORE UPDATE ON spells FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_magic_items_updated_at BEFORE UPDATE ON magic_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backgrounds_updated_at BEFORE UPDATE ON backgrounds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feats_updated_at BEFORE UPDATE ON feats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weapons_updated_at BEFORE UPDATE ON weapons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_armor_updated_at BEFORE UPDATE ON armor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic example - customize based on your auth needs)
CREATE POLICY "Users can view their own characters" ON characters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters" ON characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" ON characters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" ON characters
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for encounters
CREATE POLICY "Users can view their own encounters" ON encounters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own encounters" ON encounters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encounters" ON encounters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own encounters" ON encounters
    FOR DELETE USING (auth.uid() = user_id); 