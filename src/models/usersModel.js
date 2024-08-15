const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cpf: { type: String, required: true, unique: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password') || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = model('User', userSchema);
