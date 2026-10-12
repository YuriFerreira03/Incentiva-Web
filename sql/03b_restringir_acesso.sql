-- INCENTIVA — Passo 1 (parte B): passa a EXIGIR o papel para acessar cada módulo.
-- Só rode DEPOIS que a tela "Como você vai usar o INCENTIVA?" estiver no ar (parte A já aplicada).
-- Antes de rodar, confira quem ficará sem acesso (deve ser só quem nunca usou nenhum módulo):
--   select u.email from auth.users u
--   where not exists (select 1 from public.perfis_acesso a where a.user_id = u.id);

-- Módulo A: só proponente, e só os próprios projetos.
alter table public.projetos enable row level security;
drop policy if exists "users see own projects" on public.projetos;
drop policy if exists "proponente gerencia os proprios projetos" on public.projetos;
create policy "proponente gerencia os proprios projetos" on public.projetos
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.tem_papel('proponente')))
  with check (user_id = (select auth.uid()) and (select public.tem_papel('proponente')));

-- Módulo B: a vitrine (tabela e view) só para incentivador.
drop policy if exists "leitura autenticados" on public.projetos_autorizados;
drop policy if exists "incentivador le a vitrine" on public.projetos_autorizados;
create policy "incentivador le a vitrine" on public.projetos_autorizados
  for select to authenticated using ((select public.tem_papel('incentivador')));

-- Proponente enxerga os projetos autorizados do CNPJ da própria entidade (base da "reivindicação").
drop policy if exists "proponente le os proprios por cnpj" on public.projetos_autorizados;
create policy "proponente le os proprios por cnpj" on public.projetos_autorizados
  for select to authenticated
  using (cnpj in (select e.cnpj from public.entidades e where e.user_id = (select auth.uid())));

-- A tabela antiga projetos_captacao tinha leitura pública (qualquer pessoa, sem login).
-- Conferido no código (grep): nenhum arquivo do app a usa mais. Fecha a leitura pública.
drop policy if exists "leitura publica projetos_captacao" on public.projetos_captacao;

-- ───────── DESFAZER (volta ao comportamento anterior) ─────────
-- drop policy if exists "proponente gerencia os proprios projetos" on public.projetos;
-- create policy "users see own projects" on public.projetos for all to public using (auth.uid() = user_id);
-- drop policy if exists "incentivador le a vitrine" on public.projetos_autorizados;
-- drop policy if exists "proponente le os proprios por cnpj" on public.projetos_autorizados;
-- create policy "leitura autenticados" on public.projetos_autorizados for select to authenticated using (true);
-- create policy "leitura publica projetos_captacao" on public.projetos_captacao for select to public using (true);
