import { TrackerFinderController } from './controller';
import { PrismaClient } from '@prisma/client';
import GQLSetup from './GQLSetup';
import { PubSub } from 'graphql-subscriptions';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import rootLogger from "./logger"
import { interval } from 'rxjs';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

class App {

  private _log = rootLogger.getChildLogger({ name: "TrackerFinderController" });

  async start(PORT: number) {
    const pubsub = new PubSub();
    interval(500).subscribe((i) => {
      pubsub.publish('COOKIE_NOT_EXIST_1', { appVerCookieNotFounded: "toto" });
    })

    const prisma = new PrismaClient();
    const controller = new TrackerFinderController(pubsub, prisma);
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
    const server = ws.listen(PORT, () => {
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

      this._log.info(`🚀 Server Sub ready at ws://localhost:${PORT}/graphql`);
      this._log.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);

    });

    process.on('SIGTERM', () => {
      server.close(() => {
        this._log.info(`Server closed`);
      })
    })



  }

}


export default new App();