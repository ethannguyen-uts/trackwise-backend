import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(
  email: string,
  subject: string = "Hello",
  body: string = ``
) {
  const mailOptions = {
    from: "OnTrack <ethannguyen.uts@outlook.com>", // sender addressZ
    to: email, // list of receivers
    subject: subject, // Subject line
    text: body, // plain text body
    html: body, // html body
  };

  await sgMail.send(mailOptions);
}
