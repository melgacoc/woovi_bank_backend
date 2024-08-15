import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLObjectType, GraphQLSchema, GraphQLID, GraphQLString, GraphQLFloat, GraphQLList, GraphQLNonNull } from 'graphql';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import User, { find, findOne, findById } from '../models/User';
import Account, { find as _find, findById as _findById } from '../models/Account';
import Transaction, { find as __find } from '../models/Transaction';

const SECRET_KEY = 'your_secret_key_here';

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    cpf: { type: GraphQLString },
  },
});

const AccountType = new GraphQLObjectType({
  name: 'Account',
  fields: {
    id: { type: GraphQLID },
    owner: { type: UserType },
    ownerName: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const TransactionType = new GraphQLObjectType({
  name: 'Transaction',
  fields: {
    id: { type: GraphQLID },
    from: { type: AccountType },
    to: { type: AccountType },
    amount: { type: GraphQLFloat },
    date: { type: GraphQLString },
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return find({});
      },
    },
    accounts: {
      type: new GraphQLList(AccountType),
      resolve(parent, args) {
        return _find({}).populate('owner');
      },
    },
    transactions: {
      type: new GraphQLList(TransactionType),
      resolve(parent, args) {
        return __find({}).populate('from to');
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        cpf: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const existingUser = await findOne({ cpf: args.cpf });
        if (existingUser) {
          throw new Error('CPF already registered');
        }

        const user = new User({
          name: args.name,
          email: args.email,
          password: args.password,
          cpf: args.cpf,
        });

        return user.save();
      },
    },
    login: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const user = await findOne({ email: args.email });
        if (!user) {
          throw new Error('User not found');
        }

        const isMatch = await compare(args.password, user.password);
        if (!isMatch) {
          throw new Error('Invalid credentials');
        }

        const token = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

        return token;
      },
    },
    createAccount: {
      type: AccountType,
      args: {
        ownerId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, args) {
        const user = await findById(args.ownerId);
        if (!user) {
          throw new Error('User not found');
        }

        const account = new Account({
          owner: args.ownerId,
          ownerName: user.name,
        });

        return account.save();
      },
    },
    createTransaction: {
      type: TransactionType,
      args: {
        from: { type: new GraphQLNonNull(GraphQLID) },
        to: { type: new GraphQLNonNull(GraphQLID) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
      },
      async resolve(parent, args) {
        const fromAccount = await _findById(args.from);
        const toAccount = await _findById(args.to);

        if (!fromAccount || !toAccount || fromAccount.balance < args.amount) {
          throw new Error('Invalid transaction');
        }

        fromAccount.balance -= args.amount;
        toAccount.balance += args.amount;

        await fromAccount.save();
        await toAccount.save();

        const transaction = new Transaction({
          from: args.from,
          to: args.to,
          amount: args.amount,
        });

        return transaction.save();
      },
    },
  },
});

export default makeExecutableSchema({
  typeDefs: `
    type User {
      id: ID!
      name: String!
      email: String!
      cpf: String!
    }

    type Account {
      id: ID!
      owner: User!
      ownerName: String!
      balance: Float!
    }

    type Transaction {
      id: ID!
      from: Account!
      to: Account!
      amount: Float!
      date: String!
    }

    type Query {
      users: [User]
      accounts: [Account]
      transactions: [Transaction]
    }

    type Mutation {
      createUser(name: String!, email: String!, password: String!, cpf: String!): User
      login(email: String!, password: String!): String
      createAccount(ownerId: ID!): Account
      createTransaction(from: ID!, to: ID!, amount: Float!): Transaction
    }
  `,
  resolvers: {
    Query: {
      users: () => find(),
      accounts: () => _find().populate('owner'),
      transactions: () => __find().populate('from to'),
    },
    Mutation: {
      createUser: async (_, { name, email, password, cpf }) => {
        const existingUser = await findOne({ cpf });
        if (existingUser) throw new Error('CPF already registered');

        const user = new User({ name, email, password, cpf });
        return user.save();
      },
      login: async (_, { email, password }) => {
        const user = await findOne({ email });
        if (!user) throw new Error('User not found');

        const isMatch = await compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        return token;
      },
      createAccount: async (_, { ownerId }) => {
        const user = await findById(ownerId);
        if (!user) throw new Error('User not found');

        const account = new Account({
          owner: ownerId,
          ownerName: user.name,
        });
        return account.save();
      },
      createTransaction: async (_, { from, to, amount }) => {
        const fromAccount = await _findById(from);
        const toAccount = await _findById(to);

        if (fromAccount.balance < amount) throw new Error('Insufficient balance');

        fromAccount.balance -= amount;
        toAccount.balance += amount;

        await fromAccount.save();
        await toAccount.save();

        const transaction = new Transaction({ from, to, amount });
        return transaction.save();
      },
    },
  },
});
