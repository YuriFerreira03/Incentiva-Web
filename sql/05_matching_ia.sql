-- INCENTIVA — Matching, Parte B: gravar a explicação escrita pela IA.
-- Rode DEPOIS do 04 (versão v2). Pode rodar de novo sem erro.
--
-- Quem chama: a função da Vercel (api/matching-explicar.js), usando o TOKEN DO PRÓPRIO USUÁRIO.
-- Por isso não é preciso colocar a chave service_role na Vercel.
-- A função grava só em linhas da empresa do usuário logado e só mexe no texto da explicação:
-- a nota e os fatores continuam sendo escritos apenas pelo cálculo do banco.

create or replace function public.salvar_explicacoes(p_itens jsonb, p_modelo text, p_versao_prompt text)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_empresa uuid;
  v_item jsonb;
  v_texto text;
  v_total int := 0;
  v_linhas int;
begin
  if auth.uid() is null or not public.tem_papel('incentivador') then
    raise exception 'Apenas empresas incentivadoras podem salvar explicações.' using errcode = '42501';
  end if;
  select id into v_empresa from public.empresas where user_id = auth.uid();
  if v_empresa is null then
    raise exception 'Cadastre sua empresa antes.' using errcode = 'P0001';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) > 20 then
    raise exception 'Formato inválido: esperado uma lista de até 20 itens.' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_texto := btrim(coalesce(v_item ->> 'texto', ''));
    continue when char_length(v_texto) < 20 or char_length(v_texto) > 600;
    continue when (v_item ->> 'projeto_id') is null or (v_item ->> 'projeto_id') !~ '^[0-9a-f-]{36}$';
    update public.matching_resultados
       set explicacao = v_texto, modelo = left(p_modelo, 80), versao_prompt = left(p_versao_prompt, 40)
     where empresa_id = v_empresa and projeto_id = (v_item ->> 'projeto_id')::uuid;
    get diagnostics v_linhas = row_count;
    v_total := v_total + v_linhas;
  end loop;
  return v_total;
end $$;

revoke execute on function public.salvar_explicacoes(jsonb, text, text) from public, anon;
grant execute on function public.salvar_explicacoes(jsonb, text, text) to authenticated;
