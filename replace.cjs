const fs = require('fs');
const file = 'src/pages/DailyReports.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/className="badge"/g, 'className="status-badge"');
fs.writeFileSync(file, content);
