import { createClient } from '@supabase/supabase-js';

// We use the URL and API key provided by the user
const supabaseUrl = 'https://jedcblwqhiakgqpvsdlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_3w2jT3QlRmbyi2xxJX1BAA_bU50Iljc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
