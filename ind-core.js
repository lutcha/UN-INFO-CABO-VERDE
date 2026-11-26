/* Shared indicator model for indicadores.html and rankings.html.
   Turns the UN INFO indicator export into ROWS (status, gaps, alerts, agencies),
   so both pages always show the same numbers. Pages define INTERNO before calling build(). */
// ───────── configuration ─────────
const CLOSED_YEAR = 2025;                 // last closed reporting year
const YEARS = [2026,2025,2024,2023];
// value is not comparable with the baseline (other measure, other unit, annual vs cumulative)
const NONCOMP = {
  '1.1.2':'O valor de 2023 é outra medida (população urbana realojada), não comparável com a base.',
  '2.1.5':'O valor de 2026 corresponde a outra medida («copiar ou mover ficheiros»), não ao proxy usado.',
  '3.1.10':'Base em % (74%) e valores sem unidade (42).',
  'OI 15.2':'Base e meta em km², valores em hectares.',
  'OI 1.5':'Base cumulativa e valores anuais.',
  'OI 15.3':'Base cumulativa e valor anual.',
  'OI 3.1':'Valores cumulativos contra meta anual.',
  'OI 2.4':'Metas anuais decrescentes: comparar com a meta de cada ano, não com a de 2027.'
};
const AG_PT = {UNDP:'PNUD',UNICEF:'UNICEF',UNFPA:'UNFPA',WHO:'OMS',ILO:'OIT',FAO:'FAO',IOM:'OIM',UNIDO:'ONUDI',UNEP:'PNUMA',UNESCO:'UNESCO',
  'UN-HABITAT':'ONU-Habitat','UN HABITAT':'ONU-Habitat',UNODC:'ONUDC',OHCHR:'ACNUDH','UN ECA':'CEA',UNECA:'CEA',ITU:'UIT',UNCTAD:'CNUCED',IFAD:'FIDA',WFP:'PAM',PAM:'PAM',
  OIT:'OIT',OMS:'OMS',PNUD:'PNUD',OIM:'OIM',ONUDC:'ONUDC'};
// English acronym of each agency, shown next to the Portuguese one: "PNUD (UNDP)"
const AG_EN = {PNUD:'UNDP',OMS:'WHO',OIT:'ILO',OIM:'IOM',ONUDI:'UNIDO',PNUMA:'UNEP','ONU-Habitat':'UN-Habitat',ONUDC:'UNODC',ACNUDH:'OHCHR',
  CEA:'UNECA',UIT:'ITU',CNUCED:'UNCTAD',FIDA:'IFAD',PAM:'WFP','ONU Mulheres':'UN Women'};
const agL = a => AG_EN[a] && AG_EN[a] !== a ? `${a} (${AG_EN[a]})` : a;
const agEN = a => AG_EN[a] || a;
const agList = (list, skip) => list.filter(x=>x!==skip).map(agL).join(', ');
const STATUS = [
  ['ok','Meta atingida','#10B981'],['on','No caminho','#3B82F6'],['late','Atrasado','#F59E0B'],
  ['back','A recuar','#EF4444'],['rev','Rever','#8B5CF6'],['na','Sem dados','#CBD5E1']];
const SLABEL = Object.fromEntries(STATUS.map(s=>[s[0],s[1]]));

// ───────── helpers ─────────
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = s => String(s??'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const isEmpty = s => ['','-','—','nan','none','n/a'].includes(clean(s).toLowerCase());
// UN INFO's own colour on output indicators: 2025 value against the 2025 (annual) target.
// Only plain numbers count; anything else (qualitative values, empty target) is "Sem avaliação".
function strictNum(s){ s = clean(s); return /^-?\d+(?:[.,]\d+)?\s*%?$/.test(s) ? parseFloat(s.replace('%','').replace(',','.')) : null; }
const A25 = {ok:'Atingiu meta 2025', below:'Abaixo da meta 2025', na:'Sem avaliação'};
function num(s){
  s = clean(s); if(!s) return null;
  const m = s.match(/^[A-Za-zÀ-ú:\s]*?(-?\d+(?:[.,]\d+)?)\s*%?/);
  if(!m) return null;
  let t = m[1];
  if(/^\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g,'');
  const v = parseFloat(t.replace(',','.'));
  return isFinite(v) ? v : null;
}
const hasText = s => { const c = clean(s); return /\d/.test(c) && /[A-Za-zÀ-ú(]/.test(c.replace(/%/g,'')) && !/^[\d.,\s%-]+$/.test(c); };
const fmtN = v => v==null ? '—' : (Math.abs(v)>=1000 ? Math.round(v).toLocaleString('pt-PT') : String(+v.toFixed(2)).replace('.',','));
const pct = v => v==null ? '—' : Math.round(v*100)+'%';
function agencyName(a){ a = clean(a).toUpperCase().replace(/\s+/g,' '); return AG_PT[a] || AG_PT[a.replace(' ','-')] || a; }

function code(r){
  const m = clean(r.indicators).match(/^(\d\.\d\.\d+)/); if(m) return m[1];
  const d = String(r.description||'');
  const o = d.match(/OI\s*(\d+\.\d+)/); if(o) return 'OI '+o[1];
  const i = d.match(/invent[aá]rio\s*([\d._]+)/i); if(i) return 'Inv. '+i[1];
  return 's/ código';
}
function agencies(r){
  let raw = clean(r['agency abbreviations']);
  if(isEmpty(raw)){
    const m = clean(r.indicators).match(/\(([A-Z][A-Za-z ,/\-]+)\)\s*$/);
    raw = m ? m[1] : '';
  }
  return [...new Set(raw.split(/[;,/]/).map(a=>agencyName(a)).filter(a=>a && a.length<=12))];
}

// Portuguese part of "PT / EN" statements, without the "Efeito x:" / "Produto x:" prefix
const ptPart = s => clean(s).split(' / Outcome')[0].replace(/^(Efeito|Produto)\s*[\d.]+\s*:?\s*/,'').trim();
const RESP_MAP = {UNDP:'PNUD',PNUD:'PNUD',UNHABITAT:'ONU-Habitat',ONUHABITAT:'ONU-Habitat',OIT:'OIT',ILO:'OIT',OMS:'OMS',WHO:'OMS',OIM:'OIM',IOM:'OIM',
  UNIDO:'ONUDI',ONUDI:'ONUDI',OHCHR:'ACNUDH',ACNUDH:'ACNUDH',UNODC:'ONUDC',ONUDC:'ONUDC',UNECA:'CEA',ECA:'CEA',CEA:'CEA',ITU:'UIT',UIT:'UIT',FAO:'FAO',
  UNESCO:'UNESCO',UNICEF:'UNICEF',UNFPA:'UNFPA',UNCTAD:'CNUCED',CNUCED:'CNUCED',UNEP:'PNUMA',PNUMA:'PNUMA'};
// people named in the "AGÊNCIA RESPONSÁVEL" line of the description, per agency (internal version only)
function responsaveis(desc){
  const out = {};
  const m = String(desc||'').match(/AG[ÊE]NCIA RESPONS[ÁA]VEL\s*:([\s\S]*?)(?:FONTE|\n\s*\n|$)/);
  if(!m) return out;
  const parts = [];
  clean(m[1]).split(';').forEach(p=>parts.push(...p.split(/[\s,/]*(?=(?:UN[ -]?HABITAT|UNDP|PNUD|OIT|ILO|OMS|WHO|OIM|IOM|UNIDO|ONUDI|OHCHR|UNODC|ONUDC|UNECA|ITU|FAO|UNESCO|UNICEF|UNFPA|UNCTAD|UNEP)\b[^:;]{0,12}:)/)));
  parts.forEach(p=>{
    const mm = p.match(/^\s*([A-Za-z][A-Za-z /()-]{1,30}?)\s*(?::|\s[-–]\s)\s*(.+)$/); if(!mm) return;
    const who = mm[2].trim().replace(/^[ .,/]+|[ .,/]+$/g,'');
    mm[1].replace(/\(.*?\)/g,'').split('/').forEach(a=>{ const k = RESP_MAP[a.toUpperCase().replace(/[\s()-]|SEGUIR/g,'')]; if(k) (out[k]=out[k]||[]).push(who); });
  });
  Object.keys(out).forEach(k=>out[k]=[...new Set(out[k])].join('; '));
  return out;
}

// ───────── model ─────────
let ROWS = [];
function build(data){
  ROWS = data.filter(r=>clean(r.indicators)).map(r=>{
    const c = code(r);
    const tipo = clean(r.output) ? 'Produto' : 'Efeito';
    let oc = (clean(r.outcome).match(/Efeito\s*([\d.]+)/)||[])[1]||''; oc = oc.replace(/\.$/,'');
    const pr = ((clean(r.output).match(/Produto\s*([\d.]+)/)||[])[1]||'').replace(/[:.]$/,'');
    const name = clean(r.indicators).replace(/^\d\.\d\.\d+\s*/,'');
    const bnum = num(r.baseline), tnum = num(r['target 2027']);
    const flags = [];
    const vals = {};
    YEARS.forEach(y=>{
      let v = r['reached '+y];
      if(isEmpty(v)){ vals[y]=''; return; }
      const n = num(v);
      if(tipo==='Efeito' && n===0 && bnum!=null && bnum>=5){ flags.push(`Valor ${y} = 0 tratado como «sem dados»`); vals[y]=''; return; }
      if(hasText(v)) flags.push(`Texto no campo de valor ${y}`);
      vals[y] = clean(v);
    });
    let last='', ly=null;
    for(const y of YEARS){ if(vals[y]){ last=vals[y]; ly=y; break; } }
    const active = String(r['end date']||'') >= `${CLOSED_YEAR}-01-01`;
    const gap = active && !vals[CLOSED_YEAR];
    let lnum = last ? num(last) : null;
    if(NONCOMP[c]){ flags.push(NONCOMP[c]); lnum = null; }
    if(active && isEmpty(r['target 2027'])) flags.push('Meta 2027 vazia no UN INFO');
    // repeated value (same value reported 3+ years in a row)
    const seq = [2023,2024,2025,2026].map(y=>vals[y]).filter(Boolean);
    if(seq.length>=3 && new Set(seq).size===1 && bnum!=null && num(seq[0])!==bnum) flags.push('Mesmo valor repetido em todos os anos');
    let prog=null, st;
    if(!last) st='na';
    else if(bnum!=null && tnum!=null && lnum!=null && tnum!==bnum){
      prog = (lnum-bnum)/(tnum-bnum);
      st = prog>=1?'ok':prog>=.5?'on':prog>=0?'late':'back';
    } else if(!NONCOMP[c] && clean(last).toLowerCase()===clean(r['target 2027']).toLowerCase() && !isEmpty(r['target 2027'])) st='ok';
    else st='rev';
    const t25n = strictNum(r['target 2025']), v25n = strictNum(r['reached 2025']);
    const a25 = (t25n==null || v25n==null || (tipo==='Efeito' && v25n===0 && bnum!=null && bnum>=5)) ? 'na' : (v25n >= t25n ? 'ok' : 'below');
    const mov = clean(r['Means of Verification']);
    const narr25 = !isEmpty(r['narrative 2025']);
    let todo = '';
    if(gap){ todo = 'Valor '+CLOSED_YEAR + (narr25 ? '' : ' e narrativa '+CLOSED_YEAR); if(tipo==='Efeito') todo += ' — dado nacional: confirmar se já foi publicado'; }
    if(flags.length) todo = (todo ? todo+'. ' : '') + 'Verificar: ' + flags.map(f=>f.replace(/\.$/,'')).join('; ');
    return {c,tipo,oc,pr,name,ag:agencies(r),unit:clean(r.unit),base:clean(r.baseline),meta:clean(r['target 2027']),
      v25:vals[2025],v26:vals[2026],last,ly,bnum,tnum,lnum,prog,st,active,gap,flags,
      narr:clean(r['narrative 2026'])||clean(r['narrative 2025']),
      ocDesc:ptPart(r.outcome), prDesc:tipo==='Produto'?ptPart(r.output):'', mov:isEmpty(mov)?'':mov,
      who: tipo==='Efeito' ? 'Instituição nacional'+(/\bINE\b|Instituto Nacional de Estat/.test(mov)?' (INE)':'') : 'Agência',
      t25: clean(r['target 2025']), a25,
      narr25, todo, action: gap || flags.length>0, resp: INTERNO ? responsaveis(r.description) : {}};
  }).sort((a,b)=>a.oc.localeCompare(b.oc)||(a.tipo===b.tipo?0:a.tipo==='Efeito'?-1:1)||a.pr.localeCompare(b.pr)||a.c.localeCompare(b.c));
}

