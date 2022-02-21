import { TrackerFinderController } from './controller';
import { PrismaClient } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import rootLogger from "./logger"
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import GQLSetup from './graphql_resolvers';
import config from './config';
import { generateNotice } from './services/notice.service';
class App {

  private _log = rootLogger(config).getChildLogger({ name: "TrackerFinderController" });

  async start() {

    const pubsub = new PubSub();

    const prisma = new PrismaClient();

    const controller = new TrackerFinderController(prisma);

    const gqlController = new GQLSetup(pubsub, prisma, controller);
    const typeDefs = gqlController.typeDefs;
    const resolvers = gqlController.resolvers;

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    const app = express();
    app.use(cors());
    app.get('/', (req: any, res: any) => {
      res.send('TrackerDetectorServer');
    })

    app.get('/notices/versions/:versionId', (req: any, res: any) => {
      const versionId = parseInt(req.params.versionId, 10);

      generateNotice(versionId, res);
    })

    app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: true
    }));

    const server = app.listen(config.port, () => {

      this._log.info(`🚀 Server Sub ready at ws://localhost:${config.port}/graphql`);
      this._log.info(`🚀 Server ready at http://localhost:${config.port}/graphql`);

    });

    process.on('SIGTERM', () => {
      server.close(() => {
        this._log.info(`Server closed`);
      })
    })

  }

}



export default new App();