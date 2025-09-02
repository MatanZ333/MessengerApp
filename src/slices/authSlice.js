import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from '../api/axios';

export const login = createAsyncThunk('auth/login', async ({username, password}, {rejectWithValue}) => {
    try{
        const res = await api.post('/api/auth/login', {username, password});
        return res.data;
    }catch(e){
        return rejectWithValue(e.response?.data?.message || 'Login failed');
    }
});

const initial = (() => {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : {token: null, user: null, status: 'idle', error: null};
})();

const authSlice = createSlice({
    name: 'auth',
    initialState: initial,
    reducers: {
        logout(state){
            state.token = null,
            state.user = null,
            state.status = 'idle',
            state.error = null,
            localStorage.removeItem('auth')
        },
    },
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {state.status = 'loading'; state.error = null})
        .addCase(login.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.token = action.payload.token;
            state.user = {id: action.payload.userId, username: action.payload.username};
            localStorage.setItem('auth', JSON.stringify({token: state.token, user: state.user}));
        })
        .addCase(login.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload || 'Login failed'
        })
    }
});

export const {logout} = authSlice.actions;
export default authSlice.reducer;