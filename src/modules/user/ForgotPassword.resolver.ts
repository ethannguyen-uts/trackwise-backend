import { Resolver, Mutation, Arg } from "type-graphql";
import { User } from "../../entity/User";
import { sendForgotPasswordEmail } from "../utils/sendForgotPasswordEmail";

@Resolver()
//we define User here to know which object we resolve from
export class ForgotPasswordResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string): Promise<boolean> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    await sendForgotPasswordEmail(user.email, user.id);
    return true;
  }
}
