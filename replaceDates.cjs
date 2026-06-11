const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Pattern 1: new Date(xyz).toLocaleDateString(...)
  content = content.replace(/new Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');
  
  // Pattern 2: d.toLocaleDateString(...) where d is a variable
  content = content.replace(/([a-zA-Z0-9_]+)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');

  if (content !== original) {
    if (!content.includes("import { formatDate }")) {
      content = "import { formatDate } from '../utils/dateUtils';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
};

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.jsx')) {
    replaceInFile(path.join(pagesDir, file));
  }
});
