-- INCENTIVA — Passo 1 (parte A): perfis, empresas, entidades e preferências.
-- É ADITIVO: cria tabelas novas e migra os usuários atuais. NÃO muda o acesso às tabelas existentes.
-- Rode no SQL Editor do Supabase. Pode rodar de novo sem erro (idempotente).
-- A restrição de acesso vem na parte B (03b), depois que a tela de escolha de perfil estiver no ar.

-- ───────────────────────── CNPJ (numérico e alfanumérico) ─────────────────────────
-- Desde 31/07/2026 o CNPJ pode ter letras nas 12 primeiras posições. Os 2 últimos (DV) continuam numéricos.
-- Regra da Receita (IN RFB 2.229/2024): módulo 11, com valor do caractere = código ASCII - 48 (A vale 17).
create or replace function public.cnpj_valido(c text)
returns boolean language plpgsql immutable as $$
declare
  d text; i int; s int; r int;
  w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  d := upper(regexp_replace(coalesce(c, ''), '[^0-9A-Za-z]', '', 'g'));
  if d !~ '^[0-9A-Z]{12}[0-9]{2}$' or d ~ '^(\d)\1{13}$' then return false; end if;
  s := 0;
  for i in 1..12 loop s := s + (ascii(substr(d, i, 1)) - 48) * w1[i]; end loop;
  r := s % 11;
  if substr(d, 13, 1)::int <> (case when r < 2 then 0 else 11 - r end) then return false; end if;
  s := 0;
  for i in 1..13 loop s := s + (ascii(substr(d, i, 1)) - 48) * w2[i]; end loop;
  r := s % 11;
  return substr(d, 14, 1)::int = (case when r < 2 then 0 else 11 - r end);
end $$;

-- Devolve o CNPJ no mesmo formato da planilha oficial (XX.XXX.XXX/XXXX-DD), para poder comparar igualdade.
create or replace function public.cnpj_formatar(c text)
returns text language sql immutable as $$
  select case
    when upper(regexp_replace(coalesce(c, ''), '[^0-9A-Za-z]', '', 'g')) ~ '^[0-9A-Z]{12}[0-9]{2}$'
    then regexp_replace(upper(regexp_replace(c, '[^0-9A-Za-z]', '', 'g')),
                        '^([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})([0-9]{2})$', '\1.\2.\3/\4-\5')
    else c
  end
$$;

-- ───────────────────────── Tabelas ─────────────────────────
-- Papéis. Ninguém escreve aqui pelo navegador: o papel nasce por trigger quando a empresa/entidade é cadastrada.
create table if not exists public.perfis_acesso (
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('proponente', 'incentivador')),
  criado_em timestamptz not null default now(),
  primary key (user_id, papel)
);

-- Proponente (entidade que submete projetos). Uma entidade por usuário no MVP.
create table if not exists public.entidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  cnpj text not null,
  razao_social text not null,
  tipo text check (tipo in ('associacao','instituto','federacao','confederacao','clube','prefeitura','fundacao','outro')),
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  municipio text not null,
  responsavel_nome text not null,
  responsavel_cargo text,
  responsavel_telefone text,
  verificada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint entidades_cnpj_ck check (cnpj ~ '^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}/[0-9A-Z]{4}-[0-9]{2}$' and public.cnpj_valido(cnpj))
);
create index if not exists entidades_cnpj_idx on public.entidades (cnpj);

-- Incentivador (empresa). Uma empresa por usuário e um usuário por CNPJ no MVP.
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  cnpj text not null unique,
  razao_social text not null,
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  municipio text not null,
  porte text not null check (porte in ('mei','micro','pequena','media','grande')),
  setor text,
  regime_tributario text check (regime_tributario in ('lucro_real','lucro_presumido','simples','nao_sei')),
  responsavel_nome text not null,
  responsavel_cargo text,
  responsavel_email text not null check (responsavel_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  responsavel_telefone text,
  aceite_termos boolean not null check (aceite_termos),
  aceite_lgpd boolean not null check (aceite_lgpd),
  aceite_em timestamptz not null default now(),
  verificada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint empresas_cnpj_ck check (cnpj ~ '^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}/[0-9A-Z]{4}-[0-9]{2}$' and public.cnpj_valido(cnpj))
);

-- Preferências usadas no matching.
create table if not exists public.incentivador_preferencias (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  manifestacoes text[] not null default '{}',
  modalidades text[] not null default '{}',
  ufs text[] not null default '{}',
  valor_min_projeto numeric check (valor_min_projeto is null or valor_min_projeto >= 0),
  valor_max_projeto numeric check (valor_max_projeto is null or valor_max_projeto >= 0),
  faixa_anual text check (faixa_anual in ('ate_100k','100k_500k','500k_1m','1m_5m','acima_5m')),
  temas text[] not null default '{}',
  impacto_texto text check (impacto_texto is null or char_length(impacto_texto) <= 1000),
  atualizado_em timestamptz not null default now(),
  constraint preferencias_valores_ck check (
    valor_min_projeto is null or valor_max_projeto is null or valor_min_projeto <= valor_max_projeto)
);

-- ───────────────────────── Triggers ─────────────────────────
create or replace function public.trg_normalizar_cnpj() returns trigger
language plpgsql as $$
begin
  new.cnpj := public.cnpj_formatar(new.cnpj);
  return new;
end $$;

create or replace function public.trg_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create or replace function public.trg_papel_incentivador() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.perfis_acesso (user_id, papel) values (new.user_id, 'incentivador') on conflict do nothing;
  return new;
end $$;

create or replace function public.trg_papel_proponente() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.perfis_acesso (user_id, papel) values (new.user_id, 'proponente') on conflict do nothing;
  return new;
end $$;

drop trigger if exists empresas_cnpj on public.empresas;
create trigger empresas_cnpj before insert or update on public.empresas
  for each row execute function public.trg_normalizar_cnpj();
drop trigger if exists entidades_cnpj on public.entidades;
create trigger entidades_cnpj before insert or update on public.entidades
  for each row execute function public.trg_normalizar_cnpj();

drop trigger if exists empresas_atualizado on public.empresas;
create trigger empresas_atualizado before update on public.empresas
  for each row execute function public.trg_atualizado_em();
drop trigger if exists entidades_atualizado on public.entidades;
create trigger entidades_atualizado before update on public.entidades
  for each row execute function public.trg_atualizado_em();
drop trigger if exists preferencias_atualizado on public.incentivador_preferencias;
create trigger preferencias_atualizado before update on public.incentivador_preferencias
  for each row execute function public.trg_atualizado_em();

drop trigger if exists empresas_papel on public.empresas;
create trigger empresas_papel after insert on public.empresas
  for each row execute function public.trg_papel_incentivador();
drop trigger if exists entidades_papel on public.entidades;
create trigger entidades_papel after insert on public.entidades
  for each row execute function public.trg_papel_proponente();

-- ───────────────────────── Verificação de papel (usada nas políticas) ─────────────────────────
create or replace function public.tem_papel(p_papel text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.perfis_acesso where user_id = auth.uid() and papel = p_papel);
$$;
revoke execute on function public.tem_papel(text) from public, anon;
grant execute on function public.tem_papel(text) to authenticated;

-- ───────────────────────── Permissões por coluna ─────────────────────────
-- O usuário NUNCA escreve: verificada, aceite_em, user_id (na edição), cnpj (na edição) nem papéis.
revoke all on public.perfis_acesso, public.entidades, public.empresas, public.incentivador_preferencias
  from anon, authenticated;

grant select on public.perfis_acesso to authenticated;
grant select on public.entidades, public.empresas to authenticated;
grant select, insert, update on public.incentivador_preferencias to authenticated;

grant insert (user_id, cnpj, razao_social, tipo, uf, municipio, responsavel_nome, responsavel_cargo, responsavel_telefone)
  on public.entidades to authenticated;
grant update (razao_social, tipo, uf, municipio, responsavel_nome, responsavel_cargo, responsavel_telefone)
  on public.entidades to authenticated;

grant insert (user_id, cnpj, razao_social, uf, municipio, porte, setor, regime_tributario,
              responsavel_nome, responsavel_cargo, responsavel_email, responsavel_telefone, aceite_termos, aceite_lgpd)
  on public.empresas to authenticated;
grant update (razao_social, uf, municipio, porte, setor, regime_tributario,
              responsavel_nome, responsavel_cargo, responsavel_email, responsavel_telefone)
  on public.empresas to authenticated;

-- ───────────────────────── RLS das tabelas novas ─────────────────────────
alter table public.perfis_acesso enable row level security;
alter table public.entidades enable row level security;
alter table public.empresas enable row level security;
alter table public.incentivador_preferencias enable row level security;

drop policy if exists "ve os proprios papeis" on public.perfis_acesso;
create policy "ve os proprios papeis" on public.perfis_acesso
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "entidade propria: ver" on public.entidades;
create policy "entidade propria: ver" on public.entidades
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "entidade propria: criar" on public.entidades;
create policy "entidade propria: criar" on public.entidades
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "entidade propria: editar" on public.entidades;
create policy "entidade propria: editar" on public.entidades
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "empresa propria: ver" on public.empresas;
create policy "empresa propria: ver" on public.empresas
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "empresa propria: criar" on public.empresas;
create policy "empresa propria: criar" on public.empresas
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "empresa propria: editar" on public.empresas;
create policy "empresa propria: editar" on public.empresas
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "preferencias da propria empresa" on public.incentivador_preferencias;
create policy "preferencias da propria empresa" on public.incentivador_preferencias
  for all to authenticated
  using (exists (select 1 from public.empresas e where e.id = empresa_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.empresas e where e.id = empresa_id and e.user_id = (select auth.uid())));

-- ───────────────────────── Migração: quem já usa o Módulo A vira proponente ─────────────────────────
insert into public.perfis_acesso (user_id, papel)
select distinct p.user_id, 'proponente'
from public.projetos p
where p.user_id is not null
  and exists (select 1 from auth.users u where u.id = p.user_id)
on conflict do nothing;

-- Sua conta de teste com os dois papéis (descomente e troque o e-mail):
-- insert into public.perfis_acesso (user_id, papel)
-- select u.id, x.papel from auth.users u, unnest(array['proponente','incentivador']) as x(papel)
-- where u.email = 'seu@email.com'
-- on conflict do nothing;
