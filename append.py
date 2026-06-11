with open('src/utils/predictiveAnalytics.js', 'a', encoding='utf-8') as f:
    f.write("""

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
""")
print('Appended')
