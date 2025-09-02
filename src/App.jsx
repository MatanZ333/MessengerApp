import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AppShell from './components/AppShell'
import ChatPage from './pages/ChatPage'
import { useSelector } from 'react-redux'
import RegisterPage from './pages/RegisterPage'

const PrivateRoute = ({children}) => {
  const token = useSelector((s) => s.auth.token);
  return token ? children : <Navigate to="/" replace/>
}

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<LoginPage />}/>
      <Route path='/register' element={<RegisterPage />}/>
      <Route path='/chat' element={
        <PrivateRoute>
          <AppShell>
            <ChatPage />
          </AppShell>
        </PrivateRoute>
      }/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}

export default App
