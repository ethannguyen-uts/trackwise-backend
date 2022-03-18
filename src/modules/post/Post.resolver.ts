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
  ID,
} from "type-graphql";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { MinLength } from "class-validator";
import { getConnection } from "typeorm";
import { Updoot } from "../../entity/Updoot";

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

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() root: Post, @Ctx() ctx: MyContext) {
    const { userId } = ctx.req.session;
    const updootItem = await Updoot.findOne({
      where: { userId, postId: root.id },
    });
    if (!updootItem) return null;
    else return updootItem.value;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => ID) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() ctx: MyContext
  ) {
    const { userId } = ctx.req.session;
    const isUpvote = value !== -1;
    const point = isUpvote ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    //has voted and want to change their vote
    if (updoot && updoot.value !== point) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        update updoot 
        set value = $1
        where "postId" = $2 and "userId" = $3
        `,
          [point, postId, userId]
        );

        await tm.query(
          `
        update post 
        set points = points + $1
        where id = $2
        `,
          [point * 2, postId]
        );
      });
    } else if (!updoot) {
      //has bever voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(`
        insert into updoot ("userId", "postId", "value") values(${userId}, ${postId}, ${point});
        `);
        await tm.query(`
        update post p
        set points = p.points + ${point}
        where p.id = ${postId};
        `);
      });
    }

    /*
    await getConnection().query(
      `
    START TRANSACTION;
    
    insert into updoot ("userId", "postId", "value") values(${userId}, ${postId}, ${point});
    
    update post p
    set points = p.points + ${point}
    where p.id = ${postId};
    
    COMMIT;
    `
    );
  */

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const additionalLimit = realLimit + 1;

    const query = `SELECT p.*,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'created_at', u.created_at,
      'updated_at', u.updated_at
    ) creator
    FROM post p
    INNER JOIN "user" u on u.id = p."creatorId"
    ${cursor ? "WHERE p.created_at < ($2)" : ""}
    ORDER BY p.created_at DESC
    LIMIT $1`;
    const queryParameters: any[] = [additionalLimit];
    if (cursor) {
      queryParameters.push(new Date(cursor));
    }
    const posts: [any] = await getConnection().query(query, queryParameters);
    posts.map((item) => {
      item.creator.created_at = new Date(item.creator.created_at);
      item.creator.updated_at = new Date(item.creator.updated_at);
    });

    console.log(posts);
    /*
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.creator", "u", 'u.id="p.creatorId"')
      .orderBy('p."created_at"', "DESC")
      .take(additionalLimit);
    if (cursor)
      queryBuilder.where("p.created_at < :cursor", {
        cursor: new Date(cursor),
      });
    const posts = await queryBuilder.getMany();

      */

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
