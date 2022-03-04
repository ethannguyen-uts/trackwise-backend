import { Resolver, Query, Mutation, Arg, UseMiddleware } from "type-graphql";
import * as bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { isAuth } from "../middleware/isAuth";
import { logger } from "../middleware/logger";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";
import { sendEmail } from "../utils/sendEmail";

@Resolver()
//we define User here to know which object we resolve from
export class RegisterResolver {
  @UseMiddleware(isAuth, logger)
  @Query(() => String, { name: "helloWorld" })
  async helloWorld() {
    return "Hello world!";
  }

  @Mutation(() => User)
  async register(
    @Arg("data") { email, firstName, lastName, password }: RegisterInput
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    }).save();
    //send email for confirmation
    await sendEmail(email, await createConfirmationUrl(user.id));

    return user;
  }
}
