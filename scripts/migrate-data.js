const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Data directory path
const DATA_DIR = path.join(__dirname, '..', '..', 'dragon_data');

// Migration functions
async function migrateMonsters() {
  console.log('🦖 Migrating monsters...');
  
  const filePath = path.join(DATA_DIR, 'monsters.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const monsters = data.results.map(monster => ({
    name: monster.name,
    slug: monster.slug,
    size: monster.size,
    type: monster.type,
    subtype: monster.subtype || null,
    alignment: monster.alignment,
    challenge_rating: monster.challenge_rating,
    armor_class: monster.armor_class,
    armor_desc: monster.armor_desc,
    hit_points: monster.hit_points,
    hit_dice: monster.hit_dice,
    speed: monster.speed,
    strength: monster.strength,
    dexterity: monster.dexterity,
    constitution: monster.constitution,
    intelligence: monster.intelligence,
    wisdom: monster.wisdom,
    charisma: monster.charisma,
    data: monster // Store full monster data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('monsters')
    .upsert(monsters, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating monsters:', error);
  } else {
    console.log(`✅ Migrated ${result.length} monsters`);
  }
}

async function migrateSpells() {
  console.log('✨ Migrating spells...');
  
  const filePath = path.join(DATA_DIR, 'spells.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const spells = data.results.map(spell => ({
    name: spell.name,
    slug: spell.slug,
    level: spell.level_int,
    school: spell.school,
    casting_time: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    components: spell.components,
    material: spell.material,
    desc: spell.desc,
    higher_level: spell.higher_level,
    data: spell // Store full spell data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('spells')
    .upsert(spells, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating spells:', error);
  } else {
    console.log(`✅ Migrated ${result.length} spells`);
  }
}

async function migrateMagicItems() {
  console.log('🔮 Migrating magic items...');
  
  const filePath = path.join(DATA_DIR, 'magicitems.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const items = data.results.map(item => ({
    name: item.name,
    slug: item.slug,
    type: item.type,
    rarity: item.rarity,
    attunement: item.attunement,
    desc: item.desc,
    data: item // Store full item data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('magic_items')
    .upsert(items, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating magic items:', error);
  } else {
    console.log(`✅ Migrated ${result.length} magic items`);
  }
}

async function migrateClasses() {
  console.log('⚔️ Migrating classes...');
  
  const filePath = path.join(DATA_DIR, 'classes.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const classes = data.results.map(cls => ({
    name: cls.name,
    slug: cls.slug,
    hit_die: cls.hit_die,
    data: cls // Store full class data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('classes')
    .upsert(classes, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating classes:', error);
  } else {
    console.log(`✅ Migrated ${result.length} classes`);
  }
}

async function migrateRaces() {
  console.log('🧝 Migrating races...');
  
  const filePath = path.join(DATA_DIR, 'races.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const races = data.results.map(race => ({
    name: race.name,
    slug: race.slug,
    is_subrace: race.is_subrace,
    parent_race: race.parent_race || null,
    data: race // Store full race data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('races')
    .upsert(races, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating races:', error);
  } else {
    console.log(`✅ Migrated ${result.length} races`);
  }
}

async function migrateBackgrounds() {
  console.log('📚 Migrating backgrounds...');
  
  const filePath = path.join(DATA_DIR, 'backgrounds.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const backgrounds = data.results.map(bg => ({
    name: bg.name,
    slug: bg.slug,
    data: bg // Store full background data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('backgrounds')
    .upsert(backgrounds, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating backgrounds:', error);
  } else {
    console.log(`✅ Migrated ${result.length} backgrounds`);
  }
}

async function migrateFeats() {
  console.log('💪 Migrating feats...');
  
  const filePath = path.join(DATA_DIR, 'feats.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const feats = data.results.map(feat => ({
    name: feat.name,
    slug: feat.slug,
    data: feat // Store full feat data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('feats')
    .upsert(feats, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating feats:', error);
  } else {
    console.log(`✅ Migrated ${result.length} feats`);
  }
}

async function migrateWeapons() {
  console.log('🗡️ Migrating weapons...');
  
  const filePath = path.join(DATA_DIR, 'weapons.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const weapons = data.results.map(weapon => ({
    name: weapon.name,
    slug: weapon.slug,
    category: weapon.category,
    damage_dice: weapon.damage_dice,
    damage_type: weapon.damage_type,
    data: weapon // Store full weapon data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('weapons')
    .upsert(weapons, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating weapons:', error);
  } else {
    console.log(`✅ Migrated ${result.length} weapons`);
  }
}

async function migrateArmor() {
  console.log('🛡️ Migrating armor...');
  
  const filePath = path.join(DATA_DIR, 'armor.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const armor = data.results.map(item => ({
    name: item.name,
    slug: item.key,
    category: item.category,
    ac_base: item.ac_base,
    ac_add_dexmod: item.ac_add_dexmod,
    ac_cap_dexmod: item.ac_cap_dexmod,
    data: item // Store full armor data in JSONB
  }));

  const { data: result, error } = await supabase
    .from('armor')
    .upsert(armor, { onConflict: 'slug' });

  if (error) {
    console.error('Error migrating armor:', error);
  } else {
    console.log(`✅ Migrated ${result.length} armor items`);
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Open5e data migration...');
  console.log(`📁 Data directory: ${DATA_DIR}`);
  
  try {
    await migrateMonsters();
    await migrateSpells();
    await migrateMagicItems();
    await migrateClasses();
    await migrateRaces();
    await migrateBackgrounds();
    await migrateFeats();
    await migrateWeapons();
    await migrateArmor();
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
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
  migrateMagicItems,
  migrateClasses,
  migrateRaces,
  migrateBackgrounds,
  migrateFeats,
  migrateWeapons,
  migrateArmor
}; 