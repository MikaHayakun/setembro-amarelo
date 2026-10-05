# Projeto Setembro Amarelo 2026

Plataforma educativa em português sobre a história do Setembro Amarelo, prevenção do suicídio e exemplos de campanhas que associam cores aos meses do ano. Trabalho desenvolvido a partir das orientações do arquivo fornecido: visão do produto, stakeholders, personas, jornada, requisitos, priorização e prova de conceito com frontend, backend e banco de dados.

## Equipe

Preencher com os nomes reais dos integrantes antes da entrega acadêmica. O pacote não atribui contribuições ou commits a pessoas que não foram identificadas.

## Executar no Ubuntu

Requisito: Python 3.9 ou superior e um navegador. Não há pacotes Python externos a instalar.

1. Extraia o ZIP e abra o terminal na pasta `projeto-setembro-amarelo`.
2. Execute `python3 --version` para verificar a versão.
3. Execute `python3 backend/server.py`.
4. Abra **http://127.0.0.1:8000** no navegador.
5. Encerre o servidor com **Ctrl+C**.

Se a porta estiver ocupada: `python3 backend/server.py --port 8001`, abrindo o endereço com a porta 8001. Não abra `frontend/index.html` diretamente: a interface consulta a API do servidor local.

## Jornada demonstrável

A página inicia em Setembro. O usuário lê a síntese, os marcos históricos e a análise das evidências, consulta os links das fontes e encontra os canais de ajuda. Pode selecionar outro mês para entender sua campanha. É uma única jornada de consulta, com diferentes conteúdos; não existe cadastro nem atendimento clínico.

Ao acionar um botão de mês por clique, toque ou teclado, duas fumaças com as cores indicadas entram pelas laterais, encontram-se no centro e se dissipam em 10 segundos. Meses com uma cor usam essa mesma cor dos dois lados; em Agosto, a terceira cor entra pelo rodapé. A abertura da página não inicia a animação. Uma nova seleção substitui o efeito anterior sem bloquear a navegação. A preferência do dispositivo por movimento reduzido desativa o efeito decorativo, mantendo a seleção e o conteúdo. A fumaça é desenhada localmente em Canvas a partir do novo vídeo autorizado, com fundo branco removido e cores substituídas pelas cores da campanha. O vídeo só é carregado após acionar um mês, fica sem áudio e não exige bibliotecas externas.

O botão “Ouvir texto” é complementar. Depende do suporte do navegador e da existência de uma voz em português. O conteúdo escrito permanece disponível quando a voz não funciona. O servidor não coleta relatos pessoais nem grava histórico de navegação. Links das fontes exigem conexão à internet; vozes podem depender de serviços do navegador.

## Estrutura

- `frontend/`: HTML, CSS e JavaScript.
- `frontend/assets/emblema-setembro-amarelo.png`: emblema original fornecido localmente, fora do versionamento.
- `frontend/assets/pinterest-savepin-onl.mp4`: nova referência de fumaça fornecida e autorizada para versionamento pelo responsável. Sua imagem fornece as dobras em movimento da animação.
- `frontend/assets/fonts/`: fontes variáveis locais e suas licenças. Os títulos usam Bricolage Grotesque; o texto usa Cuidado Sans, versão reduzida e renomeada de Source Sans 3. Não há carregamento externo de fontes.
- `backend/server.py`: servidor HTTP e API de leitura.
- `database/schema.sql`: estrutura relacional.
- `database/content.json`: conteúdo de referência e 16 fontes.
- `database/campaigns.sqlite3`: banco persistente com 12 meses.
- `tests/test_api.py`: oito testes de integração.
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

## Atualização editorial

`content.json` é uma carga inicial. O servidor mantém o banco existente e não o sobrescreve ao reiniciar. Para atualizar a cópia de demonstração, faça backup de `database/campaigns.sqlite3`, revise o JSON e as fontes, remova somente o banco local de demonstração e execute `python3 backend/server.py --init-only`. Em implantação real, use migração e controle editorial; não apague um banco em produção.

As cores variam entre campanhas e países. As fontes registram marcos brasileiros em 2014 e 2015; isso está explicado no histórico. Conteúdos em inglês foram sintetizados em português com links para os originais. A base temática usa OMS, artigos em SciELO (incluindo estudo também indexado no PubMed) e materiais da Biblioteca Virtual em Saúde. A aplicação não interpreta a cor como tratamento nem promete reduzir mortalidade.

## Entrega e publicação

O código e o banco executável estão neste pacote. O documento do projeto está em `docs/`, em DOCX e PDF, e também é entregue separadamente. Os PDFs e o emblema original são mantidos apenas localmente, fora dos commits; outra cópia do repositório precisa receber o emblema em `frontend/assets/emblema-setembro-amarelo.png` para exibi-lo. As descrições das telas atendem à alternativa prevista no material de orientação. O roteiro do vídeo de até 60 segundos está em `docs/roteiro-pitch.md`; o vídeo precisa ser gravado com o aplicativo aberto. O repositório público deve ser criado na conta da equipe, com link no README e commits reais de cada integrante. Nenhum repositório remoto ou vídeo foi apresentado como já publicado.
