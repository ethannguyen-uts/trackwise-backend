import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";
import { LoginResponse } from "./login/LoginResponse";

@Resolver(() => LoginResponse)
//we define User here to know which object we resolve from
export class LoginResolver {
  @Mutation(() => LoginResponse)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() ctx: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            error: "Invalid user",
          },
        ],
      };
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            error: "Invalid password",
          },
        ],
      };
    }

    ctx.req.session!.userId = user.id;
    console.log(ctx.req.session);
    return { user };
  }
}
