import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Download, Filter, DollarSign, TrendingUp, Calendar, Activity, Edit, Trash, Menu } from 'lucide-react';
import AddRecordForm from '../components/AddRecordForm';
import EditRecordForm from '../components/EditRecordForm';
import { format } from 'date-fns';
import './Dashboard.css';

export default function Dashboard({ selectedStaff, setIsMobileMenuOpen }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  useEffect(() => {
    fetchRecords();
    
    const subscription = supabase
      .channel('records_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, () => {
        fetchRecords();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedStaff]);

  const fetchRecords = async () => {
    setLoading(true);
    let query = supabase.from('records').select('*, staff(name)').order('created_at', { ascending: false });
    
    if (selectedStaff) {
      query = query.eq('staff_id', selectedStaff);
    }
    
    const { data, error } = await query;
    if (data) setRecords(data);
    setLoading(false);
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = r.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
                        r.phone?.includes(search) || 
                        r.room_number?.toLowerCase().includes(search.toLowerCase());
    const matchDate = filterDate ? r.service_date === filterDate : true;
    return matchSearch && matchDate;
  });

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      await supabase.from('records').delete().eq('id', id);
      fetchRecords(); // re-fetch immediately for instant UI refresh
    }
  };

  const exportCSV = () => {
    const headers = ['ID,Customer,Phone,Amount,Staff Commission,Staff,Date,Time,Room,Body Size,Repeat,Mallu'];
    const rows = filteredRecords.map(r => 
      `${r.id},"${r.customer_name}","${r.phone || ''}",${r.amount},${r.staff_commission},"${r.staff?.name || ''}",${r.service_date},${r.service_time},"${r.room_number || ''}","${r.body_size || ''}",${r.repeat_customer},${r.mallu_customer}`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records.csv';
    a.click();
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const totalEarnings = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalCommission = records.reduce((sum, r) => sum + Number(r.staff_commission), 0);
  const todayEarnings = records.filter(r => r.service_date === todayStr).reduce((sum, r) => sum + Number(r.amount), 0);
  const todayCommission = records.filter(r => r.service_date === todayStr).reduce((sum, r) => sum + Number(r.staff_commission), 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <div>
            <h1 className="page-title">Business Records</h1>
            <p className="page-subtitle">Manage and track your business activities seamlessly.</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={exportCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Record
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card glass-panel">
          <div className="summary-icon icon-blue"><DollarSign size={24} /></div>
          <div className="summary-details">
            <p className="summary-label">Total Earnings</p>
            <h3 className="summary-value">AED {totalEarnings.toFixed(2)}</h3>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="summary-icon icon-green"><TrendingUp size={24} /></div>
          <div className="summary-details">
            <p className="summary-label">Total Commission</p>
            <h3 className="summary-value">AED {totalCommission.toFixed(2)}</h3>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="summary-icon icon-purple"><Calendar size={24} /></div>
          <div className="summary-details">
            <p className="summary-label">Today's Earnings</p>
            <h3 className="summary-value">AED {todayEarnings.toFixed(2)}</h3>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="summary-icon icon-orange"><Activity size={24} /></div>
          <div className="summary-details">
            <p className="summary-label">Today's Commission</p>
            <h3 className="summary-value">AED {todayCommission.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="filters-bar glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search name, phone, or room..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={18} className="filter-icon" />
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="form-input filter-date"
          />
        </div>
      </div>

      <div className="records-table-container glass-panel">
        {loading ? (
          <div className="loading-state">Loading records...</div>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Room</th>
                <th>Details</th>
                <th>Staff</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">No records found.</td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="fw-500">{r.service_date}</div>
                      <div className="text-muted text-sm">{r.service_time}</div>
                    </td>
                    <td>
                      <div className="fw-500">{r.customer_name}</div>
                      <div className="text-muted text-sm">{r.phone}</div>
                    </td>
                    <td>{r.room_number || '-'}</td>
                    <td>
                      <div className="tags">
                        {r.body_size && <span className="tag">{r.body_size}</span>}
                        {r.repeat_customer && <span className="tag tag-success">Repeat</span>}
                        {r.mallu_customer && <span className="tag tag-accent">Mallu</span>}
                      </div>
                    </td>
                    <td>{r.staff?.name || 'Unassigned'}</td>
                    <td className="fw-600">AED {Number(r.amount).toFixed(2)}</td>
                    <td className="fw-600 text-success">AED {Number(r.staff_commission).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setEditingRecord(r)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteRecord(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setShowAddForm(false)}>×</button>
            <h2 className="modal-title">Add New Record</h2>
            <AddRecordForm onSuccess={() => { setShowAddForm(false); fetchRecords(); }} />
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setEditingRecord(null)}>×</button>
            <h2 className="modal-title">Edit Record</h2>
            <EditRecordForm initialData={editingRecord} onSuccess={() => { setEditingRecord(null); fetchRecords(); }} />
          </div>
        </div>
      )}
    </div>
  );
}
