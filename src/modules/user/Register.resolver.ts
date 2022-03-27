import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import * as bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { MyContext } from "../../types/MyContext";
import { RegisterResponse } from "./register/RegisterResponse";

@Resolver()
//we define User here to know which object we resolve from
export class RegisterResolver {
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
      if (!user) throw new Error("User does not exist!");
      //login
      ctx.req.session.userId = user.id;
      return {
        user,
      };
    } catch (error) {
      return {
        errors: [
          {
            field: "username",
            error: error.message,
          },
        ],
      };
    }
  }
}
