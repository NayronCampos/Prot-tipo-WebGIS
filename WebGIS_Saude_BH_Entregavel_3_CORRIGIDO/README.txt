# WebGIS Saúde BH — versão corrigida

Protótipo acadêmico de WebGIS para localização de farmácias e laboratórios de radiografia próximos a hospitais de Belo Horizonte.

## Correções desta versão

- Corrigido o tamanho e o posicionamento do mapa.
- Corrigida a inicialização do Leaflet.
- Adicionado `map.invalidateSize()` após o carregamento e no redimensionamento.
- Removida a lógica problemática do polígono que poderia causar inconsistências visuais.
- O raio agora é desenhado como um círculo geográfico real.
- Os filtros funcionam diretamente pelo evento `change`.
- O botão "Buscar serviços" executa novamente a consulta.
- O filtro por categoria é aplicado depois da consulta espacial.
- A ordenação por distância e por nome funciona.
- Ao clicar em um resultado, o mapa centraliza no estabelecimento.
- Os marcadores e linhas anteriores são removidos antes de uma nova consulta.
- A consulta espacial considera um estabelecimento dentro da área quando sua distância ao hospital é menor ou igual ao raio.
- O mapa é responsivo.

## Como executar

Recomendado: usar o VS Code com Live Server.

1. Abra esta pasta no VS Code.
2. Abra `index.html`.
3. Clique com o botão direito no arquivo.
4. Escolha "Open with Live Server".

Alternativamente, com Python instalado:

    python -m http.server 8000

Depois acesse:

    http://localhost:8000

## Estrutura

- index.html — interface.
- style.css — estilos.
- app.js — mapa, filtros, consulta espacial, cálculo de distância e ordenação.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Leaflet 1.9.4
- OpenStreetMap

## Observação

Os hospitais, farmácias e laboratórios são dados fictícios criados para o protótipo acadêmico.
