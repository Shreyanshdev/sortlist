import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Types } from 'mongoose';

async function seedTargetedJob() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db!;

  const recruiterId = new Types.ObjectId("69eb3c93a5786e083ae87596"); // Using existing recruiter

  const jobId = new Types.ObjectId();
  const job = {
    _id: jobId,
    recruiterId,
    title: "Senior Full Stack Product Engineer (AI & E-commerce)",
    description: "We are seeking a versatile Full Stack Developer to build and scale production-grade products. You will work on React Native mobile apps with real-time tracking, high-conversion e-commerce platforms, and AI-driven internal tools. Expertise in Node.js, TypeScript, and integrating LLMs like Gemini is essential. You should have experience with payment gateways (Razorpay), Socket.io, and optimizing for both performance and SEO.",
    criteria: [
      { id: "c1", label: "Core Tech Stack", weight: 0.2, description: "Expertise in React, Next.js, Node.js, and TypeScript." },
      { id: "c2", label: "Mobile & Real-time", weight: 0.2, description: "Experience with React Native and implementing real-time features using Socket.io." },
      { id: "c3", label: "E-commerce & Payments", weight: 0.2, description: "Hands-on experience with Razorpay, order lifecycles, and complex database modeling (MongoDB/MySQL)." },
      { id: "c4", label: "GenAI Integration", weight: 0.2, description: "Proven track record of integrating Gemini or GenAI SDKs into production apps." },
      { id: "c5", label: "SEO & Architecture", weight: 0.2, description: "Commitment to clean architecture and achieving high Lighthouse SEO scores (90+)." }
    ],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    enableGithubInspection: true,
    enableLeetcodeInspection: true,
    analyseStatus: 'NOT_STARTED',
    applicantCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('jobs').insertOne(job);
  console.log('Targeted Job Seeded:', job.title);
  console.log('Job ID:', jobId.toString());
  
  process.exit(0);
}

seedTargetedJob().catch(e => { console.error(e); process.exit(1); });
