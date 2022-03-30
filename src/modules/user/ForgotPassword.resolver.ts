import { Resolver, Mutation, Arg } from "type-graphql";
import { User } from "../../entity/User";
import { sendForgotPasswordEmail } from "../utils/sendForgotPasswordEmail";
import { v4 } from "uuid";
import { redisClient } from "../../redis";
import { forgotPasswordPrefix } from "../../constants/redisPrefixes";

@Resolver()
//we define User here to know which object we resolve from
export class ForgotPasswordResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string): Promise<boolean> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }

    const token = v4();
    await redisClient.set(
      forgotPasswordPrefix + token,
      user.id,
      "ex",
      60 * 60 * 24 //1 day
    );

    await sendForgotPasswordEmail(user.email, token);
    return true;
  }
}
