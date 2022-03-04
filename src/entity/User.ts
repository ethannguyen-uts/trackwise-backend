import { Field, ObjectType, ID, Root } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@ObjectType()
//make this to become a type in Graphql
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  //Which field we want user to query
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  //name: string;
  name(@Root() parent: User): string {
    return `${parent.firstName} ${parent.lastName}`;
  }

  @Field()
  @Column("text", { unique: true })
  email: string;

  @Column()
  password: string;

  @Column("bool", { default: false })
  confirmed: string;
}
