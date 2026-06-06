const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // For SystemLogs.jsx
  if (file.includes('SystemLogs.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{log.timestamp\}<\/td>/g, ">{formatDate(log.timestamp)}</td>");
    content = content.replace(/>\{new Date\(log.timestamp\).toLocaleString\(\)\}<\/td>/g, ">{formatDate(log.timestamp)}</td>");
  }

  // For PurchaseOrders.jsx
  if (file.includes('PurchaseOrders.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/\{po.poDate\}/g, "{formatDate(po.poDate)}");
  }

  // For ProductionTracker.jsx
  if (file.includes('ProductionTracker.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{record.date\}<\/div>/g, ">{formatDate(record.date)}</div>");
  }

  // For Inspections.jsx
  if (file.includes('Inspections.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{record.inspectionDate\}<\/div>/g, ">{formatDate(record.inspectionDate)}</div>");
  }

  // For DailyExpenses.jsx
  if (file.includes('DailyExpenses.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{expense.date\}<\/td>/g, ">{formatDate(expense.date)}</td>");
  }

  // For VendorPurchasing.jsx
  if (file.includes('VendorPurchasing.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{po.date\}<\/div>/g, ">{formatDate(po.date)}</div>");
  }

  // For PendingTasks.jsx
  if (file.includes('PendingTasks.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{new Date\(task.created_at\).toLocaleDateString\(\)\}<\/div>/g, ">{formatDate(task.created_at)}</div>");
    content = content.replace(/>\{new Date\(task.updated_at\).toLocaleString\(\)\}<\/span>/g, ">{formatDate(task.updated_at)}</span>");
  }

  // For Milestones.jsx
  if (file.includes('Milestones.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../utils/dateUtils';");
    }
    content = content.replace(/>\{new Date\(m.target_date\).toLocaleDateString\(\)\}<\/div>/g, ">{formatDate(m.target_date)}</div>");
  }

  // For AuditHistoryModal.jsx
  if (file.includes('AuditHistoryModal.jsx')) {
    if (!content.includes('import { formatDate }')) {
      content = content.replace("import React", "import React\nimport { formatDate } from '../../utils/dateUtils';");
    }
    content = content.replace(/>\{log.timestamp\}<\/div>/g, ">{formatDate(log.timestamp)}</div>");
    content = content.replace(/\{new Date\(log.timestamp\).toLocaleString\(\)\}/g, "{formatDate(log.timestamp)}");
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
