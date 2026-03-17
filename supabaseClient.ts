import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';

export const supabase = new Proxy({}, {
    get(target, prop) {
        // Dynamically resolve the correct client based on the environment
        if (typeof window !== 'undefined') {
            return (createClient() as any)[prop];
        } else {
            return (createServerClient() as any)[prop];
        }
    }
}) as any;
