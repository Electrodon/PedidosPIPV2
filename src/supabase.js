import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ypkzubnfcaddpujmboki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa3p1Ym5mY2FkZHB1am1ib2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTczMzcsImV4cCI6MjA4NzM5MzMzN30._PcJZkWmvvgQeM9m6hLUIRZcGRFiPvadEJb9YkahCbU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
