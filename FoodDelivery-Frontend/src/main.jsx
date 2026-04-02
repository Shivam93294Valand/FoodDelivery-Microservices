import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
        <BrowserRouter>
            <ErrorBoundary>
                <AuthProvider>
                    <CartProvider>
                        <ThemeProvider defaultTheme="system" storageKey="foodiehub-theme">
                            <App />
                        </ThemeProvider>
                    </CartProvider>
                </AuthProvider>
            </ErrorBoundary>
        </BrowserRouter>
)