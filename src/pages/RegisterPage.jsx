import React, { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Paper, TextField, Button, Typography, Stack, Link, Alert } from '@mui/material'
import api from '../api/axios'

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError(''); setOk('');
        if(username.trim().length < 3) return setError('Username must be at least 3 characters');
        if(password.length < 4) return setError('Password must be at least 4 characters');
        if(password !== confirm) return setError('Password do not match');
        try{
            setLoading(true);
            await api.post('/api/auth/register', {username: username.trim(), password});
            setOk('Account created! You can sign in now.');
            setTimeout(() => navigate('/'), 700);
        }catch(e){
            setError(e.response?.data?.message || 'Registration failed');
        }finally{
            setLoading(false);
        }
    }

  return (
    <Box sx={{minHeight: '100vh', display: 'grid', placeItems: 'center'}}>
      <Paper sx={{p: 4, width: 380}} elevation={6}>
        <Typography variant='h5' gutterBottom>Create Account</Typography>
        <Stack spacing={2}>
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth/>
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth/>
            <TextField label="Confirm password" type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth onKeyDown={(e) => {if(e.key === 'Enter') handleRegister()}}/>
            {error && <Alert severity='error'>{error}</Alert>}
            {ok && <Alert severity='success'>{ok}</Alert>}
            <Button variant='contained' onClick={handleRegister} disabled={loading}>{loading ? 'Creating...' : 'Create account'}</Button>
            <Typography variant='body2' sx={{textAlign: 'center'}}>Have an account? <Link component={RouterLink} to="/">Sign in</Link></Typography>
        </Stack>    
      </Paper>
    </Box>
  )
}

export default RegisterPage
