import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { LotWithRisk } from '@/lib/supabase/types';
import DashboardActions from './dashboard-actions';
import { signOut } from './actions';

const riskBadgeClass = {
  overdue: 'border-red-200 bg-red-50 text-red-700',
  'due-soon': 'border-amber-200 bg-amber-50 text-amber-700',
  regular: 'border-green-200 bg-green-50 text-green-700',
} as const;

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatWeight(weightTon: number) {
  return `${weightTon.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 })} t`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; created?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const from = searchParams.from;
  const to = searchParams.to;

  let query = supabase
    .from('lots_with_risk')
    .select('*')
    .order('updated_at', { ascending: false });

  if (from) query = query.gte('updated_at', `${from}T00:00:00`);
  if (to) query = query.lte('updated_at', `${to}T23:59:59`);

  const { data: lots } = await query.limit(50);
  const lotsList = (lots ?? []) as LotWithRisk[];

  // Totais do período monitorado (sem paginação) para os cards de resumo.
  const { count: totalCount } = await supabase
    .from('lots')
    .select('*', { count: 'exact', head: true });

  const { count: overdueCount } = await supabase
    .from('lots_with_risk')
    .select('*', { count: 'exact', head: true })
    .eq('risk_status', 'overdue');

  const { count: dueSoonCount } = await supabase
    .from('lots_with_risk')
    .select('*', { count: 'exact', head: true })
    .eq('risk_status', 'due-soon');

  const { count: regularCount } = await supabase
    .from('lots_with_risk')
    .select('*', { count: 'exact', head: true })
    .eq('risk_status', 'regular');

  const total = totalCount ?? 0;
  const regularizedPct = total > 0 ? (((regularCount ?? 0) / total) * 100).toFixed(1) : '0.0';
  const inProgress = (overdueCount ?? 0) + (dueSoonCount ?? 0);

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[1440px] py-5 sm:py-8" aria-labelledby="dashboard-title">
      <header className="mb-5 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Operação / Conformidade ambiental
          </p>
          <h1 id="dashboard-title" className="text-[22px] font-extrabold tracking-tight text-navy-950">
            Dashboard de conformidade
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Visão consolidada</span>
            <span aria-hidden="true">•</span>
            <span>{user?.email}</span>
            <span aria-hidden="true">•</span>
            <form action={signOut}>
              <button type="submit" className="focus-ring rounded font-semibold text-blue-600 hover:underline">
                Sair
              </button>
            </form>
          </p>
        </div>
        <DashboardActions defaultFrom={from} defaultTo={to} />
      </header>

      {searchParams.created && (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-semibold text-green-700">
          Lote cadastrado com sucesso.
        </p>
      )}

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Resumo executivo de conformidade">
        <article className="relative grid min-h-[140px] gap-2 overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-panel before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-red-600">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">Pendências críticas</span>
            <span className="whitespace-nowrap text-[11px] text-slate-400">Agora</span>
          </div>
          <p className="text-[32px] font-extrabold leading-none tracking-tight text-red-700">{overdueCount ?? 0}</p>
          <footer className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>lotes com prazo vencido</span>
          </footer>
        </article>
        <article className="relative grid min-h-[140px] gap-2 overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-panel before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-amber-500">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">Em andamento</span>
            <span className="whitespace-nowrap text-[11px] text-slate-400">Agora</span>
          </div>
          <p className="text-[32px] font-extrabold leading-none tracking-tight text-amber-700">{inProgress}</p>
          <footer className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-bold text-amber-700">{dueSoonCount ?? 0} vencem em até 7 dias</span>
          </footer>
        </article>
        <article className="relative grid min-h-[140px] gap-2 overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-panel before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-green-600">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">Regularizados</span>
            <span className="whitespace-nowrap text-[11px] text-slate-400">Agora</span>
          </div>
          <p className="text-[32px] font-extrabold leading-none tracking-tight text-green-700">{regularCount ?? 0}</p>
          <footer className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-bold text-green-700">{regularizedPct}%</span>
            <span>do total monitorado</span>
          </footer>
        </article>
      </section>

      <nav className="mb-4 grid grid-cols-1 gap-2.5 rounded-md border border-slate-200 bg-white p-3 shadow-panel md:grid-cols-3" aria-label="Ações rápidas de conformidade">
        <Link href="/dashboard/novo-lote" className="focus-ring flex min-h-11 items-center gap-2.5 rounded border border-transparent bg-slate-50 px-2.5 py-2 text-left transition hover:border-slate-300 hover:bg-white">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-white text-sm text-navy-700" aria-hidden="true">＋</span>
          <span className="grid gap-0.5">
            <span className="text-xs font-bold text-navy-900">Cadastrar novo lote</span>
            <span className="text-[11px] text-slate-500">Registrar resíduo e destinação</span>
          </span>
        </Link>
        <Link href="/dashboard/pendencias" className="focus-ring flex min-h-11 items-center gap-2.5 rounded border border-transparent bg-slate-50 px-2.5 py-2 text-left transition hover:border-slate-300 hover:bg-white">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-white text-sm font-bold text-red-700" aria-hidden="true">!</span>
          <span className="grid gap-0.5">
            <span className="text-xs font-bold text-navy-900">Revisar pendências críticas</span>
            <span className="text-[11px] text-slate-500">{overdueCount ?? 0} itens requerem atenção</span>
          </span>
        </Link>
        <Link href="/dashboard/documentos" className="focus-ring flex min-h-11 items-center gap-2.5 rounded border border-transparent bg-slate-50 px-2.5 py-2 text-left transition hover:border-slate-300 hover:bg-white">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-white text-sm text-navy-700" aria-hidden="true">▤</span>
          <span className="grid gap-0.5">
            <span className="text-xs font-bold text-navy-900">Consultar documentos</span>
            <span className="text-[11px] text-slate-500">Licenças e comprovantes ambientais</span>
          </span>
        </Link>
      </nav>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel" aria-labelledby="recent-lots-title">
        <header className="flex min-h-[52px] items-center justify-between gap-4 border-b border-slate-200 px-3.5 py-2.5">
          <div className="flex items-baseline gap-2.5">
            <h2 id="recent-lots-title" className="text-[15px] font-bold text-navy-950">Lotes recentes</h2>
            <span className="text-[11px] tabular-nums text-slate-500">
              {from || to ? `${from ? formatDate(from) : '…'} – ${to ? formatDate(to) : '…'}` : 'Últimas atualizações'}
            </span>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] table-fixed border-collapse text-left text-[13px]">
            <caption className="sr-only-custom">Lotes recentes com situação de conformidade e destinação</caption>
            <colgroup><col className="w-[18%]" /><col className="w-[22%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[19%]" /><col className="w-[12%]" /></colgroup>
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500"><tr>
              {['Lote', 'Unidade geradora', 'Peso', 'Destinação', 'Status de risco', 'Atualizado'].map((heading) => <th key={heading} scope="col" className="h-9 border-b border-slate-200 px-3 py-2">{heading}</th>)}
            </tr></thead>
            <tbody className="text-slate-800">
              {lotsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Nenhum lote encontrado para este período.
                  </td>
                </tr>
              )}
              {lotsList.map((lot, index) => (
                <tr key={lot.id} data-risk={lot.risk_status} className={`${index < lotsList.length - 1 ? 'border-b border-slate-200' : ''} risk-row-${lot.risk_status} group hover:bg-slate-50`}>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-semibold text-blue-600">{lot.code}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">{lot.waste_class}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="block truncate font-semibold text-navy-950">{lot.generator}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">{lot.manifest}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums">{formatWeight(lot.weight_ton)}</td>
                  <td className="px-3 py-2.5 align-middle">{lot.destination}</td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-semibold ${riskBadgeClass[lot.risk_status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {lot.risk_label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums">{new Date(lot.updated_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-200 px-3.5 py-2.5 text-[11px] text-slate-500">
          Exibindo {lotsList.length} de {total} lotes monitorados.
        </footer>
      </section>
    </main>
  );
}
