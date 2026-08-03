import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SelectedProfileProvider } from './context/SelectedProfileContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SelectedProfileProvider>
        <App />
      </SelectedProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)
