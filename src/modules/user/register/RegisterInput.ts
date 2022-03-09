import { IsEmail, Length } from "class-validator";
import { PasswordInput } from "../../shared/PasswordInput";
import { InputType, Field } from "type-graphql";
import { isEmailExist, isUsernameExist } from "./ValidateRegisterInput";

@InputType()
//export class RegisterInput extends ClassMixin(PasswordInput) {
export class RegisterInput extends PasswordInput {
  @Field()
  @Length(1, 255, { message: "length must be between 1 and 255" })
  firstName: string;

  @Field()
  @Length(1, 255)
  lastName: string;

  @Field()
  @isUsernameExist({ message: "Username is already exist!" })
  @Length(3, 255)
  username: string;

  @Field()
  @IsEmail()
  @isEmailExist({ message: "Email is already exist!" })
  email: string;
}
