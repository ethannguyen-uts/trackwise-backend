import { ApolloServer } from "apollo-server-express";
import Express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
declare module "express-session" {
  export interface SessionData {
    userId: any;
  }
}
import session from "express-session";
import connectRedis from "connect-redis";
import { redisClient } from "./redis";
import cors from "cors";
import { createSchema } from "./utils/createSchema";
import {
  getComplexity,
  fieldExtensionsEstimator,
  simpleEstimator,
} from "graphql-query-complexity";
import { COOKIE_NAME } from "./constants/constants";
import path from "path";
import dotsafe from "dotenv-safe";

const main = async () => {
  dotsafe.config();
  const conn = await createConnection({
    name: "default",
    type: "postgres",
    url: process.env.DATABASE_URL,
    //synchronize: true,
    logging: true,
    entities: [path.join(__dirname, "./entity/*.{ts,js}")],
    migrationsTableName: "custom_migration_table",
    migrations: [path.join(__dirname, "./migrations/*.{ts,js}")],
    cli: {
      migrationsDir: "src/migrations",
    },
  });
  await conn.runMigrations();

  const schema = await createSchema();
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground,
      {
        requestDidStart: (): any => ({
          didResolveOperation({ request, document }: any) {
            const complexity = getComplexity({
              schema,
              operationName: request.operationName,
              // The GraphQL query document
              query: document,
              // The variables for our GraphQL query
              variables: request.variables,
              estimators: [
                fieldExtensionsEstimator(),
                simpleEstimator({ defaultComplexity: 1 }),
              ],
            });
            if (complexity > 20) {
              throw new Error(
                `Sorry, too complicated query! ${complexity} is over 20 that is the max allowed complexity.`
              );
            }
            //console.log("Used query complexity points:", complexity);
          },
        }),
      },
    ],
  });

  await apolloServer.start();
  const app = Express();

  const RedisStore = connectRedis(session);

  //make cookie work in proxy environment
  app.set("proxy", 1);

  app.use(
    cors({
      credentials: true,
      origin: process.env.CORS_ORIGIN,
    })
  );

  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
      }),
      name: COOKIE_NAME,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      cookie: {
        httpOnly: true, //make sure javascript cant access it
        secure: process.env.NODE_ENV === "production", // secure cookie can only be transmitted over encrypted connection
        //domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
        maxAge: 1000 * 60 * 60 * 24 * 1 * 365, //1 year
      },
    })
  );

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });
  app.listen(parseInt(process.env.PORT), () => {
    console.log(`Server started on port ${process.env.PORT}`);
  });

  //Scrape price every minute
  /*
  cron.schedule("* * * * *", function () {
    console.log("running");
  });
  */
};

main();
