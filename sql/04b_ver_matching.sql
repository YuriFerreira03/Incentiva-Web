-- Como ver o matching funcionando, SEM depender da tela. Rode UM bloco por vez (selecione e clique em Run).
-- Pré-requisito: a empresa já tem as preferências salvas (cadastro da empresa, passo 3).

-- 1) Cobertura da regra de modalidades nos projetos com prazo aberto
select count(*) as vigentes,
       count(*) filter (where cardinality(modalidade_grupos) > 0) as com_grupo,
       count(*) filter (where modalidade_inferida) as inferidos_pelo_nome
from public.projetos_autorizados where prazo_captacao >= current_date;

-- 2) Descubra o id da sua empresa
select id, razao_social, cnpj from public.empresas;

-- 3) Calcule o matching (troque COLE-O-ID-AQUI pelo id do passo 2)
select public.calcular_matching_para('COLE-O-ID-AQUI', true);

-- 4) Veja os 10 melhores, com os fatores que explicam a nota
select m.nota, p.projeto, p.proponente, p.uf, p.modalidade, p.valor_autorizado,
       (p.prazo_captacao - current_date) as dias_para_captar, m.fatores
from public.matching_resultados m
join public.projetos_autorizados p on p.id = m.projeto_id
where m.empresa_id = 'COLE-O-ID-AQUI'
order by m.nota desc, p.prazo_captacao desc
limit 10;
