import os
import re

def check_imports_strict(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    import_regex = re.compile(r'import\s+.*?from\s+[\'"](\..*?)[\'"];?', re.DOTALL)
    imports = import_regex.findall(content)
    
    css_import_regex = re.compile(r'import\s+[\'"](\..*?)[\'"];?', re.DOTALL)
    css_imports = css_import_regex.findall(content)
    
    all_imports = imports + css_imports
    missing = []
    
    for imp in all_imports:
        dir_name = os.path.dirname(filepath)
        target_path = os.path.normpath(os.path.join(dir_name, imp))
        target_dir = os.path.dirname(target_path)
        target_base = os.path.basename(target_path)
        
        if not os.path.exists(target_dir):
            missing.append(imp + ' (dir not found)')
            continue
            
        actual_files = os.listdir(target_dir)
        
        # Check if target_base exactly matches any file in actual_files
        # Remember we need to add .jsx, .js, .css
        matched = False
        for ext in ['', '.jsx', '.js', '.css']:
            if (target_base + ext) in actual_files:
                matched = True
                break
                
        if not matched:
            missing.append(imp + ' (case mismatch or missing)')

    return missing

def main():
    src_dir = 'src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                missing = check_imports_strict(filepath)
                if missing:
                    print(f'{filepath}: {missing}')

if __name__ == "__main__":
    main()
