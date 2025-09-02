import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, Stack, Alert, ListItemButton, Checkbox, ListItemText } from '@mui/material'
import api from '../api/axios'

const CreateGroupModal = ({open, onClose = () => {}, onCreated = () => {}}) => {
    const [name, setName] = useState('');
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!open) return;
        (async () => {
            setError('');
            try{
                const {data} = await api.get('/api/users/all');
                setUsers(data);
            }catch(e){
                setError('Failed to load users');
            }
        })();
    }, [open]);

    const toggle = (id) => {
        setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const create = async () => {
        setError('');
        if(!name.trim()) return setError('Group name is required');
        try{
            setLoading(true);
            const body = {name: name.trim(), members: selected};
            console.log('[CreateGroupModal] POST /api/groups payload:', body);
            const {data: group} = await api.post('/api/groups', body);
            console.log('[CreateGroupModal] response:', group);
            onCreated(group);
            onClose();
            setName('');
            setSelected([]);
        }catch(e){
            console.error('[CreateGroupModal] error:', e);
            setError(e.response?.data?.message || 'Failed to create group');
        }finally{
            setLoading(false);
        }
    }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{mt: 1}}>
                <TextField autoFocus label="Group name" value={name} onChange={(e) => setName(e.target.value)} fullWidth/>
                {error && <Alert severity='error'>{error}</Alert>}
                <List sx={{maxHeight: 280, overflow: 'auto'}}>
                    {users.map(u => (
                        <ListItemButton key={u._id} onClick={() => toggle(u._id)}>
                            <Checkbox edge="start" checked={selected.includes(u._id)} tabIndex={-1} disableRipple/>
                            <ListItemText primary={u.username}/>
                        </ListItemButton>
                    ))}
                </List>
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={create} variant='contained' disabled={loading || !name.trim()}>{loading ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
    </Dialog>
  )
}

export default CreateGroupModal
