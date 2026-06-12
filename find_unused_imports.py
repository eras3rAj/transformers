import os
import re

def find_unused_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all import statements
    import_regex = re.compile(r'import\s+(.*?)\s+from\s+[\'"](.*?)[\'"];?', re.DOTALL)
    imports = import_regex.findall(content)

    unused = []
    
    # Remove all import statements from content to check usage
    content_no_imports = import_regex.sub('', content)

    for symbols_str, module in imports:
        # Handle default imports, named imports, and aliases
        # e.g., React, { useState, useEffect as effect }
        
        # Clean up symbols
        symbols_str = symbols_str.replace('{', '').replace('}', '')
        symbols = [s.strip() for s in symbols_str.split(',')]
        
        for symbol in symbols:
            if not symbol:
                continue
                
            # Handle aliases: `useEffect as effect` -> we care about `effect`
            if ' as ' in symbol:
                symbol = symbol.split(' as ')[1].strip()
                
            # Handle default imports: if it starts with * as
            if symbol.startswith('* as '):
                symbol = symbol.replace('* as ', '').strip()

            # Skip React import as it might not be explicitly used in React 17+ but is fine
            if symbol == 'React':
                continue

            # Check if symbol is used in the remaining content
            # Use word boundary to avoid partial matches
            usage_regex = re.compile(r'\b' + re.escape(symbol) + r'\b')
            matches = usage_regex.findall(content_no_imports)
            
            if not matches:
                unused.append(symbol)

    return unused

def main():
    src_dir = 'src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                unused = find_unused_imports(filepath)
                if unused:
                    print(f'{filepath}: {unused}')

if __name__ == "__main__":
    main()
