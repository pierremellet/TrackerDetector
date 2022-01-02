import express from 'express';
import cors from 'cors';
import { TrackerFinderController } from './controller';
import { StorageService } from './storage';
import { graphqlHTTP } from 'express-graphql';
import { PrismaClient } from '@prisma/client';
import GraphQLController from './graphql';




class App {
  public server;

  constructor() {
    this.server = express();
    const prisma = new PrismaClient();
    const storageService = new StorageService(prisma);
    const controller = new TrackerFinderController(storageService);
    this.middlewares();
    const schema = new GraphQLController(prisma, controller).schema;
    this.server.use('/graphql', graphqlHTTP({
      schema,
    }));
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(cors());
  }



}

export default new App().server;