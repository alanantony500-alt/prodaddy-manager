import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, User, LayoutDashboard, Plus } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ selectedStaff, setSelectedStaff }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffNationality, setNewStaffNationality] = useState('');

  useEffect(() => {
    fetchStaff();

    // Subscribe to staff changes for real-time earnings updates
    const subscription = supabase
      .channel('staff_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setStaffList(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === 'INSERT') {
          setStaffList(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (!error && data) {
      setStaffList(data);
    }
    setLoading(false);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName) return;
    
    const { error } = await supabase.from('staff').insert([{ 
      name: newStaffName, 
      nationality: newStaffNationality 
    }]);

    if (error) {
      alert('Error adding staff: ' + error.message);
    } else {
      setNewStaffName('');
      setNewStaffNationality('');
      setShowAddStaff(false);
      fetchStaff();
    }
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1 className="logo">
          <LayoutDashboard className="logo-icon" size={24} />
          Prodaddy
        </h1>
      </div>

      <div className="sidebar-content">
        <div className="staff-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              <Users size={16} /> Staff Filter
            </h2>
            <button 
              className="btn" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => setShowAddStaff(true)}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          
          <ul className="staff-list">
            <li 
              className={`staff-item ${!selectedStaff ? 'active' : ''}`}
              onClick={() => setSelectedStaff(null)}
            >
              <div className="staff-info">
                <User size={18} />
                <span>All Records</span>
              </div>
            </li>
            
            {loading ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
              staffList.map((staff) => (
                <li 
                  key={staff.id} 
                  className={`staff-item ${selectedStaff === staff.id ? 'active' : ''}`}
                  onClick={() => setSelectedStaff(staff.id)}
                >
                  <div className="staff-info">
                    <User size={18} />
                    <span>{staff.name}</span>
                  </div>
                  <div className="staff-earnings">
                    ${Number(staff.total_earnings).toFixed(2)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {showAddStaff && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setShowAddStaff(false)}>×</button>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Add Staff Member</h2>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input required type="text" className="form-input" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input type="text" className="form-input" value={newStaffNationality} onChange={e => setNewStaffNationality(e.target.value)} />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                Save Staff
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
