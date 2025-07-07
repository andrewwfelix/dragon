const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get random monster (when no parameters) or filtered monsters (when parameters provided)
router.get('/', async (req, res) => {
  try {
    const { page, limit, search, type, cr_min, cr_max } = req.query;
    
    // If no parameters provided, return a random monster
    if (!page && !limit && !search && !type && !cr_min && !cr_max) {
      const supabase = db.getClient();
      
      if (!db.isSupabase()) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      if (!count || count === 0) {
        return res.status(404).json({ error: 'No monsters found' });
      }
      
      // Generate random offset
      const randomOffset = Math.floor(Math.random() * count);
      
      // Get random monster
      const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .range(randomOffset, randomOffset);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Monster not found' });
      }
      
      const monster = data[0];
      
      // Merge structured columns with JSONB data
      const fullData = { ...monster.data };
      
      // Fix "False" description values
      if (fullData.desc === 'False' || fullData.desc === false) {
        delete fullData.desc;
      }
      
      // Override with structured columns (these take precedence)
      Object.assign(fullData, {
        id: monster.id,
        name: monster.name,
        slug: monster.slug,
        size: monster.size,
        type: monster.type,
        subtype: monster.subtype,
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
        special_traits: monster.special_traits || [],
        created_at: monster.created_at,
        updated_at: monster.updated_at
      });
      
      return res.json(fullData);
    }
    
    // Otherwise, handle pagination and filtering (existing logic)
    const pageNum = page || 1;
    const limitNum = limit || 20;
    const offset = (pageNum - 1) * limitNum;
    
    // Get Supabase client
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    // Build query
    let query = supabase
      .from('monsters')
      .select('*', { count: 'exact' });
    
    // Add filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (cr_min) {
      query = query.gte('challenge_rating', cr_min);
    }
    if (cr_max) {
      query = query.lte('challenge_rating', cr_max);
    }
    
    // Add pagination and ordering
    query = query
      .order('name')
      .range(offset, offset + parseInt(limitNum) - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Merge structured columns with JSONB data
    const mergedData = data.map(monster => {
      const fullData = { ...monster.data };
      
      // Fix "False" description values
      if (fullData.desc === 'False' || fullData.desc === false) {
        delete fullData.desc;
      }
      
      // Override with structured columns (these take precedence)
      Object.assign(fullData, {
        id: monster.id,
        name: monster.name,
        slug: monster.slug,
        size: monster.size,
        type: monster.type,
        subtype: monster.subtype,
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
        special_traits: monster.special_traits || [],
        created_at: monster.created_at,
        updated_at: monster.updated_at
      });
      return fullData;
    });
    
    res.json({
      data: mergedData,
      pagination: {
        page: parseInt(pageNum),
        limit: parseInt(limitNum),
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching monsters:', error);
    res.status(500).json({ error: 'Failed to fetch monsters' });
  }
});

// Search monsters by name
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    const { data, error } = await supabase
      .from('monsters')
      .select('id, name, slug, type, challenge_rating, size')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error searching monsters:', error);
    res.status(500).json({ error: 'Failed to search monsters' });
  }
});

// Get monster by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    const { data, error } = await supabase
      .from('monsters')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Monster not found' });
      }
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Monster not found' });
    }
    
    // Merge structured columns with JSONB data
    const fullData = { ...data.data };
    // Override with structured columns (these take precedence)
    Object.assign(fullData, {
      id: data.id,
      name: data.name,
      slug: data.slug,
      size: data.size,
      type: data.type,
      subtype: data.subtype,
      alignment: data.alignment,
      challenge_rating: data.challenge_rating,
      armor_class: data.armor_class,
      armor_desc: data.armor_desc,
      hit_points: data.hit_points,
      hit_dice: data.hit_dice,
      speed: data.speed,
      strength: data.strength,
      dexterity: data.dexterity,
      constitution: data.constitution,
      intelligence: data.intelligence,
      wisdom: data.wisdom,
      charisma: data.charisma,
      special_traits: data.special_traits || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    });
    
    res.json(fullData);
  } catch (error) {
    console.error('Error fetching monster:', error);
    res.status(500).json({ error: 'Failed to fetch monster' });
  }
});

module.exports = router; 