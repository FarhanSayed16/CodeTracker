import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Desktop shell: mark early so the collapsed ball has no square page background
if (typeof window !== 'undefined' && window.companion) {
  document.documentElement.classList.add('electron');
  document.body?.classList.add('electron');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
