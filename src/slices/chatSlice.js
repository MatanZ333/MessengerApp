import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchUsers = createAsyncThunk('chat/fetchUsers', async () => {
    const {data} = await api.get('/api/users/all');
    return data;
});

export const fetchGroups = createAsyncThunk('chat/fetchGroups', async () => {
    const {data} = await api.get('/api/groups/mine');
    return data;
});

export const fetchThread = createAsyncThunk('chat/fetchThread', async ({userId, groupId}) => {
    const {data} = await api.get('/api/messages/thread', {params: {userId, groupId}});
    return data;
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({toUser, toGroup, text}) => {
    try{
        const {data} = await api.post('/api/messages', {toUser, toGroup, text});
        return data;
    }catch(e){
        return rejectWithValue(e.response?.data?.message || 'Failed to send message')
    }
});

export const fetchHistory = createAsyncThunk('chat/fetchHistory', async () => {
    const {data} = await api.get('api/messages/history');
    return data;
})

export const toggleBlockUser = createAsyncThunk('chat/toggleBlockUser', async (targetId) => {
    const {data} = await api.post(`/api/users/block/${targetId}`);
    return (data?.blockedUsers || []).map(String);
});

export const leaveGroup = createAsyncThunk('chat/leaveGroup', async (groupdId) => {
    await api.post(`/api/groups/${groupdId}/leave`);
    return {groupId};
})

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        users: [],
        groups: [],
        selected: null,
        thread: [],
        status: 'idle',
        recent: {dm: [], groups: []},
        blockedUsers: [],
    },
    reducers: {
        setSelected(state, action){
            state.selected = action.payload;
            state.thread = [];
        },
        appendMessage(state, action){
            if(!Array.isArray(state.thread)) state.thread = [];
            const msg = action.payload;
            const exists = state.thread.some(m => String(m._id) === String(msg?._id));
            if(!exists) state.thread.push(msg);
        },
        resetChat(state){
            state.selected = null;
            state.thread = [];
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUsers.fulfilled, (s, a) => {s.users = a.payload})
        .addCase(fetchGroups.fulfilled, (s, a) => {s.groups = a.payload})
        .addCase(fetchThread.pending, (s) => {s.status = 'loading'})
        .addCase(fetchThread.fulfilled, (s, a) => {
            s.status = 'succeeded';
            const payload = a.payload;
            s.thread = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
        })
        .addCase(sendMessage.fulfilled, (s, a) => {if(!Array.isArray(s.thread)) s.thread = []; s.thread.push(a.payload)})
        .addCase(toggleBlockUser.fulfilled, (s, a) => {
            s.blockedUsers = a.payload
        })
        .addCase(leaveGroup.fulfilled, (s, a) => {
            s.groups = s.groups.filter(g => String(g._id) !== String(a.payload.groupId))
        })
        .addCase(sendMessage.rejected, (s, a) => {
            s.status = 'failed';
            s.sendError = a.payload || 'Failed to send message'
        })
        .addCase(fetchHistory.fulfilled, (s, a) => {s.recent = a.payload})
    }
});

export const {setSelected, appendMessage, resetChat} = chatSlice.actions;
export default chatSlice.reducer;