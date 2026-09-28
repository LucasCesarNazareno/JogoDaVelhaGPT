# Ultimate — Jogo da Velha 2

Jogo para duas pessoas no mesmo dispositivo, feito com HTML, CSS e JavaScript puro. Funciona offline, sem instalação, frameworks, serviços externos ou backend.

## Abrir o jogo

Dê dois cliques em **index.html** para abrir no navegador. Para editar, abra esta pasta no Visual Studio Code. Se preferir, use a extensão Live Server para acompanhar as alterações.

## Regras

- X começa em qualquer uma das 81 casas. Os jogadores alternam as jogadas.
- A casa escolhida determina o próximo tabuleiro obrigatório.
- Três marcas em linha conquistam um tabuleiro e bloqueiam todas as suas casas.
- Se o destino foi conquistado ou ficou sem casas, o próximo jogador escolhe qualquer tabuleiro aberto.
- Três tabuleiros conquistados em linha vencem a partida. Se todos fecharem sem vencedor, ocorre empate.
- A numeração de ambos os níveis segue o teclado numérico:

```text
7 | 8 | 9
4 | 5 | 6
1 | 2 | 3
```

O botão **Reiniciar partida** limpa o tabuleiro e mantém o placar. Vitórias e empates ficam salvos neste navegador quando o armazenamento local está disponível. O placar pode ser diferente ao abrir pelo arquivo e por um servidor local.

## Arquivos

- `index.html`: estrutura, informações da partida e diálogos.
- `style.css`: tema, layout responsivo e animações; respeita a preferência por movimento reduzido.
- `script.js`: regras independentes da interface, estado da partida, renderização e placar.
- `tests/game.test.js`: testes de regras com o executor nativo do Node.js.

## Testes

Com Node.js instalado, execute no terminal desta pasta:

```sh
node --test tests/game.test.js
```

Os testes cobrem abertura livre, direcionamento, jogadas inválidas, todas as oito sequências de vitória para X e O nos dois níveis, destinos fechados, empates, encerramento imediato e reinício. Também simulam 300 partidas completas, verificando a consistência do estado a cada jogada.

O navegador permite jogar com mouse, toque ou teclado (Tab para navegar e Enter/Espaço para jogar). O botão **Como jogar** mostra as regras; Esc fecha os diálogos.

## Celulares

- O tabuleiro usa a largura disponível, com casas quadradas e números sempre visíveis. As bordas respeitam as áreas seguras de telas com recortes.
- Botões de ajuda, reinício e diálogos têm pelo menos 44 px de altura no layout móvel. As casas aproveitam o espaço disponível para manter os nove tabuleiros visíveis, sem rolagem horizontal.
- O toque usa a ativação nativa dos botões. A prévia ao passar o mouse só aparece em dispositivos com mouse; o toque tem feedback ao pressionar e o destino permitido permanece destacado.
- Os diálogos permitem rolagem interna em telas baixas. O zoom do navegador continua disponível.

Validação no navegador em **393×873**, incluindo uma partida completa, vitória, reinício, direcionamento, bloqueios e ajuda. Também foram conferidos **320×740**, **768×1024** e o desktop em **1366×900**, sem transbordamento horizontal. Os 46 testes das regras continuam passando. Essas verificações usaram dimensões de viewport, sem um aparelho físico.
