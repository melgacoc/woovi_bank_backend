const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { graphqlHTTP } = require('koa-graphql');
const mongoose = require('mongoose');
const schema = require('./graphql/schema');

const app = new Koa();
const router = new Router();

mongoose.connect('mongodb://localhost:27017/graphql-bank-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

app.use(cors());
app.use(bodyParser());

router.all('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 10000;
const hostAdress = '0.0.0.0';
app.listen(PORT, hostAdress, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
