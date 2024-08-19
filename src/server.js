const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { graphqlHTTP } = require('koa-graphql');
const mongoose = require('mongoose');
const schema = require('./graphql/schema');

const app = new Koa();
const router = new Router();

app.use(cors({
  origin: '*',
}));
app.use(bodyParser());

router.all('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 10000;
const hostAddress = '0.0.0.0';

const start = async () => {
  try {
    app.listen(PORT, hostAddress, () => {
      console.log(`Server is running on http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

start();
