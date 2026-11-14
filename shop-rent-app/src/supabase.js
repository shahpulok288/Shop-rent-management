import { createClient } from 'https://deyhbywksakvkiqlqhvb.supabase.co/rest/v1/';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);