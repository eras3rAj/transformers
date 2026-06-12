import os
import re

def check_lucide():
    src_dir = 'src'
    lucide_icons = set()
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = re.findall(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"]', content)
                    for match in matches:
                        icons = [i.strip() for i in match.split(',')]
                        lucide_icons.update(icons)
                        
    print(sorted([i for i in lucide_icons if i]))

check_lucide()
