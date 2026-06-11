const fs = require('fs');
let code = fs.readFileSync('src/pages/InventoryManagement.jsx', 'utf-8');

code = code.replace(/const \[itemData, setItemData\] = useState\(\{ name: '', unit: '', category: '', isNewCategory: false, suppliers: \[\], minStockLevels: \{\} \}\);/g, "const [itemData, setItemData] = useState({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [], minStockLevels: {}, secondaryUnit: '', conversionFactor: '' });");

code = code.replace(/setItemData\(\{ name: '', unit: '', category: '', isNewCategory: false, suppliers: \[\], minStockLevels: \{\} \}\);/g, "setItemData({ name: '', unit: '', category: '', isNewCategory: false, suppliers: [], minStockLevels: {}, secondaryUnit: '', conversionFactor: '' });");

code = code.replace(/setItemData\(\{ name: item.name, unit: item.unit, category: item.category, isNewCategory: false, suppliers: item.suppliers \|\| \[\], minStockLevels: item.minStockLevels \|\| \{\} \}\);/g, "setItemData({ name: item.name, unit: item.unit, category: item.category, isNewCategory: false, suppliers: item.suppliers || [], minStockLevels: item.minStockLevels || {}, secondaryUnit: item.secondaryUnit || '', conversionFactor: item.conversionFactor || '' });");

code = code.replace(/\{ unit: itemData.unit, category: itemData.category, suppliers: itemData.suppliers, minStockLevels: itemData.minStockLevels \}/g, "{ unit: itemData.unit, category: itemData.category, suppliers: itemData.suppliers, minStockLevels: itemData.minStockLevels, secondaryUnit: itemData.secondaryUnit, conversionFactor: itemData.conversionFactor }");

code = code.replace(/itemData.name.trim\(\), itemData.unit, itemData.category, itemData.suppliers, itemData.minStockLevels/g, "itemData.name.trim(), itemData.unit, itemData.category, itemData.suppliers, itemData.minStockLevels, itemData.secondaryUnit, itemData.conversionFactor");

fs.writeFileSync('src/pages/InventoryManagement.jsx', code);
