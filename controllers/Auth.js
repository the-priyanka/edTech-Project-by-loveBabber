const User = require("../models/User");
const OTP = require("..models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require();
require("dotenv").config();

// sendOTP
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from request body
    const { email } = req.body;

    // check if user already exist
    const checkUserPresent = await User.findOne({ email });

    // if user already exists, then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered!",
      });
    }

    //  generate otp
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("Opt generated", otp);

    // check unique otp or not
    const result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };

    // create an entry for OTP
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// signup
exports.signup = async (req, res) => {
  try {
    // data fetch from request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // validate
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required!",
      });
    }

    // matched password and confirm password
    if (password !== confirmPassword) {
      res.status("400").json({
        success: false,
        message:
          "Password and confirmPassword value does not match, please try again",
      });
    }

    // check user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User is already registered!",
      });
    }

    // find most recent OTP stored for the user
    const recentOTP = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    // validate OTP
    if (recentOTP.length === 0) {
      // Otp not found
      return res.status(400).json({
        success: false,
        message: "OTP is not found",
      });
    } else if (otp !== recentOTP.otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // entry create in database
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // return res
    return res.status(200).json({
      success: true,
      message: "User is registered successfully!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again!",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    // get data from req body
    const { email, password } = req.body;

    // validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required, please try again",
      });
    }

    // user check exist or not
    const user = await User.findOne({ email }).populate(
      "additionalDetails"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered, Please signup first!",
      });
    }

    // generate JWT, after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      // create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, Please try again.",
    });
  }
};

// changePassword
exports.changePassword = async (req, res) => {
  // get data from req body
  // get oldPassword, newPassword, confirmNewPassword
  // validation
  // update pwd in DB
  // send mail - Password updated
  // return response
};
