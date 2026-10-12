import pgserver, tempfile, psycopg2, uuid, sys
srv = pgserver.get_server(tempfile.mkdtemp(prefix="pgtest"))
uri = srv.get_uri()
adm = psycopg2.connect(uri); adm.autocommit = True
cur = adm.cursor()

def cnpj_ok(base12):
    def dv(n, w):
        r = sum((ord(a)-48)*b for a, b in zip(n, w)) % 11
        return 0 if r < 2 else 11 - r
    d1 = dv(base12, [5,4,3,2,9,8,7,6,5,4,3,2]); d2 = dv(base12+str(d1), [6,5,4,3,2,9,8,7,6,5,4,3,2])
    return base12 + str(d1) + str(d2)
C1, C2, C3 = cnpj_ok("112223330001"), cnpj_ok("445556660001"), cnpj_ok("778889990001")
CA = cnpj_ok("12ABC34501DE")   # exemplo oficial da Receita: 12.ABC.345/01DE-35
assert CA == "12ABC34501DE35", CA
fmt = lambda d: f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"

cur.execute("""
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

create table public.projetos (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), nome text);
alter table public.projetos enable row level security;
create policy "users see own projects" on public.projetos for all to public using (auth.uid() = user_id);

create table public.projetos_autorizados (
  id uuid primary key default gen_random_uuid(), processo text not null, sli text, proponente text not null, projeto text not null,
  manifestacao text, regime text, modalidade text, cnpj text, cidade text, uf text, valor_autorizado numeric,
  data_publicacao date, prazo_captacao date, qualidade text, fonte text not null default 'gov_xlsx',
  criado_em timestamptz default now(), atualizado_em timestamptz default now(), unique (processo, sli));
alter table public.projetos_autorizados enable row level security;
create policy "leitura autenticados" on public.projetos_autorizados for select to authenticated using (true);
create view public.vw_aptos_vigentes with (security_invoker = true) as
  select p.*, (p.prazo_captacao - current_date) as dias_para_vencer from public.projetos_autorizados p where p.prazo_captacao >= current_date;

create table public.projetos_captacao (id uuid primary key default gen_random_uuid(), processo text not null, proponente text, projeto text);
alter table public.projetos_captacao enable row level security;
create policy "leitura publica projetos_captacao" on public.projetos_captacao for select to public using (true);
insert into public.projetos_captacao (processo, proponente, projeto) values ('x','y','z');
""")
cur.execute(f"""insert into public.projetos_autorizados (processo, sli, proponente, projeto, cnpj, uf, valor_autorizado, prazo_captacao) values
 ('1','1','Ent D','P1','{fmt(C3)}','MG',100,current_date+100),
 ('2','2','Ent D','P2','{fmt(C3)}','MG',200,current_date+200),
 ('3','3','Outra','P3','{fmt(C2)}','SP',300,current_date+300)""")
U = {}
for n in "ABCDE":
    cur.execute("insert into auth.users (email) values (%s) returning id", (n.lower()+"@t.com",)); U[n] = cur.fetchone()[0]
cur.execute("insert into public.projetos (user_id, nome) values (%s,'proj de A')", (U["A"],))

def como(user, sql, params=None, role="authenticated"):
    c = psycopg2.connect(uri); k = c.cursor()
    try:
        k.execute(f"set local role {role}")
        k.execute("select set_config('request.jwt.claim.sub', %s, true)", (str(user) if user else "",))
        k.execute(sql, params)
        r = k.fetchall() if k.description else k.rowcount
        c.commit(); return ("ok", r)
    except Exception as e:
        c.rollback(); return ("erro", str(e).strip().splitlines()[0][:95])
    finally: c.close()

res = []
def t(nome, cond, extra=""):
    res.append(cond); print(("OK    " if cond else "FALHA ") + nome + (f"  [{extra}]" if extra and not cond else ""))

A03 = open("../sql/03a_perfis_e_acesso.sql", encoding="utf-8").read()
B03 = open("../sql/03b_restringir_acesso.sql", encoding="utf-8").read()
cur.execute(A03)

print("\n== Parte A aplicada (acesso antigo deve continuar igual) ==")
cur.execute("select user_id from public.perfis_acesso where papel='proponente'")
papeis = {r[0] for r in cur.fetchall()}
t("migração: quem tem projeto no Módulo A virou proponente", papeis == {U["A"]})
t("B (sem papel) ainda lê a vitrine (parte B ainda não aplicada)", como(U["B"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 3)
t("A ainda lê o próprio projeto", como(U["A"], "select count(*) from public.projetos")[1][0][0] == 1)

cur.execute(B03)
print("\n== Parte B aplicada ==")
t("A (proponente) lê o próprio projeto", como(U["A"], "select count(*) from public.projetos")[1][0][0] == 1)
t("A (proponente) cria projeto", como(U["A"], "insert into public.projetos (user_id, nome) values (%s,'novo')", (str(U["A"]),))[0] == "ok")
t("B (sem papel) NÃO cria projeto", como(U["B"], "insert into public.projetos (user_id, nome) values (%s,'x')", (str(U["B"]),))[0] == "erro")
t("B (sem papel) NÃO lê a vitrine", como(U["B"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 0)
t("A (proponente sem entidade) NÃO lê a vitrine", como(U["A"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 0)
t("anônimo NÃO lê a vitrine", como(None, "select count(*) from public.vw_aptos_vigentes", role="anon")[0] == "erro" or como(None, "select count(*) from public.vw_aptos_vigentes", role="anon")[1][0][0] == 0)

print("\n== Empresa (incentivador) ==")
emp = lambda u, cnpj, **k: como(u, """insert into public.empresas (user_id,cnpj,razao_social,uf,municipio,porte,responsavel_nome,responsavel_email,aceite_termos,aceite_lgpd)
   values (%s,%s,'Empresa C','SP','São Paulo','media','Resp','r@empresa.com',%s,%s) returning cnpj""",
   (str(u), cnpj, k.get("termos", True), k.get("lgpd", True)))
r = emp(U["C"], "".join(ch for ch in C1))   # só dígitos
t("empresa com CNPJ só dígitos é aceita e gravada formatada", r[0] == "ok" and r[1][0][0] == fmt(C1), r)
t("papel incentivador nasceu por trigger", como(U["C"], "select papel from public.perfis_acesso")[1] == [("incentivador",)])
t("C (incentivador) lê toda a vitrine", como(U["C"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 3)
t("CNPJ inválido é rejeitado", emp(U["E"], "11.111.111/0001-11")[0] == "erro")
t("CNPJ todo zero é rejeitado", emp(U["E"], "00000000000000")[0] == "erro")
t("CNPJ repetido (outro usuário) é rejeitado", emp(U["E"], fmt(C1))[0] == "erro")
t("aceite de termos = false é rejeitado", emp(U["E"], fmt(C2), termos=False)[0] == "erro")
t("usuário E não ganhou papel nas tentativas que falharam", como(U["E"], "select count(*) from public.perfis_acesso")[1][0][0] == 0)
t("não dá para criar empresa já verificada", como(U["E"], """insert into public.empresas (user_id,cnpj,razao_social,uf,municipio,porte,responsavel_nome,responsavel_email,aceite_termos,aceite_lgpd,verificada)
   values (%s,%s,'X','SP','SP','micro','R','r@x.com',true,true,true)""", (str(U["E"]), fmt(C2)))[0] == "erro")
t("não dá para se auto-verificar (update)", como(U["C"], "update public.empresas set verificada = true")[0] == "erro")
t("não dá para trocar o CNPJ depois", como(U["C"], "update public.empresas set cnpj = %s", (fmt(C2),))[0] == "erro")
t("pode editar razão social", como(U["C"], "update public.empresas set razao_social = 'Nova' returning razao_social")[1] == [("Nova",)])
t("não dá para se dar papel direto", como(U["C"], "insert into public.perfis_acesso (user_id, papel) values (%s,'proponente')", (str(U["C"]),))[0] == "erro")
t("C não lê empresa de outro", como(U["C"], "select count(*) from public.empresas")[1][0][0] == 1)

print("\n== Preferências ==")
cur.execute("select id from public.empresas"); emp_c = cur.fetchone()[0]
t("C grava preferências da própria empresa", como(U["C"], "insert into public.incentivador_preferencias (empresa_id, ufs, temas, valor_min_projeto, valor_max_projeto) values (%s, '{SP,MG}', '{base}', 1000, 50000)", (str(emp_c),))[0] == "ok")
t("valor mínimo > máximo é rejeitado", como(U["C"], "update public.incentivador_preferencias set valor_min_projeto = 99999")[0] == "erro")
r = emp(U["D"], fmt(C2)); cur.execute("select id from public.empresas where user_id=%s", (U["D"],)); emp_d = cur.fetchone()[0]
t("outro usuário NÃO grava preferências na empresa de C", como(U["D"], "insert into public.incentivador_preferencias (empresa_id) values (%s)", (str(emp_c),))[0] == "erro")
cur.execute("delete from public.empresas where user_id=%s", (U["D"],)); cur.execute("delete from public.perfis_acesso where user_id=%s", (U["D"],))

print("\n== Proponente com entidade (reivindicação por CNPJ) ==")
ent = como(U["D"], """insert into public.entidades (user_id,cnpj,razao_social,tipo,uf,municipio,responsavel_nome) values (%s,%s,'Ent D','associacao','MG','Juiz de Fora','Resp') returning cnpj""", (str(U["D"]), C3))
t("entidade criada, CNPJ formatado", ent[0] == "ok" and ent[1][0][0] == fmt(C3), ent)
t("papel proponente nasceu por trigger", como(U["D"], "select papel from public.perfis_acesso")[1] == [("proponente",)])
t("D vê SÓ os projetos autorizados do próprio CNPJ (2 de 3)", como(U["D"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 2)
t("D cria projeto no Módulo A", como(U["D"], "insert into public.projetos (user_id, nome) values (%s,'d')", (str(U["D"]),))[0] == "ok")
t("D não vê projeto de A", como(U["D"], "select count(*) from public.projetos where nome='proj de A'")[1][0][0] == 0)

print("\n== Conta com os dois papéis (teste do dono) e robô ==")
cur.execute("insert into public.perfis_acesso (user_id, papel) values (%s,'proponente'),(%s,'incentivador')", (U["E"], U["E"]))
t("conta com os dois papéis acessa Módulo A e B", como(U["E"], "select count(*) from public.vw_aptos_vigentes")[1][0][0] == 3 and como(U["E"], "insert into public.projetos (user_id,nome) values (%s,'e')", (str(U["E"]),))[0] == "ok")
t("service_role (robô) faz upsert em projetos_autorizados", como(None, "insert into public.projetos_autorizados (processo,sli,proponente,projeto,prazo_captacao) values ('9','9','R','R',current_date+5) on conflict (processo,sli) do update set projeto='R2'", role="service_role")[0] == "ok")
t("anônimo não chama tem_papel", como(None, "select public.tem_papel('incentivador')", role="anon")[0] == "erro")
t("anônimo não lê empresas", como(None, "select count(*) from public.empresas", role="anon")[0] == "erro")

print("\n== Idempotência e tabela antiga ==")
try:
    cur.execute(A03); cur.execute(B03); ok = True
except Exception as e:
    ok = False; print(e)
t("03a e 03b rodam de novo sem erro", ok)
t("03b fecha a leitura pública da tabela antiga projetos_captacao", como(None, "select count(*) from public.projetos_captacao", role="anon")[1][0][0] == 0)

print("\n== CNPJ alfanumérico (vigente desde 31/07/2026) ==")
cur.execute("select public.cnpj_valido('12.ABC.345/01DE-35'), public.cnpj_valido('12.ABC.345/01DE-34'), public.cnpj_valido('12abc34501de35'), public.cnpj_valido('12.ABC.345/01DE-3A'), public.cnpj_valido('11.222.333/0001-81')")
a = cur.fetchone()
t("exemplo oficial da Receita (12.ABC.345/01DE-35) é válido", a[0] is True, a)
t("mesmo CNPJ com DV errado é inválido", a[1] is False)
t("minúsculas e sem pontuação também validam", a[2] is True)
t("letra nos dígitos verificadores é rejeitada", a[3] is False)
t("CNPJ numérico antigo continua válido", a[4] is True)
cur.execute("select public.cnpj_formatar('12abc34501de35')"); t("formata para XX.XXX.XXX/XXXX-DD em maiúsculas", cur.fetchone()[0] == "12.ABC.345/01DE-35")
r = como(U["B"], """insert into public.empresas (user_id,cnpj,razao_social,uf,municipio,porte,responsavel_nome,responsavel_email,aceite_termos,aceite_lgpd)
   values (%s,%s,'Empresa Nova','RJ','Niterói','pequena','R','r@nova.com',true,true) returning cnpj""", (str(U["B"]), "12abc34501de35"))
t("empresa com CNPJ alfanumérico é aceita e gravada formatada", r[0] == "ok" and r[1][0][0] == "12.ABC.345/01DE-35", r)
t("empresa com CNPJ alfanumérico de DV errado é rejeitada", como(U["A"], """insert into public.empresas (user_id,cnpj,razao_social,uf,municipio,porte,responsavel_nome,responsavel_email,aceite_termos,aceite_lgpd)
   values (%s,'12ABC34501DE99','X','RJ','X','micro','R','r@x.com',true,true)""", (str(U["A"]),))[0] == "erro")

print(f"\n{sum(res)}/{len(res)} verificações passaram"); sys.exit(0 if all(res) else 1)
