// Using built-in fetch (Node.js 18+)

async function testSpecialTraitsAPI() {
  try {
    console.log('🧪 Testing Special Traits API...\n');
    
    // Test the random monster endpoint
    const response = await fetch('http://localhost:3001/api/monsters');
    const monster = await response.json();
    
    console.log('Monster:', monster.name);
    console.log('Special Traits Count:', monster.special_traits ? monster.special_traits.length : 0);
    
    if (monster.special_traits && monster.special_traits.length > 0) {
      console.log('\n📝 Special Traits:');
      monster.special_traits.forEach((trait, index) => {
        console.log(`  ${index + 1}. ${trait.name}: ${trait.description.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ No special traits found for this monster');
    }
    
    console.log('\n✅ API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testSpecialTraitsAPI(); 