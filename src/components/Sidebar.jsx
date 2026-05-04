import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, User, LayoutDashboard, Plus, Edit, Trash } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ selectedStaff, setSelectedStaff, isOpen, setIsOpen }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffNationality, setNewStaffNationality] = useState('');
  
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffNationality, setEditStaffNationality] = useState('');

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

  const handleDeleteStaff = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this staff member? Their records will be kept as Unassigned.")) {
      await supabase.from('staff').delete().eq('id', id);
      fetchStaff(); // Instant UI refresh
    }
  };

  const handleEditStaffClick = (e, staff) => {
    e.stopPropagation();
    setEditingStaff(staff.id);
    setEditStaffName(staff.name);
    setEditStaffNationality(staff.nationality || '');
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editStaffName) return;
    
    await supabase.from('staff').update({ 
      name: editStaffName, 
      nationality: editStaffNationality 
    }).eq('id', editingStaff);

    setEditingStaff(null);
    fetchStaff();
  };

  return (
    <>
      {isOpen && <div className="sidebar-mobile-overlay" onClick={() => setIsOpen(false)}></div>}
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
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
              onClick={() => { setSelectedStaff(null); setIsOpen(false); }}
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
                  className={`staff-item ${selectedStaff?.id === staff.id ? 'active' : ''}`}
                  onClick={() => { setSelectedStaff(staff); setIsOpen(false); }}
                >
                  <div className="staff-info">
                    <User size={18} className="flex-shrink-0" />
                    <span className="staff-name-text">{staff.name}</span>
                  </div>
                  <div className="staff-stats-container">
                    <div className="staff-earnings">
                      AED {Number(staff.total_earnings).toFixed(2)}
                    </div>
                    <div className="staff-actions">
                      <button onClick={(e) => handleEditStaffClick(e, staff)} className="staff-action-btn edit"><Edit size={14} /></button>
                      <button onClick={(e) => handleDeleteStaff(e, staff.id)} className="staff-action-btn delete"><Trash size={14} /></button>
                    </div>
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

      {editingStaff && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setEditingStaff(null)}>×</button>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Edit Staff Member</h2>
            <form onSubmit={handleUpdateStaff}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input required type="text" className="form-input" value={editStaffName} onChange={e => setEditStaffName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input type="text" className="form-input" value={editStaffNationality} onChange={e => setEditStaffNationality(e.target.value)} />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                Update Staff
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
