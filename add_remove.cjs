const fs = require('fs');
let code = fs.readFileSync('src/pages/DailyReports.jsx', 'utf8');

if (!code.includes('removeTableRow')) {
  const insertIndex = code.indexOf('const addTableRow');
  const removeFunc = `const removeTableRow = (section, tableField, index) => {
    setFormData(prev => {
      const table = [...(prev[section][tableField] || [])];
      table.splice(index, 1);
      return { ...prev, [section]: { ...prev[section], [tableField]: table } };
    });
  };\n\n  `;
  code = code.slice(0, insertIndex) + removeFunc + code.slice(insertIndex);
}

const addTrashImport = (c) => {
  if (!c.includes('Trash2')) {
    return c.replace('import { ChevronDown, ChevronUp, Save, Send, Plus, AlertCircle, Calendar } from \'lucide-react\';', 'import { ChevronDown, ChevronUp, Save, Send, Plus, AlertCircle, Calendar, Trash2 } from \'lucide-react\';');
  }
  return c;
};
code = addTrashImport(code);

const regex = /<table className=\"report-table\"[\s\S]*?<\/table>/g;
code = code.replace(regex, (match) => {
  if (match.includes('removeTableRow')) return match;
  
  // Add empty <th> at the end of thead tr
  let res = match.replace(/<\/tr><\/thead>/, '<th style={{width: \'40px\'}}></th></tr></thead>');
  
  // Add <td> with delete button at the end of tbody tr
  const tbodyRowRegex = /(<td(?:>| [^>]*>)[^]*?onChange=\{e=>handleTableChange\([^)]+\)\}\/>(?:<\/select>)?<\/td>)[\s\n]*<\/tr>/g;
  res = res.replace(tbodyRowRegex, (m, p1) => {
    // We need to extract the parameters from handleTableChange to know section and tableField
    const paramsMatch = m.match(/handleTableChange\('([^']+)',\s*'([^']+)'(?:,\s*i(?:ndex)?)?,/);
    if (paramsMatch) {
      const section = paramsMatch[1];
      const tableField = paramsMatch[2];
      return p1 + `<td><button type=\"button\" className=\"icon-btn-small\" style={{color: 'var(--danger)'}} onClick={() => removeTableRow('${section}', '${tableField}', i)} title=\"Remove Row\"><Trash2 size={16} /></button></td></tr>`;
    }
    return m;
  });
  return res;
});

fs.writeFileSync('src/pages/DailyReports.jsx', code);
