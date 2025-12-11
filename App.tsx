import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Solver } from './pages/Solver';
import { Results } from './pages/Results';
import { AssignmentProvider } from './context/AssignmentContext';

function App() {
  return (
    <HashRouter>
      <AssignmentProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Solver />} />
            <Route path="/result" element={<Results />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AssignmentProvider>
    </HashRouter>
  );
}

export default App;
