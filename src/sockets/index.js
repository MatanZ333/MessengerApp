import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

export const initSocket = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if(!token) return next(new Error('No token'));
        try{
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = String(payload.id);
            next();
        }catch{
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.userId;

        socket.join(`user:${userId}`);
        const groups = await Group.find({memebers: userId}, {_id: 1}).lean();
        groups.forEach((g) => socket.join(`group: ${g._id}`));

        socket.on('message:send', async (payload, cb) => {
            try{
                const {toUser, toGroup, text} = payload || {};
                if(!text || (!toUser && !toGroup)) throw new Error('Missing fields');
                if(toUser && String(toUser) === String(socket.userId)) throw new Error('Cannot message yourself');
                if(toUser){
                    const [me, target] = await Promise.all([
                        User.findById(userId),
                        User.findById(toUser),
                    ]);
                    if(!target) throw new Error('User not found');
                    const blocked = me.blockedUsers.includes(target._id) || target.blockedUsers.includes(me._id);
                    if(blocked) throw new Error('Messaging blocked');
                }
                
                if(toGroup){
                    const group = await Group.findById(toGroup);
                    if(!group) throw new Error('Group not found');
                    const isMember = group.members.some((m) => String(m) === userId);
                    if(!isMember) throw new Error('Not a member');
                }

                const msg = await Message.create({sender: userId, toUser, toGroup, text});
                if(toUser){
                    io.to(`user:${toUser}`).to(`user:${userId}`).emit('message:new', msg);
                }else{
                    io.to(`group:${toGroup}`).emit('message:new', msg);
                }

                cb?.({ok: true, msg});
            }catch(e){
                cb?.({ok: false, message: e.message});
            }
        });
        socket.on('group:join', async ({groupId}, cb) => {
            try{
                const ok = await Group.exists({_id: groupId, members: userId});
                if(!ok) return cb?.({ok: false, message: 'Not a member'});
                socket.join(`group:${groupId}`);
                cb?.({ok: true});
            }catch(e){
                cb?.({ok: false, message: e.message});
            }
        })
    });
}