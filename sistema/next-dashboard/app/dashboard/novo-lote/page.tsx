'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createLot } from '../actions';

export default function NovoLotePage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createLot(formData);
    // Em caso de sucesso, createLot já redireciona (via redirect()) e este
    // código não continua. Só chegamos aqui se houver erro de validação.
    if (result?.error) {
      setError(result.error);
    }
    setSubmitting(false);
  }

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-2xl py-5 sm:py-8">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        Operação / Conformidade ambiental
      </p>
      <h1 className="mb-1 text-[22px] font-extrabold tracking-tight text-navy-950">Cadastrar novo lote</h1>
      <p className="mb-6 text-xs text-slate-500">
        Registre um novo lote de resíduo, sua destinação e o prazo legal para regularização. O código do lote é
        gerado automaticamente e o status de risco é calculado a partir do prazo informado.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-panel">
        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Classe do resíduo *
          <input name="waste_class" required placeholder="Ex: Classe I — perigoso" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
        </label>

        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Unidade geradora *
          <input name="generator" required placeholder="Ex: Planta Industrial Norte" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
        </label>

        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Número do MTR (Manifesto de Transporte de Resíduos) *
          <input name="manifest" required placeholder="Ex: MTR-2026-00500" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-navy-900">
            Peso (toneladas) *
            <input name="weight_ton" required type="text" inputMode="decimal" placeholder="Ex: 12,5" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-navy-900">
            Prazo legal de destinação *
            <input name="deadline_date" required type="date" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
          </label>
        </div>

        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Destinação *
          <input name="destination" required placeholder="Ex: Aterro licenciado, Reciclagem, Tratamento térmico" className="focus-ring h-10 rounded border border-slate-300 px-3 text-sm font-normal text-slate-800" />
        </label>

        <label className="grid gap-1 text-xs font-semibold text-navy-900">
          Observações
          <textarea name="notes" rows={3} className="focus-ring rounded border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" />
        </label>

        {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring h-10 rounded bg-navy-950 px-4 text-xs font-semibold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? 'Salvando…' : 'Cadastrar lote'}
          </button>
          <Link href="/dashboard" className="focus-ring text-xs font-semibold text-slate-600 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
