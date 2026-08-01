const SUPABASE_URL = 'https://kkhkxjvipamajvawxzpc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraGt4anZpcGFtYWp2YXd4enBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1Nzk1MzYsImV4cCI6MjEwMTE1NTUzNn0.qkjt566Hryq62FJOGxZxKt-VoYgJaYx1yedIJAG4-l0';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
