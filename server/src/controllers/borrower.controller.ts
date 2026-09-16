import { Request, Response } from 'express';
import LoanApplication, { LoanStatus, EmploymentMode } from '../models/LoanApplication';
import { runBRE, calculateLoan } from '../services/bre.service';

export const checkEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || !monthlySalary || !employmentMode) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const salary = Number(monthlySalary);
    if (isNaN(salary)) {
      res.status(400).json({ message: 'Monthly salary must be a valid number' });
      return;
    }

    const result = runBRE({ dob, monthlySalary: salary, pan, employmentMode });

    if (!result.eligible) {
      res.status(200).json({ eligible: false, errors: result.errors });
      return;
    }

    const existing = await LoanApplication.findOne({ userId: req.user!._id });

    if (existing) {
      if (existing.status !== LoanStatus.PENDING) {
        res.status(400).json({ message: 'You already have an active application' });
        return;
      }
      existing.fullName = fullName;
      existing.pan = pan.toUpperCase().trim();
      existing.dob = new Date(dob);
      existing.monthlySalary = salary;
      existing.employmentMode = employmentMode;
      await existing.save();
    } else {
      await LoanApplication.create({
        userId: req.user!._id,
        fullName,
        pan: pan.toUpperCase().trim(),
        dob: new Date(dob),
        monthlySalary: salary,
        employmentMode,
        status: LoanStatus.PENDING,
      });
    }

    res.status(200).json({ eligible: true, errors: [] });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadSalarySlip = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload a file (PDF, JPG, or PNG, max 5MB)' });
      return;
    }

    const application = await LoanApplication.findOne({ userId: req.user!._id });
    if (!application) {
      res.status(404).json({ message: 'Please complete eligibility check first' });
      return;
    }

    application.salarySlipUrl = `/uploads/${req.file.filename}`;
    await application.save();

    res.status(200).json({ url: application.salarySlipUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const applyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanAmount, tenure } = req.body;

    const parsedAmount = Number(loanAmount);
    const parsedTenure = Number(tenure);

    if (!parsedAmount || !parsedTenure) {
      res.status(400).json({ message: 'Loan amount and tenure are required' });
      return;
    }

    if (parsedAmount < 50000 || parsedAmount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
      return;
    }

    if (parsedTenure < 30 || parsedTenure > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });
      return;
    }

    const application = await LoanApplication.findOne({ userId: req.user!._id });
    if (!application) {
      res.status(404).json({ message: 'Please complete eligibility check first' });
      return;
    }

    if (application.status !== LoanStatus.PENDING) {
      res.status(400).json({ message: 'You have already submitted an application' });
      return;
    }

    if (!application.salarySlipUrl) {
      res.status(400).json({ message: 'Please upload your salary slip first' });
      return;
    }

    const calc = calculateLoan(parsedAmount, parsedTenure);

    application.loanAmount = calc.principal;
    application.tenure = calc.tenureDays;
    application.totalInterest = calc.interest;
    application.totalRepayment = calc.totalRepayment;
    application.status = LoanStatus.APPLIED;
    await application.save();

    res.status(200).json({
      message: 'Loan application submitted',
      application: {
        id: application._id,
        loanAmount: calc.principal,
        tenure: calc.tenureDays,
        interest: calc.interest,
        totalRepayment: calc.totalRepayment,
        status: application.status,
      },
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const application = await LoanApplication.findOne({ userId: req.user!._id });

    if (!application) {
      res.status(200).json({ application: null });
      return;
    }

    res.status(200).json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
