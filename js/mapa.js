// Mapa interativo do Plano Diretor (Leaflet + OpenStreetMap).
// As camadas são lidas da pasta "dados/" em formato GeoJSON (coordenadas em WGS84 / EPSG:4326).
// Propriedades lidas de cada área (todas opcionais):
//   nome, descricao, usos, altura_maxima, lote_minimo, artigo
(function () {
  if (!window.L) {
    var box = document.getElementById('mapa');
    if (box) box.innerHTML = '<p style="padding:24px;font-size:16px">Não foi possível carregar o mapa agora. Use os mapas oficiais para download, logo abaixo.</p>';
    return;
  }
  var CENTRO = [-22.6886, -45.7311]; // São Bento do Sapucaí
  var NOMES = {
    'zoneamento': 'Zoneamento',
    'zeis': 'ZEIS',
    'corredor-bau': 'Corredor Especial do Baú',
    'aepar': 'Áreas de AEPAR',
    'corredor-comercial': 'Corredor comercial',
    'zona-rural': 'Zona rural'
  };

  var mapa = L.map('mapa', { scrollWheelZoom: false }).setView(CENTRO, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  var camadas = {};   // nome -> L.geoJSON
  var faltando = [];
  var marcador = null;

  function texto(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function descrever(p) {
    var partes = [];
    if (p.usos) partes.push('Usos permitidos: ' + p.usos + '.');
    if (p.altura_maxima) partes.push('Altura máxima: ' + p.altura_maxima + '.');
    if (p.lote_minimo) partes.push('Lote mínimo: ' + p.lote_minimo + '.');
    if (p.artigo) partes.push('Previsto no ' + p.artigo + '.');
    if (!partes.length && p.descricao) partes.push(p.descricao);
    return partes.join(' ');
  }

  function carregar(input) {
    var nome = input.getAttribute('data-camada');
    var cor = input.getAttribute('data-cor');
    return fetch('dados/' + nome + '.geojson')
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (geo) {
        camadas[nome] = L.geoJSON(geo, {
          style: { color: cor, weight: 2, fillColor: cor, fillOpacity: 0.25 },
          onEachFeature: function (f, layer) {
            var p = f.properties || {};
            layer.bindPopup('<strong>' + texto(p.nome || NOMES[nome]) + '</strong><br>' + texto(descrever(p)));
          }
        });
        if (input.checked) camadas[nome].addTo(mapa);
      })
      .catch(function () {
        faltando.push(NOMES[nome]);
        input.disabled = true;
      });
  }

  var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-camada]'));
  Promise.all(inputs.map(carregar)).then(function () {
    var aviso = document.getElementById('aviso-camadas');
    if (faltando.length) aviso.textContent = 'Camadas ainda sem dados publicados: ' + faltando.join(', ') + '.';
  });

  inputs.forEach(function (input) {
    input.addEventListener('change', function () {
      var c = camadas[input.getAttribute('data-camada')];
      if (!c) return;
      if (input.checked) c.addTo(mapa); else mapa.removeLayer(c);
    });
  });

  // Ponto dentro de polígono (ray casting), para Polygon e MultiPolygon
  function dentroAnel(pt, anel) {
    var x = pt[0], y = pt[1], dentro = false;
    for (var i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      var xi = anel[i][0], yi = anel[i][1], xj = anel[j][0], yj = anel[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) dentro = !dentro;
    }
    return dentro;
  }
  function dentroPoligono(pt, aneis) {
    if (!dentroAnel(pt, aneis[0])) return false;
    for (var k = 1; k < aneis.length; k++) if (dentroAnel(pt, aneis[k])) return false;
    return true;
  }
  function contem(geom, pt) {
    if (!geom) return false;
    if (geom.type === 'Polygon') return dentroPoligono(pt, geom.coordinates);
    if (geom.type === 'MultiPolygon') return geom.coordinates.some(function (p) { return dentroPoligono(pt, p); });
    return false;
  }

  function consultar(latlng, rotulo) {
    var pt = [latlng.lng, latlng.lat];
    var achados = [];
    Object.keys(camadas).forEach(function (nome) {
      camadas[nome].eachLayer(function (l) {
        if (contem(l.feature && l.feature.geometry, pt)) achados.push({ camada: nome, p: l.feature.properties || {} });
      });
    });

    if (marcador) mapa.removeLayer(marcador);
    marcador = L.marker(latlng).addTo(mapa);

    var titulo = document.getElementById('res-titulo');
    var corpo = document.getElementById('res-texto');
    var onde = rotulo || 'Este ponto';

    if (!Object.keys(camadas).length) {
      titulo.textContent = onde;
      corpo.textContent = 'Os dados das zonas ainda não foram publicados. Consulte os mapas oficiais abaixo.';
      return;
    }
    if (!achados.length) {
      titulo.textContent = onde;
      corpo.textContent = 'Não encontramos uma zona para este ponto. Confira nos mapas oficiais ou procure a Prefeitura.';
      return;
    }
    var principal = achados.filter(function (a) { return a.camada === 'zoneamento'; })[0] || achados[0];
    titulo.textContent = onde + ' fica na ' + (principal.p.nome || NOMES[principal.camada]);
    var extras = achados.filter(function (a) { return a !== principal; })
      .map(function (a) { return a.p.nome || NOMES[a.camada]; });
    corpo.textContent = descrever(principal.p) + (extras.length ? ' Também está em: ' + extras.join(', ') + '.' : '');
  }

  mapa.on('click', function (e) { consultar(e.latlng, 'O ponto clicado'); });

  // Busca de endereço (Nominatim / OpenStreetMap)
  document.getElementById('form-endereco').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = document.getElementById('end').value.trim();
    if (!q) return;
    var titulo = document.getElementById('res-titulo');
    var corpo = document.getElementById('res-texto');
    titulo.textContent = 'Buscando...';
    corpo.textContent = '';
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=' +
      encodeURIComponent(q + ', São Bento do Sapucaí, SP');
    fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.length) {
          titulo.textContent = 'Endereço não encontrado';
          corpo.textContent = 'Tente escrever só o nome da rua ou do bairro, ou clique no ponto direto no mapa.';
          return;
        }
        var ll = L.latLng(parseFloat(res[0].lat), parseFloat(res[0].lon));
        mapa.setView(ll, 17);
        consultar(ll, q);
      })
      .catch(function () {
        titulo.textContent = 'Não foi possível buscar agora';
        corpo.textContent = 'Clique no ponto direto no mapa para ver a zona.';
      });
  });
})();
