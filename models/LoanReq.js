import mongoose from 'mongoose';

const loanReqSchema = mongoose.Schema(
    {
        loanAmount: {
            type: String,
            required: [true, 'Please Add Loan Amount'],
        },
        period: {   
            type: String,
            required: [true, 'Please Add Period'],
        },
        depositeAmount: {
            type: String,
            required: [true, 'Please Add Deposit Amount'],
        },
        category: {
            type: String,
            required: [true, 'Please Add Category'],
        },
        subCategory: {
            type: String,
            required: [true, 'Please Add Subcategory'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Please Add User ID'],
            ref: 'Users'
        },
        status: {
            type: String,
            default: 'Pending',
        },
        witners: {
            type: Array,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('LoanReq', loanReqSchema);
