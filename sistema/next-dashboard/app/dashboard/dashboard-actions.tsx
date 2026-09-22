'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardActions({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(defaultFrom ?? '2026-09-01');
  const [endDate, setEndDate] = useState(defaultTo ?? '2026-09-21');

  async function handleExport(format: 'csv' | 'pdf') {
    setExportOpen(false);
    setExporting(true);
    setStatus('Preparando relatório de conformidade.');

    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.set('from', startDate);
      if (endDate) params.set('to', endDate);

      const response = await fetch(`/api/reports/compliance?${params.toString()}`);
      if (!response.ok) throw new Error('Falha ao gerar relatório.');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-conformidade.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus('Relatório de conformidade pronto para download.');
    } catch {
      setStatus('Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  function handleApplyFilter() {
    setFilterOpen(false);
    setStatus(`Filtro aplicado de ${startDate} até ${endDate}.`);
    const params = new URLSearchParams({ from: startDate, to: endDate });
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button
          type="button"
          aria-expanded={filterOpen}
          aria-controls="filter-panel"
          onClick={() => {
            setFilterOpen((current) => !current);
            setExportOpen(false);
          }}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <span aria-hidden="true" className="text-base leading-none">⌕</span>
          Filtrar período
        </button>

        <div className="relative">
          <button
            type="button"
            aria-expanded={exportOpen}
            aria-controls="export-panel"
            onClick={() => {
              setExportOpen((current) => !current);
              setFilterOpen(false);
            }}
            disabled={exporting}
            className="focus-ring inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded border border-navy-950 bg-navy-950 px-3.5 text-xs font-semibold text-white transition hover:border-navy-700 hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
          >
            <span aria-hidden="true" className="text-base leading-none">↓</span>
            {exporting ? 'Preparando relatório…' : 'Exportar relatório de conformidade'}
          </button>

          {exportOpen && (
            <div
              id="export-panel"
              className="absolute right-0 z-10 mt-1.5 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-panel"
            >
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="focus-ring flex w-full items-center rounded px-2.5 py-2 text-left text-xs font-semibold text-navy-900 hover:bg-slate-50"
              >
                Baixar como CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="focus-ring flex w-full items-center rounded px-2.5 py-2 text-left text-xs font-semibold text-navy-900 hover:bg-slate-50"
              >
                Baixar como PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <section id="filter-panel" className="rounded-md border border-slate-200 bg-white p-3 shadow-panel" aria-label="Filtros do dashboard">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1 text-xs font-semibold text-navy-900">
              Período inicial
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="focus-ring h-9 rounded border border-slate-300 px-2 text-xs font-normal text-slate-800" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-navy-900">
              Período final
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="focus-ring h-9 rounded border border-slate-300 px-2 text-xs font-normal text-slate-800" />
            </label>
            <button type="button" onClick={handleApplyFilter} className="focus-ring h-9 rounded bg-navy-950 px-3 text-xs font-semibold text-white hover:bg-navy-700">
              Aplicar filtro
            </button>
          </div>
        </section>
      )}

      <p className="sr-only-custom" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
