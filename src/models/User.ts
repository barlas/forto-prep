import mongoose, { Document, Model } from 'mongoose';

// Define an interface representing a document in MongoDB.
interface IUser extends Document {
  name: string;
  age: number;
}

// Create a Schema corresponding to the document interface.
const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  age: { type: Number, required: true }
});

// Create a Model.
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
