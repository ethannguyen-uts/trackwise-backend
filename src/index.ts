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
import cron from "node-cron";

dotenv.config();

const main = async () => {
  const conn = await createConnection({
    name: "default",
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres123",
    database: "space",
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
            /**
             * This provides GraphQL query analysis to be able to react on complex queries to your GraphQL server.
             * This can be used to protect your GraphQL servers against resource exhaustion and DoS attacks.
             * More documentation can be found at https://github.com/ivome/graphql-query-complexity.
             */
            const complexity = getComplexity({
              // Our built schema
              schema,
              // To calculate query complexity properly,
              // we have to check only the requested operation
              // not the whole document that may contains multiple operations
              operationName: request.operationName,
              // The GraphQL query document
              query: document,
              // The variables for our GraphQL query
              variables: request.variables,
              // Add any number of estimators. The estimators are invoked in order, the first
              // numeric value that is being returned by an estimator is used as the field complexity.
              // If no estimator returns a value, an exception is raised.
              estimators: [
                // Using fieldExtensionsEstimator is mandatory to make it work with type-graphql.
                fieldExtensionsEstimator(),
                // Add more estimators here...
                // This will assign each field a complexity of 1
                // if no other estimator returned a value.
                simpleEstimator({ defaultComplexity: 1 }),
              ],
            });
            // Here we can react to the calculated complexity,
            // like compare it with max and throw error when the threshold is reached.
            if (complexity > 20) {
              throw new Error(
                `Sorry, too complicated query! ${complexity} is over 20 that is the max allowed complexity.`
              );
            }
            // And here we can e.g. subtract the complexity point from hourly API calls limit.
            //console.log("Used query complexity points:", complexity);
          },
        }),
      },
    ],
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
      name: COOKIE_NAME,
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

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });
  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000/graphql");
  });

  //Scrape price every minute
  cron.schedule("* * * * *", function () {
    console.log("running");
  });
};

main();
