const bcrypt = require('bcrypt');
const User = require('../models/userModel'); 

const createDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ email: process.env.DEFAULT_USER_EMAIL });
    if (existingUser) {
      console.log('Usuário padrão já existe.');
      return;
    }

    const hashedPassword = bcrypt.hash(process.env.DEFAULT_USER_PASSWORD, 10);

    const defaultUser = new User({
      name: process.env.DEFAULT_USER_NAME,
      email: process.env.DEFAULT_USER_EMAIL,
      password: hashedPassword,
      cpf: process.env.DEFAULT_USER_CPF,
    });

    await defaultUser.save();
    console.log('Usuário padrão criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar o usuário padrão:', error);
  }
};

module.exports = createDefaultUser;
