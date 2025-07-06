const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/spells - Get all spells with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      level, 
      school, 
      sort = 'name', 
      order = 'asc',
      fields 
    } = req.query;

    const supabase = db.getClient();
    
    if (!db.isSupabase()) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }

    // Build the base query
    let query = supabase
      .from('spells')
      .select('*', { count: 'exact' });

    // Add search filter
    if (search) {
      // Log for debugging
      console.log('Spells search:', search);
      query = query.ilike('name', `%${search}%`);
    }

    // Add level filter
    if (level) {
      query = query.eq('level', parseInt(level));
    }

    // Add school filter
    if (school) {
      query = query.eq('school', school);
    }

    // Add sorting
    const validSortFields = ['name', 'level', 'school', 'casting_time'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json({
      spells: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching spells:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    res.json(data);

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
      // Log error for debugging
      console.error('Spell by ID error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 