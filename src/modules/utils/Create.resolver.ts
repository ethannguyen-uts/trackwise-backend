import { User } from "../../entity/User";
import {
  Arg,
  Mutation,
  Resolver,
  ClassType,
  UseMiddleware,
} from "type-graphql";
import { RegisterInput } from "../user/register/RegisterInput";

import { Middleware } from "type-graphql/dist/interfaces/Middleware";

function createResolver<T extends ClassType, X extends ClassType>(
  suffix: string,
  returnType: T,
  inputType: X,
  entity: any,
  middleware?: Middleware<any>[]
) {
  @Resolver()
  abstract class BaseResolver {
    @Mutation(() => returnType, { name: `create${suffix}` })
    @UseMiddleware(...(middleware || []))
    async create(@Arg("data", () => inputType) data: any) {
      return entity.create(data).save();
    }
  }
  return BaseResolver;
}

export const CreateUserResolver = createResolver(
  "User",
  User,
  RegisterInput,
  User
);
