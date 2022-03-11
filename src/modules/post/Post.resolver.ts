import { Post } from "../../entity/Post";
import { Arg, Query, Resolver, Int, Mutation } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    const posts = await Post.find({});
    return posts;
  }

  @Query(() => Post)
  async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    const post = await Post.findOne({ id });
    if (post) return post;

    return null;
  }

  @Mutation(() => Post)
  async createPost(@Arg("title", () => String) title: string): Promise<Post> {
    const newPost = await Post.create({ title }).save();
    if (!newPost) throw new Error("Can not create a new user");
    return newPost;
  }
}
