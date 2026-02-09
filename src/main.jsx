import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PTOProvider } from './contexts/PTOContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PTOProvider>
      <App />
    </PTOProvider>
  </StrictMode>,
)
