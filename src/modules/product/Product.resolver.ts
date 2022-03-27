import { Product } from "../../entity/Product";
import { MyContext } from "../../types/MyContext";
import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  UseMiddleware,
  Query,
  ID,
  Float,
} from "type-graphql";
import { isAuth } from "../../middleware/isAuth";
import { scrapeProduct } from "../../utils/scrapeProduct";
import { DROPPED, SCRAPPED, UPDATED } from "../../types/ProductStatus";
import { getConnection } from "typeorm";
import { scrapeAllProduct as scrapeFunc } from "../../utils/scrapeAllProduct";
import { sendPriceDroppedAnnounceEmail } from "../utils/sendPriceDroppedAnnounceEmail";
import { User } from "../../entity/User";

@Resolver()
export class ProductResolver {
  @Query(() => [Product])
  @UseMiddleware(isAuth)
  async products(@Ctx() ctx: MyContext): Promise<Product[]> {
    const { userId } = ctx.req.session;
    const products = await Product.find({
      where: { userId },
      order: { updated_at: "DESC" },
    });
    return products;
  }

  @Query(() => Product)
  @UseMiddleware(isAuth)
  async product(@Arg("id", () => ID) id: number, @Ctx() ctx: MyContext) {
    const { userId } = ctx.req.session;
    const product = await Product.findOne({ where: { id, userId } });
    return product;
  }

  @Query(() => String)
  async scrapeAllProduct() {
    await scrapeFunc();
    return "1";
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth)
  async addProduct(
    @Arg("url", () => String) url: string,
    @Ctx() ctx: MyContext
  ) {
    const { userId } = ctx.req.session;
    try {
      const isExist = await Product.findOne({ where: { url } });
      if (isExist) throw new Error("Product has already been screapped");
      const { name, imageUrl, price: scrapePrice } = await scrapeProduct(url);
      const product = await Product.create({
        name,
        userId,
        url,
        imageUrl,
        scrapePrice,
        currentPrice: scrapePrice,
        targetPrice: scrapePrice,
        status: SCRAPPED,
      }).save();
      return product;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth)
  async updateProductTargetPrice(
    @Arg("id", () => ID) id: number,
    @Arg("targetPrice", () => Float) targetPrice: number,
    @Ctx() ctx: MyContext
  ) {
    const { userId } = ctx.req.session;
    try {
      const product = await Product.findOne(id);
      if (!product) throw new Error("Product does not exist");
      const url = product?.url;
      product.status = UPDATED;
      if (product.targetPrice !== targetPrice) {
        product.targetPrice = targetPrice;
      }
      //Scrape the page again
      const { price: scrapePrice } = await scrapeProduct(url);
      //Update the current price
      product.currentPrice = scrapePrice;
      //Price dropped
      if (product.targetPrice >= scrapePrice && product.status === UPDATED) {
        product.status = DROPPED;
      }
      if (product.status == DROPPED) {
        //send email for the user //implement
        const user: User = await User.findOne(userId);
        await sendPriceDroppedAnnounceEmail(
          user.email,
          product.name,
          product.currentPrice,
          product.url
        );
      }
      //update the product in database
      await product.save();
      return product;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteProduct(@Arg("id", () => ID) id: number, @Ctx() ctx: MyContext) {
    const { userId } = ctx.req.session;
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Product)
        .where("id = :id", { id })
        .andWhere('"userId" = :userId', { userId })
        .execute();
      return true;
    } catch (err: any) {
      throw new Error("Can not delete product");
    }
  }
}
