import { Schema, model } from 'mongoose';
import { hash } from 'bcrypt';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cpf: { type: String, required: true, unique: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 10);
  }
  next();
});

export default model('User', userSchema);
