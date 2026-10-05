# Setembro Amarelo

Plataforma educativa com português como padrão e versões em inglês, espanhol, alemão, francês, japonês, chinês simplificado e coreano. Usa interface HTML/CSS/JavaScript, API em Python e banco SQLite. O material recebido está em `Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/`; o documento de referência está em `Projeto_Setembro_Amarelo_2026.pdf`.

## Executar

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

O código recebido e o banco SQLite fornecido integram a versão de referência no Git. Os PDFs e a imagem original do emblema são materiais locais e ficam fora do versionamento. Ao preparar outra cópia do projeto, forneça o emblema localmente em `Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/frontend/assets/emblema-setembro-amarelo.png`. Caches e arquivos temporários também ficam fora do histórico.
