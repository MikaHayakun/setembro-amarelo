# Projeto Setembro Amarelo 2026

Plataforma educativa em português sobre a história do Setembro Amarelo, prevenção do suicídio e exemplos de campanhas que associam cores aos meses do ano. Trabalho desenvolvido a partir das orientações do arquivo fornecido: visão do produto, stakeholders, personas, jornada, requisitos, priorização e prova de conceito com frontend, backend e banco de dados.

## Equipe

Preencher com os nomes reais dos integrantes antes da entrega acadêmica. O pacote não atribui contribuições ou commits a pessoas que não foram identificadas.

## Versão pública

Veja o [README principal](../../README.md) para compilar e executar a saída estática usada na Vercel. Os documentos originais, vídeos originais e emblema não estão disponíveis na hospedagem nem no histórico público. A versão privada abaixo mantém a animação original e seus materiais neste computador.

## Executar no Ubuntu

Requisito: Python 3.9 ou superior e um navegador. Não há pacotes Python externos a instalar.

1. Extraia o ZIP e abra o terminal na pasta `projeto-setembro-amarelo`.
2. Execute `python3 --version` para verificar a versão.
3. Execute `python3 backend/server.py`.
4. Abra **http://127.0.0.1:8000** no navegador.
5. Encerre o servidor com **Ctrl+C**.

Se a porta estiver ocupada: `python3 backend/server.py --port 8001`, abrindo o endereço com a porta 8001. Não abra `frontend/index.html` diretamente: a interface consulta a API do servidor local.

## Jornada demonstrável

A página inicia em Setembro. O usuário lê a síntese e os marcos históricos, consulta os links das fontes e encontra os canais de ajuda. Pode selecionar outro mês para entender sua campanha. É uma única jornada de consulta, com diferentes conteúdos; não existe cadastro nem atendimento clínico.

O botão de seleção de cada mês no calendário inicia a fumaça. Por clique, toque ou teclado, as cores indicadas entram pelas laterais, encontram-se no centro e se dissipam em 10 segundos. Meses com uma cor usam essa mesma cor dos dois lados; em Agosto, a terceira cor entra pelo rodapé. Todos os meses recebem também uma fumaça branca pelo rodapé, como referência ao cuidado com a saúde mental durante todo o ano. Os onze meses além de Setembro recebem mais uma entrada branca pelo canto superior esquerdo, em direção ao centro, atrás das cores da campanha. Em Agosto, a entrada branca do rodapé fica deslocada para preservar a terceira cor existente. Janeiro mantém sua fumaça branca original e recebe essas entradas adicionais.

Setembro tem uma animação específica: quatro fumaças amarelas entram pelos quatro cantos, acompanhadas de três fumaças brancas intensas que entram pelas duas laterais e pelo rodapé. Todas avançam para o centro e se dissipam em 12 segundos. As fumaças brancas usam as mesmas dobras da referência, com sombras cinza suaves e maior densidade em Setembro. Toda ocorrência visível da palavra “Setembro” funciona como botão para esse efeito, incluindo o cabeçalho, os títulos, os textos e os nomes das fontes. Esses botões repetem a animação sem trocar o conteúdo selecionado. As referências com essa palavra mantêm um link separado “Abrir fonte”.

A abertura da página não inicia a animação. Um novo acionamento substitui o efeito anterior e reinicia a duração sem bloquear a navegação. A preferência do dispositivo por movimento reduzido desativa o efeito decorativo, mantendo os botões e o conteúdo. Na cópia privada, a fumaça é desenhada localmente em Canvas a partir do vídeo de referência, com fundo branco removido e cores substituídas pelas cores da campanha. O vídeo só é carregado após acionar um efeito, fica sem áudio e não exige bibliotecas externas.

A animação preserva a proporção e os 704 × 992 pixels do vídeo em todas as telas. A iluminação registrada é mantida na recoloração, com uma correção leve de contraste local; as cópias translúcidas entram apenas durante a dispersão. O Canvas usa amostragem em maior resolução, até 3840 × 2160 pixels conforme o tamanho da janela. Esse limite descreve a área de renderização; o material original permanece em 704 × 992 pixels. As fumaças alcançam as bordas da área visível e perdem opacidade até desaparecer.

O botão “Ouvir texto” reproduz uma narração neural local no idioma selecionado, com ritmo moderado e pausas entre os trechos. Há controles de pausa, retomada, parada e velocidade (mais devagar, normal e mais rápido), utilizáveis por teclado. A reprodução começa somente por ação do usuário e é interrompida ao trocar de mês ou idioma. Não depende de uma voz instalada no computador nem envia textos a um serviço externo durante a reprodução. O conteúdo escrito continua disponível para leitores de tela. Se o texto de um mês for alterado, uma gravação anterior não é reproduzida: o site informa que o áudio precisa ser atualizado.

O seletor no início da página oferece português do Brasil, inglês, espanhol, alemão, francês, japonês, chinês simplificado e coreano. Ele traduz a interface, os doze meses, o histórico e as orientações de apoio, além de atualizar o idioma do documento para os leitores de tela. A escolha pode ser compartilhada com `?lang=en`, `?lang=es`, `?lang=de`, `?lang=fr`, `?lang=ja`, `?lang=zh-CN`, `?lang=ko` ou `?lang=pt-BR`, e é lembrada localmente no navegador. Os títulos bibliográficos e links das fontes são preservados no original; os contatos do rodapé continuam identificados como serviços do Brasil. As traduções tiveram assistência automática e revisão dos principais textos; a revisão por falantes nativos continua recomendada antes de uma publicação definitiva.

O servidor não coleta relatos pessoais nem grava histórico de navegação. Links das fontes exigem conexão à internet. Os áudios e as traduções acompanham o repositório e são servidos pelo próprio site.

## Estrutura

- `frontend/`: HTML, CSS e JavaScript.
- `frontend/narration.js`: reprodução das narrações e controles acessíveis de áudio.
- `frontend/locales/`: textos e interface dos oito idiomas, em JSON.
- `frontend/assets/audio/`: 96 narrações MP3 e um manifesto que as associa ao texto correspondente.
- `scripts/generate_narration.py`: geração editorial dos áudios; não é necessária para executar o site.
- `frontend/assets/emblema-setembro-amarelo.png`: emblema original fornecido localmente, fora do versionamento.
- `frontend/assets/pinterest-savepin-onl.mp4`: referência original privada, fora do repositório público e da hospedagem.
- `frontend/assets/smoke/`: imagens WebP processadas sem perdas, com iluminação e densidade da fumaça, autorizadas para publicação.
- `frontend/smoke-public.js`: usa essas imagens e mantém os cálculos de cores e posicionamento da versão aprovada.
- `scripts/build_public_site.py`: compila a publicação estática por uma lista de arquivos permitidos.
- `scripts/prepare_public_repository.py`: exporta o histórico público sem materiais privados.
- `scripts/generate_smoke_frames.py`: etapa editorial local, exige ffmpeg, NumPy e Pillow; não é necessária na Vercel.
- `frontend/assets/fonts/`: fontes variáveis locais e suas licenças. Os títulos usam Bricolage Grotesque; o texto usa Cuidado Sans, versão reduzida e renomeada de Source Sans 3. Não há carregamento externo de fontes.
- `backend/server.py`: servidor HTTP e API de leitura.
- `database/schema.sql`: estrutura relacional.
- `database/content.json`: conteúdo de referência e 16 fontes.
- `database/campaigns.sqlite3`: banco persistente com 12 meses.
- `tests/test_api.py`: nove testes de integração, incluindo idiomas, correspondência dos textos e entrega dos 96 áudios.
- `tests/test_narration.js`: verificações dos controles, de cancelamento e de gravações desatualizadas.
- `docs/`: roteiro do pitch, descrição das telas e relatório de validação.

## API

| Método | Rota | Resultado |
|---|---|---|
| GET | `/api/health` | Estado do servidor e contagem de meses |
| GET | `/api/campaigns` | Lista dos 12 meses |
| GET | `/api/campaigns/9` | Setembro, histórico, evidência e fontes |
| GET | `/api/sources` | Bibliografia cadastrada |

Mês inválido retorna HTTP 400, recurso inexistente retorna 404 e POST retorna 405. Apenas os arquivos públicos conhecidos são servidos. O banco e o código do backend não são expostos por rotas HTTP.

## Testes

Execute `python3 -m unittest discover -s tests -v`. Os testes iniciam um servidor real com um banco temporário; não alteram o banco distribuído. A validação realizada cobre HTTP, conteúdo, relações e persistência. A revisão visual em navegador e o teste com leitor de tela devem ser feitos no dispositivo da apresentação.

Execute também `node --test tests/test_narration.js` para verificar o comportamento dos controles. Esses testes não substituem uma avaliação da compreensão auditiva nem um teste com leitor de tela e pessoas usuárias no dispositivo final.

## Atualizar narrações e traduções

Revise os arquivos em `frontend/locales/` ao alterar o conteúdo editorial. O português é a referência; mantenha os IDs das fontes e os endereços dos links. Para regenerar os áudios, use um ambiente Python isolado com `edge-tts==7.2.8` e execute `python3 scripts/generate_narration.py`. Para somente um idioma: `python3 scripts/generate_narration.py --languages pt-BR`. Essa etapa exige internet e envia apenas o texto editorial público ao serviço de voz; a aplicação entregue não precisa dessa ferramenta. O gerador aproveita gravações cujo texto não mudou. Revise o manifesto e os MP3 com os textos e inclua os arquivos de áudio no commit editorial.

As vozes usadas são Francisca (pt-BR), Jenny (en), Elvira (es), Katja (de), Denise (fr), Nanami (ja), Xiaoxiao (zh-CN) e SunHi (ko). A geração usa a ferramenta [edge-tts](https://github.com/rany2/edge-tts), com ritmo 8% mais lento que o padrão. Os arquivos MP3 são materiais públicos do site; modelos de voz, ambientes Python, credenciais, PDFs e o emblema original não entram no repositório.

## Atualização editorial

`content.json` é uma carga inicial. O servidor mantém o banco existente e não o sobrescreve ao reiniciar. Para atualizar a cópia de demonstração, faça backup de `database/campaigns.sqlite3`, revise o JSON e as fontes, remova somente o banco local de demonstração e execute `python3 backend/server.py --init-only`. Em implantação real, use migração e controle editorial; não apague um banco em produção.

As cores variam entre campanhas e países. As fontes registram marcos brasileiros em 2014 e 2015; isso está explicado no histórico. Conteúdos em inglês foram sintetizados em português com links para os originais. A base temática usa OMS, artigos em SciELO (incluindo estudo também indexado no PubMed) e materiais da Biblioteca Virtual em Saúde. A aplicação não interpreta a cor como tratamento nem promete reduzir mortalidade.

## Entrega e publicação

Os PDFs, DOCX, emblema e vídeos originais ficam somente na cópia privada. A versão pública funciona sem esses materiais: o emblema é omitido e o link de apoio permanece na introdução e em Setembro. As imagens processadas autorizadas mantêm as dobras, a resolução e o movimento da fumaça aprovada, com as mesmas cores, durações e posições. A transferência das imagens pode exigir mais tempo no primeiro acionamento que o vídeo local; não se reduz sua resolução para compensar esse custo. Os cálculos de recoloração e composição permanecem iguais aos originais.

O roteiro está em `docs/roteiro-pitch.md`; o vídeo da apresentação precisa ser gravado separadamente. A API Python e SQLite permanecem disponíveis para a demonstração privada; na hospedagem, os meses e fontes são JSON gerados da carga editorial `database/content.json`. As rotas de leitura `/api/` são reescritas para esses arquivos; entradas inválidas retornam 404 na hospedagem. O servidor local conserva sua validação com 400 para mês inválido.

O código da aplicação não coleta relatos ou dados de saúde. A infraestrutura da hospedagem pode manter registros técnicos de acesso próprios. As narrações e os textos são públicos e continuam servidos pelo próprio site.
