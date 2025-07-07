-- Create monster_types table for storing type icons
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS monster_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_name TEXT UNIQUE NOT NULL,
    icon_image BYTEA, -- Binary data for the icon image
    icon_filename TEXT, -- Optional: store the original filename
    icon_mime_type TEXT, -- Optional: store the MIME type (e.g., 'image/png', 'image/svg+xml')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on type_name for fast lookups
CREATE INDEX IF NOT EXISTS idx_monster_types_name ON monster_types(type_name);

-- Insert all distinct monster types from the monsters table
INSERT INTO monster_types (type_name)
SELECT DISTINCT data->>'type' as type_name
FROM monsters 
WHERE data->>'type' IS NOT NULL 
  AND data->>'type' != ''
  AND NOT EXISTS (
    SELECT 1 FROM monster_types WHERE type_name = data->>'type'
  );

-- Show what types were inserted
SELECT type_name FROM monster_types ORDER BY type_name; 