import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {type: String, required: true, unique: true, trim: true},
        password: {type: String, required: true},
        blockedUsers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    },
    {timestamps: true}
);

export default mongoose.model('User', userSchema);