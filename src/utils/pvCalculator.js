export const calculatePVFinancials = (po, baseData, currData) => {
  if (!baseData || !currData) return null;

  const WEIGHTS = {
    fixed: po.weightFixed !== undefined ? (po.weightFixed / 100) : 0.15,
    al: po.weightAl !== undefined ? (po.weightAl / 100) : (po.conductorType === 'Aluminium' ? 0.22 : 0),
    cu: po.weightCu !== undefined ? (po.weightCu / 100) : (po.conductorType === 'Copper' ? 0.22 : 0),
    crgo: po.weightCrgo !== undefined ? (po.weightCrgo / 100) : 0.36,
    oil: po.weightOil !== undefined ? (po.weightOil / 100) : 0.10,
    steel: po.weightSteel !== undefined ? (po.weightSteel / 100) : 0.12,
    insulating: po.weightInsulating !== undefined ? (po.weightInsulating / 100) : 0.05,
    cpi: po.weightCpi !== undefined ? (po.weightCpi / 100) : 0.00
  };

  const origExWorks = po.exWorks;
  const origFreight = po.freight;
  const origTaxable = origExWorks + origFreight;
  const origGst = origTaxable * (po.gstRate / 100);
  const origTotal = origTaxable + origGst;

  const alFactor = WEIGHTS.al > 0 ? WEIGHTS.al * (currData.al / baseData.al) : 0;
  const cuFactor = WEIGHTS.cu > 0 ? WEIGHTS.cu * (currData.cu / baseData.cu) : 0; 
  
  const crgoFactor = WEIGHTS.crgo > 0 ? WEIGHTS.crgo * (currData.crgo / baseData.crgo) : 0;
  const oilFactor = WEIGHTS.oil > 0 ? WEIGHTS.oil * (currData.oil / baseData.oil) : 0;
  const steelFactor = WEIGHTS.steel > 0 ? WEIGHTS.steel * (currData.steel315 / baseData.steel315) : 0;
  const insulFactor = WEIGHTS.insulating > 0 ? WEIGHTS.insulating * (currData.insulating3 / baseData.insulating3) : 0;
  const cpiFactor = WEIGHTS.cpi > 0 ? WEIGHTS.cpi * (currData.cpi / baseData.cpi) : 0;
  
  const totalFactor = WEIGHTS.fixed + alFactor + cuFactor + crgoFactor + oilFactor + steelFactor + insulFactor + cpiFactor;
  
  const newExWorks = origExWorks * totalFactor;
  const newFreight = origFreight; 
  const newTaxable = newExWorks + newFreight;
  const newGst = newTaxable * (po.gstRate / 100);
  const newTotal = newTaxable + newGst;

  const exWorksDiff = newExWorks - origExWorks;
  const totalDiff = newTotal - origTotal;
  const percentageChange = ((totalFactor - 1) * 100).toFixed(2);

  return {
    origExWorks, origFreight, origTaxable, origGst, origTotal,
    newExWorks, newFreight, newTaxable, newGst, newTotal,
    exWorksDiff, totalDiff, percentageChange,
    currMonthStr: currData.month
  };
};
