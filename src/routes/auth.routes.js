import { Router } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/register', async (req, res) => {
    try{
        const {username, password} = req.body;
        if(!username || !password) return res.status(400).json({message: 'Missing fields'});
        const exists = await User.findOne({username});
        if(exists) return res.status(400).json({message: 'Username already taken'});
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({username, password: hash});
        return res.status(201).json({id: user._id, username: user.username});
    }catch(e){
        console.error(e);
        return res.status(500).json({message: 'Server error'});
    }
});

router.post('/login', async (req, res) => {
    try{
        const {username, password} = req.body;
        const user = await User.findOne({username});
        if(!user) return res.status(400).json({message: 'Invalid credentials'});
        const ok = await bcrypt.compare(password, user.password);
        if(!ok) return res.status(400).json({message: 'Invalud credentials'});
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '2h'});
        return res.json({token, userId: user._id, username: user.username});
    }catch(e){
        console.error(e);
        return res.status(500).json({message: 'Server error'});
    }
});

export default router;