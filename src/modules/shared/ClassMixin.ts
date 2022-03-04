import { ClassType, Field, InputType } from "type-graphql";

export const ClassMixin = <T extends ClassType>(BaseClass: T) => {
  @InputType()
  class MixInput extends BaseClass {
    @Field()
    newField: string;
  }
  return MixInput;
};
