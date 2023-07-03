"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");
const fs = require("fs");
require("dotenv").config();
const encodeMessage = (message) => {
    return Buffer.from(message).toString("base64");
};
const createMail = async (options) => {
    const mailComposer = new MailComposer(options);
    const message = await mailComposer.compile().build();
    return encodeMessage(message);
};
const sendMail = async (email, jwtToken) => {
    try {
        const googleClient = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL);
        googleClient.setCredentials(JSON.parse(fs.readFileSync(process.env.TOKEN_FILE_PATH, "utf8")));
        const gmail = googleapis_1.google.gmail({ version: "v1", auth: googleClient });
        const htmlText = `
    <p>Hello,</p>
    <p>You have been added as user to the Fontaine Dealer Portal. Please use the following link to create your login.</p>
    <p><a style="color: #CB0232;" href="https://dealerportal.webflow.io/user-signup/?code=${jwtToken}">Create Your Login</a></p>
    <br />
    <br />
    <img src="https://assets.website-files.com/6436e391fe5f1a46d86470fe/64493b2054714720141a7673_ft-logomark.png" alt="logo" />
    `;
        const options = {
            to: email,
            subject: `Create Your Login`,
            text: htmlText,
            html: htmlText,
            textEncoding: "base64",
        };
        const message = await createMail(options);
        await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: message,
            },
        });
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = sendMail;
