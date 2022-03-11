import { Field, ObjectType } from "type-graphql";
import { User } from "../../entity/User";
import { FieldError } from "./FieldError";

@ObjectType()
//export class RegisterInput extends ClassMixin(PasswordInput) {
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: [FieldError];

  @Field(() => User, { nullable: true })
  user?: User;
}
