import { Resolver, Mutation, Arg } from "type-graphql";
import { User } from "../../entity/User";
import { redisClient } from "../../redis";
import { confirmUserPrefix } from "../constants/redisPrefixes";

@Resolver()
//we define User here to know which object we resolve from
export class ConfirmUserResolver {
  @Mutation(() => Boolean)
  async confirmUser(@Arg("token") token: string): Promise<boolean> {
    const userId = await redisClient.get(confirmUserPrefix + token);
    if (!userId) {
      return false;
    }
    const user = await User.findOne(userId);
    if (!user) {
      return false;
    }
    User.update({ id: user.id }, { confirmed: true });
    redisClient.del(confirmUserPrefix + token);
    return true;
  }
}
