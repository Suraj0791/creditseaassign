import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'LoanApplication',
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
