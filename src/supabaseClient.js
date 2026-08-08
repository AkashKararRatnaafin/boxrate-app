import { createClient } from "@supabase/supabase-js";

// This is the public "anon" key — safe to ship in the app.
// It only grants what the database's row-level security policies allow.
const SUPABASE_URL = "https://rwevapgaxcdmrcikivet.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZXZhcGdheGNkbXJjaWtpdmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQwNTIsImV4cCI6MjEwMTc3MDA1Mn0.fLtyKUMZ9YNNa9cqlHj1m6BHr_aqM4S9VjU6tmFFBFw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
