import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './globals.css';
import { RootProvider } from './context/RootProvider';
import 'react-toastify/dist/ReactToastify.css';
import '@fontsource/inter';
import '@fontsource/jetbrains-mono';
import 'reactflow/dist/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootProvider>
        <App />
      </RootProvider>
    </BrowserRouter>
  </React.StrictMode>
); 