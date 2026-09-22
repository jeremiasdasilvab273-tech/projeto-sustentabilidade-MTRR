import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Lê/escreve o cookie de sessão do Supabase Auth via next/headers.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // chamado a partir de um Server Component sem permissão de escrita;
            // o middleware cuida de manter a sessão atualizada nesse caso.
          }
        },
      },
    }
  );
}
