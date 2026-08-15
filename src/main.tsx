import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import './App.css'

const queryClient = new QueryClient({

    defaultOptions: {
        queries: {
            staleTime: 1000 * 30, // 30s
            refetchOnWindowFocus: false,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    className: 'hutapi-toast',
                    style: {
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '1rem',
                        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.2)',
                        padding: '14px 20px',
                        fontSize: '0.875rem',
                        fontWeight: '800',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#f43f5e',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)


