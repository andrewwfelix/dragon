const path = require('path');

// Simple environment variable loading
const fs = require('fs');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Simple HTTP client for Supabase
const https = require('https');

function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ data: body, error: null });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Improved parser that better handles trait boundaries
 */
function parseSpecialTraitsImproved(desc) {
  if (!desc) return [];
  
  const traits = [];
  
  // Split the description by ** markers
  const parts = desc.split(/\*\*/);
  
  // Look for trait patterns: part[i] = trait name, part[i+1] = description
  for (let i = 1; i < parts.length - 1; i += 2) {
    const traitName = parts[i].trim();
    let traitDesc = parts[i + 1].trim();
    
    // Extract trait name (remove the trailing period)
    const nameMatch = traitName.match(/^([^.]+)\./);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      
      // Clean up the description - remove common endings that aren't part of traits
      traitDesc = cleanTraitDescription(traitDesc);
      
      traits.push({
        name: name,
        description: traitDesc
      });
    }
  }
  
  return traits;
}

/**
 * Clean up trait descriptions to remove license text and other non-trait content
 */
function cleanTraitDescription(desc) {
  if (!desc) return '';
  
  let cleaned = desc;
  
  // Remove leading underscores and spaces
  cleaned = cleaned.replace(/^_+\s*/, '');
  
  // Remove trailing underscores and spaces
  cleaned = cleaned.replace(/\s*_+$/, '');
  
  // Remove common license and non-trait endings
  const endingsToRemove = [
    /Open Game License.*$/i,
    /This work.*$/i,
    /Permission.*$/i,
    /Copyright.*$/i,
    /All rights reserved.*$/i,
    /\.\.\..*$/, // Remove trailing ellipsis and anything after
    /\s+$/, // Remove trailing whitespace
  ];
  
  for (const ending of endingsToRemove) {
    cleaned = cleaned.replace(ending, '');
  }
  
  // If the description is very short after cleaning, it might not be a real trait
  if (cleaned.length < 10) {
    return '';
  }
  
  return cleaned.trim();
}

/**
 * Remove special traits from the main description text
 */
function removeTraitsFromDescription(desc) {
  if (!desc) return desc;
  
  // Split by ** markers to find trait sections
  const parts = desc.split(/\*\*/);
  
  // If we don't have trait markers, return the original description
  if (parts.length < 3) return desc;
  
  // Reconstruct the description without trait sections
  let cleanedDesc = '';
  
  for (let i = 0; i < parts.length; i++) {
    // Even indices (0, 2, 4...) are regular description text
    // Odd indices (1, 3, 5...) are trait names
    if (i % 2 === 0) {
      // This is regular description text
      cleanedDesc += parts[i];
    }
    // Skip odd indices (trait names) and the text after them (trait descriptions)
  }
  
  // Clean up the result
  cleanedDesc = cleanedDesc
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s+\./g, '.') // Remove spaces before periods
    .replace(/\s+,/g, ',') // Remove spaces before commas
    .replace(/^_+\s*/, '') // Remove leading underscores
    .trim();
  
  return cleanedDesc;
}

/**
 * Find and fix monsters with problematic trait descriptions
 */
async function findAndFixProblematicTraits() {
  console.log('🔍 Finding and fixing monsters with problematic trait descriptions...\n');
  
  try {
    // Get monsters with special traits that might have issues
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data,special_traits&special_traits=neq.[]');
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} monsters with special traits to check`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      try {
        const traits = monster.special_traits || [];
        let needsUpdate = false;
        const cleanedTraits = [];
        
        for (const trait of traits) {
          const originalDesc = trait.description || '';
          const cleanedDesc = cleanTraitDescription(originalDesc);
          
          if (cleanedDesc !== originalDesc) {
            console.log(`  📝 ${monster.name} - "${trait.name}":`);
            console.log(`    Before: "${originalDesc.substring(0, 100)}..."`);
            console.log(`    After:  "${cleanedDesc.substring(0, 100)}..."`);
            needsUpdate = true;
          }
          
          // Only keep traits with meaningful descriptions
          if (cleanedDesc.length > 10) {
            cleanedTraits.push({
              name: trait.name,
              description: cleanedDesc
            });
          }
        }
        
        // Also clean up the main description
        const originalData = monster.data || {};
        const originalDesc = originalData.desc || '';
        const cleanedDesc = removeTraitsFromDescription(originalDesc);
        
        if (cleanedDesc !== originalDesc) {
          console.log(`  📝 ${monster.name} - Main description cleaned`);
          console.log(`    Before: "${originalDesc.substring(0, 100)}..."`);
          console.log(`    After:  "${cleanedDesc.substring(0, 100)}..."`);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          // Update the monster with cleaned traits and description
          const updateData = {
            special_traits: cleanedTraits
          };
          
          // Only update the data.desc if it actually changed
          if (cleanedDesc !== originalDesc) {
            updateData.data = {
              ...originalData,
              desc: cleanedDesc
            };
          }
          
          const updateResult = await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, 'PATCH', updateData);
          
          if (updateResult.error) {
            console.error(`    ❌ Error updating ${monster.name}:`, updateResult.error);
            errorCount++;
          } else {
            console.log(`    ✅ Updated ${monster.name}`);
            fixedCount++;
          }
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Fix completed!`);
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in fix process:', error);
    throw error;
  }
}

/**
 * Show examples of problematic traits
 */
async function showProblematicExamples() {
  console.log('📝 Showing examples of problematic trait descriptions...\n');
  
  try {
    // Get a sample of monsters with special traits
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data,special_traits&special_traits=neq.[]&limit=5');
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    
    for (const monster of monsters) {
      console.log(`📝 ${monster.name}:`);
      
      // Show original description
      const originalDesc = monster.data?.desc || '';
      console.log(`   Original description: "${originalDesc.substring(0, 150)}..."`);
      
      // Show cleaned description
      const cleanedDesc = removeTraitsFromDescription(originalDesc);
      console.log(`   Cleaned description:  "${cleanedDesc.substring(0, 150)}..."`);
      
      // Show traits
      const traits = monster.special_traits || [];
      for (const trait of traits) {
        const desc = trait.description || '';
        console.log(`   Trait "${trait.name}": "${desc.substring(0, 100)}..."`);
        console.log(`   Cleaned: "${cleanTraitDescription(desc).substring(0, 100)}..."`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error showing examples:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'fix':
      await findAndFixProblematicTraits();
      break;
      
    case 'examples':
      await showProblematicExamples();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node fix-trait-parser.js fix');
      console.log('  node fix-trait-parser.js examples');
      console.log('');
      console.log('Examples:');
      console.log('  node fix-trait-parser.js examples');
      console.log('  node fix-trait-parser.js fix');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
} 