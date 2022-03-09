import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import * as bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { isAuth } from "../middleware/isAuth";
import { logger } from "../middleware/logger";
//import { createConfirmationUrl } from "../utils/createConfirmationUrl";
//import { sendEmail } from "../utils/sendEmail";
import { MyContext } from "src/types/MyContext";
import { RegisterResponse } from "./register/RegisterResponse";

@Resolver()
//we define User here to know which object we resolve from
export class RegisterResolver {
  @UseMiddleware(isAuth, logger)
  @Query(() => String, { name: "helloWorld" })
  async helloWorld() {
    return "Hello world!";
  }

  @Mutation(() => RegisterResponse)
  async register(
    @Arg("data") registerInput: RegisterInput,
    @Ctx() ctx: MyContext
  ): Promise<RegisterResponse> {
    const { email, firstName, lastName, password, username } = registerInput;

    const hashedPassword = await bcrypt.hash(password, 12);
    try {
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        username,
        created_at: new Date(),
        updated_at: new Date(),
      }).save();

      if (!user) throw new Error("aa");

      //send email for confirmation
      //await sendEmail(email, await createConfirmationUrl(user.id));
      //login
      ctx.req.session.userId = user.id;

      return {
        user,
      };
    } catch (error) {
      console.log(error);
      return {
        errors: [
          {
            error: error.message,
          },
        ],
      };
    }
  }
}
