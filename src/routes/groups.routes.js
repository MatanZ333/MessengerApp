import { Router } from "express";
import {auth} from '../middleware/auth.js';
import Group from '../models/Group.js';
import mongoose from "mongoose";

const router = Router();
const {ObjectId} = mongoose.Types;

router.post('/', auth, async (req, res) => {
    console.log('CREATE GROUP BODY:', req.body);

    const {name, members = []} = req.body;

    console.log('PARSED:', {name, membersLen: members.length, members});

    if(!name) return res.status(400).json({message: 'Name required'});

    const uniq = new Set([String(req.user.id), ...members.map(String)]);
    const allMembers = [...uniq].map((id) => new ObjectId(id));

    console.log('ALL MEMBERS TO SAVE:', allMembers);

    const group = await Group.create({name: name.trim(), owner: req.user.id, members: allMembers});

    console.log('SAVED GROUP:', group);

    res.status(201).json(group);
});

router.get('/mine', auth, async (req, res) => {
    const groups = await Group.find({members: req.user.id}).lean();
    res.json(groups);
});

router.post('/:groupId/leave', auth, async (req, res) => {
    const {groupId} = req.params;
    await Group.updateOne({_id: groupId}, {$pull: {members: req.user.id}});
    res.json({ok: true});
});

export default router;