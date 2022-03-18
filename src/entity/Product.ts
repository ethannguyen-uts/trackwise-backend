import { ProductStatus } from "../types/ProductStatus";
import { Field, ObjectType, ID, Float } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@ObjectType()
//make this to become a type in Graphql
@Entity()
export class Product extends BaseEntity {
  @Field(() => ID)
  //Which field we want user to query
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column()
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.products)
  user: User;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  url: string;

  @Field()
  @Column()
  imageUrl: string;

  @Field(() => Float)
  @Column({ type: "float" })
  scrapePrice: number;

  @Field(() => Float)
  @Column({ type: "float" })
  currentPrice: number;

  @Field(() => Float)
  @Column({ type: "float" })
  targetPrice: number;

  @Field()
  @Column()
  status: string;

  @Field()
  @Column({ default: "WOOLWORTHS" })
  retailer: string;

  @Field()
  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  created_at: Date;

  @Field()
  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  updated_at: Date;
}
