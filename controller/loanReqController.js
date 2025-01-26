import LoanReq from '../models/LoanReq.js';
import { responseMessages } from '../constants/responseMessages.js';
import Users from '../models/Users.js';

export const createLoanRequest = async (req, res) => {
    const { loanAmount, period, depositeAmount, category, subCategory, userId } = req.body;

    // Validate required fields
    if (!loanAmount || !period || !depositeAmount || !category || !subCategory || !userId) {
        return res.status(400).json({ status: 'error', message: responseMessages.MISSING_FIELDS });
    }

    try {
        const newLoanReq = new LoanReq({
            loanAmount,
            period,
            depositeAmount,
            category,
            subCategory,
            userId,
            status: 'pending',
        });

        const savedLoanReq = await newLoanReq.save();

        // UPDATE THE USER LOANREQ ARRAY
        const user = await Users.findByIdAndUpdate(userId, {
            $push: { loanReqs: savedLoanReq._id },
        })
        res.status(201).json({ status: 'success', message: responseMessages.ADD_SUCCESS_MESSAGES, data: savedLoanReq });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: responseMessages.ERROR_MESSAGES });
    }
};


export const updateLoanRequest = async (req, res) => {
    const { id } = req.params;
    const { witners } = req.body; // Expecting witners to be sent in the request body

    // Validate required fields
    if (!witners) {
        return res.status(400).json({ status: 'error', message: responseMessages.MISSING_FIELDS });
    }

    try {
        const updatedLoanReq = await LoanReq.findByIdAndUpdate(
            id,
            { witners },
            { new: true, runValidators: true } // Return the updated document and run validators
        );

        if (!updatedLoanReq) {
            return res.status(404).json({ status: 'error', message: 'Loan request not found' });
        }

        res.status(200).json({ status: 'success', message: responseMessages.UPDATE_SUCCESS_MESSAGES, data: updatedLoanReq });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: responseMessages.ERROR_MESSAGES });
    }
};

export const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate required fields
    if (!status) {
        return res.status(400).json({ status: 'error', message: responseMessages.MISSING_FIELDS });
    }

    try {
        const updatedLoanReq = await LoanReq.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true } // Return the updated document and run validators
        );

        if (!updatedLoanReq) {
            return res.status(404).json({ status: 'error', message: 'Loan request not found' });
        }

        res.status(200).json({ status: 'success', message: responseMessages.UPDATE_SUCCESS_MESSAGES, data: updatedLoanReq });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: responseMessages.ERROR_MESSAGES });
    }
};

export const getLoanRequests = async (req, res) => {
    const { id } = req.query; // Check for query parameter 'id'

    try {
        let loanRequests;
        if (id) {
            // If 'id' is provided, find the loan request by user ID
            loanRequests = await LoanReq.find({ userId: id });
            if (loanRequests.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No loan requests found for this user' });
            }
        } else {
            // If no 'id' is provided, fetch all loan requests
            loanRequests = await LoanReq.find();
        }

        res.status(200).json({ status: 'success', data: loanRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: responseMessages.ERROR_MESSAGES });
    }
};

