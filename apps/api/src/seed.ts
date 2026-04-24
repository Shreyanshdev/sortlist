/**
 * Seed script — run with:
 *   cd apps/api && npx ts-node -r dotenv/config src/seed.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGODB_URI || '';

interface UserDoc {
  email: string;
  passwordHash: string;
  role: string;
  candidateProfile?: any;
  recruiterProfile?: any;
  createdAt: Date;
  updatedAt: Date;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');
  const jobs  = db.collection('jobs');

  // Clean existing data
  await users.deleteMany({});
  await jobs.deleteMany({});
  await db.collection('applications').deleteMany({});
  await db.collection('resumes').deleteMany({});
  await db.collection('analysisresults').deleteMany({});
  await db.collection('notifications').deleteMany({});
  console.log('Cleared existing data');

  const pw = await bcrypt.hash('Test@1234', 10);

  // ─── ADMIN ───
  await users.insertOne({
    email: 'admin@shortlist.io',
    passwordHash: pw,
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✅ Admin created');

  // ─── RECRUITERS (5) ───
  const recruiterData = [
    { name: 'Priya Sharma',    company: 'Google India',       email: 'priya@google.com',         status: 'VERIFIED' },
    { name: 'Rahul Mehta',     company: 'Microsoft',          email: 'rahul@microsoft.com',      status: 'VERIFIED' },
    { name: 'Ananya Gupta',    company: 'Flipkart',           email: 'ananya@flipkart.com',      status: 'VERIFIED' },
    { name: 'Vikram Singh',    company: 'Razorpay',           email: 'vikram@razorpay.com',      status: 'PENDING' },
    { name: 'Neha Joshi',      company: 'CRED',               email: 'neha@cred.club',           status: 'PENDING' },
  ];

  const recruiterIds: any[] = [];
  for (const r of recruiterData) {
    const result = await users.insertOne({
      email: r.email,
      passwordHash: pw,
      role: 'RECRUITER',
      recruiterProfile: {
        name: r.name,
        companyName: r.company,
        companyEmail: r.email,
        status: r.status,
        ...(r.status === 'VERIFIED' ? { verifiedAt: new Date() } : {}),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    recruiterIds.push(result.insertedId);
  }
  console.log('✅ 5 Recruiters created');

  // ─── CANDIDATES (10) ───
  const candidateData = [
    { name: 'Aarav Patel',       email: 'aarav@gmail.com',      github: 'https://github.com/aaravp',    leetcode: 'https://leetcode.com/aaravp' },
    { name: 'Diya Krishnan',     email: 'diya@gmail.com',       github: 'https://github.com/diyak',     leetcode: 'https://leetcode.com/diyak' },
    { name: 'Arjun Reddy',       email: 'arjun@gmail.com',      github: 'https://github.com/arjunr',    leetcode: '' },
    { name: 'Meera Nair',        email: 'meera@gmail.com',      github: '',                              leetcode: 'https://leetcode.com/meeran' },
    { name: 'Rohan Desai',       email: 'rohan@gmail.com',      github: 'https://github.com/rohand',    leetcode: 'https://leetcode.com/rohand' },
    { name: 'Ishita Banerjee',   email: 'ishita@gmail.com',     github: 'https://github.com/ishitab',   leetcode: '' },
    { name: 'Karan Chopra',      email: 'karan@gmail.com',      github: '',                              leetcode: '' },
    { name: 'Sneha Iyer',        email: 'sneha@gmail.com',      github: 'https://github.com/snehai',    leetcode: 'https://leetcode.com/snehai' },
    { name: 'Aditya Verma',      email: 'aditya@gmail.com',     github: 'https://github.com/adityav',   leetcode: 'https://leetcode.com/adityav' },
    { name: 'Kavya Menon',       email: 'kavya@gmail.com',      github: 'https://github.com/kavyam',    leetcode: '' },
  ];

  for (const c of candidateData) {
    await users.insertOne({
      email: c.email,
      passwordHash: pw,
      role: 'CANDIDATE',
      candidateProfile: {
        name: c.name,
        githubUrl: c.github || undefined,
        leetcodeUrl: c.leetcode || undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log('✅ 10 Candidates created');

  // ─── JOBS (3 sample jobs from verified recruiters) ───
  const jobsData = [
    {
      recruiterId: recruiterIds[0],
      title: 'Senior Frontend Engineer',
      description: 'Build high-performance React applications for Google Search. Must have deep expertise in React, TypeScript, and performance optimization. Experience with large-scale systems preferred.',
      criteria: [
        { id: 'c1', label: 'React & TypeScript', weight: 0.35, description: 'Strong hands-on experience building production React apps with TypeScript' },
        { id: 'c2', label: 'Performance Optimization', weight: 0.25, description: 'Experience with web vitals, lazy loading, code splitting, and profiling' },
        { id: 'c3', label: 'System Design', weight: 0.20, description: 'Ability to design scalable frontend architectures for large codebases' },
        { id: 'c4', label: 'Testing & CI/CD', weight: 0.20, description: 'Unit testing with Jest/RTL and experience with CI pipelines' },
      ],
      deadline: new Date(Date.now() + 14 * 86400000), // 14 days from now
    },
    {
      recruiterId: recruiterIds[1],
      title: 'Backend Engineer — Node.js',
      description: 'Design and build microservices powering Azure cloud platform. Strong Node.js, MongoDB, and distributed systems knowledge required.',
      criteria: [
        { id: 'c1', label: 'Node.js & Express', weight: 0.30, description: 'Production-grade REST API development with Express or Fastify' },
        { id: 'c2', label: 'MongoDB & Databases', weight: 0.25, description: 'Schema design, indexing, aggregation pipelines, and data modeling' },
        { id: 'c3', label: 'Distributed Systems', weight: 0.25, description: 'Message queues, caching (Redis), and event-driven architecture' },
        { id: 'c4', label: 'DevOps & Docker', weight: 0.20, description: 'Containerization, Kubernetes basics, and CI/CD workflows' },
      ],
      deadline: new Date(Date.now() + 21 * 86400000), // 21 days
    },
    {
      recruiterId: recruiterIds[2],
      title: 'ML Engineer — NLP',
      description: 'Work on search ranking and recommendation systems at Flipkart using transformer models and semantic embeddings.',
      criteria: [
        { id: 'c1', label: 'Python & ML Frameworks', weight: 0.30, description: 'PyTorch or TensorFlow, scikit-learn, and data pipelines' },
        { id: 'c2', label: 'NLP & Transformers', weight: 0.30, description: 'BERT, sentence-transformers, fine-tuning, and embeddings' },
        { id: 'c3', label: 'Data Engineering', weight: 0.20, description: 'ETL pipelines, Spark, or large-scale data processing' },
        { id: 'c4', label: 'Production ML', weight: 0.20, description: 'Model serving, A/B testing, and monitoring in production' },
      ],
      deadline: new Date(Date.now() + 30 * 86400000), // 30 days
    },
  ];

  for (const j of jobsData) {
    await jobs.insertOne({
      ...j,
      isActive: true,
      analyseStatus: 'NOT_STARTED',
      applicantCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log('✅ 3 Sample Jobs created');

  console.log('\n🎉 Seed complete! See credentials.md for login details.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
