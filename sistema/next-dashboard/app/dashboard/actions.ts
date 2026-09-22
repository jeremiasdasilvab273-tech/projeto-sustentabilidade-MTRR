'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { error?: string; success?: boolean };

function nextCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `LT-${year}-${random}`;
}

/** Cadastra um novo lote de resíduo. */
export async function createLot(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const wasteClass = String(formData.get('waste_class') || '').trim();
  const generator = String(formData.get('generator') || '').trim();
  const manifest = String(formData.get('manifest') || '').trim();
  const weightRaw = String(formData.get('weight_ton') || '').replace(',', '.');
  const destination = String(formData.get('destination') || '').trim();
  const deadlineDate = String(formData.get('deadline_date') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  const weightTon = Number.parseFloat(weightRaw);

  if (!wasteClass || !generator || !manifest || !destination || !deadlineDate || Number.isNaN(weightTon)) {
    return { error: 'Preencha todos os campos obrigatórios corretamente.' };
  }

  const { error } = await supabase.from('lots').insert({
    code: nextCode(),
    waste_class: wasteClass,
    generator,
    manifest,
    weight_ton: weightTon,
    destination,
    deadline_date: deadlineDate,
    notes: notes || null,
    created_by: user.id,
  });

  if (error) {
    return { error: `Não foi possível cadastrar o lote: ${error.message}` };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard?created=1');
}

/** Marca um lote como regularizado (resolve a pendência). */
export async function regularizeLot(lotId: string): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const { error } = await supabase.from('lots').update({ regularized: true }).eq('id', lotId);

  if (error) {
    return { error: `Não foi possível regularizar o lote: ${error.message}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pendencias');
  return { success: true };
}

/** Registra os metadados de um documento já enviado ao Storage. */
export async function registerDocument(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const name = String(formData.get('name') || '').trim();
  const docType = String(formData.get('doc_type') || 'outro');
  const filePath = String(formData.get('file_path') || '').trim();
  const fileSize = Number(formData.get('file_size') || 0);
  const lotId = String(formData.get('lot_id') || '').trim();

  if (!name || !filePath) {
    return { error: 'Nome e arquivo são obrigatórios.' };
  }

  const { error } = await supabase.from('documents').insert({
    name,
    doc_type: docType,
    file_path: filePath,
    file_size: fileSize || null,
    lot_id: lotId || null,
    uploaded_by: user.id,
  });

  if (error) {
    return { error: `Não foi possível registrar o documento: ${error.message}` };
  }

  revalidatePath('/dashboard/documentos');
  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
