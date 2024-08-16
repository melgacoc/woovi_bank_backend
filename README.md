# Woovi Bank API

Este é o backend da aplicação Woovi Bank, construído com Node.js, Koa, MongoDB e GraphQL. A API gerencia autenticação de usuários, gerenciamento de contas e transações, fornecendo uma base robusta para uma aplicação bancária.

## Funcionalidades

- **Autenticação de Usuários**: Registre e autentique usuários com senhas criptografadas.
- **Gerenciamento de Contas**: Crie e gerencie contas bancárias, vinculando-as a usuários.
- **Transações**: Transfira dinheiro entre contas, rastreie entradas e saídas.
- **API GraphQL**: Fornece uma API flexível e poderosa com GraphQL, permitindo que os clientes façam consultas específicas.
- **Integração com MongoDB**: Todos os dados são armazenados no MongoDB, proporcionando uma solução de banco de dados escalável.

## Tecnologias
![Javascript Badge](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Node Badge](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Graphql](https://img.shields.io/badge/GraphQl-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=Postman&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

## Primeiros Passos

### Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB (v4.4 ou superior)
- Postman (opcional, para testar a API)

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/yourusername/woovi_bank_backend.git
cd woovi_bank_backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
DEFAULT_USER_NAME=Admin
DEFAULT_USER_EMAIL=admin@example.com
DEFAULT_USER_PASSWORD=password123
DEFAULT_USER_CPF=00000000000
PORT=10000
DATABASE=mongodb://localhost:27017/graphql-bank-api
```

4. Inicie o servidor Mongo se ainda não estiver ativo ou substitua em DATABASE por um banco externo, como Atlas, por exemplo
```bash
mongodb
```

5. Inicie a aplicação
```bash
npm start
```

### GraphQL Playground
A partir do localhost acesse a porta 10000 exposta para o playground do GraphQL http://localhost:10000/graphql.
é possível acessar pelo link do [deploy da API](https://woovi-bank-backend.onrender.com/graphql). Por se tratar de um deploy gratuito ele irá carregar por 50 segundos, mais ou menos, depois de um tempo inativo.

### Coleção Postman
Na raiz do projeto se encontra o arquivo woovi_bank.postman_collection.json. Importe esse arquivo no Postman para acessar a coleção de requisições pré definidas da API
   
