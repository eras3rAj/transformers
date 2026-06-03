const fs = require('fs');
const path = require('path');

const contextDir = path.join(__dirname, 'src', 'context');
const files = fs.readdirSync(contextDir);

files.forEach(file => {
  if (!file.endsWith('Context.jsx')) return;
  const filePath = path.join(contextDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes("channel('custom-all-channel')")) {
    const tableMatch = content.match(/table: '([^']+)'/);
    if (tableMatch) {
      const tableName = tableMatch[1];
      content = content.replace("channel('custom-all-channel')", `channel('custom-all-channel-\${Date.now()}-${tableName}')`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated channel name in ${file}`);
    }
  }
});
