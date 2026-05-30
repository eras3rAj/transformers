import React from 'react';
import { renderToString } from 'react-dom/server';
import PriceVariation from './src/pages/PriceVariation';
import { PVContext } from './src/context/PVContext';
import { POContext } from './src/context/POContext';

const indices = [{
  id: '1', month: 'January 2026', al: 10, cu: 10, crgo: 10, steel315: 10, insulating3: 10, oil: 10, cpi: 10, fixed: 100
}];
const pos = [{
  id: '1', poNo: 'PO1', utilityBoard: 'UPCL', conductorType: 'Aluminium', capacity: '100kVA', baseMonthStr: 'January 2026', exWorks: 1000, freight: 100, gstRate: 18, quantity: 1, weightFixed: 15, weightAl: 22, weightCu: 0, weightCrgo: 36, weightSteel: 12, weightInsulating: 5, weightOil: 10, weightCpi: 0
}];

const App = () => (
  <PVContext.Provider value={{ indices, addIndex: () => {}, updateIndex: () => {}, getIndexByMonth: (m) => indices.find(i => i.month.toLowerCase() === m.toLowerCase()) }}>
    <POContext.Provider value={{ pos, addPO: () => {}, boards: [], capacities: [], gstRates: [] }}>
      <PriceVariation />
    </POContext.Provider>
  </PVContext.Provider>
);

try {
  const html = renderToString(<App />);
  console.log("Rendered successfully!", html.length);
} catch (e) {
  console.error("CRASH:", e);
}
