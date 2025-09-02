import { Router } from "express";
import User from '../models/User.js';
import {auth} from '../middleware/auth.js';

const router = Router();

router.get('/all', auth, async (_req, res) => {
    const users = await User.find({}, {password: 0}).sort({username: 1});
    res.json(users);
});

router.post('/block/:targetId', auth, async (req, res) => {
    const {id} = req.user;
    const {targetId} = req.params;
    const me = await User.findById(id);
    const isBlocked = me.blockedUsers.some(u => u.toString() === targetId);
    if(isBlocked){
        me.blockedUsers = me.blockedUsers.filter(u => u.toString() !== targetId);
    }else{
        me.blockedUsers.push(targetId);
    }
    await me.save();
    res.json({blockedUsers: me.blockedUsers});
});

export default router;