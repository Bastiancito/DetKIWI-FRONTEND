import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/bootstrap-theme.scss'
import './index.css'
import App from './App.tsx'
// Ensure authService is initialized early so axios interceptors are installed
import './crud/auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
