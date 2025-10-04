import { supabase } from './supabaseClient';

export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');

    // Test 1: Check if Supabase client is initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return false;
    }
    console.log('✅ Supabase client initialized');

    // Test 2: Test basic query (check if payment_modes table exists and has data)
    const { data: paymentModes, error: paymentError } = await supabase
      .from('payment_modes')
      .select('*')
      .limit(1);

    if (paymentError) {
      console.error('❌ Error querying payment_modes:', paymentError.message);
      console.error('⚠️  Make sure you have run the supabase-schema.sql file in your Supabase SQL Editor');
      return false;
    }

    console.log('✅ Successfully queried payment_modes table');
    if (paymentModes && paymentModes.length > 0) {
      console.log('✅ Payment modes data found:', paymentModes[0]);
    }

    // Test 3: Check tickets table
    const { error: ticketsError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    if (ticketsError) {
      console.error('❌ Error accessing tickets table:', ticketsError.message);
      return false;
    }
    console.log('✅ Tickets table accessible');

    // Test 4: Check profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError.message);
      return false;
    }
    console.log('✅ Profiles table accessible');

    console.log('🎉 All Supabase connection tests passed!');
    console.log('📝 Note: If you see RLS policy errors, create a user and profile first.');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during Supabase connection test:', error);
    return false;
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  testSupabaseConnection();
}
