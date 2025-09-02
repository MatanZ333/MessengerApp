import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {Box, Paper, Tabs, Tab, List, ListItemButton, ListItemText, Divider, Typography, IconButton, TextField, Button, Stack, Tooltip, ListSubheader} from '@mui/material'
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import { fetchUsers, fetchGroups, fetchThread, setSelected, appendMessage, sendMessage, toggleBlockUser, leaveGroup, fetchHistory } from '../slices/chatSlice';
import {connectedSocket} from '../socket.js';
import CreateGroupModal from '../components/CreateGroupModal.jsx';

const ChatPage = () => {
    const dispatch = useDispatch();
    const {users, groups, selected, thread, blockedUsers, recent} = useSelector((s) => s.chat);
    const auth = useSelector((s) => s.auth);
    
    const [tab, setTab] = useState(0);
    const [text, setText] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const socketRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if(!auth.token) return;
        dispatch(fetchUsers());
        dispatch(fetchGroups());
        dispatch(fetchHistory());
    }, [dispatch, auth.token]);

    const selectedRef = useRef(selected);
    useEffect(() => {selectedRef.current = selected}, [selected]);
    const myIdRef = useRef(auth.user?.id);
    useEffect(() => {myIdRef.current = auth.user?.id}, [auth.user?.id]);

    useEffect(() => {
        if(!auth.token) return;
        const socket = connectedSocket(auth.token);
        const handler = (msg) => {
            const sel = selectedRef.current;
            if(!sel) return;
            const mineId = String(myIdRef.current);
            const selId = String(sel.id);
            const sender = String(msg.sender);
            const toUser = msg.toUser != null ? String(msg.toUser) : null;
            const toGroup = msg.toGroup != null ? String(msg.toGroup) : null;
            const isDM = sel.type === 'user' && ((sender === mineId && toUser === selId) || (sender === selId && toUser === mineId));
            const isGroup = sel.type === 'group' && (toGroup === selId);
            if(isDM || isGroup) dispatch(appendMessage(msg));
        }
        socket.on('message:new', handler);
        socketRef.current = socket;
        return () => {socket.off('message:new', handler); socket.disconnect()};
    }, [auth.token, dispatch]);

    useEffect(() => {
        if(!selected) return;
        if(selected.type === 'user') dispatch(fetchThread({userId: selected.id}));
        if(selected.type === 'group') dispatch(fetchThread({groupId: selected.id}));
    }, [selected, dispatch]);

    useEffect(() => {
        if(!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [thread]);

    const onPickUser = (u) => {
        dispatch(setSelected({type: 'user', id: u._id, name: u.username}));
    }

    const onPickGroup = (g) => {
        dispatch(setSelected({type: 'group', id: g._id, name: g.name}));
    }

    const handleSend = async () => {
        const trimmed = text.trim();
        if(!trimmed || !selected) return;
        if(selected.type === 'user' && String(selected.id) === String(auth.user?.id)) return;
        
        const payload = selected.type === 'user' ? {toUser: selected.id, text: trimmed} : {toGroup: selected.id, text: trimmed};

        if(socketRef.current?.connected){
            socketRef.current.emit('message:send', payload, (ack) => {
                if(ack?.ok){
                    if(ack.msg) dispatch(appendMessage(ack.msg))
                }else{
                    dispatch(sendMessage(payload));
                }
            })
        }else{
            await dispatch(sendMessage(payload));
        }

        setText('');
    }
 
  return (
    <Box sx={{display: 'grid', gridTemplateColumns: '340px 1fr', gap: 2, height: 'calc(100vh - 96px)'}}>
        <Paper sx={{p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant='fullWidth' textColor='primary' indicatorColor='primary'>
                <Tab label="Recent"/>
                <Tab label="Direct"/>
                <Tab label="Groups"/>
            </Tabs>
            <Divider />
            <Box sx={{flex: 1, overflow: 'auto'}}>
                {tab === 0 && (
                    <List>
                        <ListSubheader disableSticky>Direct</ListSubheader>
                        {(recent?.dm ?? []).map(r => (
                            <ListItemButton key={`dm-${r.userId}`} onClick={() => dispatch(setSelected({type: 'user', id: r.userId, name: r.username}))}>
                                <ListItemText primary={r.username || 'Unknown'} secondary={r.last ? new Date(r.last).toLocaleString() : ''}/>
                            </ListItemButton>
                        ))}

                        <Divider sx={{my: 1}}/>

                        <ListSubheader disableSticky>Groups</ListSubheader>
                        {(recent?.groups ?? []).map(g => (
                            <ListItemButton key={`g-${g.groupId}`} onClick={() => dispatch(setSelected({type: 'group', id: g.groupId, name: g.name}))}>
                                <ListItemText primary={g.name || 'Unknown'} secondary={g.last ? new Date(g.last).toLocaleString() : ''}/>
                            </ListItemButton>
                        ))}
                    </List>
                )}
                {tab === 1 && (
                    <List>
                        {users.filter(u => String(u._id) !== String(auth.user?.id)).map((u) => (
                            <ListItemButton key={u._id} selected={selected?.type === 'user' && selected.id === u._id} onClick={() => onPickUser(u)} sx={{display: 'flex', justifyContent: 'space-between'}}>
                                <ListItemText primary={u.username}/>
                                <Tooltip title={blockedUsers.includes(u._id) ? 'Unblock user' : 'Block user'}>
                                    <Button size='small' variant='text' onClick={(e) => {e.stopPropagation(); dispatch(toggleBlockUser(u._id));}}>
                                        {blockedUsers.includes(u._id) ? 'Unblock' : 'Block'}
                                    </Button>
                                </Tooltip>
                            </ListItemButton>
                        )) }
                    </List>
                )}
                {tab === 2 && (
                    <Stack sx={{p: 1}} spacing={1}>
                        <Button variant='outlined' startIcon={<AddIcon />} onClick={(e) => {setShowCreate(true); e.currentTarget.blur();}}>
                            Create Group
                        </Button>
                        <List>
                            {groups.map((g) => (
                                <ListItemButton key={g._id} selected={selected?.type === 'group' && selected.id === g._id} onClick={() => onPickGroup(g)}>
                                    <ListItemText primary={g.name} secondary={`${g.members?.length || 0} members`}/>
                                </ListItemButton>
                            ))}
                        </List>
                    </Stack>
                )}
            </Box>
        </Paper>

        <Paper sx={{p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <Box sx={{p: 0, borderBottom: '1px solid #eee', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Typography variant='subtitle1'>{selected ? selected.name : 'Select a chat'}</Typography>
                    {selected?.type === 'group' && (
                        <Button size='small' color='error' variant='outlined' onClick={async () => {
                            await dispatch(leaveGroup(selected.id));
                            dispatch(fetchGroups());
                            dispatch(setSelected(null));
                        }}>
                            Leave Group
                        </Button>
                    )}
                </Box>
                <Box ref={listRef} sx={{flex: 1, overflowY: 'auto', p: 2, backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02))'}}>
                    {selected ? (
                        (Array.isArray(thread) ? thread : []).map((m) => (
                            <Bubble key={m._id || m.createdAt} mine={String(m.sender) === String(auth.user?.id)} text={m.text} time={new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}/>
                        ))
                    ) : (
                        <Typography color="text.secondary">Pick a user or a group from the left to start chatting</Typography>
                    )}
                </Box>
                <Box sx={{p: 1.5, display: 'flex', gap: 1, alignItems: 'center', borderTop: '1px solid #eee'}}>
                    <TextField fullWidth size="small" placeholder={selected?.type === 'user' && blockedUsers.includes(selected.id) ? 'You blocked this user' : 'Type a message'} value={text} onChange={(e) => setText(e.target.value)} disabled={selected?.type === 'user' && blockedUsers.includes(selected.id)} onKeyDown={(e) => {if (e.key === 'Enter') handleSend()}}/>
                    <IconButton color="primary" onClick={handleSend} disabled={selected?.type === 'user' && blockedUsers.includes(selected.id)}><SendIcon /></IconButton>
                </Box>
        </Paper>

        <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(group) => {
            setShowCreate(false);
            dispatch(fetchGroups());
            if(socketRef.current?.connected && group?._id){
                socketRef.current.emit('group:join', {groupId: group._id})
            }
        }}/>
    </Box>
  )
}

const Bubble = ({mine, text, time}) => {
    return (
        <Box sx={{display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1.2}}>
            <Box sx={{maxWidth: '70%', px: 1.5, py: 1, bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? '#fff' : 'text.primary', borderRadius: 3, boxShadow: 1}}>
                <Typography variant='body2' sx={{whiteSpace: 'pre-wrap'}}>{text}</Typography>
                <Typography variant='caption' sx={{opacity: 0.8, display: 'block', textAlign: 'right', mt: 0.5}}>{time}</Typography>
            </Box>
        </Box>
    )
}

export default ChatPage
