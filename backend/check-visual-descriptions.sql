-- Check visual descriptions in the monsters table
-- Run these in your Supabase SQL Editor

-- 1. Count how many monsters have visual descriptions
SELECT COUNT(*) as total_monsters_with_visual_descriptions 
FROM monsters 
WHERE visual_description IS NOT NULL;

-- 2. Show the first 10 monsters with their visual descriptions
SELECT name, visual_description 
FROM monsters 
WHERE visual_description IS NOT NULL 
ORDER BY name 
LIMIT 10;

-- 3. Check the length of visual descriptions to see if they're too long
SELECT 
    name,
    LENGTH(visual_description) as description_length,
    LEFT(visual_description, 100) as preview
FROM monsters 
WHERE visual_description IS NOT NULL 
ORDER BY LENGTH(visual_description) DESC 
LIMIT 10;

-- 4. Clear all existing visual descriptions (if you want to regenerate them)
-- WARNING: This will delete all existing visual descriptions!
-- UPDATE monsters SET visual_description = NULL WHERE visual_description IS NOT NULL; 