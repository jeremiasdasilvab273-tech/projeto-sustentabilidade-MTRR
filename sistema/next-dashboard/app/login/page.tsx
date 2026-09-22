'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      return;
    }

    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        Operação / Conformidade ambiental
      </p>
      <h1 className="mb-6 text-[22px] font-extrabold tracking-tight text-navy-950">Entrar no sistema</h1>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800"
          />
        </label>

        {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring mt-2 h-10 rounded bg-navy-950 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-[11px] text-slate-500">
        Não tem uma conta? Peça ao administrador do sistema para criar seu acesso no painel do Supabase
        (Authentication → Users → Add user).
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[calc(100%-2rem)] max-w-sm flex-col justify-center py-8">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
