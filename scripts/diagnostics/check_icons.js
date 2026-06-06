import * as Lucide from 'lucide-react';

const iconsToCheck = [
  // EodSummary
  'FileText', 'Calendar', 'Layers', 'Truck', 'ShieldAlert', 'DollarSign', 
  'PackageCheck', 'AlertTriangle', 'Printer', 'ChevronRight', 'TrendingDown', 
  'TrendingUp', 'Inbox',
  
  // CustomDuty
  'Percent', 'Calculator', 'Plus', 'Trash2', 'AlertCircle', 'HelpCircle',
  
  // BankGuaranteeLC
  'Briefcase', 'CheckCircle', 'Clock', 'Shield'
];

console.log("Checking Lucide React exports:");
let missingCount = 0;
iconsToCheck.forEach(iconName => {
  const icon = Lucide[iconName];
  if (!icon) {
    console.error(`❌ Icon NOT found: "${iconName}"`);
    missingCount++;
  } else {
    console.log(`✅ Icon found: "${iconName}"`);
  }
});

if (missingCount > 0) {
  console.error(`Total missing icons: ${missingCount}`);
} else {
  console.log("All icons verified successfully!");
}
