import { TrackerFinderController } from './controller';
import { PrismaClient } from '@prisma/client';
import GQLSetup from './GQLSetup';
import { PubSub } from 'graphql-subscriptions';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import rootLogger from "./logger"
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import yaml from 'js-yaml';
import fs from 'fs';
import { AppConfig } from './utils';
class App {

  private config: AppConfig = yaml.load(fs.readFileSync('config/config.yml', 'utf8')) as AppConfig;
  private _log = rootLogger(this.config).getChildLogger({ name: "TrackerFinderController" });

  async start() {
    const pubsub = new PubSub();

    const prisma = new PrismaClient();
    const controller = new TrackerFinderController(this.config, pubsub, prisma);
    
    const gqlController = new GQLSetup(pubsub, prisma, controller);
    const typeDefs = gqlController.typeDefs;
    const resolvers = gqlController.resolvers;

    const schema = makeExecutableSchema({ typeDefs, resolvers });
 
    const app = express();
    app.use(cors());
    app.get('/', (req: any, res: any) => {
      res.send('TrackerDetectorServer');
    })

    app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: true
    }));

    const ws = createServer(app);
    const server = ws.listen(this.config.port, () => {
      new SubscriptionServer(
        {
          execute,
          subscribe,
          schema,
        },
        {
          server: ws,
          path: '/graphql',
        },
      );

      this._log.info(`🚀 Server Sub ready at ws://localhost:${this.config.port}/graphql`);
      this._log.info(`🚀 Server ready at http://localhost:${this.config.port}/graphql`);

    });

    process.on('SIGTERM', () => {
      server.close(() => {
        this._log.info(`Server closed`);
      })
    })

  }

}



export default new App();