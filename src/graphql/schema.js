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
    type: { type: GraphQLString },
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return User.find({});
      },
    },
    accounts: {
      type: new GraphQLList(AccountType),
      resolve(parent, args) {
        return Account.find({}).populate('owner');
      },
    },
    transactions: {
      type: new GraphQLList(TransactionType),
      args: {
        accountId: { type: new GraphQLNonNull(GraphQLID) },
        filter: { type: 'TransactionFilterInput' },
      },
      resolve(parent, { accountId, filter }) {
        let query = Transaction.find({
          $or: [{ from: accountId }, { to: accountId }],
        });

        if (filter) {
          if (filter.startDate || filter.endDate) {
            query = query.where('date').gte(filter.startDate).lte(filter.endDate);
          }
          if (filter.type) {
            query = query.where('type', filter.type);
          }
        }

        return query.populate('from to');
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

        const type = fromAccount._id.equals(args.from) ? 'saida' : 'entrada';

        const transaction = new Transaction({
          from: args.from,
          to: args.to,
          amount: args.amount,
          type,
          date: new Date().toISOString(),
        });

        return transaction.save();
      },
    },
  },
});

module.exports = makeExecutableSchema({
  typeDefs: `
    type AuthPayload {
      token: String!
      id: ID!
      name: String!
      email: String!
    } 

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
      type: String!
    }

    input TransactionFilterInput {
      startDate: String
      endDate: String
      type: String
    }

    type Query {
      users: [User]
      accounts: [Account]
      transactions(accountId: ID!, filter: TransactionFilterInput): [Transaction]
    }

    type Mutation {
      createUser(name: String!, email: String!, password: String!, cpf: String!): User
      login(email: String!, password: String!): AuthPayload
      createAccount(ownerId: ID!): Account
      createTransaction(from: ID!, to: ID!, amount: Float!): Transaction
    }
  `,
  resolvers: {
    Query: {
      users: () => User.find(),
      accounts: () => Account.find().populate('owner'),
      transactions: (_, { accountId, filter }) => {
        let query = Transaction.find({
          $or: [{ from: accountId }, { to: accountId }],
        });

        if (filter) {
          if (filter.startDate || filter.endDate) {
            query = query.where('date').gte(filter.startDate).lte(filter.endDate);
          }
          if (filter.type) {
            query = query.where('type', filter.type);
          }
        }

        return query.populate('from to');
      },
    },
    Mutation: {
      createUser: async (_, { name, email, password, cpf }) => {
        const existingUser = await User.findOne({ cpf });
        if (existingUser) throw new Error('CPF already registered');

        const user = new User({ name, email, password, cpf });
        const token = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        if (!user) throw new Error('Error creating user');
        return {
          token,
          id: user.id,
          email: user.email,
          name: user.name,
          accountId: user.accountId? user.accountId : null,
        };
      },
      login: async (_, { email, password }) => {
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');

        const isMatch = await compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        return {
          token,
          id: user.id,
          email: user.email,
          name: user.name,
          accountId: user.accountId? user.accountId : null,
        }
      },
      createAccount: async (_, { ownerId }) => {
        const user = await User.findById(ownerId);
        if (!user) throw new Error('User not found');

        const account = new Account({
          owner: ownerId,
          ownerName: user.name,
        });
        await account.save();
        user.accountId = savedAccount._id;
        await user.save();
        const attUser = await User.findById(ownerId);
        return attUser;
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
      
          if (!fromAccount || !toAccount) {
            throw new Error('One or both accounts not found');
          }
      
          const isDeposit = fromAccount._id.equals(toAccount._id);
      
          if (!isDeposit && fromAccount.balance < args.amount) {
            throw new Error('Insufficient funds');
          }
      
          if (isDeposit) {
            fromAccount.balance += args.amount;
          } else {
            fromAccount.balance -= args.amount;
            toAccount.balance += args.amount;
          }
      
          await fromAccount.save();
          await toAccount.save();
      
          const type = isDeposit ? 'income' : 'expense';

          const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
          const transaction = new Transaction({
            transactionId,
            from: args.from,
            to: args.to,
            amount: args.amount,
            type,
            date: new Date().toISOString(),
          });

      
          return transaction.save();
        },
      },
    },
  },
});
