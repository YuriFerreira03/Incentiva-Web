#!/usr/bin/env python3
"""Baixa a planilha 'Projetos aptos à captação' do gov.br para ./aptos.xlsx.

O nome do arquivo muda a cada atualização (ex.: ...ajustada-05-10-26.xlsx),
então o link é lido da página oficial da Lei de Incentivo ao Esporte.

Variáveis opcionais (usadas em testes):
    PAGINA_URL     página onde procurar o link
    URL_PLANILHA   pula a busca na página e baixa direto desta URL
"""
import hashlib
import html
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PAGINA = os.environ.get(
    "PAGINA_URL",
    "https://www.gov.br/esporte/pt-br/acoes-e-programas-1/lei-de-incentivo-ao-esporte",
)
DESTINO = "aptos.xlsx"
TAMANHO_MINIMO = 100_000  # bytes; planilha real tem alguns MB
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def baixar(url, tentativas=3):
    ultimo = None
    for i in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9", "Accept": "*/*"}
            )
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            ultimo = f"HTTP {e.code}"
            if e.code in (401, 403, 404):  # insistir não adianta
                break
        except Exception as e:  # rede, timeout, DNS
            ultimo = f"{type(e).__name__}: {e}"
        if i < tentativas:
            time.sleep(3 * i)
    sys.exit(
        f"ERRO: não consegui baixar {url}\n  motivo: {ultimo}\n"
        "  Se for 401/403, o gov.br pode estar bloqueando este servidor (IP fora do Brasil)."
    )


def achar_link(pagina_html):
    links = [html.unescape(h) for h in re.findall(r'href="([^"]+)"', pagina_html)]
    xlsx = [h for h in links if ".xlsx" in h.lower()]
    candidatos = [h for h in xlsx if "aptos" in h.lower()]
    if not candidatos:
        sys.exit(
            "ERRO: não achei link de planilha 'aptos' na página.\n"
            f"  .xlsx encontrados: {xlsx or 'nenhum'}\n"
            "  A página pode ter mudado de endereço ou de layout."
        )
    return urllib.parse.urljoin(PAGINA, candidatos[0])


def main():
    url = os.environ.get("URL_PLANILHA")
    if not url:
        pagina = baixar(PAGINA).decode("utf-8", errors="replace")
        url = achar_link(pagina)
    print("Planilha:", url)

    dados = baixar(url)
    if not dados.startswith(b"PK") or len(dados) < TAMANHO_MINIMO:
        sys.exit(
            f"ERRO: o arquivo baixado não parece um .xlsx válido ({len(dados)} bytes, começa com {dados[:12]!r})."
        )
    with open(DESTINO, "wb") as f:
        f.write(dados)
    print(f"OK: {DESTINO} ({len(dados):,} bytes, sha256 {hashlib.sha256(dados).hexdigest()[:12]})")


if __name__ == "__main__":
    main()
