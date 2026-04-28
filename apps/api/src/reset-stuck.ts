import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function resetStuck() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db!;

  // 1. Reset all jobs to NOT_STARTED
  const jobResult = await db.collection('jobs').updateMany(
    {},
    { $set: { analyseStatus: 'NOT_STARTED', applicantCount: 0 }, $unset: { analyseTriggeredAt: "", feedbackSentAt: "" } }
  );
  console.log('Reset all jobs:', jobResult.modifiedCount);

  // 2. Delete ALL analysis results
  const resultDel = await db.collection('analysisresults').deleteMany({});
  console.log('Deleted all analysis results:', resultDel.deletedCount);

  // 3. Delete ALL applications
  const appDel = await db.collection('applications').deleteMany({});
  console.log('Deleted all applications:', appDel.deletedCount);

  // 4. Delete ALL resumes
  const resumeDel = await db.collection('resumes').deleteMany({});
  console.log('Deleted all resumes:', resumeDel.deletedCount);

  console.log('Database cleared successfully. Ready for re-upload.');
  process.exit(0);
}

resetStuck().catch(e => { console.error(e); process.exit(1); });
