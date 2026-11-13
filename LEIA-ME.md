# Site do Plano Diretor de São Bento do Sapucaí

Site estático em HTML, CSS e JavaScript, sem banco de dados e sem WordPress. Basta copiar a pasta inteira para qualquer servidor web.

## Estrutura

```
index.html        Início
lei.html          A Lei: lei consolidada, histórico de alterações, documentos e glossário
mapas.html        Mapas: mapa interativo, consulta por endereço e download dos mapas
participe.html    Participe: etapas, formas de participar, formulário, respostas e agenda
css/estilo.css    Estilos de todas as páginas
js/site.js        Barra de acessibilidade (A+, A−, contraste) e avisos dos formulários
js/mapa.js        Mapa interativo
dados/            Camadas do mapa em GeoJSON (ver abaixo)
pdf/              Sugestão: criar esta pasta para os PDFs das leis e anexos
```

## Antes de publicar

1. **Trocar os itens entre colchetes.** Procure por `[` nos arquivos .html. Os principais:
   - `[BRASÃO]`: trocar pelo `<img src="img/brasao.png" alt="Brasão de São Bento do Sapucaí">`;
   - `[FOTO]`: fotos do banner da página inicial;
   - `[DATA]`, `[RESUMO DA ALTERAÇÃO]` e `[A CONFERIR]` na tabela de lei.html;
   - `[SIGNIFICADO DA SIGLA E EXPLICAÇÃO]` (AEPAR) e outros itens do glossário;
   - contatos do rodapé (`[SECRETARIA RESPONSÁVEL]`, `[ENDEREÇO]`, `[TELEFONE]`, `[E-MAIL]`), que se repetem nas 4 páginas.
2. **Ligar os links dos PDFs.** Os links que estão como `href="#"` devem apontar para os arquivos, por exemplo `href="pdf/lei-2649-2026.pdf"`.
3. **Definir o destino do formulário de contribuições** (participe.html). Hoje ele só mostra um aviso. Opções: enviar para o 1doc, para um e-mail institucional ou trocar por um link do Google Forms. Depois disso, remova o atributo `data-pendente` do `<form>`.
4. **Busca do site:** a caixa de busca do cabeçalho também está com `data-pendente`. Ela pode ser ligada a uma busca do Google restrita ao domínio do site ou removida.

## Camadas do mapa

O mapa já funciona com o OpenStreetMap ao fundo. As zonas aparecem quando os arquivos abaixo forem colocados na pasta `dados/`:

| Arquivo | Camada |
|---|---|
| `zoneamento.geojson` | Zoneamento |
| `zeis.geojson` | ZEIS |
| `corredor-bau.geojson` | Corredor Especial do Baú |
| `aepar.geojson` | Áreas de AEPAR |
| `corredor-comercial.geojson` | Corredor comercial (R. Benedito Pereira Goulart) |
| `zona-rural.geojson` | Zona rural |

Enquanto um arquivo não existir, a camada aparece desativada, com um aviso na página.

**Como gerar os arquivos:** no QGIS, abra o shapefile ou o KML da zona, clique com o botão direito na camada, vá em *Exportar → Salvar feições como*, escolha o formato **GeoJSON** e o sistema de coordenadas **EPSG:4326 (WGS 84)**.

**Campos que o site lê** de cada área (todos opcionais): `nome`, `descricao`, `usos`, `altura_maxima`, `lote_minimo` e `artigo`. Com esses campos preenchidos, a consulta por endereço mostra, por exemplo: "Rua X fica na Zona Y. Usos permitidos: ... Altura máxima: ...".

## Testar no computador

Abrir o index.html com dois cliques funciona para todas as páginas, menos para as camadas do mapa, porque o navegador bloqueia a leitura dos arquivos da pasta `dados/` fora de um servidor. Para testar tudo:

```
cd pasta-do-site
python -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## Serviços externos usados

- Google Fonts (Montserrat e Roboto)
- VLibras (tradução para Libras, do governo federal)
- Leaflet e OpenStreetMap (mapa)
- Nominatim/OpenStreetMap (busca de endereço; uso gratuito, com limite de 1 busca por segundo)
