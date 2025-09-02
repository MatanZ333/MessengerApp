import { Router } from "express";
import mongoose from "mongoose";
import {auth} from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from "../models/Group.js";

const router = Router();

const {ObjectId} = mongoose.Types;

router.post('/', auth, async (req, res) => {
    const {toUser, toGroup, text} = req.body;
    if(!text || (!toUser && !toGroup)) return res.status(400).json({message: 'Missing fields'});
    if(toUser && String(toUser) === String(req.user.id)){
        return res.status(400).json({message: 'Cannot message yourself'})
    }
    if(toUser){
        const [me, target] = await Promise.all([
            User.findById(req.user.id),
            User.findById(toUser),
        ]);
        if(!target) return res.status(404).json({message: 'User not found'});
        const isBlocked = me.blockedUsers.includes(target._id) || target.blockedUsers.includes(me._id);
        if(isBlocked) return res.status(403).json({message: 'Messaging blocked'});
    }

    if(toGroup){
        const group = await Group.findById(toGroup);
        if(!group) return res.status(404).json({message: 'Group not found'});
        const isMember = group.members.some((m) => String(m) === String(req.user.id));
        if(!isMember) return res.status(403).json({message: 'Not a member of this group'});
    }
    const msg = await Message.create({sender: req.user.id, toUser, toGroup, text});
    return res.status(201).json(msg);
});

router.get('/thread', auth, async (req, res) => {
    const {userId, groupId} = req.query;
    let filter;
    if(userId){
        const me = new ObjectId(req.user.id);
        const other = new ObjectId(userId);
        filter = {$or: [{sender: me, toUser: other}, {sender: other, toUser: me}]};
    }else if(groupId){
        const ok = await Group.exists({_id: groupId, members: req.user.id});
        if(!ok) return res.status(403).json({message: 'Not a member of this group'});
        filter = {toGroup: new ObjectId(groupId)};
    }else{
        return res.status(400).json({message: 'userId or groupId required'});
    }

    const items = await Message.find(filter).sort({createdAt: -1}).limit(50).lean();
    res.json(items.reverse());
});

router.get('/history', auth, async (req, res) => {
    const me = new ObjectId(req.user.id);

    const dmAgg = await Message.aggregate([
        {$match: {$or: [{sender: me}, {toUser: me} ] } },
        {$project: {
            createdAt: 1,
            other: {$cond: [{$eq: ['$sender', me]}, '$toUser', '$sender']}
        }},
        {$match: {other: {$ne: null}}},
        {$group: {_id: '$other', last: {$max: '$createdAt'} } },
        {$sort: {last: -1}},
        {$limit: 20}
    ]);

    const myGroups = await Group.find({members: me}, {_id: 1, name: 1}).lean();
    const groupIds = myGroups.map(g => g._id);
    const groupAgg = await Message.aggregate([
        {$match: {toGroup: {$in: groupIds} } },
        {$group: {_id: '$toGroup', last: {$max: '$createdAt'} } },
        {$sort: {last: -1}},
        {$limit: 20}
    ])

    const users = await User.find({_id: {$in: dmAgg.map(x => x._id)}},
    {username: 1}).lean();
    const userMap = new Map(users.map(u => [String(u._id), u.username]));
    const groupMap = new Map(myGroups.map(g => [String(g._id), g.name]));

    res.json({
        dm: dmAgg.map(x => ({userId: x._id, username: userMap.get(String(x._id)) || 
            'Unknown', last: x.last})),
        groups: groupAgg.map(x => ({groupId: x._id, name: groupMap.get(String(x._id)) || 
            'Unknown', last: x.last}))
    });
});

export default router;

