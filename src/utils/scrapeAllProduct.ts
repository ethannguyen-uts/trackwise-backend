import { DROPPED, UPDATED } from "../types/ProductStatus";
import { Product } from "../entity/Product";
import { scrapeProduct } from "./scrapeProduct";
import { ScrappedData } from "../types/ScrappedData";
import { sendPriceDroppedAnnounceEmail } from "../modules/utils/sendPriceDroppedAnnounceEmail";
import { User } from "../entity/User";

export const scrapeAllProduct = async () => {
  try {
    const listProducts = await Product.find({ where: { status: UPDATED } });
    const dictionary: Record<string, ScrappedData> = {};
    //scrape all the data concurency
    await Promise.allSettled(
      listProducts.map(async (product) => {
        const scrappedData = await scrapeProduct(product.url);
        dictionary[product.id] = scrappedData;
      })
    );

    for (let productId in dictionary) {
      const productData = dictionary[productId];
      const product = await Product.findOne(parseInt(productId));
      if (product) {
        product.currentPrice = productData.price;
        product.status = UPDATED;
        if (
          product.targetPrice >= productData.price &&
          product.status == UPDATED
        ) {
          product.status = DROPPED;
        }
        if (product.status == DROPPED) {
          const user = await User.findOne(product.userId);
          if (!user) throw new Error("User does not exist!");
          await sendPriceDroppedAnnounceEmail(
            user.email,
            product.name,
            product.currentPrice,
            product.url
          );
        }
        //save data to the database
        await product.save();
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
