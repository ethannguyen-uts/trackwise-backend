import { Field, ObjectType } from "type-graphql";
import { FieldError } from "../register/RegisterResponse";
import { User } from "../../../entity/User";

@ObjectType()
//export class RegisterInput extends ClassMixin(PasswordInput) {
export class LoginResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: [FieldError];

  @Field(() => User, { nullable: true })
  user?: User;
}
