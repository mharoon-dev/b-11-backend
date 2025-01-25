import express from "express";
import {
  forgotPasswordEmail,
  login,
  resetPasswordEmail,
  signUp,
  isUserLoggedIn,
  verifyEmail,
  changePassword
} from "../controller/authController.js";
import { VerifyToken, validateToken } from "../helpers/token.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/changepassword/:id", changePassword);
authRoutes.post("/login", login);
authRoutes.post("/verifyEmail", validateToken, verifyEmail);
authRoutes.get("/isuserloggedin", validateToken, isUserLoggedIn);
authRoutes.post("/forgotPassword", forgotPasswordEmail);
authRoutes.put("/resetPassword", resetPasswordEmail);
