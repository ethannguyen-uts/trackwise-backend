import { IsEmail, Length } from "class-validator";
import { InputType, Field } from "type-graphql";
import { isEmailExist } from "./IsEmailExist";

@InputType()
export class RegisterInput {
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

  @Field()
  password: string;
}
