import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../slices/authSlice'
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {Box, Paper, TextField, Button, Typography, CircularProgress, Stack, Link} from '@mui/material'

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {status, error} = useSelector((s) => s.auth);

    const handleLogin = async () => {
        const res = await dispatch(login({username, password}));
        if(res.type.endsWith('fulfilled')) navigate('/chat');
    }

  return (
    <Box sx={{minHeight: '100vh', display: 'grid', placeItems: 'center'}}>
        <Paper sx={{p: 4, width: 360}} elevation={6}>
            <Typography variant='h5' gutterBottom>Login</Typography>
            <TextField fullWidth label="Username" sx={{mb: 2}} value={username} onChange={(e) => setUsername(e.target.value)}/>
            <TextField fullWidth label="Password" type='password' sx={{mb: 2}} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') handleLogin()}}/>
            {error && <Typography color="error" sx={{mb: 1}}>{error}</Typography>}
            <Stack direction="column" spacing={1}>
                <Button fullWidth variant='contained' onClick={handleLogin} disabled={status === 'loading'}>
                    {status === 'loading' ? <CircularProgress size={22}/> : 'Sign in'}
                </Button>
                <Typography variant='body2' sx={{textAlign: 'center'}}>No account? <Link component={RouterLink} to="/register">Create one</Link></Typography>
            </Stack>
        </Paper>
    </Box>
  )
}

export default LoginPage
