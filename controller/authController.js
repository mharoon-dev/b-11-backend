import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { sendError, sendSuccess } from "../utils/responses.js";
import { v4 as uuidv4 } from "uuid";
import {
  ALREADYEXISTS,
  BADREQUEST,
  CREATED,
  FORBIDDEN,
  INTERNALERROR,
  NOTFOUND,
  OK,
  UNAUTHORIZED,
} from "../constants/httpStatus.js";
import nodemailer from "nodemailer";
// import Users from '../models/register.js';
// import { PENDING } from '../constants/constants.js';
import { responseMessages } from "../constants/responseMessages.js";
import Users from "../models/Users.js";
import { GenerateToken, ValidateToken, VerifyToken } from "../helpers/token.js";
import pkg from "jsonwebtoken";
import { sendEmailOTP } from "../helpers/merayFunction.js";

const { verify, decode, sign } = pkg;

// const {
//     GET_SUCCESS_MESSAGES,
//     INVITATION_LINK_UNSUCCESS,
//     MISSING_FIELDS,
//     MISSING_FIELD_EMAIL,
//     NO_USER,
//     NO_USER_FOUND,
//     PASSWORD_AND_CONFIRM_NO_MATCH,
//     PASSWORD_CHANGE,
//     PASSWORD_FAILED,
//     RESET_LINK_SUCCESS,
//     SUCCESS_REGISTRATION,
//     UN_AUTHORIZED,
//     USER_EXISTS,
//     USER_NAME_EXISTS
// } = responseMessages;

// @desc    SIGNUP
// @route   POST api/auth/signup
// @access  Public

export const signUp = async (req, res) => {
  console.log("signup controller");
  console.log(req.body, "===>>> req.body");

  try {
    const { cnic, email } = req.body;

    if (!cnic || !email) {
      return res
        .status(BADREQUEST) // BADREQUEST
        .send(
          sendError({ status: false, message: responseMessages.MISSING_FIELDS })
        );
    }

    const user = await Users.findOne({ email: email });

    console.log(user, "====>> user");
    if (user) {
      return res
        .status(ALREADYEXISTS)
        .send(
          sendError({ status: false, message: responseMessages.USER_EXISTS })
        );
    } else {

        const checkCnic = await Users.findOne({ cnic: cnic });
        if (checkCnic) {
            return res
            .status(ALREADYEXISTS)
            .send(
              sendError({ status: false, message: responseMessages.USER_EXISTS })
            )
        }
      const password = Math.random().toString(36).slice(-8); // Generates a random password of 8 characters
const salt = genSaltSync(10); // Generate a salt of 10 bits
      const doc = new Users({
        cnic,
        email,
        password: hashSync(password, salt),
        isPasswordChanged: false,
      });

      let savedUser = await doc.save();
      if (savedUser.errors) {
        return res
          .status(INTERNALERROR)
          .send(
            sendError({
              status: false,
              message: savedUser.errors.message,
              error: savedUser.errors,
            })
          );
      } else {
        savedUser.password = undefined; // Corrected to lowercase 'password'
        const data = {
          cnic: savedUser.cnic,
          password: password, // Use the generated password
          link: `https://b-11-frontend.vercel.app/login`,
        };

        const emailResponse = await sendEmailOTP(email, data);

        return res.status(CREATED).send(
          sendSuccess({
            status: true,
            message: responseMessages.SUCCESS_REGISTRATION,
            token: null, // Assuming token is not defined in this context
            data: savedUser,
          })
        );
      }
    }
  } catch (error) {
    return res
      .status(INTERNALERROR) // INTERNALERROR
      .send(sendError({ status: false, message: error.message, error }));
  }
};


//change password
export const changePassword = async (req, res) => {
    const {password} = req.body;
    const {id} = req.params;
const isUserExists = await Users.findById(id);
if(!isUserExists){
    return res.status(NOTFOUND).send(
        sendError({
            status: false,
            message: responseMessages.NO_USER_FOUND,
        })
    )
}
    const salt = genSaltSync(10); // Generate a salt of 10 bits
    const hashPassword = hashSync(password, salt);
    const user = await Users.findOneAndUpdate(
        {_id: id},
        {isPasswordChanged: true, password: hashPassword},
        {new: true}
    );
    return res.status(OK).send(
        sendSuccess({
            status: true,
            message: responseMessages.PASSWORD_CHANGE,
            data: user,
        })
    )
}


// @desc    VERIFY EMAIL
// @route   POST api/auth/verifyEmail
// @access  Private

export const verifyEmail = async (req, res) => {
  console.log(req.user, "===>>> req.user");
  try {
    const { otp } = req.body;
    if (otp) {
      const user = await Users.findOne({ otp: otp, _id: req.user._id });
      if (user) {
        console.log(user, "===>> user");
        console.log(user.expiresIn > Date.now());
        if (user.expiresIn > Date.now()) {
          user.isVerified = true;
          user.otp = undefined;
          user.otpExpires = undefined;
          await user.save();
          return res.status(OK).send(
            sendSuccess({
              status: true,
              message: "Email Verified Successfully",
              data: user,
            })
          );
        } else {
          return res.status(OK).send(
            sendError({
              status: false,
              message: "OTP has expired. Please request a new OTP",
            })
          );
        }
      } else {
        return res
          .status(FORBIDDEN)
          .send(sendError({ status: false, message: "Invalid OTP" }));
      }
    } else {
      return res
        .status(BADREQUEST)
        .send(sendError({ status: false, message: MISSING_FIELDS }));
    }
  } catch (error) {
    return res
      .status(INTERNALERROR)
      .send(sendError({ status: false, message: error.message, error }));
  }
};

// @desc    LOGIN
// @route   GET api/auth/login
// @access  Public

export const login = async (req, res) => {
  try {
    const { cnic, password } = req.body;
    if (cnic && password) {
      // return res.send("login controller")

      let user = await Users.findOne({ cnic: cnic });
      console.log(user);
      if (user) {
        const isValid = compareSync(password, user.password);

        if (!isValid) {
          return res
            .status(OK)
            .send(
              sendError({ status: false, message: responseMessages.INVALID_PASS })
            );
        }
          user.password = undefined;
          const token = GenerateToken({ data: user, expiresIn: "24h" });
          res.status(OK).send(
            sendSuccess({
              status: true,
              message: "Login Successful",
              token,
              data: user,
            })
          );
      } else {
        return res
          .status(NOTFOUND)
          .send(
            sendError({ status: false, message: responseMessages.NO_USER })
          );
      }
    } else {
      return (
        res
          .status(500) //BADREQUEST
          // .send(sendError({ status: false, message: MISSING_FIELDS }));
          .send("Missing fields")
      );
    }
  } catch (error) {
    return res
      .status(500) //INTERNALERROR
      .send(error.message);
    // .send(
    //     sendError({
    //         status: false,
    //         message: error.message,
    //         data: null,
    //     })
    // );
  }
};

export const isUserLoggedIn = async (req, res) => {
  try {
    const userData = req.user;
    if (userData) {
      console.log(userData, "====>> userData");
      return res.status(200).json({
        status: true,
        message: "User is logged in",
        data: userData,
      });
    } else {
      console.log("User is not logged in");
    }
  } catch (error) {
    return res
      .status(500) //INTERNALERROR
      .send(error.message);
  }
};

// @desc    forgotPasswordEmail
// @route   GET api/auth/forgotPasswordEmail
// @access  Public

export const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const user = await Users.findOne({
        Email: email,
      });
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY;
        // console.log(user, "===>> user")
        // console.log(user._id, "===>> userId")
        // console.log(process.env.JWT_SECRET_KEY, "===>> secretKey")
        const token = GenerateToken({ data: secret, expiresIn: "30m" });
        // return res.send(token)
        const link = `${process.env.WEB_LINK}/api/auth/resetPassword/${user._id}/${token}`;

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        // const transporter = nodemailer.createTransport({
        //     host: process.env.MAILTRAPHOST,
        //     port: process.env.MAILTRAPPORT,
        //     auth: {
        //         user: process.env.MAILTRAPUSERNAME,
        //         pass: process.env.MAILTRAPPASSWORD,
        //     },
        // });

        const mailOptions = {
          from: "innosufiyan@gmail.com", //email jis se bhejni ho
          to: "innosufiyan@gmail.com", //jisko email bhejni ho
          subject: "Reset Password",
          text: `Please click on the link to reset your password ${link}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            return res
              .status(INTERNALERROR)
              .send(sendError({ status: false, message: error.message }));
          } else {
            console.log("Email sent: " + info.response);
            return res.status(OK).send(
              sendSuccess({
                status: true,
                message: "Reset Password Link Generated",
              })
            );
          }
        });
      } else {
        return res
          .status(NOTFOUND)
          .send(
            sendError({
              status: false,
              message: responseMessages.NO_USER_FOUND,
            })
          );
      }
    } else {
      return res
        .status(BADREQUEST)
        .send(
          sendError({
            status: false,
            message: responseMessages.MISSING_FIELD_EMAIL,
          })
        );
    }
  } catch (error) {
    return res.status(INTERNALERROR).send(
      sendError({
        status: false,
        message: error.message,
        data: null,
      })
    );
  }
};
export const resetPasswordEmail = async (req, res) => {
  console.log("resetPasswordEmail controller");
  try {
    const { newPassword, confirmNewPassword, token } = req.body;
    if (newPassword && confirmNewPassword && token) {
      const { result } = verify(token, process.env.JWT_SECRET_KEY);
      const userId = result.slice(
        0,
        result.length - process.env.JWT_SECRET_KEY.length
      );
      const user = await Users.findById(userId);
      // return res.send(user)
      if (user) {
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(newPassword, salt);
        await Users.findByIdAndUpdate(userId, {
          $set: { Password: hashedPassword },
        });
        return res.status(OK).send(
          sendSuccess({
            status: true,
            message: "Password Updated Successfully",
          })
        );
      } else {
        return res
          .status(NOTFOUND)
          .send(
            sendError({ status: false, message: responseMessages.NO_USER })
          );
      }
    } else {
      return res
        .status(BADREQUEST)
        .send(
          sendError({ status: false, message: responseMessages.MISSING_FIELDS })
        );
    }
  } catch (error) {
    console.log(error, "error");
    return res.status(INTERNALERROR).send(
      sendError({
        status: false,
        message: error.message,
        data: null,
      })
    );
  }
};

// @desc    RefreshToken
// @route   GET api/auth/refreshToken
// @access  Public

// export const refreshToken = async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (token) {
//       // Decode Token
//       const { result } = decode(token);
//       let user = result;
//       if (user) {
//         if (!user.IsActivate) {
//           return res.status(OK).send(
//             sendSuccess({
//               status: true,
//               message:
//                 'User is deactivated, sign up again from a different email address',
//               data: user,
//             })
//           );
//         }
//         // generate new token
//         const newToken = GenerateToken({ data: user, expiresIn: '1m' });
//         res.status(OK).send(
//           sendSuccess({
//             status: true,
//             message: 'Refresh Token Generated',
//             token: newToken,
//           })
//         );
//       } else {
//         return res
//           .status(NOTFOUND)
//           .send(sendError({ status: false, message: NO_USER }));
//       }
//     } else {
//       return res
//         .status(BADREQUEST)
//         .send(sendError({ status: false, message: MISSING_FIELDS }));
//     }
//   } catch (error) {
//     return res.status(401).send({
//       status: 'failed',
//       message: 'Unauthorized User, Not A Valid Token',
//     });
//   }
// };

// @desc    CHANGEPASSWORD
// @route   PUT api/auth/changePassword
// @access  Private

// export const changePassword = async (req, res) => {
//   const userDetails = req.user;
//   try {
//     const user = await Users.findOne({
//       'Authentication.Email': userDetails.Authentication.Email,
//     });
//     const { password, confirmPassword } = req.body;
//     if (password && confirmPassword) {
//       if (password !== confirmPassword) {
//         return res
//           .status(BADREQUEST)
//           .send(
//             sendError({ status: false, message: PASSWORD_AND_CONFIRM_NO_MATCH })
//           );
//       } else {
//         const salt = genSaltSync(10);
//         const newPassword = hashSync(password, salt);
//         const isValid = compareSync(password, user.Authentication.Password);
//         if (isValid) {
//           return res.status(OK).send(
//             sendSuccess({
//               status: false,
//               message: PASSWORD_FAILED,
//               data: null,
//             })
//           );
//         }
//         await Users.findByIdAndUpdate(req.user._id, {
//           $set: { 'Authentication.Password': newPassword },
//         });
//         return res
//           .status(OK)
//           .send(
//             sendSuccess({ status: true, message: PASSWORD_CHANGE, data: null })
//           );
//       }
//     } else {
//       return res
//         .status(BADREQUEST)
//         .send(sendError({ status: false, message: MISSING_FIELDS }));
//     }
//   } catch (error) {
//     return res.status(INTERNALERROR).send(
//       sendError({
//         status: false,
//         message: error.message,
//         data: null,
//       })
//     );
//   }
// };

// @desc    Get Logged In User details
// @route   GET api/auth/userInfo
// @access  Private

// export const loggedInUser = async (req, res) => {
//   try {
//     return res.status(OK).send(
//       sendSuccess({
//         status: true,
//         message: GET_SUCCESS_MESSAGES,
//         data: req.user,
//       })
//     );
//   } catch (error) {
//     return res.status(INTERNALERROR).send(
//       sendError({
//         status: false,
//         message: error.message,
//         data: null,
//       })
//     );
//   }
// };

// @desc    Send Reset Password Email
// @route   POST api/auth/resetPasswordRequest
// @access  Public

// export const sendReset = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (email) {
//       const user = await Users.findOne({ 'Authentication.Email': email });
//       if (user) {
//         const secret = user._id + process.env.JWT_SECRET_KEY;
//         const token = GenerateToken({ data: secret, expiresIn: '30m' });
//         const link = `${process.env.WEB_LINK}/api/auth/resetPassword/${user._id}/${token}`;
//         return res.status(OK).send(
//           sendSuccess({
//             status: true,
//             message: RESET_LINK_SUCCESS,
//             data: link,
//           })
//         );
//       } else {
//         return res
//           .status(NOTFOUND)
//           .send(sendError({ status: false, message: NO_USER_FOUND }));
//       }
//     } else {
//       return res
//         .status(BADREQUEST)
//         .send(sendError({ status: false, message: MISSING_FIELD_EMAIL }));
//     }
//   } catch (error) {
//     return res.status(INTERNALERROR).send(
//       sendError({
//         status: false,
//         message: error.message,
//         data: null,
//       })
//     );
//   }
// };

// @desc    Send Reset Password Email
// @route   POST api/auth/resetPasswordRequest
// @access  Public

// export const resetPassword = async (req, res) => {
//     try {
//         const { password, confirmPassword } = req.body;
//         const { id, token } = req.params;
//         const user = await Users.findById(id);
//         if (user) {
//             const secret = user._id + process.env.JWT_SECRET_KEY;

//             ValidateToken({ token: token, key: secret });
//             res.send(isVerifed);
//         } else {
//             return res
//                 .status(NOTFOUND)
//                 .send(sendError({ status: false, message: NO_USER_FOUND }));
//         }

//         // if (email) {
//         //   const user = await Users.findOne({ "Authentication.Email": email });
//         //   if(user){
//         //     const secret = user._id + process.env.JWT_SECRET_KEY
//         //     const token = GenerateToken({ data: secret , expiresIn :"30m" });
//         //     const link = `${process.env.WEB_LINK}/api/auth/resetPassword/${user._id}/${token}`
//         //     console.log(link);
//         //     return res.status(OK).send(sendSuccess({status : true , message : RESET_LINK_SUCCESS , data : link}))

//         //   } else {
//         //     return res.status(NOTFOUND).send(sendError({status : false , message : NO_USER_FOUND}))
//         //   }
//         // } else {
//         //   return res
//         //     .status(BADREQUEST)
//         //     .send(sendError({ status: false, message: MISSING_FIELD_EMAIL }));
//         // }
//     } catch (error) {
//         return res.status(INTERNALERROR).send(
//             sendError({
//                 status: false,
//                 message: error.message,
//                 data: null,
//             })
//         );
//     }
// };

// @desc    Logout User
// @route   POST api/auth/logout
// @access  Public

// export const logout = async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (token) {
//     } else {
//       return res
//         .status(BADREQUEST)
//         .send(sendError({ status: false, message: MISSING_FIELDS }));
//     }
//   } catch (error) {
//     return res.status(INTERNALERROR).send(
//       sendError({
//         status: false,
//         message: error.message,
//         data: null,
//       })
//     );
//   }
// };

// @desc    Save DeviceId
// @route   POST api/auth/saveDeviceId
// @access  Public

// export const addDeviceId = async (req, res) => {
//   try {
//     console.log(req.body);
//     const { deviceId } = req.body;
//     const id = req.user._id;
//     if (deviceId) {
//       let user = await Users.findOne({ _id: id });
//       if (user) {
//         // update user with this deveiceId
//         user = await Users.findByIdAndUpdate(id, {
//           $set: { 'Authentication.DeviceId': deviceId },
//         });
//         res.status(OK).send(
//           sendSuccess({
//             status: true,
//             message: 'DeviceId Saved Successfully',
//           })
//         );
//       } else {
//         return res
//           .status(OK)
//           .send(sendError({ status: false, message: NO_USER }));
//       }
//     } else {
//       return res
//         .status(BADREQUEST)
//         .send(sendError({ status: false, message: MISSING_FIELDS }));
//     }
//   } catch (error) {
//     return res.status(INTERNALERROR).send(
//       sendError({
//         status: false,
//         message: error.message,
//         data: null,
//       })
//     );
//   }
// };
