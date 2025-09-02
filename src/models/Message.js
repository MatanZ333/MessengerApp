import mongoose from 'mongoose';

const {Schema} = mongoose;
const MessageSchema = new Schema(
    {
        sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        toUser: {type: Schema.Types.ObjectId, ref: 'User', default: null},
        toGroup: {type: Schema.Types.ObjectId, ref: 'Group', default: null},
        text: {type: String, required: true}
    },
    {timestamps: true}
);

export default mongoose.model('Message', MessageSchema);