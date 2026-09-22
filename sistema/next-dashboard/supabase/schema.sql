-- =========================================================
-- Dashboard de Conformidade Ambiental — schema Supabase
-- Execute este arquivo inteiro em: Supabase > SQL Editor > New query
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- Tabela principal: lotes de resíduos
-- ---------------------------------------------------------
create table if not exists public.lots (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,                -- ex: LT-2026-00481
  waste_class text not null,                -- ex: "Classe I — perigoso"
  generator text not null,                  -- unidade geradora do resíduo
  manifest text not null,                   -- número do MTR (Manifesto de Transporte de Resíduos)
  weight_ton numeric(12,3) not null,        -- peso em toneladas
  destination text not null,                -- ex: "Aterro licenciado", "Reciclagem"
  deadline_date date not null,              -- prazo legal para regularização/destinação final
  regularized boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lots_deadline_idx on public.lots (deadline_date);
create index if not exists lots_regularized_idx on public.lots (regularized);

-- ---------------------------------------------------------
-- Tabela de documentos (licenças, comprovantes, MTRs digitalizados)
-- ---------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid references public.lots(id) on delete set null,
  name text not null,
  doc_type text not null default 'outro',   -- licenca | comprovante | mtr | outro
  file_path text not null,                  -- caminho dentro do bucket "documents"
  file_size bigint,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists documents_lot_idx on public.documents (lot_id);

-- ---------------------------------------------------------
-- View: calcula o status de risco em tempo real a partir do prazo.
-- Esta é a regra de negócio central do sistema: um lote não fica
-- "vencido" ou "regular" porque alguém marcou manualmente, e sim
-- porque o prazo legal (deadline_date) passou ou está próximo.
-- ---------------------------------------------------------
create or replace view public.lots_with_risk as
select
  l.*,
  case
    when l.regularized then 'regular'
    when l.deadline_date < current_date then 'overdue'
    when l.deadline_date <= current_date + interval '7 days' then 'due-soon'
    else 'regular'
  end as risk_status,
  case
    when l.regularized then 'Regularizado'
    when l.deadline_date < current_date then 'Pendência crítica'
    when l.deadline_date <= current_date + interval '7 days'
      then 'Vence em ' || (l.deadline_date - current_date) || ' dia(s)'
    else 'No prazo'
  end as risk_label
from public.lots l;

-- ---------------------------------------------------------
-- Row Level Security — qualquer usuário autenticado da empresa
-- pode ler e escrever. Ajuste depois se precisar de papéis
-- diferentes (ex.: só admin cadastra, operador só lê).
-- ---------------------------------------------------------
alter table public.lots enable row level security;
alter table public.documents enable row level security;

drop policy if exists "lots_select_authenticated" on public.lots;
create policy "lots_select_authenticated" on public.lots
  for select using (auth.role() = 'authenticated');

drop policy if exists "lots_insert_authenticated" on public.lots;
create policy "lots_insert_authenticated" on public.lots
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "lots_update_authenticated" on public.lots;
create policy "lots_update_authenticated" on public.lots
  for update using (auth.role() = 'authenticated');

drop policy if exists "documents_select_authenticated" on public.documents;
create policy "documents_select_authenticated" on public.documents
  for select using (auth.role() = 'authenticated');

drop policy if exists "documents_insert_authenticated" on public.documents;
create policy "documents_insert_authenticated" on public.documents
  for insert with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- Trigger: atualiza updated_at automaticamente
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lots_set_updated_at on public.lots;
create trigger lots_set_updated_at
before update on public.lots
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Storage: bucket privado para documentos
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_bucket_select" on storage.objects;
create policy "documents_bucket_select" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "documents_bucket_insert" on storage.objects;
create policy "documents_bucket_insert" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- Dados de exemplo (opcional). Comente/apague se não quiser
-- popular o dashboard com lotes de demonstração.
-- ---------------------------------------------------------
insert into public.lots (code, waste_class, generator, manifest, weight_ton, destination, deadline_date, regularized)
values
  ('LT-2026-00481', 'Classe I — perigoso', 'Planta Industrial Norte', 'MTR-2026-00481', 12.5, 'Tratamento térmico', current_date - interval '2 days', false),
  ('LT-2026-00482', 'Classe II A — não inerte', 'Centro de Distribuição Leste', 'MTR-2026-00482', 8.75, 'Reciclagem', current_date + interval '2 days', false),
  ('LT-2026-00483', 'Classe II B — inerte', 'Unidade de Tratamento Sul', 'MTR-2026-00483', 21.2, 'Aterro licenciado', current_date - interval '10 days', true),
  ('LT-2026-00484', 'Reciclável segregado', 'Planta Industrial Oeste', 'MTR-2026-00484', 5.4, 'Reaproveitamento', current_date + interval '20 days', true)
on conflict (code) do nothing;
