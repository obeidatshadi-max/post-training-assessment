const SUPABASE_URL = 'https://pvlhzfztablgxsjlxpyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bGh6Znp0YWJsZ3hzamx4cHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTU3MjYsImV4cCI6MjA5NzE3MTcyNn0.XopP_dBKePNlhprJN4geONtoPeN6_OEIkHW2Vj5vdpI';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
