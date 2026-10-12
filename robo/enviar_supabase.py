#!/usr/bin/env python3
"""Envia saida/aptos_supabase.csv para a tabela projetos_autorizados (upsert).

Uso:
    python3 robo/enviar_supabase.py saida/aptos_supabase.csv [--dry-run]

Variáveis de ambiente (segredos do GitHub):
    SUPABASE_URL                ex.: https://xxxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY   chave secreta (nunca vai para o navegador nem para o repositório)

O upsert usa a chave (processo, sli). O id e criado_em de projetos já existentes
são preservados, então outras tabelas poderão apontar para eles no futuro.
"""
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

TABELA = "projetos_autorizados"
LOTE = 1000
MIN_LINHAS = 16_000  # a lista oficial tem ~16,8 mil; muito abaixo disso o layout provavelmente mudou
MAX_PROCESSO_INVALIDO_PCT = 2.0
COLUNAS = [
    "processo", "sli", "proponente", "projeto", "manifestacao", "regime", "modalidade",
    "cnpj", "cidade", "uf", "valor_autorizado", "data_publicacao", "prazo_captacao", "qualidade",
]


def ler(caminho):
    linhas = []
    with open(caminho, newline="", encoding="utf-8") as f:
        leitor = csv.DictReader(f)
        faltando = [c for c in COLUNAS if c not in (leitor.fieldnames or [])]
        if faltando:
            sys.exit(f"ERRO: CSV sem as colunas {faltando}")
        for r in leitor:
            linha = {}
            for c in COLUNAS:
                v = (r.get(c) or "").strip()
                if v == "":
                    linha[c] = None
                elif c == "valor_autorizado":
                    linha[c] = float(v)
                else:
                    linha[c] = v
            linhas.append(linha)
    return linhas


def validar(linhas):
    """Trava de segurança: se a planilha mudou de formato, não envia lixo para o banco."""
    if len(linhas) < MIN_LINHAS:
        sys.exit(f"ABORTADO: só {len(linhas)} linhas (mínimo {MIN_LINHAS}). A planilha mudou de formato?")
    ruins = sum(1 for l in linhas if "processo_formato" in (l["qualidade"] or ""))
    pct = 100 * ruins / len(linhas)
    if pct > MAX_PROCESSO_INVALIDO_PCT:
        sys.exit(f"ABORTADO: {pct:.1f}% dos processos fora do padrão (máximo {MAX_PROCESSO_INVALIDO_PCT}%).")
    chaves = [(l["processo"], l["sli"]) for l in linhas]
    if len(set(chaves)) != len(chaves):
        sys.exit("ABORTADO: há (processo, sli) repetido no CSV.")
    sem_obrigatorio = sum(1 for l in linhas if not (l["processo"] and l["proponente"] and l["projeto"]))
    if sem_obrigatorio:
        sys.exit(f"ABORTADO: {sem_obrigatorio} linhas sem processo/proponente/projeto.")


def cabecalhos(chave):
    h = {"apikey": chave, "Content-Type": "application/json"}
    if chave.startswith("eyJ"):  # chave antiga (JWT) também vai em Authorization
        h["Authorization"] = f"Bearer {chave}"
    return h


def requisitar(metodo, url, chave, corpo=None, extra=None, tentativas=4):
    h = cabecalhos(chave)
    h.update(extra or {})
    dados = json.dumps(corpo, ensure_ascii=False).encode("utf-8") if corpo is not None else None
    for i in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, data=dados, headers=h, method=metodo)
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < tentativas:
                time.sleep(5 * i)
                continue
            sys.exit(f"ERRO Supabase HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:500]}")
        except Exception as e:
            if i < tentativas:
                time.sleep(5 * i)
                continue
            sys.exit(f"ERRO de rede ao falar com o Supabase: {type(e).__name__}: {e}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    seco = "--dry-run" in sys.argv
    if not args:
        sys.exit("Uso: enviar_supabase.py saida/aptos_supabase.csv [--dry-run]")

    linhas = ler(args[0])
    validar(linhas)
    print(f"CSV válido: {len(linhas)} linhas")
    if seco:
        print("--dry-run: nada foi enviado.")
        return

    base = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    chave = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not base or not chave:
        sys.exit("ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (segredos do GitHub).")

    agora = datetime.now(timezone.utc).isoformat()
    url = f"{base}/rest/v1/{TABELA}?on_conflict=processo,sli"
    for i in range(0, len(linhas), LOTE):
        lote = [dict(l, atualizado_em=agora) for l in linhas[i:i + LOTE]]
        requisitar("POST", url, chave, lote, {"Prefer": "resolution=merge-duplicates,return=minimal"})
        print(f"  enviado {min(i + LOTE, len(linhas))}/{len(linhas)}")

    _, cab, _ = requisitar(
        "GET", f"{base}/rest/v1/vw_aptos_vigentes?select=id", chave,
        extra={"Prefer": "count=exact", "Range": "0-0"},
    )
    print("Vigentes na view agora:", (cab.get("Content-Range") or cab.get("content-range") or "?").split("/")[-1])
    print("OK")


if __name__ == "__main__":
    main()
