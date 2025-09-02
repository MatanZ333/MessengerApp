import mongoose from 'mongoose';

const {Schema} = mongoose;

const GroupSchema = new Schema(
    {
        name: {type: String, required: true},
        owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        members: [{type: Schema.Types.ObjectId, ref: 'User'}]
    },
    {timestamps: true}
);

export default mongoose.model('Group', GroupSchema);