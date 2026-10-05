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
- O código original foi registrado no Git local. Os PDFs e o emblema original foram excluídos do versionamento e do histórico por solicitação do responsável. Nenhum repositório remoto foi publicado.

Esta execução confirma funcionamento local e testes automatizados. A revisão em navegador gráfico, com leitor de tela e reprodução de voz continua pendente.

## Modernização visual — 5 de outubro de 2026

A direção visual foi confirmada pelo responsável: amarelo marcante e maior contraste. O layout usa amarelo, verde profundo, espaçamento consistente e duas fontes variáveis servidas localmente. O emblema foi mantido intacto; a imagem e os PDFs continuam fora do versionamento.

- Os oito testes de integração passaram, incluindo a entrega das duas fontes como `font/woff2` e a preservação das rotas privadas.
- A sintaxe do JavaScript foi verificada com `node --check frontend/app.js`.
- No Firefox, a interface carregou os 12 meses, o emblema e as fontes. As larguras de 1440, 1024, 768 e 500 pixels não apresentaram rolagem horizontal da página. Capturas em 390 e 320 pixels também foram inspecionadas; o título e o botão foram ajustados para a tela de 320 pixels.
- A seleção de Janeiro, Outubro e Setembro foi verificada por clique. Enter no botão de Janeiro ativou a campanha e transferiu o foco para seu título.
- Foi confirmado que as fontes carregam apenas do servidor local. A abertura e a seção de apoio foram inspecionadas em capturas reais do navegador.
- Os pares principais de texto e fundo tiveram contraste entre 4,78:1 e 12,24:1. Essa checagem não equivale a uma auditoria completa de acessibilidade.

Continuam pendentes testes com usuários, leitor de tela, zoom de 200% e reprodução de voz no dispositivo da apresentação. As capturas e os perfis de verificação ficam apenas na `.cache` local, ignorada pelo Git.

## Fumaças das campanhas — 5 de outubro de 2026

O vídeo fornecido foi usado somente para observar o movimento. O efeito foi criado em Canvas com texturas procedurais, usando as cores já registradas para cada mês. Não foram incorporados vídeo, letras, imagens de fundo ou cores da referência.

- Os oito testes HTTP passaram, incluindo a nova rota pública `/smoke.js`. Os dois arquivos JavaScript passaram na verificação de sintaxe do Node.
- No Firefox, os 12 botões iniciaram uma única animação por vez e continuaram selecionando os conteúdos. A camada decorativa não intercepta cliques e fica oculta para leitores de tela.
- A abertura e o recarregamento da página não iniciaram o efeito. Enter no botão também ativou a seleção e a fumaça.
- Foram inspecionadas capturas de Janeiro, Fevereiro, Agosto e Setembro: entrada lateral, encontro central, repetição da mesma cor nos meses de uma cor e terceira fumaça entrando pelo rodapé em Agosto.
- A camada foi removida após 10 segundos. Uma nova seleção durante a animação iniciou seu próprio período, sem ser interrompida pelo temporizador anterior. A opacidade final foi conferida durante a dissipação.
- Em uma janela de 500 pixels, a animação não provocou rolagem horizontal da página. Em outro perfil do Firefox, com a preferência nativa por movimento reduzido ativada, a seleção continuou funcionando sem criar fumaça.

Não foi medida a fluidez em celulares físicos. Capturas, perfis temporários e quadros extraídos para inspeção permanecem na `.cache` ignorada pelo Git. O vídeo original permanece fora do projeto; PDFs e emblema continuam fora dos commits.
