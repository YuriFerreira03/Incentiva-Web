-- Registro de uso da IA por usuário (cota diária e acompanhamento de custo).
-- Rode no Supabase: SQL Editor > New query > colar > Run.

create table if not exists public.ia_uso (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rota text not null,
  tipo text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ia_uso_user_created_idx on public.ia_uso (user_id, created_at desc);

alter table public.ia_uso enable row level security;

-- Cada usuário só lê e grava as próprias linhas. Sem update/delete.
drop policy if exists ia_uso_select_own on public.ia_uso;
create policy ia_uso_select_own on public.ia_uso
  for select to authenticated using (user_id = auth.uid());

drop policy if exists ia_uso_insert_own on public.ia_uso;
create policy ia_uso_insert_own on public.ia_uso
  for insert to authenticated with check (user_id = auth.uid());

-- Consulta útil (rode como admin no SQL Editor): custo estimado por dia.
-- select date(created_at) dia, tipo, count(*) chamadas,
--        sum(input_tokens) entrada, sum(output_tokens) saida,
--        round((sum(input_tokens) * 0.10 + sum(output_tokens) * 0.50) / 1e6, 4) custo_usd
-- from public.ia_uso group by 1, 2 order by 1 desc, 2;
