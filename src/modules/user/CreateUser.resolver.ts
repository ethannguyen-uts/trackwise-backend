import { User } from "src/entity/User";
import { Arg, Mutation, Resolver } from "type-graphql";
import { RegisterInput } from "./register/RegisterInput";

@Resolver()
export class CreateUserResilver {
  @Mutation()
  async createUser(@Arg("data") data: RegisterInput) {
    return User.create(data).save();
  }
}
