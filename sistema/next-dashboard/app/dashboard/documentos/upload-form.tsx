'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerDocument } from '../actions';
import type { Lot } from '@/lib/supabase/types';

export default function UploadForm({ lots }: { lots: Pick<Lot, 'id' | 'code'>[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        setError(`Falha ao enviar arquivo: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.set('name', String(new FormData(form).get('name') || file.name));
      formData.set('doc_type', String(new FormData(form).get('doc_type') || 'outro'));
      formData.set('lot_id', String(new FormData(form).get('lot_id') || ''));
      formData.set('file_path', filePath);
      formData.set('file_size', String(file.size));

      const result = await registerDocument(formData);
      if (result?.error) {
        setError(result.error);
        setUploading(false);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    } catch {
      setError('Não foi possível enviar o documento. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <label className="grid gap-1 text-xs font-semibold text-navy-900">
        Nome do documento
        <input name="name" placeholder="Ex: Licença de operação 2026" className="focus-ring h-9 rounded border border-slate-300 px-2.5 text-xs font-normal text-slate-800" />
      </label>

      <label className="grid gap-1 text-xs font-semibold text-navy-900">
        Tipo
        <select name="doc_type" defaultValue="outro" className="focus-ring h-9 rounded border border-slate-300 px-2.5 text-xs font-normal text-slate-800">
          <option value="licenca">Licença ambiental</option>
          <option value="comprovante">Comprovante de destinação</option>
          <option value="mtr">MTR digitalizado</option>
          <option value="outro">Outro</option>
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-navy-900">
        Lote vinculado (opcional)
        <select name="lot_id" defaultValue="" className="focus-ring h-9 rounded border border-slate-300 px-2.5 text-xs font-normal text-slate-800">
          <option value="">Nenhum</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>{lot.code}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold text-navy-900">
        Arquivo
        <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" className="focus-ring h-9 rounded border border-slate-300 px-2.5 text-xs font-normal text-slate-800 file:mr-2 file:h-full file:border-0 file:bg-transparent file:text-xs file:font-semibold" />
      </label>

      {error && <p className="col-span-full text-xs font-semibold text-red-700">{error}</p>}

      <div className="col-span-full">
        <button
          type="submit"
          disabled={uploading}
          className="focus-ring h-9 rounded bg-navy-950 px-4 text-xs font-semibold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70"
        >
          {uploading ? 'Enviando…' : 'Enviar documento'}
        </button>
      </div>
    </form>
  );
}
