import mongoose, { Document, Schema } from 'mongoose';

export enum LoanStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  SANCTIONED = 'sanctioned',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  CLOSED = 'closed',
}

export enum EmploymentMode {
  SALARIED = 'salaried',
  SELF_EMPLOYED = 'self_employed',
  UNEMPLOYED = 'unemployed',
}

export interface ILoanApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  loanAmount?: number;
  tenure?: number;
  interestRate: number;
  totalInterest?: number;
  totalRepayment?: number;
  totalPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    pan: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
    },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
      required: true,
    },
    salarySlipUrl: {
      type: String,
    },
    loanAmount: {
      type: Number,
    },
    tenure: {
      type: Number,
    },
    interestRate: {
      type: Number,
      default: 12,
    },
    totalInterest: {
      type: Number,
    },
    totalRepayment: {
      type: Number,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.PENDING,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const LoanApplication = mongoose.model<ILoanApplication>('LoanApplication', loanApplicationSchema);

export default LoanApplication;
