import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

function App() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Sidebar 
          selectedStaff={selectedStaff} 
          setSelectedStaff={setSelectedStaff} 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
        />
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard selectedStaff={selectedStaff} setIsMobileMenuOpen={setIsMobileMenuOpen} isSeparateRoute={false} />} />
            <Route path="/separate" element={<Dashboard selectedStaff={selectedStaff} setIsMobileMenuOpen={setIsMobileMenuOpen} isSeparateRoute={true} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
