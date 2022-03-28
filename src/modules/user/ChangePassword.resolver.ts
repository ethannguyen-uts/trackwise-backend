import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { User } from "../../entity/User";
import { redisClient } from "../../redis";
import { forgotPasswordPrefix } from "../../constants/redisPrefixes";
import bcrypt from "bcryptjs";
import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { MyContext } from "../../types/MyContext";
import { UserResponse } from "../shared/UserResponse";

@Resolver()
export class ChangePasswordResolver {
  @Mutation(() => UserResponse, { nullable: true })
  async changePassword(
    @Arg("data") { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<UserResponse> {
    const userId = await redisClient.get(forgotPasswordPrefix + token);
    if (!userId) {
      return { errors: [{ field: "token", error: "Token expired" }] };
    }
    const user = await User.findOne(userId);
    if (!user) {
      return { errors: [{ field: "token", error: "User no longer exists" }] };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    User.update({ id: user.id }, { password: hashedPassword });
    redisClient.del(forgotPasswordPrefix + token);

    //login the user:
    ctx.req.session.userId = user.id;

    return { user };
  }
}
