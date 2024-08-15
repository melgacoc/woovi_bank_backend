import { Schema, model } from 'mongoose';

const accountSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  balance: { type: Number, default: 0 },
});

export default model('Account', accountSchema);
//