import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {Server as IOServer} from 'socket.io';
import { initSocket } from './sockets/index.js';
import connectDB from './utils/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import groupRoutes from './routes/groups.routes.js';
import messageRoutes from './routes/messages.routes.js';

dotenv.config();
await connectDB();

const app = express();

app.use(cors({origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ok: true}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new IOServer(server, {
    cors: {origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST']}
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));