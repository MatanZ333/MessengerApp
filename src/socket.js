import {io} from 'socket.io-client';

export const connectedSocket = (token) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return io(baseUrl, {auth: {token}});
}