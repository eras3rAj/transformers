/**
 * Predictive Inventory Analytics
 * Calculates the burn rate and estimates the runway (days until stockout) for inventory items.
 */

export const calculateInventoryInsights = (transactions, items, getGlobalStock) => {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();

  // Filter for OUT transactions within the last 30 days
  const recentOutflows = transactions.filter(t => {
    if (t.type !== 'OUT') return false;
    const tDate = new Date(t.date);
    return (now - tDate) <= THIRTY_DAYS_MS;
  });

  // Group outflows by item name
  const usageByItem = {};
  recentOutflows.forEach(t => {
    if (!usageByItem[t.item]) usageByItem[t.item] = 0;
    usageByItem[t.item] += Number(t.qty || 0);
  });

  const insights = [];

  items.forEach(item => {
    const totalUsed30Days = usageByItem[item.name] || 0;
    const dailyBurnRate = totalUsed30Days / 30;
    const currentStock = getGlobalStock(item.name);
    
    let runwayDays = Infinity;
    if (dailyBurnRate > 0) {
      runwayDays = Math.floor(currentStock / dailyBurnRate);
    }

    let status = 'Healthy';
    let urgency = 'low';
    
    if (runwayDays <= 7 && runwayDays !== Infinity) {
      status = 'Critical Shortage Risk';
      urgency = 'high';
    } else if (runwayDays <= 14) {
      status = 'Reorder Soon';
      urgency = 'medium';
    } else if (currentStock === 0) {
      status = 'Out of Stock';
      urgency = 'high';
      runwayDays = 0;
    }

    if (totalUsed30Days > 0 || currentStock === 0) {
      insights.push({
        itemName: item.name,
        unit: item.unit,
        currentStock,
        dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
        runwayDays: runwayDays === Infinity ? 'Infinite' : runwayDays,
        status,
        urgency
      });
    }
  });

  // Sort by urgency
  return insights.sort((a, b) => {
    if (a.urgency === 'high' && b.urgency !== 'high') return -1;
    if (a.urgency !== 'high' && b.urgency === 'high') return 1;
    if (a.urgency === 'medium' && b.urgency === 'low') return -1;
    if (a.urgency === 'low' && b.urgency === 'medium') return 1;
    return (a.runwayDays === 'Infinite' ? 9999 : a.runwayDays) - (b.runwayDays === 'Infinite' ? 9999 : b.runwayDays);
  });
};


export const getPredictiveMaintenanceAlerts = (dailyReports) => {
  // Aggregate breakdown duration by machine description
  const machineDowntime = {};

  dailyReports.forEach(report => {
    // Check main problems array
    if (report.problems) {
      report.problems.forEach(p => {
        if (p.type === 'Breakdown' || p.type === 'Maintenance') {
          const machine = p.description || 'Unknown Machine';
          if (!machineDowntime[machine]) machineDowntime[machine] = 0;
          machineDowntime[machine] += Number(p.duration || 0);
        }
      });
    }
  });

  const alerts = [];
  Object.keys(machineDowntime).forEach(machine => {
    const totalMins = machineDowntime[machine];
    // Threshold: more than 180 minutes (3 hours) of downtime indicates maintenance needed
    if (totalMins >= 180) {
      alerts.push({
        machine,
        totalDowntimeMinutes: totalMins,
        status: 'Maintenance Overdue',
        urgency: 'high'
      });
    } else if (totalMins >= 60) {
      alerts.push({
        machine,
        totalDowntimeMinutes: totalMins,
        status: 'Maintenance Recommended',
        urgency: 'medium'
      });
    }
  });

  return alerts.sort((a, b) => b.totalDowntimeMinutes - a.totalDowntimeMinutes);
};
