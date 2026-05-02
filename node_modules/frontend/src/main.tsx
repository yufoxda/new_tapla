import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Profile from './features/events/Profile'
import EventCreate from './features/events/EventCreate'
import EventDetail from './features/answers/EventDetail'
import EventAnswer from './features/answers/EventAnswer'
import Login from './features/auth/Login'
import { getAuthToken } from './api/client'

const queryClient = new QueryClient()

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = getAuthToken()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={getAuthToken() ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          
          <Route path="/events/new" element={<AuthGuard><EventCreate /></AuthGuard>} />
          
          {/* 集計画面 */}
          <Route path="/events/:id" element={<AuthGuard><EventDetail /></AuthGuard>} />
          
          {/* 回答入力画面 */}
          <Route path="/events/:id/answer" element={<AuthGuard><EventAnswer /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
