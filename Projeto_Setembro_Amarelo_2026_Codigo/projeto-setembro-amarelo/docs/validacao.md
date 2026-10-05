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

## Primeira versão das fumaças — 5 de outubro de 2026

O vídeo fornecido foi usado somente para observar o movimento. O efeito foi criado em Canvas com texturas procedurais, usando as cores já registradas para cada mês. Não foram incorporados vídeo, letras, imagens de fundo ou cores da referência.

- Os oito testes HTTP passaram, incluindo a nova rota pública `/smoke.js`. Os dois arquivos JavaScript passaram na verificação de sintaxe do Node.
- No Firefox, os 12 botões iniciaram uma única animação por vez e continuaram selecionando os conteúdos. A camada decorativa não intercepta cliques e fica oculta para leitores de tela.
- A abertura e o recarregamento da página não iniciaram o efeito. Enter no botão também ativou a seleção e a fumaça.
- Foram inspecionadas capturas de Janeiro, Fevereiro, Agosto e Setembro: entrada lateral, encontro central, repetição da mesma cor nos meses de uma cor e terceira fumaça entrando pelo rodapé em Agosto.
- A camada foi removida após 10 segundos. Uma nova seleção durante a animação iniciou seu próprio período, sem ser interrompida pelo temporizador anterior. A opacidade final foi conferida durante a dissipação.
- Em uma janela de 500 pixels, a animação não provocou rolagem horizontal da página. Em outro perfil do Firefox, com a preferência nativa por movimento reduzido ativada, a seleção continuou funcionando sem criar fumaça.

Não foi medida a fluidez em celulares físicos. Capturas, perfis temporários e quadros extraídos para inspeção permanecem na `.cache` ignorada pelo Git. O vídeo original permanece fora do projeto; PDFs e emblema continuam fora dos commits.

## Nova referência de fumaça — 5 de outubro de 2026

O responsável forneceu `pinterest-savepin-onl.mp4` e autorizou sua inclusão no commit. O arquivo foi copiado intacto para `frontend/assets/`. A animação agora usa as dobras e o movimento desse vídeo, remove seu fundo branco, substitui o pigmento pelas cores do mês e preserva luzes e sombras. A implementação procedural anterior foi removida. O vídeo anterior do WhatsApp, o emblema e os PDFs continuam fora dos commits.

- Os oito testes HTTP passaram, incluindo entrega do MP4 intacto com tipo `video/mp4`. A sintaxe de `smoke.js` foi validada pelo Node.
- No Firefox, a abertura não carregou o MP4 nem criou fumaça. O vídeo foi decodificado após clicar, sem áudio e sem controles expostos na página.
- Foram inspecionadas capturas de Janeiro, Fevereiro e Agosto durante a animação, com fundo transparente e cores do mês. A terceira cor de Agosto entra pelo rodapé; somente essa fumaça usa a máscara inferior, sem recorte visível na ponta.
- Os 12 botões mantiveram a seleção e criaram uma única camada decorativa por vez. A troca durante o efeito preservou os 10 segundos da nova seleção, e o efeito terminou com a remoção da camada e interrupção do vídeo.
- Enter iniciou a fumaça; recarregar não a iniciou. A preferência nativa de movimento reduzido manteve a seleção sem o efeito.
- A captura em janela de 500 pixels foi inspecionada e não houve rolagem horizontal da página.

As verificações de vídeo foram realizadas no Firefox deste computador. Reprodução e fluidez em outros navegadores e celulares físicos continuam pendentes. As imagens e os perfis de teste ficam somente na `.cache`, fora do Git.

## Relevo, nitidez e dispersão ampliada — 5 de outubro de 2026

A fumaça recebeu iluminação direcional calculada a partir das dobras, sombras, realces e transparência conforme a densidade. O processamento usa a resolução original do vídeo em janelas largas e até 640 pixels de altura nas menores. A iluminação usa tabelas pré-calculadas e normais suavizadas para destacar o volume sem amplificar o ruído do vídeo. Camadas translúcidas adicionais ampliam a quantidade; entre o encontro e o fim, a fumaça cresce para alcançar a área visível da página.

- `node --check frontend/smoke.js` e a verificação do diff passaram.
- Capturas no Firefox foram inspecionadas durante a entrada, o encontro e a dispersão, incluindo Janeiro, Fevereiro e Agosto. A presença de fumaça durante a expansão foi verificada nos quatro cantos do Canvas em janela larga e em janela de 500 pixels.
- Os 12 botões mantiveram uma única camada decorativa por vez, sem bloquear os cliques. A troca durante o efeito iniciou seu próprio período e a camada foi removida ao final dos 10 segundos.
- A entrada da terceira cor pelo rodapé, a seleção por Enter, a ausência de efeito ao abrir/recarregar e a ausência de rolagem horizontal foram conferidas. Movimento reduzido continuou desativando o efeito sem impedir a seleção.

As verificações são visuais e funcionais no Firefox deste computador. Não foi aferida a taxa de quadros em celulares físicos; a maior resolução deve ser conferida no dispositivo de apresentação.

## Correção da renderização e Canvas até 4K — 5 de outubro de 2026

Após nova revisão com o responsável, foi mantido o mesmo vídeo. A renderização anterior deformava suas proporções, sobrepunha cópias na entrada e limitava a largura do Canvas a 2000 pixels. Foram removidos a iluminação artificial por normais e os redimensionamentos desproporcionais. A recoloração preserva a iluminação registrada, com uma correção leve de contraste local. Todos os dispositivos agora processam os 704 × 992 pixels originais; a área de renderização pode chegar a 3840 × 2160 pixels. A fonte continua sendo o arquivo recebido, com sua resolução original.

- No Firefox, em área visível de 1920 × 1080, foi confirmado um Canvas de exatamente 3840 × 2160. O desenho do vídeo no Canvas de processamento foi instrumentado e manteve os 704 × 992 pixels, sem redução.
- Capturas de Janeiro, Fevereiro e Agosto foram inspecionadas, incluindo a terceira fumaça pelo rodapé e uma janela de 500 pixels. A quantidade é ampliada durante a dispersão por fluxos adicionais com proporções preservadas.
- Foram verificadas a presença de fumaça nas bordas durante a dispersão, a remoção após 10 segundos, a ausência de vídeo e efeito na abertura, a ausência de rolagem horizontal e a seleção normal com movimento reduzido ativado.
- A sintaxe JavaScript e o diff passaram nas verificações. Perfis e capturas permanecem apenas na `.cache` local.

Não foi adicionada dependência de GSAP: sua [documentação de CSS](https://gsap.com/docs/v3/GSAP/CorePlugins/CSS/) distingue animação de propriedades da qualidade de renderização do navegador. A correção foi realizada no processamento e no desenho do Canvas. A taxa de quadros em telas 4K físicas e celulares continua pendente de medição no dispositivo final.

## Botões por mês e Setembro nos quatro cantos — 5 de outubro de 2026

Todos os meses receberam um botão dedicado para repetir a fumaça sem recarregar o conteúdo. A seleção no calendário também aciona o efeito. Setembro usa quatro plumas amarelas direcionadas dos cantos ao centro, com dissipação em 12 segundos; os outros meses continuam com 10 segundos, suas cores e a terceira entrada pelo rodapé quando aplicável. O movimento do vídeo foi desacelerado proporcionalmente para os 12 segundos. As ocorrências visíveis de “Setembro”, inclusive em minúsculas, viraram botões que mantêm a tipografia do texto. Nas referências, o link externo é mantido como “Abrir fonte”, separado do botão.

- No Firefox, os 12 botões de seleção e os 12 botões dedicados foram acionados. A duração foi conferida para cada mês; sempre houve uma única camada decorativa, sem interceptar cliques.
- Todas as palavras “Setembro” no conteúdo inicial foram verificadas como botões. Os cinco acionadores inseridos nos textos foram testados, incluindo cabeçalho, introdução, título, síntese e referência. Nenhum botão ficou dentro de outro botão ou de um link. Os links das fontes mantiveram seus destinos e abertura externa.
- Enter no acionador do cabeçalho iniciou o efeito amarelo sem trocar o mês selecionado. A frase do cabeçalho permaneceu exatamente como aprovada, em negrito e sem ponto final.
- Capturas durante a entrada, o encontro e a dissipação mostraram fumaça nos quatro cantos. A camada continuou presente além dos 10 segundos e foi removida ao final dos 12 segundos. A troca de Setembro para Janeiro respeitou os 10 segundos da nova animação, sem interrupção pelo temporizador anterior.
- Os botões e as fumaças foram inspecionados em telas de 1440 e 500 pixels, sem rolagem horizontal da página. O efeito de quatro entradas manteve o Canvas de 3840 × 2160 numa área visível de 1920 × 1080.
- Com movimento reduzido ativado no Firefox, todos os meses continuaram selecionáveis, os botões dedicados e o acionador do cabeçalho não criaram fumaça e o vídeo não foi carregado. A abertura normal também não iniciou a animação nem carregou o vídeo.
- `node --check frontend/app.js`, `node --check frontend/smoke.js` e `git diff --check` passaram. As capturas e os scripts de verificação ficaram na `.cache` local, fora do versionamento. PDFs e emblema continuam fora dos commits.

A inspeção foi realizada no Firefox deste computador; a fluidez em celulares físicos e outros navegadores continua pendente.

## Remoção do botão adicional de fumaça — 5 de outubro de 2026

Por solicitação do responsável, o botão “Acionar fumaça de [mês]” foi retirado do conteúdo de todos os meses, junto com seus estilos exclusivos. Os botões do calendário e as palavras “Setembro” continuam acionando as animações. O código da fumaça e suas durações permanecem iguais. A sintaxe de `app.js`, o diff e a ausência de referências ao botão removido foram conferidos; não houve nova execução em navegador nesta remoção.
