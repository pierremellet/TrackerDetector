import { TrackerFinderController } from './controller';
import { PrismaClient } from '@prisma/client';
import GQLSetup from './GQLSetup';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer } from 'apollo-server-express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { DocumentNode, execute, subscribe } from 'graphql';
import { PluginDefinition } from 'apollo-server-core';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { interval, timer } from 'rxjs';


class App {

  async start(port: number) {
    const pubsub = new PubSub();
    const prisma = new PrismaClient();
    const controller = new TrackerFinderController(pubsub, prisma);
    const gqlController = new GQLSetup(pubsub, prisma, controller);
    const typeDefs = gqlController.typeDefs;
    const resolvers = gqlController.resolvers;
    await this.startApolloServer(port, typeDefs, resolvers);
    interval(100).subscribe(()=>pubsub.publish('COOKIE_NOT_EXIST_1', {
      appVerCookieNotFounded: {
        name: (new Date()).getTime() + ""
      }
    }))
  }

 private async startApolloServer(port: number, typeDefs: DocumentNode, resolvers: any) {
    const app = express();
    app.use(cors());

    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const subscriptionServer = SubscriptionServer.create(
      { schema, execute, subscribe }, 
      {server: httpServer,path: '/graphql'}
    );

    const drainWebSocketServer: PluginDefinition = {
      serverWillStart: async () => {
        drainServer: async () => {
          console.log("close");
          subscriptionServer.close();
        }
      }
    }

    const server = new ApolloServer({
      schema,
      plugins: [drainWebSocketServer, ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();
    server.applyMiddleware({app});

    httpServer.listen(port, () =>
    console.log(`Server is now running on http://localhost:${port}/graphql`)
  );
  }
}


export default new App();