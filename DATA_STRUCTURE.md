# Open5e Data Structure Documentation

## 📊 Overview

Your `C:\temp\dragon_data` directory contains a complete Open5e dataset with **6,767 total items** across **15 endpoints**. This data is ready to be imported into your Supabase database for the D&D 5e application.

## 📁 File Inventory

| File | Size | Items | Description |
|------|------|-------|-------------|
| `monsters.json` | 17.4MB | 3,300 | Complete monster database with stats |
| `spells.json` | 5MB | 1,500 | All spells with casting details |
| `magicitems.json` | 1.9MB | 1,618 | Magic items and equipment |
| `classes.json` | 575KB | 12 | Character classes |
| `races.json` | 98KB | 52 | Races and subraces |
| `backgrounds.json` | 224KB | 52 | Character backgrounds |
| `feats.json` | 123KB | 89 | Character feats |
| `weapons.json` | 36KB | 37 | Weapons |
| `armor.json` | 5KB | 12 | Armor types |
| `conditions.json` | 8KB | 15 | Status conditions |
| `planes.json` | 11KB | 8 | Planes of existence |
| `sections.json` | 325KB | 45 | Document sections |
| `documents.json` | 216KB | 20 | Reference documents |
| `spelllist.json` | 36KB | 7 | Spell lists |
| `manifest.json` | 74B | 1 | API manifest |

## 🗂️ Data Format

All files follow the Open5e API structure:

```json
{
  "count": number,
  "next": null,
  "previous": null,
  "results": [
    {
      // Item data varies by type
    }
  ]
}
```

## 📋 Detailed Data Structures

### Monsters (`monsters.json`)
```json
{
  "slug": "a-mi-kuk",
  "name": "A-mi-kuk",
  "size": "Huge",
  "type": "Aberration",
  "subtype": "",
  "alignment": "chaotic evil",
  "armor_class": 14,
  "armor_desc": "natural armor",
  "hit_points": 115,
  "hit_dice": "10d12+50",
  "speed": {
    "swim": 40,
    "burrow": 20,
    "walk": 30
  },
  "strength": 21,
  "dexterity": 8,
  "constitution": 20,
  "intelligence": 7,
  "wisdom": 14,
  "charisma": 10,
  "desc": "Detailed description...",
  "actions": [...],
  "legendary_actions": [...],
  "special_abilities": [...]
}
```

### Spells (`spells.json`)
```json
{
  "name": "Accelerando",
  "slug": "a5e-ag_accelerando",
  "level_int": 3,
  "school": "Transmutation",
  "casting_time": "1 action",
  "range": "30 feet",
  "duration": "Concentration, up to 1 minute",
  "concentration": true,
  "ritual": false,
  "components": ["V", "S"],
  "material": null,
  "desc": "Spell description...",
  "higher_level": "At higher levels...",
  "casting_options": [...]
}
```

### Magic Items (`magicitems.json`)
```json
{
  "name": "Adamantine Armor",
  "slug": "adamantine-armor",
  "type": "Armor",
  "rarity": "Uncommon",
  "attunement": false,
  "desc": "This suit of armor is reinforced with adamantine...",
  "document": "https://api.open5e.com/v2/documents/srd/"
}
```

### Classes (`classes.json`)
```json
{
  "name": "Barbarian",
  "slug": "barbarian",
  "hit_die": 12,
  "proficiency_choices": [...],
  "proficiencies": [...],
  "saving_throws": [...],
  "starting_equipment": [...],
  "class_levels": [...],
  "spellcasting": {...},
  "subclasses": [...]
}
```

### Races (`races.json`)
```json
{
  "name": "Dragonborn",
  "slug": "srd_dragonborn",
  "is_subrace": false,
  "parent_race": null,
  "traits": [
    {
      "name": "Ability Score Increase",
      "desc": "Your Strength score increases by 2..."
    }
  ],
  "ability_bonuses": [...],
  "starting_proficiencies": [...]
}
```

## 🗄️ Database Schema Mapping

The migration script maps this data to the following database structure:

### Hybrid Approach
- **Structured columns**: Fast queries on common fields (name, level, type, CR)
- **JSONB columns**: Store complete data for complex nested information

### Key Tables
1. **monsters** - Monster database with ability scores and full data
2. **spells** - Spell reference with casting details
3. **magic_items** - Equipment and magic items
4. **classes** - Character classes
5. **races** - Races and subraces
6. **backgrounds** - Character backgrounds
7. **feats** - Character feats
8. **weapons** - Weapon database
9. **armor** - Armor types
10. **characters** - User-created characters
11. **encounters** - Encounter management

## 🚀 Migration Process

### 1. Set up Supabase Database
```bash
# Run the SQL schema in Supabase SQL editor
npm run setup-db
```

### 2. Configure Environment
```bash
# Copy and edit environment variables
cp env.example .env
# Add your Supabase credentials
```

### 3. Run Migration
```bash
# Import all data to Supabase
npm run migrate
```

## 📈 Performance Optimizations

### Indexes Created
- Full-text search on names
- Type-based filtering
- Challenge rating ranges
- JSONB GIN indexes for complex queries

### Query Optimization
- Structured columns for common filters
- JSONB for complex nested data
- Pagination support
- Efficient search capabilities

## 🔍 Search Capabilities

The database supports:
- **Monster search** by name, type, CR range
- **Spell search** by name, level, school
- **Item search** by name, rarity, type
- **Full-text search** across descriptions
- **Complex queries** using JSONB operators

## 📝 Usage Examples

### Find Monsters by CR
```sql
SELECT name, challenge_rating, type 
FROM monsters 
WHERE challenge_rating = '5';
```

### Search Spells by School
```sql
SELECT name, level, casting_time 
FROM spells 
WHERE school = 'Evocation' AND level <= 3;
```

### Full-text Search
```sql
SELECT name, desc 
FROM monsters 
WHERE to_tsvector('english', name) @@ plainto_tsquery('dragon');
```

## 🎯 Next Steps

1. **Set up Supabase project** and get credentials
2. **Run database schema** in Supabase SQL editor
3. **Configure environment variables** with your credentials
4. **Run data migration** to import all Open5e data
5. **Test API endpoints** with the imported data
6. **Build frontend features** using the data

This comprehensive dataset provides everything needed to build a full-featured D&D 5e application! 