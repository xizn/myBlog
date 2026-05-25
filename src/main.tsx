import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initAppStorage } from '@/utils/appStorage';
import { applyThemeSettings, loadThemeSettings } from '@/utils/themeSettings';
import '@/styles/global.css';
import '@/styles/app-dialog.css';
import '@/styles/export-pdf.css';

initAppStorage();
applyThemeSettings(loadThemeSettings());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
