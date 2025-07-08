const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get random spell (when no parameters) or filtered spells (when parameters provided)
router.get('/', async (req, res) => {
  try {
    const { page, limit, search, level, school } = req.query;
    
    // If no parameters provided, return a random spell
    if (!page && !limit && !search && !level && !school) {
      const supabase = db.getClient();
      
      if (!db.isSupabase()) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('spells')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      if (!count || count === 0) {
        return res.status(404).json({ error: 'No spells found' });
      }
      
      // Generate random offset
      const randomOffset = Math.floor(Math.random() * count);
      
      // Get random spell
      const { data, error } = await supabase
        .from('spells')
        .select('*')
        .range(randomOffset, randomOffset);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Spell not found' });
      }
      
      const spell = data[0];
      
      // Merge structured columns with JSONB data
      const fullData = { ...spell.data };
      
      // Fix "False" description values
      if (fullData.desc === 'False' || fullData.desc === false) {
        delete fullData.desc;
      }
      
      // Override with structured columns (these take precedence)
      Object.assign(fullData, {
        id: spell.id,
        name: spell.name,
        slug: spell.slug,
        level: spell.level,
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
        created_at: spell.created_at,
        updated_at: spell.updated_at
      });
      
      return res.json(fullData);
    }
    
    // Otherwise, handle pagination and filtering
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
      .from('spells')
      .select('*', { count: 'exact' });
    
    // Add filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (level) {
      query = query.eq('level', parseInt(level));
    }
    if (school) {
      query = query.eq('school', school);
    }
    
    // Add pagination and ordering
    query = query
      .order('name')
      .range(offset, offset + parseInt(limitNum) - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Merge structured columns with JSONB data
    const mergedData = data.map(spell => {
      const fullData = { ...spell.data };
      
      // Fix "False" description values
      if (fullData.desc === 'False' || fullData.desc === false) {
        delete fullData.desc;
      }
      
      // Override with structured columns (these take precedence)
      Object.assign(fullData, {
        id: spell.id,
        name: spell.name,
        slug: spell.slug,
        level: spell.level,
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
        created_at: spell.created_at,
        updated_at: spell.updated_at
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
    console.error('Error fetching spells:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

// Search spells by name
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    const { data, error } = await supabase
      .from('spells')
      .select('id, name, slug, level, school, casting_time')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error searching spells:', error);
    res.status(500).json({ error: 'Failed to search spells' });
  }
});

// GET /api/spells/slug/:slug - Get a specific spell by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Spell not found' });
      }
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    // Merge structured columns with JSONB data
    const fullData = { ...data.data };
    
    // Fix "False" description values
    if (fullData.desc === 'False' || fullData.desc === false) {
      delete fullData.desc;
    }
    
    // Override with structured columns (these take precedence)
    Object.assign(fullData, {
      id: data.id,
      name: data.name,
      slug: data.slug,
      level: data.level,
      school: data.school,
      casting_time: data.casting_time,
      range: data.range,
      duration: data.duration,
      concentration: data.concentration,
      ritual: data.ritual,
      components: data.components,
      material: data.material,
      desc: data.desc,
      higher_level: data.higher_level,
      created_at: data.created_at,
      updated_at: data.updated_at
    });

    res.json(fullData);

  } catch (error) {
    console.error('Error fetching spell by slug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/spells/:id - Get a specific spell by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }
    
    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Spell not found' });
      }
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    // Merge structured columns with JSONB data
    const fullData = { ...data.data };
    
    // Fix "False" description values
    if (fullData.desc === 'False' || fullData.desc === false) {
      delete fullData.desc;
    }
    
    // Override with structured columns (these take precedence)
    Object.assign(fullData, {
      id: data.id,
      name: data.name,
      slug: data.slug,
      level: data.level,
      school: data.school,
      casting_time: data.casting_time,
      range: data.range,
      duration: data.duration,
      concentration: data.concentration,
      ritual: data.ritual,
      components: data.components,
      material: data.material,
      desc: data.desc,
      higher_level: data.higher_level,
      created_at: data.created_at,
      updated_at: data.updated_at
    });

    res.json(fullData);

  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 