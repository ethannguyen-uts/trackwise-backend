import { MyContext } from "../../types/MyContext";
import { Ctx, Mutation, Resolver } from "type-graphql";
import { COOKIE_NAME } from "../constants/constants";

@Resolver()
export class LogoutResolver {
  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: MyContext): Promise<boolean> {
    return new Promise((resolve, reject) => {
      ctx.req.session.destroy((err) => {
        console.log(err);
        return reject(false);
      });
      ctx.res.clearCookie(COOKIE_NAME);
      return resolve(true);
    });
  }
}
