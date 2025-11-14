import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { DebugPage } from './components/Debug/DebugPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search/:conversationId" element={<App />} />
        <Route path="/debug/:conversationId" element={<DebugPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);