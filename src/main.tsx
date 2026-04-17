import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { DuckDBProvider } from './db/DuckDBProvider.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DuckDBProvider>
      <App />
    </DuckDBProvider>
  </React.StrictMode>,
)
