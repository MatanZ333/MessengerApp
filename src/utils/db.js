import mongoose from 'mongoose';

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if(!uri) throw new Error('MONGO_URI missing in .env');
    await mongoose.connect(uri, {serverSelectionTimeoutMS: 5000});
    console.log('MongoDB connected');
};

export default connectDB;