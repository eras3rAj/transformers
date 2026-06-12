import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = "import { DispatchProvider } from './context/DispatchContext';\n"
if "DispatchProvider" not in content:
    content = content.replace("import { ToastProvider } from './context/ToastContext';", "import { ToastProvider } from './context/ToastContext';\n" + import_statement)

if "<DispatchProvider>" not in content:
    content = content.replace("<DailyReportProvider>", "<DailyReportProvider>\n<DispatchProvider>")
    content = content.replace("</DailyReportProvider>", "</DispatchProvider>\n</DailyReportProvider>")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("DispatchProvider injected into App.jsx")
