import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

function App() {
  const [selectedStaff, setSelectedStaff] = useState(null);

  return (
    <Router>
      <div className="app-container">
        <Sidebar selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard selectedStaff={selectedStaff} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
