import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";
import { emailVerificationMailgenContent } from "../utils/mail.js";

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

  await sendEmail({
    email: user?.email,
    subject: "Verify email pls",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
    ),
  });
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "there is no User with that email");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "password is not correct");
  }
  const { aToken, rToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -refreshToken -emailVerificationExpiry",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", aToken, options)
    .cookie("refreshToken", rToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: aToken,
          refreshToken: rToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req?.user },
        "Current user fetched successfully",
      ),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(404, "Invalid or expired verification token");
  }
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiery: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(404, "Invalid or expired verification token");
  } else {
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiery = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email verified successfully"));
  }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }
  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiery = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Verify email pls",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Verification email resent successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new ApiError(404, "Refresh token not found");
  }
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new ApiError(404, "Invalid refresh token");
  }
  const newAccessToken = user.generateAccessToken();
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        "Access token refreshed successfully",
      ),
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "there is no User with that email");
  }
  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiery = tokenExpiry;
  await user.save({ validateBeforeSave: false });
  // send email to user with the unhashed token and a link to reset password
  await sendEmail({
    email: user?.email,
    subject: "Reset your password",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${unhashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset email sent successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  if (!resetToken) {
    throw new ApiError(404, "Invalid or expired reset token");
  }
  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiery: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(404, "Invalid or expired reset token");
  }
  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiery = undefined;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  const user = await User.find.findById(userId).select("+password");
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(404, "Current password is not correct");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
};
