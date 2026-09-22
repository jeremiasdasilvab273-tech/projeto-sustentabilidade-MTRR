import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import type { LotWithRisk } from '@/lib/supabase/types';

function toCsv(lots: LotWithRisk[]): string {
  const headers = ['Lote', 'Classe', 'Unidade geradora', 'MTR', 'Peso (t)', 'Destinação', 'Prazo', 'Status', 'Atualizado'];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const rows = lots.map((lot) =>
    [
      lot.code,
      lot.waste_class,
      lot.generator,
      lot.manifest,
      lot.weight_ton.toString(),
      lot.destination,
      lot.deadline_date,
      lot.risk_label,
      lot.updated_at,
    ]
      .map((value) => escape(String(value)))
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

async function toPdf(lots: LotWithRisk[], from?: string, to?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 792; // letter, paisagem
  const pageHeight = 612;
  const margin = 40;
  const rowHeight = 18;
  const columns = [
    { key: 'code', label: 'Lote', width: 90 },
    { key: 'generator', label: 'Unidade geradora', width: 150 },
    { key: 'weight', label: 'Peso (t)', width: 70 },
    { key: 'destination', label: 'Destinação', width: 140 },
    { key: 'deadline', label: 'Prazo', width: 80 },
    { key: 'status', label: 'Status', width: 130 },
  ] as const;

  let page = doc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  function drawHeader() {
    page.drawText('Relatório de conformidade ambiental', {
      x: margin,
      y: cursorY,
      size: 16,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    cursorY -= 18;
    const period = from || to ? `Período: ${from ?? '...'} a ${to ?? '...'}` : 'Todos os lotes monitorados';
    page.drawText(`${period}  •  Gerado em ${new Date().toLocaleString('pt-BR')}`, {
      x: margin,
      y: cursorY,
      size: 9,
      font,
      color: rgb(0.4, 0.45, 0.53),
    });
    cursorY -= 24;

    let x = margin;
    for (const col of columns) {
      page.drawText(col.label, { x, y: cursorY, size: 9, font: boldFont, color: rgb(0.4, 0.45, 0.53) });
      x += col.width;
    }
    cursorY -= 6;
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: pageWidth - margin, y: cursorY },
      thickness: 0.5,
      color: rgb(0.85, 0.87, 0.9),
    });
    cursorY -= rowHeight;
  }

  drawHeader();

  for (const lot of lots) {
    if (cursorY < margin + rowHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      cursorY = pageHeight - margin;
      drawHeader();
    }

    const values: Record<(typeof columns)[number]['key'], string> = {
      code: lot.code,
      generator: lot.generator,
      weight: lot.weight_ton.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
      destination: lot.destination,
      deadline: new Date(`${lot.deadline_date}T00:00:00`).toLocaleDateString('pt-BR'),
      status: lot.risk_label,
    };

    let x = margin;
    for (const col of columns) {
      const text = values[col.key];
      const truncated = text.length > 28 ? `${text.slice(0, 27)}…` : text;
      page.drawText(truncated, { x, y: cursorY, size: 9, font, color: rgb(0.1, 0.12, 0.18) });
      x += col.width;
    }
    cursorY -= rowHeight;
  }

  if (lots.length === 0) {
    page.drawText('Nenhum lote encontrado para o período selecionado.', {
      x: margin,
      y: cursorY,
      size: 10,
      font,
      color: rgb(0.4, 0.45, 0.53),
    });
  }

  return doc.save();
}

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  let query = supabase.from('lots_with_risk').select('*').order('updated_at', { ascending: false });
  if (from) query = query.gte('updated_at', `${from}T00:00:00`);
  if (to) query = query.lte('updated_at', `${to}T23:59:59`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lots = (data ?? []) as LotWithRisk[];

  if (format === 'csv') {
    const csv = toCsv(lots);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="relatorio-conformidade.csv"',
      },
    });
  }

  const pdfBytes = await toPdf(lots, from, to);
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="relatorio-conformidade.pdf"',
    },
  });
}
