# Setembro Amarelo

Site: https://setembro-amarelo-dun.vercel.app

Repositório público: https://github.com/MikaHayakun/setembro-amarelo

Plataforma educativa com português como padrão e versões em inglês, espanhol, alemão, francês, japonês, chinês simplificado e coreano. Usa interface HTML/CSS/JavaScript, API em Python e banco SQLite. O código está em `Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/`. Os documentos e vídeos originais e a imagem do emblema permanecem somente na cópia privada.

## Executar a versão pública

Requisito: Python 3.9 ou superior, sem bibliotecas externas.

```bash
python3 Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/scripts/build_public_site.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Abra http://127.0.0.1:8000. Esta é a versão usada na Vercel: conteúdo estático, oito idiomas, 96 narrações e fumaça com imagens processadas sem perdas. Não contém o emblema, PDFs, DOCX, banco SQLite ou vídeos originais. O seletor de mês e os botões de Setembro preservam as cores, posições e durações da animação aprovada. As imagens processadas preservam 704 × 992 pixels e os 30 quadros por segundo da referência; a renderização continua limitada a 3840 × 2160 conforme a janela. Não há aumento artificial da resolução da referência.

Os quadros processados foram autorizados para publicação. Eles contêm apenas iluminação e densidade para reconstruir a fumaça, sem as cores, o fundo ou o áudio originais. O arquivo original não é necessário para compilar a versão pública. As imagens são maiores que o vídeo comprimido e o primeiro acionamento depende da conexão; as ativações seguintes usam os recursos em cache.

## Executar a versão privada local

Requisito: Python 3.9 ou superior. A aplicação usa apenas a biblioteca padrão, sem dependências externas a instalar.

A partir desta pasta:

```bash
cd Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo
python3 backend/server.py
```

Abra http://127.0.0.1:8000 no navegador. Para encerrar, pressione Ctrl+C no terminal do servidor. Se a porta estiver ocupada, use `python3 backend/server.py --port 8001` e abra a porta correspondente. A página deve ser aberta pelo servidor para consultar a API.

Na pasta da aplicação, execute os testes com `python3 -m unittest discover -s tests -v`. Eles usam um banco temporário e verificam também os idiomas e os 96 áudios. Os controles de narração podem ser verificados com `node tests/test_narration.js`. A verificação opcional de sintaxe com Node.js é `node --check frontend/app.js`.

Escolha o idioma no seletor no início da página. “Ouvir texto” usa áudios locais com voz neural; há pausa, retomada, parada e ajuste de velocidade. As traduções e os MP3 são recursos públicos do site e acompanham o Git. A execução não exige serviços de tradução ou voz externos.

O [README da aplicação](Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/README.md) descreve a API, a jornada de consulta e a manutenção do conteúdo.

## Histórico de alterações

Usamos Git para registrar etapas concluídas e permitir revisão ou restauração de mudanças específicas.

- Cada commit deve tratar de uma mudança coerente, com uma mensagem que descreva seu propósito.
- Antes de registrar uma alteração, confira `git status` e `git diff`. Adicione apenas os arquivos relacionados à mudança.
- Dependências, arquivos gerados, configurações locais e credenciais ficam fora do histórico. Arquivos de lock de dependências devem ser versionados quando existirem.
- Para consultar as etapas registradas, use `git log --oneline`.
- Para examinar uma etapa, use `git show <commit>`.
- Para desfazer um commit registrado preservando o histórico, use `git revert <commit>`; verifique eventuais conflitos e valide o resultado.
- Para recuperar um arquivo de uma etapa anterior, revise primeiro as alterações locais e use `git restore --source=<commit> -- caminho/do/arquivo`. Esse comando substitui o conteúdo local do arquivo; registre a restauração em um novo commit após validá-la.

## Manutenção

Faça alterações focadas na necessidade atual. Ao substituir uma implementação, remova o código antigo e suas referências depois de confirmar que não são mais necessários. Evite cópias de versões antigas dentro do projeto: o Git guarda o histórico.

O histórico privado permanece neste computador. O histórico público é exportado com uma lista de arquivos permitidos, excluindo documentos originais, vídeos originais, emblema, banco SQLite, configurações locais e credenciais em todas as etapas. Ao preparar outra cópia do projeto, forneça o emblema localmente em `Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/frontend/assets/emblema-setembro-amarelo.png`. Caches e arquivos temporários também ficam fora do histórico.

## Publicar e atualizar

`vercel.json` gera somente `dist/` usando `scripts/build_public_site.py`. `.gitignore` e `.vercelignore` também bloqueiam os materiais privados. A publicação inicial usa uma pasta isolada contendo apenas a saída pública. Não envie esta pasta de trabalho privada diretamente ao GitHub: o histórico local anterior contém materiais que foram autorizados antes da mudança de preferência.

Depois de revisar e registrar uma alteração local, execute:

```bash
python3 Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/scripts/prepare_public_repository.py
```

O comando cria um novo checkout em `.cache/public-repositories/<commit>`, com o histórico filtrado, e verifica que nenhum objeto dos materiais privados foi incluído. Publique somente esse checkout no repositório público. O comando não modifica o histórico privado nem apaga os materiais locais. Para atualizar a hospedagem manualmente, gere `dist/` e envie somente essa saída; o repositório público filtrado já está conectado à Vercel, e novos commits enviados ao seu ramo `main` iniciam a implantação automaticamente. Envie somente o ramo `main` exportado; nunca adicione um remoto público ao histórico privado deste computador.
