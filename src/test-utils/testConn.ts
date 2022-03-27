import { createConnection } from "typeorm";

export const testConn = async (drop: boolean = false) => {
  const {
    POSTGRES_HOST,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_TEST_DB,
    POSTGRES_PORT,
  } = process.env;

  return createConnection({
    name: "default",
    type: "postgres",
    host: POSTGRES_HOST,
    port: POSTGRES_PORT as unknown as number,
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_TEST_DB,
    synchronize: drop,
    dropSchema: drop,
    entities: [__dirname + "/../entity/*.*"],
  });
};
