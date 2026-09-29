/* Shared strict icon model for browser previews and the offline Android importer. */
(function (root) {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function number(v, label, min, max) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw Error(label + ' is outside its supported range.');
    return v;
  }
  function paint(v) {
    if (v === 'none' || v === 'currentColor') return v;
    if (typeof v === 'string' && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(v)) {
      v = v.toLowerCase();
      return v.length < 6 ? '#' + [...v.slice(1)].map(x => x + x).join('') : v;
    }
    throw Error('Paint must be a hex color, currentColor, or none. Gradients and external references are not supported.');
  }
  function pathData(d) {
    if (typeof d !== 'string' || d.length > 100000 || !/^\s*[Mm]/.test(d)) throw Error('A path must start with M and be under 100,000 characters.');
    const tokenPattern = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
    let tokens = [], m, end = 0;
    while ((m = tokenPattern.exec(d))) {
      if (!/^[\s,]*$/.test(d.slice(end, m.index))) throw Error('Unsupported path syntax.');
      tokens.push(m[0]); end = tokenPattern.lastIndex;
    }
    if (!/^[\s,]*$/.test(d.slice(end)) || tokens.length > 18000) throw Error('Invalid or oversized path.');
    const arities = { M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0 };
    let i = 0;
    while (i < tokens.length) {
      const command = tokens[i++], upper = command.toUpperCase();
      if (!own(arities, upper)) throw Error('Unsupported path command ' + command);
      const start = i;
      while (i < tokens.length && !/^[a-z]$/i.test(tokens[i])) {
        const n = Number(tokens[i]); if (!Number.isFinite(n) || Math.abs(n) > 100000) throw Error('Path coordinate is out of range.');
        i++;
      }
      const count = i - start, arity = arities[upper];
      if (arity === 0 ? count !== 0 : count === 0 || count % arity !== 0) throw Error('Wrong argument count for ' + command);
      if (upper === 'A') for (let at = start; at < i; at += 7) {
        if (Number(tokens[at]) < 0 || Number(tokens[at+1]) < 0 || !['0','1'].includes(tokens[at+3]) || !['0','1'].includes(tokens[at+4])) throw Error('Invalid arc radius or flag.');
      }
    }
    return d.trim();
  }
  function model(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Missing icon geometry.');
    const result = { width:number(input.width,'Width',1,4096), height:number(input.height,'Height',1,4096), paths:[] };
    if (!Array.isArray(input.paths) || input.paths.length < 1 || input.paths.length > 128) throw Error('Use between 1 and 128 paths.');
    for (const p of input.paths) {
      if (!p || typeof p !== 'object') throw Error('Invalid path.');
      const q = { d:pathData(p.d), fill:paint(p.fill ?? 'currentColor'), stroke:paint(p.stroke ?? 'none'), strokeWidth:number(p.strokeWidth ?? 0,'Stroke width',0,4096), fillRule:p.fillRule ?? 'nonzero', lineCap:p.lineCap ?? 'butt', lineJoin:p.lineJoin ?? 'miter', opacity:number(p.opacity ?? 1,'Opacity',0,1), fillOpacity:number(p.fillOpacity ?? 1,'Fill opacity',0,1), strokeOpacity:number(p.strokeOpacity ?? 1,'Stroke opacity',0,1) };
      if (!['nonzero','evenodd'].includes(q.fillRule) || !['butt','round','square'].includes(q.lineCap) || !['miter','round','bevel'].includes(q.lineJoin)) throw Error('Unsupported path rendering option.');
      result.paths.push(q);
    }
    return result;
  }
  function svg(input) {
    const m = model(input);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+m.width+' '+m.height+'">'+m.paths.map(p => '<path d="'+p.d+'" fill="'+p.fill+'" stroke="'+p.stroke+'" stroke-width="'+p.strokeWidth+'" fill-rule="'+p.fillRule+'" stroke-linecap="'+p.lineCap+'" stroke-linejoin="'+p.lineJoin+'" opacity="'+p.opacity+'" fill-opacity="'+p.fillOpacity+'" stroke-opacity="'+p.strokeOpacity+'"/>').join('')+'</svg>';
  }
  function fromSvg(text) {
    if (typeof DOMParser === 'undefined') throw Error('SVG normalization runs in the browser catalog. Import its JSON package on the command line.');
    if (typeof text !== 'string' || text.length > 1000000 || /<!DOCTYPE|<!ENTITY|<\?/i.test(text.replace(/^\s*<\?xml[^?]*\?>/i,''))) throw Error('SVG must be under 1 MB and cannot contain entities or processing instructions.');
    const doc = new DOMParser().parseFromString(text,'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw Error('Invalid SVG document.');
    const allowed = new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc']);
    const allowedAttributes = new Set(['xmlns','viewBox','width','height','version','id','fill','stroke','stroke-width','fill-rule','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity','d','x','y','rx','ry','r','cx','cy','x1','x2','y1','y2','points','role','aria-label']);
    for (const node of doc.querySelectorAll('*')) {
      if (!allowed.has(node.localName) || (node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/2000/svg')) throw Error('Unsupported SVG element: '+node.localName+'. Convert text and complex artwork to plain paths first.');
      for (const attr of node.attributes) if (!allowedAttributes.has(attr.name) || /url\s*\(|javascript:|data:/i.test(attr.value)) throw Error('Unsupported SVG attribute: '+attr.name+'. Flatten transforms, styles, and effects to plain paths first.');
    }
    const root = doc.documentElement, view = root.getAttribute('viewBox');
    const values = view ? view.trim().split(/[\s,]+/).map(Number) : [0,0,parseFloat(root.getAttribute('width')),parseFloat(root.getAttribute('height'))];
    if (values.length !== 4 || values[0] !== 0 || values[1] !== 0) throw Error('Use a viewBox starting at 0 0.');
    const result = {width:values[2],height:values[3],paths:[]};
    const value = (node,name,fallback) => node.hasAttribute(name) ? node.getAttribute(name) : fallback;
    function walk(node, inherited) {
      if (['title','desc'].includes(node.localName)) return;
      const style = { ...inherited };
      for (const [attr,key] of [['fill','fill'],['stroke','stroke'],['stroke-width','strokeWidth'],['fill-rule','fillRule'],['stroke-linecap','lineCap'],['stroke-linejoin','lineJoin'],['fill-opacity','fillOpacity'],['stroke-opacity','strokeOpacity']]) if (node.hasAttribute(attr)) style[key] = ['strokeWidth','fillOpacity','strokeOpacity'].includes(key) ? Number(node.getAttribute(attr)) : node.getAttribute(attr);
      style.opacity = inherited.opacity * Number(value(node,'opacity',1));
      if (['svg','g'].includes(node.localName)) { for (const child of node.children) walk(child,style); return; }
      const n = (key,fallback=0) => Number(value(node,key,fallback));
      let d = '';
      if (node.localName === 'path') d = node.getAttribute('d');
      else if (['circle','ellipse'].includes(node.localName)) {
        const x=n('cx'),y=n('cy'),rx=n(node.localName==='circle'?'r':'rx'),ry=n(node.localName==='circle'?'r':'ry');
        d=`M${x-rx} ${y} A${rx} ${ry} 0 1 0 ${x+rx} ${y} A${rx} ${ry} 0 1 0 ${x-rx} ${y} Z`;
      } else if (node.localName === 'rect') {
        const x=n('x'),y=n('y'),w=n('width'),h=n('height'),rx=Math.min(n('rx',n('ry')),w/2),ry=Math.min(n('ry',rx),h/2);
        if (w<=0||h<=0||rx<0||ry<0) throw Error('Invalid rectangle.');
        d=rx&&ry?`M${x+rx} ${y} H${x+w-rx} A${rx} ${ry} 0 0 1 ${x+w} ${y+ry} V${y+h-ry} A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h} H${x+rx} A${rx} ${ry} 0 0 1 ${x} ${y+h-ry} V${y+ry} A${rx} ${ry} 0 0 1 ${x+rx} ${y} Z`:`M${x} ${y} H${x+w} V${y+h} H${x} Z`;
      } else if (node.localName === 'line') d=`M${n('x1')} ${n('y1')} L${n('x2')} ${n('y2')}`;
      else { const points=(node.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number); if(points.length<4||points.length%2||points.some(v=>!Number.isFinite(v)))throw Error('Invalid polygon points.'); d='M'+points.slice(0,2).join(' ')+' L'+points.slice(2).join(' ')+(node.localName==='polygon'?' Z':''); }
      result.paths.push({...style,d});
    }
    walk(root,{fill:'currentColor',stroke:'none',strokeWidth:0,fillRule:'nonzero',lineCap:'butt',lineJoin:'miter',opacity:1,fillOpacity:1,strokeOpacity:1});
    return model(result);
  }
  function packageData(input, catalog) {
    if (!input || input.schema !== 'update-icon-replacements/v1' || !input.icons || typeof input.icons !== 'object' || Array.isArray(input.icons)) throw Error('Use an UpDate icon replacement package.');
    const valid = new Set(catalog.icons.filter(i=>i.replaceable).map(i=>i.id)), icons={};
    for (const [id, value] of Object.entries(input.icons)) {
      if (!valid.has(id)) throw Error('Unknown or protected icon: '+id);
      icons[id]=value===null?null:model(value);
    }
    // Emergency has one guardian shape across in-app controls, widgets and the active notification.
    const guardian=['drawable.widget_glyph_emergency','drawable.ic_stat_cosmic_guardian'];
    const supplied=guardian.filter(id=>own(icons,id));
    if(supplied.length===2&&JSON.stringify(icons[supplied[0]])!==JSON.stringify(icons[supplied[1]]))throw Error('Emergency and active-notification shields must use the same artwork.');
    if(supplied.length)for(const id of guardian)if(valid.has(id))icons[id]=icons[supplied[0]];
    return {schema:'update-icon-replacements/v1',icons,notes:typeof input.notes==='string'?input.notes.slice(0,20000):''};
  }
  root.UpDateIconModel={model,svg,fromSvg,packageData,pathData};
})(globalThis);
