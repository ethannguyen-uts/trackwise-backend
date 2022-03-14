import { Post } from "../../entity/Post";
import {
  Arg,
  Query,
  Resolver,
  Int,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { MinLength } from "class-validator";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
  @Field()
  @MinLength(5)
  title: string;

  @Field()
  @MinLength(10)
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const additionalLimit = realLimit + 1;
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"created_at"', "DESC")
      .take(additionalLimit);
    if (cursor)
      queryBuilder.where("created_at < :cursor", {
        cursor: new Date(cursor),
      });
    const posts = await queryBuilder.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === additionalLimit,
    };
  }

  @Query(() => Post)
  async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    const post = await Post.findOne({ id });
    if (post) return post;
    return null;
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() ctx: MyContext
  ): Promise<Post> {
    const newPost = await Post.create({
      ...input,
      creatorId: ctx.req.session.userId,
    }).save();
    if (!newPost) throw new Error("Can not create a new user");
    return newPost;
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ id });
    if (!post) return null;
    await Post.update({ id }, { title });
    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
