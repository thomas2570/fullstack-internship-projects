import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { LiveSession } from '../models/LiveSession.js';
import { Enrollment } from '../models/Enrollment.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { Transaction } from '../models/Transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
  try {
    await connectDB();
    console.log('[Cleanup] Connected to database.');

    const defaultEmails = [
      'admin@eduflow.com',
      'dr.alex@eduflow.com',
      'sarah.chen@eduflow.com',
      'marcus.brody@eduflow.com',
      'john.student@eduflow.com',
      'emily.watson@eduflow.com',
      'arjun.verma@example.com',
      'priya.nair@example.com'
    ];

    // Password for both accounts (plain text, User schema pre('save') hashes it once)
    const newPassword = 'Abhi@123';

    // 1. Ensure rc19160344@gmail.com exists with admin + instructor powers
    let mainUser = await User.findOne({ email: 'rc19160344@gmail.com' });
    if (!mainUser) {
      mainUser = await User.create({
        name: 'Ankur Singh',
        email: 'rc19160344@gmail.com',
        password: newPassword,
        role: 'admin',
        headline: 'Lead Instructor & Platform Administrator',
        bio: 'Founder and Lead Instructor at EduFlow Academy.',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        earnings: {
          totalRevenue: 15400,
          netEarnings: 10780,
          pendingBalance: 7500,
          withdrawnAmount: 3280,
        },
        payoutInfo: {
          payoutMethod: 'bank_transfer',
          bankName: 'HDFC Bank',
          accountNumber: '****5678',
        }
      });
      console.log('[Cleanup] Created main account rc19160344@gmail.com with password Abhi@123');
    } else {
      mainUser.role = 'admin';
      mainUser.name = 'Ankur Singh';
      mainUser.password = newPassword;
      await mainUser.save();
      console.log('[Cleanup] Updated main account rc19160344@gmail.com with password Abhi@123');
    }

    // Also ensure rc19150344@gmail.com exists as alias
    let aliasUser = await User.findOne({ email: 'rc19150344@gmail.com' });
    if (!aliasUser) {
      aliasUser = await User.create({
        name: 'Ankur Singh',
        email: 'rc19150344@gmail.com',
        password: newPassword,
        role: 'admin',
        headline: 'Lead Instructor & Platform Administrator',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      });
      console.log('[Cleanup] Created alias account rc19150344@gmail.com with password Abhi@123');
    } else {
      aliasUser.role = 'admin';
      aliasUser.name = 'Ankur Singh';
      aliasUser.password = newPassword;
      await aliasUser.save();
      console.log('[Cleanup] Updated alias account rc19150344@gmail.com with password Abhi@123');
    }

    // 2. Reassign all existing courses & live sessions to mainUser so courses have an instructor
    const updatedCourses = await Course.updateMany(
      {},
      { $set: { instructor: mainUser._id } }
    );
    console.log(`[Cleanup] Reassigned ${updatedCourses.modifiedCount} courses to Ankur Singh`);

    const updatedSessions = await LiveSession.updateMany(
      {},
      { $set: { instructor: mainUser._id } }
    );
    console.log(`[Cleanup] Reassigned ${updatedSessions.modifiedCount} live sessions to Ankur Singh`);

    // 3. Delete all default fake users from database
    const deletedUsers = await User.deleteMany({
      email: { $in: defaultEmails }
    });
    console.log(`[Cleanup] Deleted ${deletedUsers.deletedCount} default users from database.`);

    // 4. Enroll mainUser in courses
    const allCourses = await Course.find();
    for (const c of allCourses) {
      let enr = await Enrollment.findOne({ student: mainUser._id, course: c._id });
      if (!enr) {
        await Enrollment.create({
          student: mainUser._id,
          course: c._id,
          completedLessons: [],
          progressPercentage: 50,
          enrolledAt: new Date()
        });
      }
    }

    // 5. Reassign all payout requests & transactions to mainUser
    const updatedPayouts = await PayoutRequest.updateMany(
      {},
      { $set: { instructor: mainUser._id, accountDetails: mainUser.email } }
    );
    console.log(`[Cleanup] Reassigned ${updatedPayouts.modifiedCount} payout requests to Ankur Singh`);

    const updatedTx = await Transaction.updateMany(
      {},
      { $set: { instructor: mainUser._id } }
    );
    console.log(`[Cleanup] Reassigned ${updatedTx.modifiedCount} transactions to Ankur Singh`);

    // 6. Output remaining users in database
    const remaining = await User.find({}, 'name email role createdAt');
    console.log('[Cleanup] Remaining users in database:');
    console.table(remaining.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })));

    console.log('[Cleanup] Finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Cleanup Error]', err);
    process.exit(1);
  }
};

cleanup();
