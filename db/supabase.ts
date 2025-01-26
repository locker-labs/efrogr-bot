import {createClient} from "@supabase/supabase-js";

// Create a single db client for interacting with your database
if(!process.env.SUPABASE_URL) {
    console.error('Missing env SUPABASE_URL');
    process.exit(1);
}

if(!process.env.SUPABASE_SERVICE_ROLE) {
    console.error('Missing env SUPABASE_SERVICE_ROLE');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
);

export default supabase;