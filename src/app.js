const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { graphqlHTTP } = require('koa-graphql');
const mongoose = require('mongoose');
const schema = require('./graphql/schema');
const createDefaultUser = require('./scripts/defaultUser');
require('dotenv').config();

const app = new Koa();
const router = new Router();

// Conectar ao MongoDB e criar usuário padrão
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Conectado ao MongoDB');
    createDefaultUser();  // Criar usuário padrão após a conexão bem-sucedida
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Configurar middleware
app.use(cors());
app.use(bodyParser());

router.all('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 10000;
const hostAdress = '0.0.0.0';

// Iniciar o servidor
app.listen(PORT, hostAdress, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
