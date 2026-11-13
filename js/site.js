// Barra de acessibilidade: tamanho do texto e alto contraste.
// As escolhas ficam salvas no navegador da pessoa.
(function () {
  var html = document.documentElement;
  var niveis = [1, 1.1, 1.2, 1.3];
  var nivel = 0;

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }
  function salvar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) {}
  }

  function aplicarZoom() {
    document.body.style.zoom = niveis[nivel];
    salvar('pd-zoom', String(nivel));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var z = parseInt(ler('pd-zoom'), 10);
    if (!isNaN(z) && z >= 0 && z < niveis.length) { nivel = z; aplicarZoom(); }
    if (ler('pd-contraste') === '1') html.classList.add('contraste');

    var mais = document.querySelector('[data-acc="mais"]');
    var menos = document.querySelector('[data-acc="menos"]');
    var contraste = document.querySelector('[data-acc="contraste"]');

    if (mais) mais.addEventListener('click', function () {
      if (nivel < niveis.length - 1) { nivel++; aplicarZoom(); }
    });
    if (menos) menos.addEventListener('click', function () {
      if (nivel > 0) { nivel--; aplicarZoom(); }
    });
    if (contraste) contraste.addEventListener('click', function () {
      var ativo = html.classList.toggle('contraste');
      contraste.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      salvar('pd-contraste', ativo ? '1' : '0');
    });
  });
})();

// Formulários ainda sem destino definido: avisam em vez de recarregar a página.
document.addEventListener('submit', function (e) {
  var f = e.target;
  if (f && f.hasAttribute && f.hasAttribute('data-pendente')) {
    e.preventDefault();
    alert(f.getAttribute('data-pendente'));
  }
});
