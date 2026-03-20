import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import reportWebVitals from './reportWebVitals';

try {
  const savedTheme = localStorage.getItem('crm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
} catch (_) {}

const HARMLESS_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /requestAnimationFrame.*took \d+ms/i,
  /\[Violation\].*requestAnimationFrame/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Non-Error promise rejection captured/i,
  /socket\.io.*ERR_CONNECTION_REFUSED/i,
  /WebSocket connection to.*socket\.io.*failed/i,
  /WebSocket connection to.*\/ws.*failed/i,
];

const origError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : String(args[0]?.message || args[0] || '');
  if (HARMLESS_ERROR_PATTERNS.some(p => p.test(msg))) return;
  origError.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason;
  const isApiError = err?.isAxiosError === true;
  const status = err?.response?.status;
  if (isApiError && (status === 401 || err?._handled || err?._silent)) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
