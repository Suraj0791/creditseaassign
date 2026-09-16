import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import LoanApplication, { LoanStatus } from '../models/LoanApplication';
import Payment from '../models/Payment';

export const getSalesLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const borrowers = await User.find({ role: UserRole.BORROWER }).select('-password');
    const applications = await LoanApplication.find({}).select('userId');
    const appliedUserIds = new Set(applications.map((a) => a.userId.toString()));

    const leads = borrowers.filter((b) => !appliedUserIds.has(b._id.toString()));

    res.status(200).json({ leads });
  } catch (error) {
    console.error('Sales leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSanctionQueue = async (_req: Request, res: Response): Promise<void> => {
  try {
    const applications = await LoanApplication.find({ status: LoanStatus.APPLIED })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Sanction queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await LoanApplication.findById(id);

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== LoanStatus.APPLIED) {
      res.status(400).json({ message: `Cannot approve a loan with status: ${application.status}` });
      return;
    }

    application.status = LoanStatus.SANCTIONED;
    await application.save();

    res.status(200).json({ message: 'Loan approved', application });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const application = await LoanApplication.findById(id);

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== LoanStatus.APPLIED) {
      res.status(400).json({ message: `Cannot reject a loan with status: ${application.status}` });
      return;
    }

    application.status = LoanStatus.REJECTED;
    application.rejectionReason = reason;
    await application.save();

    res.status(200).json({ message: 'Loan rejected', application });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDisbursementQueue = async (_req: Request, res: Response): Promise<void> => {
  try {
    const applications = await LoanApplication.find({ status: LoanStatus.SANCTIONED })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Disbursement queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await LoanApplication.findById(id);

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== LoanStatus.SANCTIONED) {
      res.status(400).json({ message: `Cannot disburse a loan with status: ${application.status}` });
      return;
    }

    application.status = LoanStatus.DISBURSED;
    await application.save();

    res.status(200).json({ message: 'Loan disbursed', application });
  } catch (error) {
    console.error('Disburse loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCollectionQueue = async (_req: Request, res: Response): Promise<void> => {
  try {
    const applications = await LoanApplication.find({ status: LoanStatus.DISBURSED })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Collection queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { utrNumber, amount, date } = req.body;

    if (!utrNumber || !amount || !date) {
      res.status(400).json({ message: 'UTR number, amount, and date are required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be a positive number' });
      return;
    }

    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      res.status(409).json({ message: 'A payment with this UTR number already exists' });
      return;
    }

    const application = await LoanApplication.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (application.status !== LoanStatus.DISBURSED) {
      res.status(400).json({ message: 'Payments can only be recorded for disbursed loans' });
      return;
    }

    const outstanding = (application.totalRepayment || 0) - application.totalPaid;
    if (parsedAmount > outstanding) {
      res.status(400).json({ message: `Payment amount exceeds outstanding balance of ₹${outstanding.toFixed(2)}` });
      return;
    }

    await Payment.create({
      loanId: application._id,
      utrNumber,
      amount: parsedAmount,
      date: new Date(date),
      recordedBy: req.user!._id,
    });

    application.totalPaid += parsedAmount;

    if (application.totalPaid >= (application.totalRepayment || 0)) {
      application.status = LoanStatus.CLOSED;
    }

    await application.save();

    res.status(201).json({
      message: application.status === LoanStatus.CLOSED ? 'Payment recorded. Loan is now closed.' : 'Payment recorded',
      application,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'A payment with this UTR number already exists' });
      return;
    }
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await Payment.find({ loanId: id })
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
