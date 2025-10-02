import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzaezpexrtwwpntclonu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6YWV6cGV4cnR3d3BudGNsb251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODM0NjMsImV4cCI6MjA3NDQ1OTQ2M30.87cHSZJR2XQZERuzCcNCnm56WNKOmjfaklF07NY0-tw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);