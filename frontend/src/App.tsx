import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import Scheduler from './pages/Scheduler';
import LogHistory from './pages/LogHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/input-data" element={<InputData />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/log-history" element={<LogHistory />} />
        </Route>
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
