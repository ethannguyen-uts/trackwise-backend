import path from "path";
import { buildSchema } from "type-graphql";
export const createSchema = async () => {
  return await buildSchema({
    resolvers: [path.join(__dirname, "../modules/**/*.resolver.{ts,js}")],
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
};
