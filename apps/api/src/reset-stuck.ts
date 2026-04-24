import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function resetStuck() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db!;

  const jobResult = await db.collection('jobs').updateMany(
    { analyseStatus: 'IN_PROGRESS' },
    { $set: { analyseStatus: 'NOT_STARTED' } }
  );
  console.log('Reset jobs:', jobResult.modifiedCount);

  const resultDel = await db.collection('analysisresults').deleteMany(
    { status: { $in: ['PENDING', 'PROCESSING'] } }
  );
  console.log('Cleared stuck results:', resultDel.deletedCount);

  await db.collection('resumes').updateMany(
    { status: { $in: ['PARSING', 'EMBEDDING'] } },
    { $set: { status: 'UPLOADED' } }
  );
  console.log('Reset stuck resumes');
  process.exit(0);
}

resetStuck().catch(e => { console.error(e); process.exit(1); });
