import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class FieldError {
  @Field({ nullable: false })
  field!: string;

  @Field({ nullable: false })
  error!: string;
}
