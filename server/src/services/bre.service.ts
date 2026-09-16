interface BREInput {
  dob: string;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

interface BREResult {
  eligible: boolean;
  errors: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  const age = calculateAge(input.dob);
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50. Current age: ${age}`);
  }

  if (input.monthlySalary < 25000) {
    errors.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString()}`);
  }

  const panUpper = input.pan.toUpperCase().trim();
  if (!PAN_REGEX.test(panUpper)) {
    errors.push('PAN format is invalid. Expected format: ABCDE1234F');
  }

  if (input.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan');
  }

  return {
    eligible: errors.length === 0,
    errors,
  };
}

export function calculateLoan(principal: number, tenureDays: number) {
  const rate = 12;
  const interest = Math.round((principal * rate * tenureDays) / (365 * 100));
  const totalRepayment = principal + interest;

  return {
    principal,
    tenureDays,
    rate,
    interest,
    totalRepayment,
  };
}
