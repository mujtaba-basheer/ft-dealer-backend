import { google } from "googleapis";
import MailComposer = require("nodemailer/lib/mail-composer");
import * as fs from "fs";

require("dotenv").config();

const encodeMessage = (message: string) => {
  return Buffer.from(message).toString("base64");
};

const createMail = async (options: any) => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message);
};

const sendMail = async (email: string, jwtToken: string) => {
  try {
    const googleClient = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL
    );
    googleClient.setCredentials(
      JSON.parse(fs.readFileSync(process.env.TOKEN_FILE_PATH, "utf8"))
    );

    const gmail = google.gmail({ version: "v1", auth: googleClient });

    const options = {
      to: email,
      subject: `Create Your Login`,
      text: `<a href="https://dealerportal.webflow.io/user-signup/?code=${jwtToken}">Click on this link</a>`,
      html: `<a href="https://dealerportal.webflow.io/user-signup/?code=${jwtToken}">Click on this link</a>`,
      textEncoding: "base64",
    };

    const message = await createMail(options);
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: message,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export default sendMail;
