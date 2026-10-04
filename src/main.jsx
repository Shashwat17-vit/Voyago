import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { InvitesProvider } from './context/InvitesContext'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <InvitesProvider>
          <App />
        </InvitesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)