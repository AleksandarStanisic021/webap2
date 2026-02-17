import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { sendEmail } from "../utils/mail.js";
import { mailVerification } from "../utils/mail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const aToken = user.generateAccessToken();
    const rToken = user.generateRefreshToken();
    user.refreshToken = rToken;
    await user.save({ validateBeforeSave: false });
    return { aToken, rToken };
  } catch (error) {
    throw new ApiError(404, "Error with data");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (!existedUser) {
    throw new ApiError(404, "there is existed User with that email,username");
  }
  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });
  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiery = tokenExpiry;

  await user.save({ validateBeforeSave: false });
  /*
  await sendEmail({
    email: user?.email,
    subject: "Verify email pls",
    mailgenContent: mailVerification(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
    ),
  });*/
  const createdUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -refreshToken -emailVerificationExpiry",
  );
  if (!createdUser) {
    throw new ApiError(504, "Eroor creating User");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, { user: createdUser }, "User created!"));
});

export { registerUser };
