-- Fix the icon_image column to store URLs as TEXT instead of BYTEA
-- Run this in your Supabase SQL Editor

-- First, let's see what we currently have
SELECT type_name, icon_image, 
       CASE 
         WHEN icon_image IS NULL THEN 'NULL'
         WHEN icon_image::text LIKE '\\x%' THEN 'HEX_ENCODED'
         ELSE 'TEXT'
       END as data_type
FROM monster_types 
WHERE icon_image IS NOT NULL
LIMIT 5;

-- Change the column type to TEXT
ALTER TABLE monster_types ALTER COLUMN icon_image TYPE TEXT;

-- Now we need to convert any existing hex-encoded data back to URLs
-- This will be done in our JavaScript code when we fetch the data 