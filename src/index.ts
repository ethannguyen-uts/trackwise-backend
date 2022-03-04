import { ApolloServer } from "apollo-server-express";
import Express from "express";
import { buildSchema } from "type-graphql";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { RegisterResolver } from "./modules/user/register";
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
import { LoginResolver } from "./modules/user/login";
import { MeResolver } from "./modules/user/me";

const main = async () => {
  await createConnection();
  const schema = await buildSchema({
    resolvers: [RegisterResolver, LoginResolver, MeResolver],
    authChecker: ({ context: { req } }) => {
      // here we can read the user from context
      // and check his permission in the db against the `roles` argument
      // that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]
      if (req.session.userId) {
        return true;
      }
      return false; // or false if access is denied
    },
  });
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }: any) => ({ req }),
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
