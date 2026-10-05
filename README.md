# Setembro Amarelo

Projeto em preparação. Ainda não há código de aplicação nem tecnologia definida.

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

Registre aqui as instruções de instalação, execução e validação assim que a tecnologia do projeto for definida.
