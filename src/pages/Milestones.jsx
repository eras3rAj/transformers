import React, { useState } from 'react';
import { Target, Plus, CheckCircle, Clock, Calendar, Building2, Trash2 } from 'lucide-react';
import { useMilestones } from '../context/MilestoneContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import '../components/layout/Layout.css';

const Milestones = () => {
  const { milestones, addMilestone, updateMilestoneStatus, deleteMilestone, loading } = useMilestones();
  const { currentUser } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Short Term'); // Short Term, Long Term
  const [deletePrompt, setDeletePrompt] = useState({ isOpen: false, milestone: null });
  
  const [formData, setFormData] = useState({
    title: '', company: 'All', term_type: 'Short Term', target_date: ''
  });

  const filteredMilestones = milestones.filter(m => m.term_type === activeTab);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addMilestone(formData);
    setFormData({ title: '', company: 'All', term_type: activeTab, target_date: '' });
    setShowForm(false);
  };

  const confirmDelete = async () => {
    if (deletePrompt.milestone) {
      await deleteMilestone(deletePrompt.milestone.id);
    }
    setDeletePrompt({ isOpen: false, milestone: null });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading milestones...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={28} color="var(--accent-primary)" />
            Company Milestones
          </h1>
          <p>Track global company-wide objectives and goals.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> New Milestone
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        {['Short Term', 'Long Term'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: 'none', border: 'none', padding: '1rem', cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredMilestones.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            No {activeTab.toLowerCase()} milestones found.
          </div>
        ) : (
          filteredMilestones.map(milestone => (
            <div key={milestone.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderLeft: `4px solid ${milestone.status === 'Completed' ? 'var(--success)' : 'var(--accent-primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{milestone.title}</h3>
                {currentUser?.role === 'superadmin' && (
                  <button className="icon-btn" style={{ color: 'var(--danger)', padding: '0.2rem' }} onClick={() => setDeletePrompt({ isOpen: true, milestone })}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> {milestone.company}</span>
                {milestone.target_date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(milestone.target_date).toLocaleDateString()}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {milestone.status === 'Completed' ? (
                  <span style={{ color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} /> Completed
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <Clock size={16} /> Pending
                  </span>
                )}
                
                <select 
                  value={milestone.status} 
                  onChange={(e) => updateMilestoneStatus(milestone.id, e.target.value)}
                  className="input-field" 
                  style={{ marginBottom: 0, padding: '0.3rem', fontSize: '0.85rem', width: 'auto', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3>New Company Milestone</h3>
            <form onSubmit={handleSubmit}>
              <label className="input-label">Milestone Title *</label>
              <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Expand facility by 5000 sq ft" />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Scope/Company</label>
                  <select className="input-field" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                    <option value="All">All Companies</option>
                    <option value="J.M. Electricals">J.M. Electricals</option>
                    <option value="J.R. Transformers">J.R. Transformers</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Term</label>
                  <select className="input-field" value={formData.term_type} onChange={e => setFormData({...formData, term_type: e.target.value})}>
                    <option value="Short Term">Short Term</option>
                    <option value="Long Term">Long Term</option>
                  </select>
                </div>
              </div>
              
              <label className="input-label">Target Date</label>
              <input type="date" className="input-field" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deletePrompt.isOpen}
        title="Delete Milestone"
        message="Are you sure you want to permanently delete this milestone?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeletePrompt({ isOpen: false, milestone: null })}
      />
    </div>
  );
};

export default Milestones;
