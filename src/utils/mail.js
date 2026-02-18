import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Test App",
      link: "https://testmanager.com",
    },
  });
  console.log(process.env.MAIL_TRAP_SMTP_USER);
  console.log(process.env.MAIL_TRAP_SMTP_HOST);
  console.log(process.env.MAIL_TRAP_SMTP_USER);

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_TRAP_SMTP_HOST,
    port: process.env.MAIL_TRAP_SMTP_PORT,
    auth: {
      user: process.env.MAIL_TRAP_SMTP_USER,
      pass: process.env.MAIL_TRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "taks@examples.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log("error in sending mail", error);
  }
}; /////

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to App",
      action: {
        instructions: "To verify mail click on Button",
        button: {
          color: "#1f1f1f",
          text: "verify email",
          link: verificationUrl,
        },
      },
      outro: "If you need help search docs",
    },
  };
};

const forgotPasswordMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Request to reset password",
      action: {
        instructions: "To reset password click on Button",
        button: {
          color: "#1f1f1f",
          text: "Reset password",
          link: verificationUrl,
        },
      },
      outro: "If you need help search docs",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
