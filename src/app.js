const { connect } = require('mongoose');
const createDefaultUser = require('./scripts/defaultUser');

connect(process.env.DATABASE)
  .then(() => {
    console.log('Conectado ao MongoDB');
    createDefaultUser();
  })
  .catch((err) => console.log(err));
