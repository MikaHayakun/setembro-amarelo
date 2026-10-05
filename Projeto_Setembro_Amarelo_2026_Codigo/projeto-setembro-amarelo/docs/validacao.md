# Relatório de validação — 5 de outubro de 2026

Ambiente de execução: Python 3.12.14, Node.js 24.19.0. O código do backend utiliza recursos disponíveis em Python 3.9 ou superior; a execução automatizada foi realizada na versão indicada.

## Testes realizados

Comando: `python3 -m unittest discover -s tests -v`.

Resultado: **8 testes aprovados** com HTTP real e SQLite temporário.

1. Estado do servidor e lista dos 12 meses ordenados.
2. Consulta de todos os meses, 16 fontes resolvidas e histórico de Setembro.
3. Rejeição de meses fora do intervalo, texto e entradas malformadas.
4. Bloqueio de arquivos internos e caminhos desconhecidos.
5. Rejeição de POST.
6. Entrega dos arquivos públicos, presença dos canais de ajuda e cabeçalhos.
7. Integridade e relações por chaves estrangeiras do banco.
8. Preservação de um dado após reiniciar o processo do servidor.

Comando complementar: `node --check frontend/app.js`. Resultado: sintaxe válida. O Node é usado somente para esta verificação, não para executar o aplicativo.

O banco de distribuição foi inicializado e tem 12 campanhas, 16 fontes e referências relacionadas. O documento DOCX foi convertido em PDF e as 15 páginas foram inspecionadas visualmente; foram corrigidos os espaços das tabelas e a largura da coluna da jornada.

## Limites da verificação

A revisão do documento não corresponde a uma revisão da interface em navegador. Não foi feito teste em navegador gráfico, leitor de tela, com usuários, conexão externa dos dispositivos da equipe ou reprodução de voz. As larguras, o teclado, o zoom e o contraste devem ser conferidos conforme `telas.md`. Não se declara conformidade formal de acessibilidade nem eficácia clínica.

## Itens da entrega externa

A equipe deve preencher sua identificação, revisar a aplicação no dispositivo da apresentação, gravar o vídeo de até 60 segundos, publicar o repositório público e comprovar commits reais. Este pacote não contém um vídeo gravado nem um link de GitHub fictício.

## Execução local do material recebido — 5 de outubro de 2026

Ambiente desta execução: Python 3.13.3 e Node.js 24.15.0.

- Os oito testes de integração passaram com servidor HTTP e banco temporário.
- `node --check frontend/app.js` passou sem erros de sintaxe.
- A consulta somente de leitura ao banco fornecido retornou integridade `ok`, 12 campanhas e 16 fontes.
- O servidor foi iniciado em `http://127.0.0.1:8000`. A página HTML, `/api/health` e `/api/campaigns/9` responderam corretamente; o conteúdo de Setembro retornou quatro marcos históricos e sete fontes.
- O material original foi registrado no Git local no commit `6150f28`. Nenhum repositório remoto foi publicado.

Esta execução confirma funcionamento local e testes automatizados. A revisão em navegador gráfico, com leitor de tela e reprodução de voz continua pendente.
