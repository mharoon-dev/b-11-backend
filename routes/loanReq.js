import express from "express";
import {
    createLoanRequest,
    // getLoanRequests,
    updateLoanRequest,
    // deleteLoanRequest,
    // getLoanRequestById
} from "../controller/loanReqController.js"; // Assuming you have a controller for loan requests
import { updateStatus } from "../controller/loanReqController.js";

export const loanReqRoutes = express.Router();

loanReqRoutes.post("/add", createLoanRequest); // Route to create a new loan request
loanReqRoutes.post("/update/:id", updateLoanRequest); // Route to create a new loan request
loanReqRoutes.post("/updatestatus/:id", updateStatus); // Route to create a new loan request
// loanReqRoutes.get("/", getLoanRequests); // Route to get all loan requests
// loanReqRoutes.get("/:id", getLoanRequestById); // Route to get a loan request by ID
// loanReqRoutes.put("/:id", updateLoanRequest); // Route to update a loan request by ID
// loanReqRoutes.delete("/:id", deleteLoanRequest); // Route to delete a loan request by ID
