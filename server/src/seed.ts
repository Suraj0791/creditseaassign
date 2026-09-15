import mongoose from 'mongoose';
import User, { UserRole } from './models/User';
import connectDB from './config/db';

const seedUsers = [
  { name: 'Admin User', email: 'admin@lms.dev', password: 'Admin@123', role: UserRole.ADMIN },
  { name: 'Sales Executive', email: 'sales@lms.dev', password: 'Sales@123', role: UserRole.SALES },
  { name: 'Sanction Officer', email: 'sanction@lms.dev', password: 'Sanction@123', role: UserRole.SANCTION },
  { name: 'Disbursement Manager', email: 'disburse@lms.dev', password: 'Disburse@123', role: UserRole.DISBURSEMENT },
  { name: 'Collection Officer', email: 'collect@lms.dev', password: 'Collect@123', role: UserRole.COLLECTION },
  { name: 'Test Borrower', email: 'borrower@lms.dev', password: 'Borrower@123', role: UserRole.BORROWER },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Seeding database...\n');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`  ✓ ${userData.role.padEnd(14)} — ${userData.email} (already exists)`);
      } else {
        await User.create(userData);
        console.log(`  + ${userData.role.padEnd(14)} — ${userData.email} (created)`);
      }
    }

    console.log('\nSeed complete. Credentials:');
    console.log('─'.repeat(50));
    for (const u of seedUsers) {
      console.log(`  ${u.role.padEnd(14)} | ${u.email.padEnd(22)} | ${u.password}`);
    }
    console.log('─'.repeat(50));
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
