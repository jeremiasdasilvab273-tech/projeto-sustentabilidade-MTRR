import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { LotWithRisk } from '@/lib/supabase/types';
import RegularizeButton from './regularize-button';

export default async function PendenciasPage() {
  const supabase = createClient();

  const { data: lots } = await supabase
    .from('lots_with_risk')
    .select('*')
    .in('risk_status', ['overdue', 'due-soon'])
    .order('deadline_date', { ascending: true });

  const lotsList = (lots ?? []) as LotWithRisk[];

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[1100px] py-5 sm:py-8">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        Operação / Conformidade ambiental
      </p>
      <h1 className="mb-1 text-[22px] font-extrabold tracking-tight text-navy-950">Pendências críticas</h1>
      <p className="mb-6 text-xs text-slate-500">
        Lotes com prazo legal vencido ou vencendo nos próximos 7 dias. Regularize assim que a destinação final for
        confirmada.
      </p>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-[13px]">
            <colgroup><col className="w-[16%]" /><col className="w-[22%]" /><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[14%]" /></colgroup>
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                {['Lote', 'Unidade geradora', 'Prazo', 'Status', 'Destinação', ''].map((heading) => (
                  <th key={heading} scope="col" className="h-9 border-b border-slate-200 px-3 py-2">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {lotsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Nenhuma pendência crítica no momento. 🎉
                  </td>
                </tr>
              )}
              {lotsList.map((lot, index) => (
                <tr key={lot.id} className={index < lotsList.length - 1 ? 'border-b border-slate-200' : ''}>
                  <td className="px-3 py-2.5 align-middle font-semibold text-blue-600">{lot.code}</td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="block truncate font-semibold text-navy-950">{lot.generator}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">{lot.manifest}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums">
                    {new Date(`${lot.deadline_date}T00:00:00`).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span
                      className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-semibold ${
                        lot.risk_status === 'overdue'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {lot.risk_label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">{lot.destination}</td>
                  <td className="px-3 py-2.5 align-middle">
                    <RegularizeButton lotId={lot.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4">
        <Link href="/dashboard" className="focus-ring text-xs font-semibold text-blue-600 hover:underline">
          ← Voltar ao dashboard
        </Link>
      </p>
    </main>
  );
}
