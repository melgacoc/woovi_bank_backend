const { makeExecutableSchema } = require('@graphql-tools/schema');
const { GraphQLObjectType, GraphQLSchema, GraphQLID, GraphQLString, GraphQLFloat, GraphQLList, GraphQLNonNull } = require('graphql');
const { compare } = require('bcryptjs');
const { sign } = require('jsonwebtoken');
const User = require('../models/usersModel');
const Account = require('../models/accountModel');
const Transaction = require('../models/transactionsModel');

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
        return User.find({}); // Use User.find() diretamente
      },
    },
    accounts: {
      type: new GraphQLList(AccountType),
      resolve(parent, args) {
        return Account.find({}).populate('owner'); // Use Account.find() diretamente
      },
    },
    transactions: {
      type: new GraphQLList(TransactionType),
      resolve(parent, args) {
        return Transaction.find({}).populate('from to'); // Use Transaction.find() diretamente
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
        const existingUser = await User.findOne({ cpf: args.cpf });
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
        const user = await User.findOne({ email: args.email });
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
        const user = await User.findById(args.ownerId);
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
        const fromAccount = await Account.findById(args.from);
        const toAccount = await Account.findById(args.to);

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

module.exports = makeExecutableSchema({
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
      users: () => User.find(), // Use User.find() diretamente
      accounts: () => Account.find().populate('owner'), // Use Account.find() diretamente
      transactions: () => Transaction.find().populate('from to'), // Use Transaction.find() diretamente
    },
    Mutation: {
      createUser: async (_, { name, email, password, cpf }) => {
        const existingUser = await User.findOne({ cpf });
        if (existingUser) throw new Error('CPF already registered');

        const user = new User({ name, email, password, cpf });
        return user.save();
      },
      login: async (_, { email, password }) => {
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');

        const isMatch = await compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        return token;
      },
      createAccount: async (_, { ownerId }) => {
        const user = await User.findById(ownerId);
        if (!user) throw new Error('User not found');

        const account = new Account({
          owner: ownerId,
          ownerName: user.name,
        });
        return account.save();
      },
      createTransaction: async (_, { from, to, amount }) => {
        const fromAccount = await Account.findById(from);
        const toAccount = await Account.findById(to);

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
