import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rnxzsuajaajhbbcnfsnb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xhLuK63whpU77_UUjuBE7A_6EAojOi9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
