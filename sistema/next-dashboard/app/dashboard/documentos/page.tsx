import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { DocumentRow, Lot } from '@/lib/supabase/types';
import UploadForm from './upload-form';

const docTypeLabel: Record<string, string> = {
  licenca: 'Licença ambiental',
  comprovante: 'Comprovante de destinação',
  mtr: 'MTR digitalizado',
  outro: 'Outro',
};

export default async function DocumentosPage() {
  const supabase = createClient();

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  const { data: lots } = await supabase
    .from('lots')
    .select('id, code')
    .order('created_at', { ascending: false })
    .limit(200);

  const documentsList = (documents ?? []) as DocumentRow[];
  const lotsList = (lots ?? []) as Pick<Lot, 'id' | 'code'>[];

  const lotCodeById = new Map(lotsList.map((lot) => [lot.id, lot.code]));

  // Gera links assinados (válidos por 10 minutos) para cada documento privado.
  const signedUrls = await Promise.all(
    documentsList.map((doc) => supabase.storage.from('documents').createSignedUrl(doc.file_path, 600))
  );

  const documentsWithUrl = documentsList.map((doc, index) => ({
    ...doc,
    url: signedUrls[index]?.data?.signedUrl ?? null,
  }));

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[1100px] py-5 sm:py-8">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        Operação / Conformidade ambiental
      </p>
      <h1 className="mb-1 text-[22px] font-extrabold tracking-tight text-navy-950">Documentos</h1>
      <p className="mb-6 text-xs text-slate-500">
        Licenças ambientais, comprovantes de destinação final e MTRs digitalizados. Os arquivos ficam em um bucket
        privado — só usuários autenticados conseguem visualizar.
      </p>

      <UploadForm lots={lotsList} />

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed border-collapse text-left text-[13px]">
            <colgroup><col className="w-[30%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[16%]" /></colgroup>
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                {['Documento', 'Tipo', 'Lote vinculado', 'Enviado em', ''].map((heading) => (
                  <th key={heading} scope="col" className="h-9 border-b border-slate-200 px-3 py-2">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {documentsWithUrl.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Nenhum documento enviado ainda.
                  </td>
                </tr>
              )}
              {documentsWithUrl.map((doc, index) => (
                <tr key={doc.id} className={index < documentsWithUrl.length - 1 ? 'border-b border-slate-200' : ''}>
                  <td className="px-3 py-2.5 align-middle font-semibold text-navy-950">{doc.name}</td>
                  <td className="px-3 py-2.5 align-middle">{docTypeLabel[doc.doc_type] ?? doc.doc_type}</td>
                  <td className="px-3 py-2.5 align-middle">
                    {doc.lot_id ? lotCodeById.get(doc.lot_id) ?? '—' : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums">
                    {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="focus-ring rounded font-semibold text-blue-600 hover:underline">
                        Abrir
                      </a>
                    ) : (
                      <span className="text-slate-400">indisponível</span>
                    )}
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
