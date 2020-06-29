import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import DataLoader from 'dataloader';
import 'dotenv/config';

import schema from './graphql/schema';
import resolvers from './graphql/resolvers';
import models from './models';
import loaders from './loaders';
import getMe from './utils/getMe';

export default async () => {
  const port = process.env.PORT || 8000;
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  const server = new ApolloServer({
    introspection: true,
    playground: true,
    typeDefs: schema,
    resolvers,
    context: async ({ req, connection }) => {
      if (connection) {
        return {
          models,
          loaders: {
            user: new DataLoader((keys) =>
              loaders.user.batchUsers(keys, models),
            ),
          },
        };
      }

      if (req) {
        const me = await getMe(req);

        return {
          models,
          me,
          secret: process.env.ACCESS_TOKEN_SECRET,
          loaders: {
            user: new DataLoader((keys) =>
              loaders.user.batchUsers(keys, models),
            ),
          },
        };
      }
    },
  });

  server.applyMiddleware({ app, path: '/graphql' });

  // const mongoUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
  const mongoUrl = 'mongodb://localhost:27017/nodejs-demo';
  console.log(mongoUrl);
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  });
  app.listen({ port }, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
  });
};
