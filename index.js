import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

console.log("yo " + process.env.database + " !");
