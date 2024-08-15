const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const transactionSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'Account' },
  to: { type: Schema.Types.ObjectId, ref: 'Account' },
  amount: Number,
  date: { type: Date, default: Date.now },
});

export default model('Transaction', transactionSchema);
