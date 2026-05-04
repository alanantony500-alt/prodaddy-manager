import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function AddRecordForm({ onSuccess, isSeparateRoute }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    amount: '',
    staff_commission: '',
    staff_id: '',
    nationality: '',
    service_date: format(new Date(), 'yyyy-MM-dd'),
    service_time: format(new Date(), 'HH:mm'),
    room_number: '',
    service_timing: '',
    body_size: '',
    behavior: '',
    repeat_customer: false,
    mallu_customer: false
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('id, name, is_separate').order('name');
    if (data) {
      setStaff(data.filter(s => isSeparateRoute ? s.is_separate : !s.is_separate));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      staff_commission: parseFloat(formData.staff_commission) || 0,
      staff_id: formData.staff_id || null,
      body_size: formData.body_size || null
    };

    const { error } = await supabase.from('records').insert([submissionData]);
    
    setLoading(false);
    if (error) {
      alert('Error adding record: ' + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-record-form">
      <div className="form-group">
        <label className="form-label">Customer Name *</label>
        <input required type="text" name="customer_name" className="form-input" value={formData.customer_name} onChange={handleChange} />
      </div>

      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Nationality</label>
          <input type="text" name="nationality" className="form-input" value={formData.nationality} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">Total Amount *</label>
          <input required type="number" step="0.01" name="amount" className="form-input" value={formData.amount} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Staff Commission *</label>
          <input required type="number" step="0.01" name="staff_commission" className="form-input" value={formData.staff_commission} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Assigned Staff</label>
        <select name="staff_id" className="form-select" value={formData.staff_id} onChange={handleChange}>
          <option value="">Select Staff...</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input required type="date" name="service_date" className="form-input" value={formData.service_date} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Time *</label>
          <input required type="time" name="service_time" className="form-input" value={formData.service_time} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-3-col">
        <div className="form-group">
          <label className="form-label">Room No</label>
          <input type="text" name="room_number" className="form-input" value={formData.room_number} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Duration/Timing</label>
          <input type="text" name="service_timing" className="form-input" placeholder="e.g. 1hr" value={formData.service_timing} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Body Size</label>
          <select name="body_size" className="form-select" value={formData.body_size} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="BIG">BIG</option>
            <option value="NORMAL">NORMAL</option>
            <option value="SMALL">SMALL</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Behavior Notes</label>
        <input type="text" name="behavior" className="form-input" value={formData.behavior} onChange={handleChange} />
      </div>

      <div className="form-checkbox-container">
        <label className="form-checkbox">
          <input type="checkbox" name="repeat_customer" checked={formData.repeat_customer} onChange={handleChange} />
          <span>Repeat Customer</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" name="mallu_customer" checked={formData.mallu_customer} onChange={handleChange} />
          <span>MALLU CUSTOMER</span>
        </label>
      </div>

      <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Saving...' : 'Save Record'}
      </button>
    </form>
  );
}
