import { Resolver, Query, Ctx } from "type-graphql";
import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";

@Resolver()
//we define User here to know which object we resolve from
export class MeResolver {
  @Query(() => User, { nullable: true, complexity: 5 })
  async me(@Ctx() ctx: MyContext): Promise<User | null> {
    if (!ctx.req.session!.userId) {
      return null;
    }

    return User.findOne(ctx.req.session!.userId);
  }
}
