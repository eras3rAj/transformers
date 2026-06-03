const fs = require('fs');
const path = require('path');

const contextDir = path.join(__dirname, 'src', 'context');
const files = fs.readdirSync(contextDir);

files.forEach(file => {
  if (!file.endsWith('Context.jsx')) return;
  const filePath = path.join(contextDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We are looking for something like:
  // useEffect(() => {
  //   fetch...();
  // }, []);
  // and we want to change it to include the supabase subscription.

  // We need to figure out the table name. We can find it by looking for `supabase.from('some_table')`
  const tableMatch = content.match(/supabase\.from\(['"]([^'"]+)['"]\)/);
  if (!tableMatch) {
    console.log(`Skipping ${file}: No supabase.from found.`);
    return;
  }
  const tableName = tableMatch[1];

  // We also need to find the fetch function name, e.g. fetchClaims, fetchPOs, fetchLogs
  const fetchMatch = content.match(/const (fetch[A-Za-z0-9_]+) = async \(\) =>/);
  if (!fetchMatch) {
    console.log(`Skipping ${file}: No fetch function found.`);
    return;
  }
  const fetchFuncName = fetchMatch[1];

  // Check if it already has a channel subscription
  if (content.includes('.channel(')) {
    console.log(`Skipping ${file}: Already has a channel subscription.`);
    return;
  }

  // Find the exact useEffect block
  // This is tricky with regex, let's use a simple string replacement
  const searchStr1 = `  useEffect(() => {
    ${fetchFuncName}();
  }, []);`;
  
  const searchStr2 = `  useEffect(() => {
    ${fetchFuncName}();
  }, [currentUser]);`; // some might depend on currentUser

  const replacement1 = `  useEffect(() => {
    ${fetchFuncName}();

    const channel = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: '${tableName}' }, (payload) => {
        ${fetchFuncName}();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;

  const replacement2 = `  useEffect(() => {
    ${fetchFuncName}();

    const channel = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: '${tableName}' }, (payload) => {
        ${fetchFuncName}();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);`;

  if (content.includes(searchStr1)) {
    content = content.replace(searchStr1, replacement1);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else if (content.includes(searchStr2)) {
    content = content.replace(searchStr2, replacement2);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find exact useEffect block in ${file}`);
  }
});
