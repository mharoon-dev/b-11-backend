import mongoose from 'mongoose';
// import validator from 'validator';

const register = mongoose.Schema(
    {
        cnic: {
            type: String,
            required: [true, 'Please Add CNIC'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please Add Email'],
            unique: true,
            trim: true,
            lowercase: true,
            // validate: [validator.isEmail, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please Add Password'],
            minlength: 8,
            trim: true,
        },
        isPasswordChanged: {
            type: Boolean,
            default: false
        },
        loanReqs: {
            type: Array,
            default: []
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Users', register);
