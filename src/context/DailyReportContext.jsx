import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const DailyReportContext = createContext();

export const useDailyReports = () => useContext(DailyReportContext);

export const DailyReportProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Timeframes: morning (9-10), afternoon (14-15), evening (17-18)
  const shifts = ['morning', 'afternoon', 'evening'];

  const fetchReportsForDate = async (date) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('action', 'daily_report')
      .like('claim_id', `${date}_%`);
      
    if (!error && data) {
      const mapped = data.map(log => ({
        id: log.id,
        shift: log.claim_id.split('_')[1],
        date: log.claim_id.split('_')[0],
        data: log.changes || {},
        submitted_by: log.user_name,
        timestamp: log.timestamp
      }));
      setReports(mapped);
      setLoading(false);
      return mapped;
    }
    setLoading(false);
    return [];
  };

  const saveReport = async (date, shift, reportData) => {
    const claimId = `${date}_${shift}`;
    const existingIdx = reports.findIndex(r => r.date === date && r.shift === shift);
    
    const dbRecord = {
      action: 'daily_report',
      user_name: currentUser?.name || 'system',
      claim_id: claimId,
      timestamp: new Date().toISOString(),
      changes: reportData
    };

    if (existingIdx >= 0) {
      const existingId = reports[existingIdx].id;
      const { data, error } = await supabase.from('system_logs').update(dbRecord).eq('id', existingId).select();
      if (!error && data) {
        setReports(prev => prev.map(r => r.id === existingId ? { id: data[0].id, shift, date, data: reportData } : r));
        return true;
      }
    } else {
      const { data, error } = await supabase.from('system_logs').insert([dbRecord]).select();
      if (!error && data) {
        setReports(prev => [...prev, { id: data[0].id, shift, date, data: reportData }]);
        return true;
      }
    }
    return false;
  };

  // Notification checker
  useEffect(() => {
    if (!currentUser) return;
    
    const checkDeadlines = async () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hour = now.getHours();
      
      let expectedShift = null;
      let deadlineName = '';
      
      // Check which deadlines have passed today
      if (hour >= 10 && hour < 15) { expectedShift = 'morning'; deadlineName = 'Morning (9-10 AM)'; }
      else if (hour >= 15 && hour < 18) { expectedShift = 'afternoon'; deadlineName = 'Afternoon (2-3 PM)'; }
      else if (hour >= 18) { expectedShift = 'evening'; deadlineName = 'Evening (5-6 PM)'; }

      if (expectedShift) {
        // Fetch to see if it exists
        const { data, error } = await supabase
          .from('system_logs')
          .select('id')
          .eq('action', 'daily_report')
          .eq('claim_id', `${dateStr}_${expectedShift}`);
          
        if (!error && data.length === 0) {
          // It's missing. Check if we already notified.
          const notifKey = `notified_report_${dateStr}_${expectedShift}`;
          if (!localStorage.getItem(notifKey)) {
            createNotification({
              userId: currentUser.id,
              title: 'Missing Daily Report',
              message: `The ${deadlineName} daily report has not been submitted yet.`,
              linkUrl: '/daily-reports'
            });
            localStorage.setItem(notifKey, 'true');
          }
        }
      }
    };

    // Check on mount and every 5 minutes
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, createNotification]);

  return (
    <DailyReportContext.Provider value={{
      reports,
      loading,
      fetchReportsForDate,
      saveReport,
      shifts
    }}>
      {children}
    </DailyReportContext.Provider>
  );
};
