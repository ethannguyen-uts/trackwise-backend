import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { User } from "../../entity/User";
import { redisClient } from "../../redis";
import { forgotPasswordPrefix } from "../constants/redisPrefixes";
import bcrypt from "bcryptjs";
import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { MyContext } from "src/types/MyContext";

@Resolver()
//we define User here to know which object we resolve from
export class ChangePasswordResolver {
  @Mutation(() => User, { nullable: true })
  async changePassword(
    @Arg("data") { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
    const userId = await redisClient.get(forgotPasswordPrefix + token);
    if (!userId) {
      return null;
    }
    const user = await User.findOne(userId);
    if (!user) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    User.update({ id: user.id }, { password: hashedPassword });
    redisClient.del(forgotPasswordPrefix + token);

    User.update({ id: user.id }, { confirmed: true });

    //login the user:
    ctx.req.session.userId = user.id;

    return user;
  }
}
