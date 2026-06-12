import sys

with open('src/pages/OperationsHub.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = "import TransformerDispatch from '../components/operations/TransformerDispatch';\n"
if "TransformerDispatch" not in content:
    content = content.replace("import EodSummary from '../components/common/EodSummary';", "import EodSummary from '../components/common/EodSummary';\n" + import_statement)

if "{ id: 'dispatch'" not in content:
    content = content.replace("{ id: 'eod-summary', label: 'EOD Summary', component: <EodSummary /> }", "{ id: 'eod-summary', label: 'EOD Summary', component: <EodSummary /> },\n    { id: 'dispatch', label: 'Dispatch & Loading', component: <TransformerDispatch /> }")

with open('src/pages/OperationsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("TransformerDispatch added to OperationsHub.jsx")
