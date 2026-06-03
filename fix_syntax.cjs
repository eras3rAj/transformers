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

  // We need to fix the syntax error:
  // import React
  // import { formatDate } from '../utils/dateUtils';, { useState } from 'react';
  
  // We can just find this bad pattern and replace it.
  const regex1 = /import React\nimport \{ formatDate \} from '\.\.\/utils\/dateUtils';, (\{[^}]+\}) from 'react';/g;
  content = content.replace(regex1, "import React, $1 from 'react';\nimport { formatDate } from '../utils/dateUtils';");
  
  const regex2 = /import React\nimport \{ formatDate \} from '\.\.\/\.\.\/utils\/dateUtils';, (\{[^}]+\}) from 'react';/g;
  content = content.replace(regex2, "import React, $1 from 'react';\nimport { formatDate } from '../../utils/dateUtils';");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed syntax in ${file}`);
  }
});
