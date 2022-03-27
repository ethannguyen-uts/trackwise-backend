import { sendEmail } from "./sendEmail";
import { v4 } from "uuid";
import { redisClient } from "../../redis";
import { forgotPasswordPrefix } from "../../constants/redisPrefixes";

export const sendForgotPasswordEmail = async (
  userEmail: string,
  userId: number
): Promise<void> => {
  try {
    const token = v4();
    await redisClient.set(
      forgotPasswordPrefix + token,
      userId,
      "ex",
      60 * 60 * 24 //1 day
    );

    const { FRONTEND_HOST, FRONTEND_PORT } = process.env;
    const url = `${FRONTEND_HOST}:${FRONTEND_PORT}/change-password/${token}`;
    const subject = "Password Reset";
    const body = `
    <div>
    <h1>Forgot your password?</h1> 
    <span>Nevermind. Please use the following link to reset your password:</span>
    <p><a href=${url}>${url}</a></p></span>

    Cheers,<br>
    The Track Wise support team
    </div>
    `;

    await sendEmail(userEmail, subject, body);
  } catch (error) {
    throw error;
  }
};
