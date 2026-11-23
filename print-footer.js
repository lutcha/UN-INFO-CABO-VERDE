/* Print/PDF footer: data source + extraction date on the left, "Página X de Y" on the right.
   It uses CSS page margin boxes (Chrome/Edge 131+). When a page defines its own margin
   boxes, the browser does not print its default header and footer (page URL, title, date)
   in those places, so the PDF carries no link to where the page is hosted.
   Each page can set window.PRINT_FOOTER = () => 'text' to describe its data. */
(function () {
  var style = null;
  function footerText() {
    var t = '';
    try { t = window.PRINT_FOOTER ? window.PRINT_FOOTER() : ''; } catch (e) {}
    return t || ('Fonte: UN INFO, Quadro de Cooperação de Cabo Verde 2023–2027 · relatório gerado em ' + new Date().toLocaleDateString('pt-PT'));
  }
  function cssString(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
  function before() {
    if (style) style.remove();
    style = document.createElement('style');
    var box = 'font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#4A627A;';
    style.textContent = '@media print{@page{margin-bottom:14mm;' +
      '@top-left{content:" "}@top-right{content:" "}' +
      '@bottom-left{content:' + cssString(footerText()) + ';' + box + 'vertical-align:middle}' +
      '@bottom-right{content:"Página " counter(page) " de " counter(pages);' + box + 'vertical-align:middle;text-align:right}}}';
    document.head.appendChild(style);   // added last, so it wins over earlier @page rules for these properties
  }
  window.addEventListener('beforeprint', before);
})();
