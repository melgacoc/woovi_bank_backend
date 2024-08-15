import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { graphqlHTTP } from 'koa-graphql';
import { connect } from 'mongoose';
import schema from './graphql/schema';

const app = new Koa();
const router = new Router();

connect('mongodb://localhost:27017/graphql-bank-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(bodyParser());

router.all('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
