-- INCENTIVA — Matching, Parte A: regra de grupos de modalidade + nota de 0 a 100 (regras fixas, explicáveis).
-- Rode DEPOIS do 03a. Pode rodar de novo sem erro (idempotente).
-- Sem IA aqui: a nota é calculada no banco, e o navegador não escreve nenhum resultado.
-- A explicação em texto (IA) entra na Parte B e só preenche a coluna "explicacao".

-- ───────────────────────── Texto sem acento (independe do idioma do servidor) ─────────────────────────
create or replace function public.texto_sem_acento(t text)
returns text language sql immutable as $$
  select lower(translate(coalesce(t, ''),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
    'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'))
$$;

-- ───────────────────────── Grupos de modalidade (regras editáveis) ─────────────────────────
-- A planilha oficial tem ~1.100 grafias ("Futebol/Futsal", "Thiathlon"...). Cada grupo tem uma expressão
-- regular aplicada ao texto sem acento e em minúsculas. \y = limite de palavra.
create table if not exists public.grupos_modalidade (
  slug text primary key,
  rotulo text not null,
  padrao text not null,
  exclui text
);

insert into public.grupos_modalidade (slug, rotulo, padrao, exclui) values
 ('futebol',  'Futebol', 'futebol(?! americano)|futebo\y|soccer|society', null),
 ('futsal',   'Futsal', 'futsal|\yfutsa\y|futebol de salao', null),
 ('basquete', 'Basquete', 'basquete|basket', null),
 ('volei',    'Vôlei e futevôlei', 'volei|\yolei\y|voleibol', null),
 ('handebol', 'Handebol', 'handebol|handball', null),
 ('atletismo','Atletismo', 'atletismo|arremesso|lancamento de|salto em|pista e campo', null),
 ('corrida',  'Corrida e caminhada', 'corrida|caminhada|maratona|\ytrail|\yrun\y|cross.?country', null),
 ('natacao',  'Natação e aquáticos', 'natacao|\ynado|aquatic|salto(s)? ornamental|ornamentais|lifesaving|salvamento', null),
 ('lutas',    'Lutas e artes marciais', 'judo|\yudo\y|jiu|karate|taekwondo|poomase|kiorugui|hapkido|kung fu|boxe|muay|\yluta|capoeira|wrestling|\ymma\y|kickbox|esgrima|\ykata|kumite|sumo|aikido|krav|artes marciais|\ybjj\y', null),
 ('raquetes', 'Tênis e raquetes', 'tenis|badminton|squash|padel|pickleball|raquete', null),
 ('automobilismo','Automobilismo e kart', '\ykart|stock|rally|automobil|formula|motociclismo|motocross|\ymoto\y|endurance|kartismo|\ytrack\y', null),
 ('ciclismo', 'Ciclismo e bike', '\yciclismo|\yparaciclismo|bike|bmx|moutain|mountain|\ymtb\y|ciclocross|\yestrada\y', null),
 ('triathlon','Triathlon e multiesporte', 'triat|triath|thiath|duathlon|aquathlon|pentatlo', null),
 ('ginastica','Ginástica', 'ginastica|trampolim|acrobatic', null),
 ('agua_vela','Vela, remo e surf', '\yvela\y|\yremo\y|canoa|surf|(?<!skate)board|stand up|\ysup\y|kite|windsurf|classe olimpica|optimist', null),
 ('radicais', 'Skate e radicais', 'skate|patins|patinacao|parkour|escalada|radical|slackline|bouderling|boulder|\ystreet\y', null),
 ('para',     'Paradesporto (modalidades)', 'paralimp|paraolimp|paradesport|cadeiras? de rodas|bocha|goalball|surdo|deficien|\ypcd\y|\ypara[ -]?(atletismo|natacao|badminton|tenis|ciclismo|tiro|judo|canoagem|remo|triatlo|taekwondo|surf|vela|equestre)|paraesquetre|paraequestre', null),
 ('mente',    'Xadrez e e-sports', 'xadrez|\ydamas?\y|e-?sports?\y|gamer|\ygames?\y|poker|sinuca|domino', null),
 ('rugby_bat','Rugby, beisebol e futebol americano', 'rugby|beisebol|softbol|softball|baseball|futebol americano|cricket|criquete', null),
 ('outras_modalidades','Golfe, hipismo, tiro e outras', 'golfe|hipismo|equestre|adestramento|volteio|\ysaltos\y|pesca|\ytiro\y|arco (e flecha|recurvo)|halterofilismo|levantamento|powerlifting|danca|breaking|breakdance|yoga|hoquei|paraquedismo|\yvoo\y|\ypolo\y|culturismo|musculacao|carabina|pistola', null)
on conflict (slug) do update set rotulo = excluded.rotulo, padrao = excluded.padrao, exclui = excluded.exclui;

create or replace function public.modalidade_grupos(p_texto text)
returns text[] language sql stable as $$
  with t as (select public.texto_sem_acento(p_texto) as s)
  select coalesce(array_agg(g.slug order by g.slug), '{}'::text[])
  from public.grupos_modalidade g, t
  where t.s ~ g.padrao and (g.exclui is null or t.s !~ g.exclui)
$$;

-- ───────────────────────── Temas inferidos (só pelo nome/modalidade; não há resumo ainda) ─────────────────────────
create or replace function public.projeto_temas(p_projeto text, p_proponente text, p_modalidade text, p_manifestacao text, p_grupos text[])
returns text[] language plpgsql stable as $$
declare
  t text := public.texto_sem_acento(coalesce(p_projeto, '') || ' ' || coalesce(p_proponente, '') || ' ' || coalesce(p_modalidade, ''));
  r text[] := '{}';
begin
  if 'para' = any(p_grupos) or t ~ 'paralimp|paraolimp|paradesport|\yapae\y|deficien|cadeiras? de rodas|autis|surdo|\ypcd\y' then
    r := array_append(r, 'paradesporto');
  end if;
  if t ~ 'feminin|meninas|mulher|\yelas?\y|\ydelas\y|garotas' then
    r := array_append(r, 'esporte_feminino');
  end if;
  if p_manifestacao in ('Formação Esportiva', 'Educacional')
     or t ~ 'categorias? de base|\ybase\y|escolinha|iniciacao|infantil|criancas|\ysub[- ]?[0-9]{2}\y|jovens|talentos|formando|formacao' then
    r := array_append(r, 'base');
  end if;
  if t ~ 'inclus|social|comunidade|vulnerab|cidadania|transform|periferia|quebrada|favela|oportunidade|cidadao' then
    r := array_append(r, 'inclusao_social');
  end if;
  return r;
end $$;

-- ───────────────────────── Colunas derivadas na tabela de projetos (preenchidas por gatilho) ─────────────────────────
-- O robô diário continua igual: ao inserir/atualizar um projeto, o gatilho recalcula os dois campos.
alter table public.projetos_autorizados
  add column if not exists modalidade_grupos text[] not null default '{}',
  add column if not exists modalidade_inferida boolean not null default false,
  add column if not exists temas_inferidos text[] not null default '{}';

create or replace function public.trg_projeto_derivados() returns trigger
language plpgsql as $$
begin
  -- Primeiro a modalidade da planilha. Se ela não identifica nada (ex.: "Outros"), tenta o nome do projeto.
  new.modalidade_grupos := public.modalidade_grupos(new.modalidade);
  new.modalidade_inferida := false;
  if cardinality(new.modalidade_grupos) = 0 then
    new.modalidade_grupos := public.modalidade_grupos(new.projeto);
    new.modalidade_inferida := cardinality(new.modalidade_grupos) > 0;
  end if;
  new.temas_inferidos := public.projeto_temas(new.projeto, new.proponente, new.modalidade, new.manifestacao, new.modalidade_grupos);
  return new;
end $$;

drop trigger if exists projetos_derivados on public.projetos_autorizados;
create trigger projetos_derivados before insert or update on public.projetos_autorizados
  for each row execute function public.trg_projeto_derivados();

-- Depois de mudar as regras de grupos/temas, rode:  select public.recalcular_derivados();
create or replace function public.recalcular_derivados() returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  update public.projetos_autorizados set modalidade = modalidade;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.recalcular_derivados() from public, anon, authenticated;

-- ───────────────────────── Resultados e controle de execução ─────────────────────────
create table if not exists public.matching_resultados (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  projeto_id uuid not null references public.projetos_autorizados(id) on delete cascade,
  nota int not null check (nota between 0 and 100),
  fatores jsonb not null,        -- um item por fator: peso, pontos, status, detalhe
  posicao int,                   -- 1 = melhor; o app ordena por aqui
  explicacao text,               -- preenchido pela IA na Parte B
  modelo text,
  versao_regras text not null,
  versao_prompt text,
  calculado_em timestamptz not null default now(),
  primary key (empresa_id, projeto_id)
);
alter table public.matching_resultados add column if not exists posicao int;
create index if not exists matching_resultados_nota_idx on public.matching_resultados (empresa_id, nota desc);
create index if not exists matching_resultados_pos_idx on public.matching_resultados (empresa_id, posicao);

create table if not exists public.matching_execucoes (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  versao_regras text not null,
  hash_perfil text not null,
  total_resultados int not null default 0,
  calculado_em timestamptz not null default now(),
  dia date not null default current_date,
  execucoes_no_dia int not null default 1
);

alter table public.grupos_modalidade enable row level security;
alter table public.matching_resultados enable row level security;
alter table public.matching_execucoes enable row level security;

revoke all on public.grupos_modalidade, public.matching_resultados, public.matching_execucoes from anon, authenticated;
grant select on public.grupos_modalidade, public.matching_resultados, public.matching_execucoes to authenticated;

drop policy if exists "regras publicas para logados" on public.grupos_modalidade;
create policy "regras publicas para logados" on public.grupos_modalidade for select to authenticated using (true);
drop policy if exists "resultados da propria empresa" on public.matching_resultados;
create policy "resultados da propria empresa" on public.matching_resultados for select to authenticated
  using (exists (select 1 from public.empresas e where e.id = empresa_id and e.user_id = (select auth.uid())));
drop policy if exists "execucao da propria empresa" on public.matching_execucoes;
create policy "execucao da propria empresa" on public.matching_execucoes for select to authenticated
  using (exists (select 1 from public.empresas e where e.id = empresa_id and e.user_id = (select auth.uid())));

create or replace function public.tema_rotulo(p_slug text)
returns text language sql immutable as $$
  select case p_slug when 'base' then 'esporte de base' when 'paradesporto' then 'paradesporto'
                     when 'esporte_feminino' then 'esporte feminino' when 'inclusao_social' then 'inclusão social' else p_slug end
$$;

-- ───────────────────────── A nota ─────────────────────────
-- Pesos (v2): modalidade 30 · estado 25 · valor 15 · manifestação 10 · temas 10 · prazo 10.
-- Só entram na conta os fatores que a empresa preencheu (os pesos são reescalados). O prazo sempre entra.
-- Dado desconhecido no projeto (ex.: modalidade "Outros") vale 30 pontos e é marcado como "desconhecido".
create or replace function public.matching_status(p int, desconhecido boolean)
returns text language sql immutable as $$
  select case when p is null then 'sem_preferencia'
              when desconhecido then 'desconhecido'
              when p >= 100 then 'combina'
              when p <= 0 then 'nao_combina'
              else 'parcial' end
$$;

create or replace function public.moeda_br(v numeric)
returns text language sql immutable as $$
  select 'R$ ' || replace(to_char(round(v), 'FM999,999,999,999,999'), ',', '.')
$$;

-- Uso interno (service_role / SQL Editor): calcula e grava o resultado de UMA empresa.
create or replace function public.calcular_matching_para(p_empresa uuid, p_forcar boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  c_versao constant text := 'v2';
  c_limite_dia constant int := 10;
  c_validade constant interval := interval '12 hours';
  c_top constant int := 100;
  v_pref public.incentivador_preferencias%rowtype;
  v_hash text;
  v_exec public.matching_execucoes%rowtype;
  v_total int;
  v_nota_max int;
  v_inicio timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext(p_empresa::text));

  select * into v_pref from public.incentivador_preferencias where empresa_id = p_empresa;
  if not found
     or (cardinality(v_pref.modalidades) = 0 and cardinality(v_pref.ufs) = 0 and cardinality(v_pref.manifestacoes) = 0
         and v_pref.valor_min_projeto is null and v_pref.valor_max_projeto is null and cardinality(v_pref.temas) = 0) then
    raise exception 'Preencha ao menos uma preferência da empresa (estado, modalidade, valor, manifestação ou tema) para calcular o matching.'
      using errcode = 'P0001';
  end if;

  v_hash := md5(c_versao || '|' || (to_jsonb(v_pref) - 'atualizado_em' - 'impacto_texto')::text);
  select * into v_exec from public.matching_execucoes where empresa_id = p_empresa;

  if found and not p_forcar then
    if v_exec.hash_perfil = v_hash and v_exec.versao_regras = c_versao and v_exec.calculado_em > now() - c_validade then
      return jsonb_build_object('ok', true, 'cache', true, 'total', v_exec.total_resultados, 'calculado_em', v_exec.calculado_em);
    end if;
    if v_exec.dia = current_date and v_exec.execucoes_no_dia >= c_limite_dia then
      raise exception 'Limite de % cálculos por dia atingido. Tente novamente amanhã.', c_limite_dia using errcode = 'P0001';
    end if;
  end if;

  v_inicio := clock_timestamp();

  insert into public.matching_resultados as m (empresa_id, projeto_id, nota, fatores, posicao, versao_regras, calculado_em)
  select p_empresa, x.id, x.nota, x.fatores, row_number() over (order by x.nota desc, x.espec, x.dias desc, x.id), c_versao, v_inicio
  from (
    with alvo as (
      select a.id, a.uf, a.manifestacao, a.valor_autorizado as valor, a.modalidade_grupos as grupos, a.modalidade_inferida as inf,
             a.temas_inferidos as temas, (a.prazo_captacao - current_date) as dias
      from public.projetos_autorizados a
      where a.prazo_captacao >= current_date
    ),
    f as (
      select alvo.*,
        case when cardinality(v_pref.modalidades) = 0 then null
             when cardinality(grupos) = 0 then 30
             when grupos && v_pref.modalidades then 100 else 0 end as p_mod,
        (cardinality(v_pref.modalidades) > 0 and cardinality(grupos) = 0) as u_mod,
        case when cardinality(v_pref.ufs) = 0 then null
             when uf is null then 30
             when uf = any (v_pref.ufs) then 100 else 0 end as p_uf,
        (cardinality(v_pref.ufs) > 0 and uf is null) as u_uf,
        case when cardinality(v_pref.manifestacoes) = 0 then null
             when manifestacao is null then 30
             when manifestacao = any (v_pref.manifestacoes)
                  or (manifestacao = 'Rendimento / Formação' and v_pref.manifestacoes && array['Rendimento', 'Formação Esportiva']) then 100
             else 0 end as p_man,
        (cardinality(v_pref.manifestacoes) > 0 and manifestacao is null) as u_man,
        case when v_pref.valor_min_projeto is null and v_pref.valor_max_projeto is null then null
             when valor is null then 30
             when (v_pref.valor_min_projeto is null or valor >= v_pref.valor_min_projeto)
                  and (v_pref.valor_max_projeto is null or valor <= v_pref.valor_max_projeto) then 100
             when v_pref.valor_min_projeto is not null and valor < v_pref.valor_min_projeto
               then greatest(0, round(100 * valor / nullif(v_pref.valor_min_projeto, 0)))::int
             else greatest(0, coalesce(round(100 * (2 - valor / nullif(v_pref.valor_max_projeto, 0)))::int, 0)) end as p_val,
        ((v_pref.valor_min_projeto is not null or v_pref.valor_max_projeto is not null) and valor is null) as u_val,
        case when cardinality(v_pref.temas) = 0 then null
             when 'outros' = any (v_pref.temas) and cardinality(temas) = 0 then 100
             when temas && v_pref.temas then 100
             when cardinality(temas) = 0 then 30
             else 0 end as p_tem,
        (cardinality(v_pref.temas) > 0 and cardinality(temas) = 0 and not ('outros' = any (v_pref.temas))) as u_tem,
        case when dias >= 90 then 100
             when dias >= 30 then 50 + round((dias - 30) * 50.0 / 60)::int
             else greatest(0, round(dias * 50.0 / 30)::int) end as p_pra
      from alvo
    ),
    g as (
      select f.*,
        -- Nota 100 só quando TODOS os fatores aplicáveis combinam por inteiro; caso contrário, no máximo 99.
        case when coalesce(p_mod, 100) = 100 and coalesce(p_uf, 100) = 100 and coalesce(p_val, 100) = 100
                  and coalesce(p_man, 100) = 100 and coalesce(p_tem, 100) = 100 and p_pra = 100
             then 100
             else least(99, round((coalesce(p_mod * 30, 0) + coalesce(p_uf * 25, 0) + coalesce(p_val * 15, 0) + coalesce(p_man * 10, 0)
                                   + coalesce(p_tem * 10, 0) + p_pra * 10)::numeric
                  / (case when p_mod is not null then 30 else 0 end + case when p_uf is not null then 25 else 0 end
                     + case when p_val is not null then 15 else 0 end + case when p_man is not null then 10 else 0 end
                     + case when p_tem is not null then 10 else 0 end + 10))::int)
        end as nota
      from f
    )
    select g.id, g.nota, cardinality(g.grupos) as espec, g.dias,
      jsonb_build_array(
        jsonb_build_object('fator', 'modalidade', 'peso', 30, 'pontos', p_mod, 'status', public.matching_status(p_mod, u_mod),
          'detalhe', case when p_mod is null then null
                          when u_mod then 'A planilha não identifica a modalidade do projeto'
                          else (select string_agg(m.rotulo, ', ' order by m.slug) from public.grupos_modalidade m where m.slug = any (g.grupos))
                               || case when g.inf then ' (inferido pelo nome do projeto)' else '' end end),
        jsonb_build_object('fator', 'estado', 'peso', 25, 'pontos', p_uf, 'status', public.matching_status(p_uf, u_uf),
          'detalhe', case when p_uf is null then null else 'Projeto em ' || coalesce(g.uf, 'estado não informado') end),
        jsonb_build_object('fator', 'valor', 'peso', 15, 'pontos', p_val, 'status', public.matching_status(p_val, u_val),
          'detalhe', case when p_val is null then null when g.valor is null then 'Valor não informado'
                          else public.moeda_br(g.valor) || ' autorizados' end),
        jsonb_build_object('fator', 'manifestacao', 'peso', 10, 'pontos', p_man, 'status', public.matching_status(p_man, u_man),
          'detalhe', case when p_man is null then null else coalesce(g.manifestacao, 'Manifestação não informada') end),
        jsonb_build_object('fator', 'temas', 'peso', 10, 'pontos', p_tem, 'status', public.matching_status(p_tem, u_tem),
          'detalhe', case when p_tem is null then null
                          when cardinality(g.temas) = 0 then 'Nenhum tema identificado pelo nome do projeto'
                          else 'Inferido do nome e da manifestação do projeto: '
                               || (select string_agg(public.tema_rotulo(t), ', ' order by t) from unnest(g.temas) as t) end),
        jsonb_build_object('fator', 'prazo', 'peso', 10, 'pontos', p_pra,
          'status', case when g.dias >= 90 then 'combina' when g.dias >= 30 then 'parcial' else 'nao_combina' end,
          'detalhe', g.dias || ' dias para captar')
      ) as fatores
    from g
    order by g.nota desc, cardinality(g.grupos), g.dias desc, g.id
    limit c_top
  ) x
  on conflict (empresa_id, projeto_id) do update set
    explicacao = case when m.fatores = excluded.fatores and m.nota = excluded.nota then m.explicacao end,
    modelo = case when m.fatores = excluded.fatores and m.nota = excluded.nota then m.modelo end,
    versao_prompt = case when m.fatores = excluded.fatores and m.nota = excluded.nota then m.versao_prompt end,
    nota = excluded.nota, fatores = excluded.fatores, posicao = excluded.posicao,
    versao_regras = excluded.versao_regras, calculado_em = excluded.calculado_em;

  get diagnostics v_total = row_count;
  delete from public.matching_resultados where empresa_id = p_empresa and calculado_em < v_inicio; -- saiu do top 100
  select max(nota) into v_nota_max from public.matching_resultados where empresa_id = p_empresa;

  insert into public.matching_execucoes (empresa_id, versao_regras, hash_perfil, total_resultados, calculado_em, dia, execucoes_no_dia)
  values (p_empresa, c_versao, v_hash, v_total, now(), current_date, 1)
  on conflict (empresa_id) do update set
    versao_regras = excluded.versao_regras, hash_perfil = excluded.hash_perfil, total_resultados = excluded.total_resultados,
    calculado_em = excluded.calculado_em,
    execucoes_no_dia = case when public.matching_execucoes.dia = current_date then public.matching_execucoes.execucoes_no_dia + 1 else 1 end,
    dia = current_date;

  return jsonb_build_object('ok', true, 'cache', false, 'total', v_total, 'nota_maxima', v_nota_max, 'calculado_em', now());
end $$;
revoke execute on function public.calcular_matching_para(uuid, boolean) from public, anon, authenticated;

-- Uso do app: a empresa logada calcula o PRÓPRIO matching. Não recebe parâmetro, então não dá para pedir o de outra empresa.
create or replace function public.calcular_matching()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_empresa uuid;
begin
  if auth.uid() is null or not public.tem_papel('incentivador') then
    raise exception 'Apenas empresas incentivadoras podem calcular o matching.' using errcode = '42501';
  end if;
  select id into v_empresa from public.empresas where user_id = auth.uid();
  if v_empresa is null then
    raise exception 'Cadastre sua empresa antes de calcular o matching.' using errcode = 'P0001';
  end if;
  return public.calcular_matching_para(v_empresa, false);
end $$;
revoke execute on function public.calcular_matching() from public, anon;
grant execute on function public.calcular_matching() to authenticated;

-- Leitura pelo app: só projetos com prazo aberto, só da própria empresa (RLS).
drop view if exists public.vw_matching;
create view public.vw_matching with (security_invoker = true) as
select m.empresa_id, m.nota, m.posicao, m.fatores, m.explicacao, m.calculado_em, v.*
from public.matching_resultados m
join public.vw_aptos_vigentes v on v.id = m.projeto_id;

-- Preenche as colunas derivadas dos projetos que já existem
select public.recalcular_derivados();
