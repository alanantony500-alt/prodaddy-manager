import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

function App() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const fetchRecords = async () => {
    setLoadingRecords(true);
    const { data, error } = await supabase.from('records').select('*, staff(name)').order('created_at', { ascending: false });
    if (data) setRecords(data);
    setLoadingRecords(false);
  };

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
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Sidebar 
          selectedStaff={selectedStaff} 
          setSelectedStaff={setSelectedStaff} 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen}
          records={records}
        />
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard 
              selectedStaff={selectedStaff} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
              records={records}
              loadingRecords={loadingRecords}
              fetchRecords={fetchRecords}
            />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
