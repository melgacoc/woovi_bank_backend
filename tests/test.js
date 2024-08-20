const request = require('supertest');
const app = require('../src/server');


beforeAll(async () => {
   await new Promise(resolve => setTimeout(resolve, 1000));
});

describe('GraphQL API', () => {
  it('should fetch all users', async () => {
    const response = await request(app.callback())
      .post('/graphql')
      .send({
        query: `{ users { id name email cpf } }`
      })
      .expect(200);

    expect(response.body.data.users).toBeDefined();
    expect(Array.isArray(response.body.data.users)).toBe(true);
  });

  it('should create a new user', async () => {
    const response = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(name: "John Doe", email: "john@example.com", password: "password123", cpf: "12345678901") {
            id
            name
            email
            cpf
          }
        }`
      })
      .expect(200);

    expect(response.body.data.createUser).toBeDefined();
    expect(response.body.data.createUser.name).toBe('John Doe');
  });

  it('should login a user and return a token', async () => {
    const response = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          login(email: "john@example.com", password: "password123")
        }`
      })
      .expect(200);

    expect(response.body.data.login).toBeDefined();
    expect(typeof response.body.data.login).toBe('string');
  });

  it('should create a new account', async () => {
    const userResponse = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(name: "Jane Doe", email: "jane@example.com", password: "password123", cpf: "10987654321") {
            id
            email
          }
        }`
      });

    const userId = userResponse.body.data.createUser.id;

    const response = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createAccount(ownerId: "${userId}") {
            id
            ownerName
          }
        }`
      })
      .expect(200);

    expect(response.body.data.createAccount).toBeDefined();
    expect(response.body.data.createAccount.ownerName).toBe('Jane Doe');
  });

  it('should create a transaction', async () => {
    const fromAccountResponse = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createAccount(ownerId: "66c4b1aa8ce09b78e6b56978") {
            id
          }
        }`
      });

    const toAccountResponse = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createAccount(ownerId: "66c4b1e08ce09b78e6b5698b") {
            id
          }
        }`
      });

    const fromAccountId = fromAccountResponse.body.data.createAccount.id;
    const toAccountId = toAccountResponse.body.data.createAccount.id;

    // Em seguida, crie uma transação
    const response = await request(app.callback())
      .post('/graphql')
      .send({
        query: `mutation {
          createTransaction(from: "${fromAccountId}", to: "${toAccountId}", amount: 50.0) {
            id
            amount
            type
          }
        }`
      })
      .expect(200);

    expect(response.body.data.createTransaction).toBeDefined();
    expect(response.body.data.createTransaction.amount).toBe(50.0);
  });
});
