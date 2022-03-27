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
import { COOKIE_NAME } from "./modules/constants/constants";
import dotenv from "dotenv";
//import cron from "node-cron";

dotenv.config();
const {
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  FRONTEND_HOST,
  FRONTEND_PORT,
  SESSION_SECRET_KEY,
} = process.env;

const main = async () => {
  const conn = await createConnection({
    name: "default",
    type: "postgres",
    host: POSTGRES_HOST,
    port: POSTGRES_PORT as unknown as number,
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    synchronize: true,
    logging: true,
    entities: ["src/entity/*.*"],
    migrationsTableName: "custom_migration_table",
    migrations: ["src/migrations/*.*"],
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
              // Our built schema
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
  app.use(
    cors({ credentials: true, origin: `${FRONTEND_HOST}:${FRONTEND_PORT}` })
  );

  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
      }),
      name: COOKIE_NAME,
      saveUninitialized: false,
      secret: SESSION_SECRET_KEY as string,
      resave: false,
      cookie: {
        httpOnly: true, //make sure javascript cant access it
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 1 * 365, //1 year
      },
    })
  );

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });
  app.listen(4000, () => {
    console.log("Server started on port 4000");
  });

  //Scrape price every minute
  /*
  cron.schedule("* * * * *", function () {
    console.log("running");
  });
  */
};

main();
