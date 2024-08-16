const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const transactionSchema = new Schema({
  transactionId: { type: String, unique: true, required: true },
  from: { type: Schema.Types.ObjectId, ref: 'Account' },
  to: { type: Schema.Types.ObjectId, ref: 'Account' },
  amount: Number,
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['income', 'expense'], required: true },
});

transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = model('Transaction', transactionSchema);
