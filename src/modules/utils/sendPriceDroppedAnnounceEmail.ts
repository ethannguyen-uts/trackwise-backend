import { sendEmail } from "./sendEmail";

export const sendPriceDroppedAnnounceEmail = async (
  userEmail: string,
  productName: string,
  productPrice: number,
  productUrl: string
): Promise<void> => {
  try {
    const subject = `Price dropped on product: ${productName}.`;
    const body = `
          <div>
          <h1>We have good news for you!</h1> 
          <span>Price dropped on product: ${productName}. The current price is AUD ${productPrice}.</span>
          <p>Please follow the link to purchase your product: <a href=${productUrl}>${productUrl}</a></p></span>
    
          Cheers,<br>
          The On Track support team.
          </div>
        `;
    await sendEmail(userEmail, subject, body);
  } catch (error) {
    throw error;
  }
};
