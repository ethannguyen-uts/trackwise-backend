import { Field, ObjectType } from "type-graphql";
import { User } from "../../../entity/User";

@ObjectType()
export class FieldError {
  @Field({ nullable: true })
  error?: string;
}

@ObjectType()
//export class RegisterInput extends ClassMixin(PasswordInput) {
export class RegisterResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: [FieldError];

  @Field(() => User, { nullable: true })
  user?: User;
}
