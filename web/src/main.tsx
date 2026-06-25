import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProviders } from './providers'
import App from './App'
import './index.css'

// Registrar PWA
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// Captura global do evento de instalação
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.deferredPWAInstallPrompt = e
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
