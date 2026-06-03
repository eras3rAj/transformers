const fs = require('fs');
const path = require('path');

const contextDir = path.join(__dirname, 'src', 'context');
const files = fs.readdirSync(contextDir);

files.forEach(file => {
  if (!file.endsWith('Context.jsx')) return;
  const filePath = path.join(contextDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the exact block we injected and replace it back with the original
  // We injected:
  //   useEffect(() => {
  //     fetchX();
  // 
  //     const channel = supabase
  //       .channel('custom-all-channel-\${Date.now()}-table')
  //       .on('postgres_changes', { event: '*', schema: 'public', table: 'table' }, (payload) => {
  //         fetchX();
  //       })
  //       .subscribe();
  // 
  //     return () => {
  //       supabase.removeChannel(channel);
  //     };
  //   }, []);
  
  // A regex to match the whole block and capture fetchFuncName and dependencies
  const regex = /  useEffect\(\(\) => \{\s+([a-zA-Z0-9_]+)\(\);\s+const channel = supabase\s+\.channel\('[^']+'\)\s+\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: '[^']+' \}, \(payload\) => \{\s+\1\(\);\s+\}\)\s+\.subscribe\(\);\s+return \(\) => \{\s+supabase\.removeChannel\(channel\);\s+\};\s+\}, (\[[^\]]*\])\);/g;

  if (regex.test(content)) {
    content = content.replace(regex, "  useEffect(() => {\n    $1();\n  }, $2);");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted ${file}`);
  }
});
