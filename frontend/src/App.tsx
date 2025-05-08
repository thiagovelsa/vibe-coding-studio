import { memo } from 'react';
import { AppLayout } from '@components/layout/AppLayout';
// RootProvider import can be removed if not used elsewhere in this file after the change.
// import RootProvider from './context/RootProvider'; 
// import './index.css'; // Removed import for index.css
import { ToastContainer } from 'react-toastify';

const App = memo(function App() {
  return (
    // <RootProvider> // Removed redundant RootProvider
      <div className="h-screen overflow-hidden">
        <AppLayout />
        <ToastContainer 
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
        />
      </div>
    // </RootProvider> // Removed redundant RootProvider
  );
});

export default App; 