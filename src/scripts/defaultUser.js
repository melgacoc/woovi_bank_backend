const User = require('../models/usersModel');

const createDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ email: process.env.DEFAULT_USER_EMAIL });
    if (!existingUser) {
      const defaultUser = new User({
        name: process.env.DEFAULT_USER_NAME,
        email: process.env.DEFAULT_USER_EMAIL,
        password: process.env.DEFAULT_USER_PASSWORD,
        cpf: process.env.DEFAULT_USER_CPF,
      });

      await defaultUser.save();
      console.log('Usuário padrão criado com sucesso.');
    }

  } catch (error) {
    console.error(`Erro ao criar o usuário padrão: ${error.message}`);
    throw error;
  }
};

module.exports = createDefaultUser;
