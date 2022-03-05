import { IsEmail, Length } from "class-validator";
import { PasswordInput } from "../../shared/PasswordInput";
import { InputType, Field } from "type-graphql";
import { isEmailExist } from "./IsEmailExist";
//import { ClassMixin } from "../../shared/ClassMixin";

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
  @IsEmail()
  @isEmailExist({ message: "Email is already exist!" })
  email: string;
}
