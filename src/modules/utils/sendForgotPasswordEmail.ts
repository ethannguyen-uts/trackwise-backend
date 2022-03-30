import { sendEmail } from "./sendEmail";

export const sendForgotPasswordEmail = async (
  userEmail: string,
  token: string
): Promise<void> => {
  try {
    const url = `${process.env.CORS_ORIGIN}/change-password/${token}`;
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
