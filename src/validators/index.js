import { body } from "express-validator";

const userRegisterValidator = () => {
  return [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("email").isEmail().normalizeEmail().withMessage("Email is not valid"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .isString()
      .withMessage("Password must be at least 8 characters long"),
  ];
};

export { userRegisterValidator };
