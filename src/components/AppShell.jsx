import React from 'react'
import {AppBar, Toolbar, Typography, Box, IconButton, Avatar} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';

const AppShell = ({children}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth.user);

    const onLogout = () => {
        dispatch(logout());
        navigate('/');
    }

  return (
    <Box sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <AppBar position='static' color="secondary">
        <Toolbar>
            <Avatar sx={{mr: 2}}>{user?.username?.[0]?.toUpperCase() || 'U'}</Avatar>
            <Typography variant='h6'>WhatsApp clone</Typography>
            <IconButton color="inherit" onClick={onLogout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{flex: 1, p: 2}}>{children}</Box>
    </Box>
  )
}

export default AppShell
