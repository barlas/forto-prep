import mongoose from 'mongoose';
// Create a Schema corresponding to the document interface.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true }
});
// Create a Model.
const User = mongoose.model('User', userSchema);
export default User;
