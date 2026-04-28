import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Types } from 'mongoose';

async function seedTest() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db!;

  const recruiterId = new Types.ObjectId("69eb3c93a5786e083ae87596");

  // 1. Create the Job
  const jobId = new Types.ObjectId();
  const job = {
    _id: jobId,
    recruiterId,
    title: "Full Stack Product Engineer (React, Node.js & AI)",
    description: "We are looking for a Full Stack Product Engineer to architect and scale our next-generation platforms. You will be responsible for building high-performance web and mobile applications from the ground up, integrating real-time features and Generative AI capabilities. The ideal candidate has a deep understanding of React/Next.js for the frontend and Node.js/Express for scalable backends, with a focus on e-commerce logic and clean architecture.",
    criteria: [
      { id: "c1", label: "Full-Stack Mastery", weight: 0.25, description: "Deep experience in React, Node.js, TypeScript, and architecting complex RESTful APIs with MongoDB." },
      { id: "c2", label: "E-commerce Systems", weight: 0.25, description: "Proven ability to build production-grade e-commerce platforms involving payment gateways, order lifecycles, and real-time tracking." },
      { id: "c3", label: "AI Integration", weight: 0.20, description: "Experience implementing AI-driven features using Gemini or other LLM SDKs for analysis or automation." },
      { id: "c4", label: "Performance & SEO", weight: 0.15, description: "Expertise in optimizing apps for sub-200ms response times and high Lighthouse SEO/Performance scores." },
      { id: "c5", label: "Mobile & Real-time", weight: 0.15, description: "Experience with React Native and real-time communications using Socket.io or similar tech." }
    ],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    enableGithubInspection: true,
    enableLeetcodeInspection: false,
    analyseStatus: 'NOT_STARTED',
    applicantCount: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('jobs').insertOne(job);
  console.log('Created Job:', job.title);

  const resumes = [
    {
      name: "Shreyansh Gupta",
      source: "RECRUITER_BULK",
      text: `Shreyansh Gupta
Full stack developer focused on building scalable products. Strong in React, Node.js, TypeScript, REST APIs, and AI integrations.
TakeSmart: React Native quick commerce app. Razorpay, Socket.io real-time tracking. 15+ REST API endpoints.
Hridika Jewellers: Node.js/Express, MySQL. 92+ Lighthouse SEO score. 20+ REST APIs.
SkillSense.AI: Next.js and Gemini AI. 90%+ parsing accuracy.`,
      github: "https://github.com/Shreyanshdev"
    },
    {
      name: "Amit Sharma",
      source: "RECRUITER_BULK",
      text: `Amit Sharma - Java Developer
5 years experience in Java, Spring Boot and Microservices. Worked on some React frontend parts.
Expert in MySQL, Docker and AWS. Built scalable enterprise applications.
Experience with REST APIs and basic frontend development.`,
      github: "https://github.com/amit-dev"
    },
    {
      name: "Rahul Kumar",
      source: "RECRUITER_BULK",
      text: `Rahul Kumar - Frontend Specialist
React, HTML, CSS, JavaScript. 3 years experience building responsive websites.
Focus on UI/UX and Tailwind CSS. Some experience with Firebase.
No backend or AI experience. Looking for frontend roles.`,
      github: "https://github.com/rahul-front"
    },
    {
      name: "Neha Singh",
      source: "RECRUITER_BULK",
      text: `Neha Singh - Data Scientist
Python, Pandas, Scikit-learn, TensorFlow. 2 years experience in data analysis.
Building ML models for predictive analytics.
No web development or product engineering experience.`,
      github: "https://github.com/neha-data"
    }
  ];

  for (const r of resumes) {
    const resumeId = new Types.ObjectId();
    const resumeDoc = {
      _id: resumeId,
      recruiterId,
      jobId,
      source: r.source,
      filename: `${r.name.replace(' ', '_')}_Resume.pdf`,
      s3Key: `seed/${resumeId}`,
      fileUrl: `https://example.com/resumes/${resumeId}`,
      fileBuffer: Buffer.from(r.text), // Dummy buffer for processing
      mimeType: "application/pdf",
      fileSize: r.text.length,
      status: "UPLOADED",
      rawText: r.text,
      uploadedAt: new Date()
    };

    await db.collection('resumes').insertOne(resumeDoc);

    // Create AnalysisResult entry
    await db.collection('analysisresults').insertOne({
      jobId,
      resumeId,
      status: 'PENDING',
      isAnonymous: true,
      anonymousName: r.name,
      resumeScore: 0,
      finalScore: 0,
      rank: 999,
      githubUrl: r.github
    });

    console.log('Seeded Resume for:', r.name);
  }

  console.log('Seeding complete. You can now go to the recruiter dashboard and trigger analysis.');
  process.exit(0);
}

seedTest().catch(e => { console.error(e); process.exit(1); });
