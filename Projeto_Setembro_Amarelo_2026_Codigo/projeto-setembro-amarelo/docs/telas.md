# Descrição das telas e roteiro de verificação visual

## Tela única de consulta

No topo, a marca “Setembro Amarelo 2026” e o atalho “Onde buscar ajuda”. A abertura “Conhecer para cuidar” apresenta a finalidade educativa. Em telas maiores, os 12 meses ficam à esquerda e o conteúdo selecionado à direita. Em telas estreitas, as áreas ficam em sequência vertical.

## Estado inicial e conteúdo de Setembro

A interface consulta `/api/campaigns` e abre `/api/campaigns/9`. Apresenta a cor amarela por nome, a síntese, o propósito, os marcos de 1994, 2003, 2015 e 2024–2026, a diferença entre os registros de 2014/2015 e a análise do estudo ecológico. Inclui orientações gerais da OMS, leitura opcional por voz e links identificados por números de referência.

## Seleção dos outros meses

Ao ativar um botão, a interface carrega o conteúdo correspondente. O mês selecionado usa `aria-pressed`; o título recebe foco quando a seleção ocorre por ação do usuário. O texto informa tema, propósito e fontes. A cor também é escrita, para não depender exclusivamente da percepção visual.

## Canais de ajuda

A seção de ajuda já integra o HTML inicial. Tem CVV 188, SAMU 192, UBS e CAPS, diferencia apoio emocional de emergência e liga a fontes da BVS. Permanece disponível caso a API falhe.

## Falha e leitura opcional

Durante a consulta, aparece “Carregando”. Em caso de erro de conteúdo, aparece mensagem de indisponibilidade e “Tentar novamente”. Falha no carregamento inicial orienta reiniciar e recarregar. “Ouvir texto” informa indisponibilidade se não existir voz em português; “Parar leitura” cancela a reprodução.

## Verificação a realizar no navegador da apresentação

1. Abrir o endereço local e consultar Setembro e pelo menos dois outros meses.
2. Percorrer botões e links com Tab e ativar com teclado.
3. Verificar larguras de 320, 768 e 1280 pixels e zoom de 200%.
4. Conferir títulos, leitura com tecnologia assistiva, contraste e ausência de sobreposição.
5. Testar os links de referências e o recurso de voz, se disponível.
6. Depois de a página abrir, encerrar o servidor e selecionar outro mês para observar a mensagem de erro e a permanência dos canais de ajuda.

Esta descrição é documentação do código entregue, não uma captura de tela ou resultado de teste com usuários. A validação automatizada não substitui esta verificação visual.
