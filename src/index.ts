import { ApolloServer } from "apollo-server-express";
import Express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import session from "express-session";
declare module "express-session" {
  export interface SessionData {
    userId: any;
  }
}
import connectRedis from "connect-redis";
import { redisClient } from "./redis";
import cors from "cors";
import { createSchema } from "./utils/createSchema";

const main = async () => {
  await createConnection();
  const schema = await createSchema();
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  });

  await apolloServer.start();

  const app = Express();

  const RedisStore = connectRedis(session);
  app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
      }),
      name: "uid",
      saveUninitialized: false,
      secret: "secret cat",
      resave: false,
      cookie: {
        httpOnly: true, //make sure javascript cant access it
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 1 * 365, //1 year
      },
    })
  );

  apolloServer.applyMiddleware({ app });
  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000/graphql");
  });
};

main();
