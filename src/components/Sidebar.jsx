import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, User, LayoutDashboard } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ selectedStaff, setSelectedStaff }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <h2 className="section-title">
            <Users size={16} /> Staff Filter
          </h2>
          
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
    </aside>
  );
}
