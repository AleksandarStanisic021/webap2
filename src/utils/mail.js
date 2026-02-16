import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Taskacraft",
      link: "https://taskcraft.com",
    },
  });
  const emailText = mailGenerator.generatePlainText(options.mailGenContent);
  const emailHtml = mailGenerator.generate(options.mailGenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_TRAP_SMTP_HOST,
    port: process.env.MAIL_TRAP_SMTP_PORT,
    auth: {
      user: process.env.MAIL_TRAP_SMTP_USER,
      pass: process.env.MAIL_TRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@sasa.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log("error sending mail");
  }
};

const mailVerification = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Us!",
      action: {
        instructions: "Verify email, click on button",
        button: {
          color: "#22bc66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro: "Need Help?",
    },
  };
};

const forgotPassword = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "Request to reset password",
      action: {
        instructions: "Click on button to reset password",
        button: {
          color: "#eb0f17",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro: "Need Help?",
    },
  };
};

export { mailVerification, forgotPassword, sendEmail };
