import { MyContext } from "../../types/MyContext";
import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { User } from "../../entity/User";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() ctx: MyContext) {
    if (ctx.req.session.userId === user.id) return user.email;
    else return "";
  }
}
