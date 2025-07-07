# TODO List - Tomorrow

## 🎨 Monster Type Icons
- [ ] Run the `create-monster-types-table.sql` in Supabase SQL Editor
- [ ] Get the list of distinct monster types from the database
- [ ] Create/design icons for each monster type (2"x2" format)
- [ ] Create a Node.js script to upload icons to the `monster_types` table
- [ ] Test icon upload functionality

## 🖼️ Monster Visual Descriptions
- [ ] Generate visual descriptions for more monsters (continue from where we left off)
- [ ] Review the quality of generated descriptions for icon suitability
- [ ] Adjust prompt if needed for better icon-focused descriptions
- [ ] Consider creating a batch script to process all remaining monsters

## 🔧 Technical Improvements
- [ ] Add visual description display to the frontend MonsterViewer
- [ ] Create a way to regenerate visual descriptions for specific monsters
- [ ] Add quality control/validation for generated descriptions
- [ ] Consider caching generated descriptions to avoid regeneration

## 🎯 Image Generation Integration
- [ ] Research and choose an image generation service (Midjourney, DALL-E, etc.)
- [ ] Create API endpoints for image generation
- [ ] Integrate visual descriptions with image generation service
- [ ] Add image storage and retrieval functionality

## 📊 Database & Performance
- [ ] Add indexes for better query performance on visual descriptions
- [ ] Consider adding a `has_visual_description` boolean field for faster filtering
- [ ] Add validation to ensure visual descriptions meet quality standards

## 🎮 Frontend Enhancements
- [ ] Display monster type icons in the UI
- [ ] Add visual description section to monster details
- [ ] Create icon/visual description management interface
- [ ] Add loading states for image generation

## 🧪 Testing & Quality Assurance
- [ ] Test visual description generation with various monster types
- [ ] Validate that generated descriptions work well for icon creation
- [ ] Test icon upload and retrieval functionality
- [ ] Ensure proper error handling throughout the system

## 📝 Documentation
- [ ] Document the visual description generation process
- [ ] Create guidelines for icon creation and upload
- [ ] Update README with new features
- [ ] Document API endpoints for image/icon management

## 🚀 Future Considerations
- [ ] Plan for individual monster image generation (not just types)
- [ ] Consider user-uploaded custom icons
- [ ] Plan for different icon sizes/styles
- [ ] Consider integration with D&D Beyond or other monster databases

---

## Notes from Today's Progress:
- ✅ Successfully created visual description generation system
- ✅ Updated prompts for 2"x2" icon format
- ✅ Generated descriptions for 10+ monsters
- ✅ Fixed Git security issue with API keys
- ✅ Created monster_types table structure
- ✅ Optimized prompts for small icon format

## Priority Order:
1. **High Priority**: Monster type icons and upload system
2. **Medium Priority**: Continue visual description generation
3. **Low Priority**: Frontend integration and image generation 