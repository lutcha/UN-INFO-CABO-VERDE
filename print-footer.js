/* Print/PDF without the browser's own header and footer (page URL, title, date).
   With page margins at 0 the browser has no room to print them. A frame table is
   wrapped around the page only while printing: its header row gives the top margin
   and its footer row repeats our own footer (source and extraction date) on every page.
   Each page can set window.PRINT_FOOTER = () => 'text' to describe its data. */
(function () {
  var frame = null, style = null, moved = [];
  function footerText() {
    var t = '';
    try { t = window.PRINT_FOOTER ? window.PRINT_FOOTER() : ''; } catch (e) {}
    return t || ('Fonte: UN INFO, Quadro de Cooperação de Cabo Verde 2023–2027 · relatório gerado em ' + new Date().toLocaleDateString('pt-PT'));
  }
  function before() {
    if (frame) return;
    style = document.createElement('style');
    style.textContent = '@media print{@page{margin:0 !important}' +
      'body{margin:0 !important;padding:0 10mm !important}' +
      'table.pf{width:100%;border-collapse:collapse;border:0;margin:0}' +
      'table.pf>thead>tr>td,table.pf>tfoot>tr>td,table.pf>tbody>tr>td{border:0 !important;padding:0 !important;background:none !important}' +
      'table.pf>tbody>tr{break-inside:auto !important}' +
      '.pf-top{height:10mm}' +
      '.pf-foot{height:12mm;box-sizing:border-box;padding-top:3mm;border-top:1px solid #D5DEE8;font:9px/1.4 Arial,sans-serif;color:#4A627A}}';
    document.head.appendChild(style);
    frame = document.createElement('table');
    frame.className = 'pf';
    frame.innerHTML = '<thead><tr><td><div class="pf-top"></div></td></tr></thead>' +
      '<tfoot><tr><td><div class="pf-foot"></div></td></tr></tfoot><tbody><tr><td></td></tr></tbody>';
    frame.querySelector('.pf-foot').textContent = footerText();
    var cell = frame.querySelector('tbody td');
    moved = Array.prototype.slice.call(document.body.childNodes).filter(function (n) { return n.nodeName !== 'SCRIPT'; });
    moved.forEach(function (n) { cell.appendChild(n); });
    document.body.appendChild(frame);
  }
  function after() {
    if (!frame) return;
    moved.forEach(function (n) { document.body.insertBefore(n, frame); });
    frame.remove(); style.remove();
    frame = null; style = null; moved = [];
  }
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
})();
