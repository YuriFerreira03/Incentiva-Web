#!/usr/bin/env python3
"""Importador da planilha "Projetos aptos à captação" (gov.br) -> CSV limpo.

Uso:
    python3 scripts/importar_aptos.py aptos.xlsx
    python3 scripts/importar_aptos.py aptos.xlsx --hoje 2026-10-12

Saída (pasta saida/):
    aptos_limpo.csv    todas as linhas, normalizadas, com status_prazo e qualidade
    aptos_revisar.csv  linhas com algum problema de dados (exceto só "sem_cidade")
    aptos_supabase.csv colunas da tabela projetos_autorizados (para importar no Supabase)
"""
import argparse
import re
import sys
from datetime import date
from pathlib import Path

import pandas as pd

UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}

MANIF = {
    "educacional": "Educacional",
    "desporto educacional": "Educacional",
    "participação": "Participação",
    "participacao": "Participação",
    "rendimento": "Rendimento",
    "desporto de rendimento": "Rendimento",
    "formação esportiva": "Formação Esportiva",
    "formacao esportiva": "Formação Esportiva",
    "esporte para toda vida": "Esporte para Toda a Vida",
    "esporte para toda a vida": "Esporte para Toda a Vida",
    "excelência esportiva": "Excelência Esportiva",
    "excelencia esportiva": "Excelência Esportiva",
    "rendimento / formação": "Rendimento / Formação",
    "rendimento / formacao": "Rendimento / Formação",
    "obra": "Obra",
}
REGIME_NOVO = {"Formação Esportiva", "Esporte para Toda a Vida", "Excelência Esportiva"}
REGIME_ANTIGO = {"Educacional", "Participação", "Rendimento"}

PROCESSO_RE = re.compile(r"^\d{5}\.\d{6}/\d{4}-\d{2}$")


def vazio(v):
    return v is None or (not isinstance(v, str) and pd.isna(v))


def txt(v):
    if vazio(v):
        return None
    s = str(v).replace("_x000D_", " ")
    s = re.sub(r"[\u200b\xa0]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s or None


def valor(v):
    if vazio(v):
        return None
    if isinstance(v, (int, float)):
        return round(float(v), 2)
    s = re.sub(r"[^\d,.]", "", str(v))
    if not s:
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    elif s.count(".") == 1 and len(s.split(".")[1]) == 2:
        pass  # ponto decimal
    else:
        s = s.replace(".", "")
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def cnpj_dv_ok(d):
    """Módulo 11 da Receita. Valor do caractere = código ASCII - 48 (vale para dígitos e, desde 31/07/2026, letras)."""
    vals = [ord(ch) - 48 for ch in d]
    for k, pesos in (
        (12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]),
        (13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]),
    ):
        r = sum(a * b for a, b in zip(vals[:k], pesos)) % 11
        if vals[k] != (0 if r < 2 else 11 - r):
            return False
    return True


def cnpj(v):
    """Retorna (cnpj_formatado_ou_None, flags). Aceita CNPJ numérico e alfanumérico."""
    s = txt(v)
    if not s:
        return None, ["cnpj_invalido"]
    s = re.sub(r"^[A-Za-z]{1,4}\s*:\s*", "", s)  # rótulo digitado junto ("J: 04.162...")
    d = re.sub(r"[^0-9A-Za-z]", "", s).upper()
    flags = []
    if len(d) == 13 and d.isdigit():  # zero à esquerda perdido
        d = d.zfill(14)
        flags.append("cnpj_corrigido")
    if re.fullmatch(r"[0-9A-Z]{12}[0-9]{2}", d) and not re.fullmatch(r"(\d)\1{13}", d) and cnpj_dv_ok(d):
        return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}", flags
    return None, ["cnpj_invalido"]


def norm_header(h):
    h = (txt(h) or "").lower()
    if h == "nº":
        return "n"
    if h.startswith("processo"):
        return "processo"
    if h.startswith("proponente"):
        return "proponente"
    if h.startswith("projeto"):
        return "projeto"
    if h == "sli":
        return "sli"
    if h.startswith("contagem"):
        return "contagem_sli"
    if h.startswith("manifesta"):
        return "manifestacao"
    if h.startswith("modalidade"):
        return "modalidade"
    if h == "cnpj":
        return "cnpj"
    if h == "uf":
        return "uf"
    if h.startswith("valor"):
        return "valor"
    if h.startswith("data da publica"):
        return "data_publicacao"
    if h.startswith("per") and "capta" in h:
        return "prazo_captacao"
    return h


def ler(caminho):
    bruto = pd.read_excel(caminho, sheet_name=0, header=None)
    hr = None
    for i in range(min(15, len(bruto))):
        if any(txt(c) == "Processo" for c in bruto.iloc[i].tolist()):
            hr = i
            break
    if hr is None:
        sys.exit("Cabeçalho com a coluna 'Processo' não encontrado.")
    cab = [txt(c) for c in bruto.iloc[hr].tolist()]
    nomes = []
    for i, h in enumerate(cab):
        if h is None and i > 0 and cab[i - 1] == "CNPJ":
            nomes.append("cidade")  # coluna sem título entre CNPJ e UF
        else:
            nomes.append(norm_header(h))
    df = bruto.iloc[hr + 1:].copy()
    df.columns = nomes
    df = df[df["processo"].notna()].reset_index(drop=True)
    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx")
    ap.add_argument("--hoje", default=None, help="AAAA-MM-DD (padrão: hoje)")
    ap.add_argument("--saida", default="saida")
    a = ap.parse_args()

    hoje = pd.Timestamp(a.hoje) if a.hoje else pd.Timestamp(date.today())
    df = ler(a.xlsx)

    linhas = []
    for _, r in df.iterrows():
        flags = []
        processo = txt(r.get("processo"))
        if not processo or not PROCESSO_RE.match(processo):
            flags.append("processo_formato")

        cn, f = cnpj(r.get("cnpj"))
        flags += f

        uf = (txt(r.get("uf")) or "").upper() or None
        if uf not in UFS:
            if uf:
                flags.append("uf_invalida")
            uf = None

        cidade = txt(r.get("cidade"))
        if not cidade:
            flags.append("sem_cidade")

        manif_raw = txt(r.get("manifestacao"))
        chave_m = re.sub(r"\s*/\s*", " / ", (manif_raw or "").lower())
        manif = MANIF.get(chave_m)
        if manif is None:
            flags.append("manifestacao_invalida")
        regime = (
            "novo" if manif in REGIME_NOVO
            else "antigo" if manif in REGIME_ANTIGO
            else "misto" if manif == "Rendimento / Formação"
            else "obra" if manif == "Obra"
            else None
        )

        val = valor(r.get("valor"))
        if val is None:
            flags.append("sem_valor")

        pub = pd.to_datetime(r.get("data_publicacao"), errors="coerce", dayfirst=True)
        prazo = pd.to_datetime(r.get("prazo_captacao"), errors="coerce", dayfirst=True)
        if pd.isna(pub):
            flags.append("sem_data_publicacao")
        if pd.isna(prazo):
            flags.append("sem_prazo")
            status = "sem_prazo"
            dias = None
        else:
            status = "vigente" if prazo >= hoje else "vencido"
            dias = int((prazo - hoje).days)

        linhas.append({
            "processo": processo,
            "sli": txt(r.get("sli")),
            "proponente": txt(r.get("proponente")),
            "projeto": txt(r.get("projeto")),
            "manifestacao": manif,
            "regime": regime,
            "modalidade": txt(r.get("modalidade")),
            "cnpj": cn,
            "cnpj_original": txt(r.get("cnpj")),
            "cidade": cidade,
            "uf": uf,
            "valor_autorizado": val,
            "data_publicacao": None if pd.isna(pub) else pub.date().isoformat(),
            "prazo_captacao": None if pd.isna(prazo) else prazo.date().isoformat(),
            "status_prazo": status,
            "dias_para_vencer": dias,
            "qualidade": ";".join(flags),
        })

    out = pd.DataFrame(linhas)
    out["dias_para_vencer"] = out["dias_para_vencer"].astype("Int64")

    # Duplicata real = mesmo processo + SLI + projeto. Mantém a publicação mais recente.
    # (O mesmo SLI aparece em processos diferentes: isso NÃO é duplicata.)
    n0 = len(out)
    out["_chave"] = (
        out["processo"].fillna("") + "|" + out["sli"].fillna("") + "|"
        + out["projeto"].fillna("").str.lower()
    )
    out = out.sort_values("data_publicacao", na_position="first", kind="stable")
    tinha_dup = out.duplicated("_chave", keep=False)
    dup_mask = out.duplicated("_chave", keep="last")
    removidos = int(dup_mask.sum())
    out = out[~dup_mask].copy()
    marca = tinha_dup.loc[out.index]
    out.loc[marca, "qualidade"] = out.loc[marca, "qualidade"].apply(
        lambda q: (q + ";duplicado_resolvido").strip(";")
    )
    out = out.drop(columns="_chave").sort_index()
    # processo com mais de um projeto (informativo)
    multi = out.groupby("processo")["projeto"].transform("nunique") > 1
    out.loc[multi, "qualidade"] = out.loc[multi, "qualidade"].apply(
        lambda q: (q + ";processo_multiplo_projeto").strip(";")
    )

    pasta = Path(a.saida)
    pasta.mkdir(parents=True, exist_ok=True)
    out.to_csv(pasta / "aptos_limpo.csv", index=False, encoding="utf-8")

    # CSV alinhado à tabela projetos_autorizados do Supabase (sem colunas derivadas do dia)
    cols_db = [
        "processo", "sli", "proponente", "projeto", "manifestacao", "regime",
        "modalidade", "cnpj", "cidade", "uf", "valor_autorizado",
        "data_publicacao", "prazo_captacao", "qualidade",
    ]
    out[cols_db].to_csv(pasta / "aptos_supabase.csv", index=False, encoding="utf-8")

    sem_info = {"sem_cidade", "processo_multiplo_projeto"}
    precisa = out["qualidade"].apply(
        lambda q: any(f for f in q.split(";") if f and f not in sem_info)
    )
    out[precisa].to_csv(pasta / "aptos_revisar.csv", index=False, encoding="utf-8")

    # resumo
    print(f"Hoje (referência): {hoje.date()}")
    print(f"Linhas lidas: {n0} | duplicata real removida: {removidos} | final: {len(out)}")
    print("Chave (processo, sli) única:", not out.duplicated(["processo", "sli"]).any())
    print("status_prazo:", out["status_prazo"].value_counts().to_dict())
    v = out[out["status_prazo"] == "vigente"]
    print(f"Vigentes: {len(v)} | vencem em 60 dias: {int((v['dias_para_vencer'] <= 60).sum())}")
    print("Manifestação (vigentes):", v["manifestacao"].value_counts(dropna=False).to_dict())
    cont = {}
    for q in out["qualidade"]:
        for f in q.split(";"):
            if f:
                cont[f] = cont.get(f, 0) + 1
    print("Qualidade:", dict(sorted(cont.items(), key=lambda x: -x[1])))
    print(f"aptos_revisar.csv: {int(precisa.sum())} linhas")


if __name__ == "__main__":
    main()
