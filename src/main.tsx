import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/noto-sans-thai'
import './styles/index.css'
import App from './app/App'
import { registerPwa } from './pwa/register'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)
registerPwa()
