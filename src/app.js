import { connect } from 'mongoose';
import createDefaultUser from './scripts/defaultUser';

connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Conectado ao MongoDB');
    createDefaultUser();
  })
  .catch((err) => console.log(err));
