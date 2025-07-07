require('dotenv').config();

console.log('🔍 Environment Variables Test:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');

if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL preview:', process.env.SUPABASE_URL.substring(0, 50) + '...');
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_SERVICE_ROLE_KEY preview:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
} 