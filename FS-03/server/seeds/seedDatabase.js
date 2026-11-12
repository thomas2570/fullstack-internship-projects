import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
import path from 'path';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Quiz } from '../models/Quiz.js';
import { QuizSubmission } from '../models/QuizSubmission.js';
import { Enrollment } from '../models/Enrollment.js';
import { LiveSession } from '../models/LiveSession.js';
import { Certificate } from '../models/Certificate.js';
import { Transaction } from '../models/Transaction.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { generateCertificate } from '../services/certificateGenerator.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduflow_lms';

// Reference streaming links: Blender open movies & Pexels stock video CDNs
const OPEN_MEDIA = {
  bigBuckBunnyHls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  bigBuckBunnyMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  sintelHls: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  sintelMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  tearsOfSteelMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  localHls: '/uploads/hls/sample-lesson/master.m3u8',
  pexelsTechMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  pexelsCodeMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Lesson.deleteMany({}),
      Quiz.deleteMany({}),
      QuizSubmission.deleteMany({}),
      Enrollment.deleteMany({}),
      LiveSession.deleteMany({}),
      Certificate.deleteMany({}),
      Transaction.deleteMany({}),
      PayoutRequest.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing database records.');

    // 1. Create Verified Genuine Account (No fake/dummy accounts)
    const mainUser = await User.create({
      name: 'Ankur Singh',
      email: 'rc19160344@gmail.com',
      password: 'password123',
      role: 'admin',
      headline: 'Lead Instructor & Platform Administrator',
      bio: 'Platform Administrator, Lead Instructor and Full-Stack Systems Specialist.',
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

    const aliasUser = await User.create({
      name: 'Ankur Singh',
      email: 'rc19150344@gmail.com',
      password: 'password123',
      role: 'admin',
      headline: 'Lead Instructor & Platform Administrator',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    });

    const admin = mainUser;
    const instructor1 = mainUser;
    const instructor2 = mainUser;
    const instructor3 = mainUser;
    const student1 = mainUser;
    const student2 = aliasUser;
    const userRc = mainUser;

    console.log('[Seed] Genuine verified accounts created (no dummy accounts).');

    // 2. Create Courses (Coursera & Udemy Style Catalog)
    // Course 1 (Coursera Specialization format): Full-Stack Web Architecture
    const course1 = await Course.create({
      title: 'Full-Stack Web Engineering: Architecture, Cloud & Scalable Systems',
      subtitle: 'Master modern front-end and back-end development, real-time collaboration, media delivery, and enterprise cloud architecture.',
      description: 'A comprehensive engineering masterclass designed to take you from foundational concepts to architecting and deploying scalable, high-performance web platforms. Learn how engineering leaders design distributed systems, build interactive real-time experiences, optimize media streaming, and implement secure data workflows.',
      category: 'Web Development',
      level: 'Advanced',
      price: 89,
      currency: 'USD',
      instructor: instructor1._id,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['Full-Stack', 'Web Development', 'System Architecture', 'Cloud Services', 'React', 'Node.js'],
      requirements: [
        'Familiarity with modern JavaScript (ES6+) and basic React',
        'Basic understanding of server-side programming and REST APIs',
        'A computer with Node.js 18+ and a local code editor',
      ],
      whatYouWillLearn: [
        'Architect scalable, secure full-stack web applications from the ground up',
        'Implement real-time two-way audio, video, and collaborative messaging rooms',
        'Deploy automated media processing and adaptive high-definition video streaming',
        'Handle asynchronous background workloads and high-throughput task queues',
        'Accelerate content delivery globally with enterprise edge network caching',
        'Earn an accredited, cryptographically verifiable completion certificate with instant QR validation',
      ],
      sections: [
        { title: 'Module 1: Enterprise System Architecture & Role-Based Security', order: 0 },
        { title: 'Module 2: Media Processing Pipelines & Distributed Edge Delivery', order: 1 },
        { title: 'Module 3: Real-Time Interactive Classrooms & Low-Latency Collaboration', order: 2 },
        { title: 'Module 4: Architectural Knowledge Assessment & Graduation', order: 3 },
      ],
      totalDuration: 145,
      totalLessons: 4,
      enrolledCount: 42,
      averageRating: 4.9,
      reviewCount: 28,
    });

    // Course 2 (Coursera Andrew Ng / DeepLearning.AI format): Deep Learning & Generative AI
    const course2 = await Course.create({
      title: 'Deep Learning & Generative AI in Production',
      subtitle: 'Master transformer architectures, PyTorch model deployment, vector databases, and real-time inference streaming.',
      description: 'A comprehensive journey into modern deep learning. From backpropagation and attention mechanisms to deploying LLMs and diffusion models with low-latency streaming APIs.',
      category: 'Data Science & AI',
      level: 'Advanced',
      price: 99,
      currency: 'USD',
      instructor: instructor2._id,
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['PyTorch', 'Transformers', 'FastAPI', 'LLM', 'AI'],
      requirements: ['Python proficiency', 'Basic linear algebra and calculus'],
      whatYouWillLearn: [
        'Train and fine-tune transformer models for downstream NLP tasks',
        'Deploy high-throughput inference servers with FastAPI and vLLM',
        'Implement semantic search with vector indexing (Pinecone / Chroma)',
      ],
      sections: [
        { title: 'Module 1: Transformer Core Mechanics', order: 0 },
        { title: 'Module 2: Real-Time Streaming Inference', order: 1 },
      ],
      totalDuration: 180,
      totalLessons: 2,
      enrolledCount: 54,
      averageRating: 4.9,
      reviewCount: 39,
    });

    // Course 3 (Udemy Stephane Maarek format): AWS Solutions Architect
    const course3 = await Course.create({
      title: 'AWS Certified Solutions Architect & Cloud Engineering Masterclass',
      subtitle: 'Everything you need to master AWS: EC2, S3, CloudFront, Lambda, ECS, RDS, DynamoDB, and VPC networking.',
      description: 'The definitive hands-on cloud certification preparation course. Design highly available, fault-tolerant, cost-optimized architectures on Amazon Web Services.',
      category: 'Cloud Computing',
      level: 'Intermediate',
      price: 79,
      currency: 'USD',
      instructor: instructor3._id,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['AWS', 'CloudFront', 'S3', 'EC2', 'Docker'],
      requirements: ['General IT knowledge'],
      whatYouWillLearn: [
        'Design global content delivery networks with CloudFront and S3',
        'Build scalable microservices with ECS, Fargate, and Application Load Balancers',
        'Configure secure multi-tier VPC networks with private subnets and NAT gateways',
      ],
      sections: [
        { title: 'Module 1: Global Edge Storage & CloudFront', order: 0 },
        { title: 'Module 2: Containerized Microservices on AWS', order: 1 },
      ],
      totalDuration: 210,
      totalLessons: 2,
      enrolledCount: 78,
      averageRating: 4.8,
      reviewCount: 62,
    });

    // Course 4 (Udemy Angela Yu format): The Complete 2026 Web Development Bootcamp
    const course4 = await Course.create({
      title: 'The Complete 2026 Web Development Bootcamp',
      subtitle: 'Become a full-stack web developer with just ONE course: HTML, CSS, JavaScript, React, Node, and MongoDB.',
      description: 'The all-in-one comprehensive curriculum designed to take complete beginners to employable software engineers with 10+ real-world portfolio projects.',
      category: 'Web Development',
      level: 'Beginner',
      price: 49,
      currency: 'USD',
      instructor: instructor1._id,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['JavaScript', 'HTML5', 'CSS3', 'React', 'MongoDB'],
      requirements: ['No prior programming experience required'],
      whatYouWillLearn: [
        'Master core web standards: semantic HTML5, modern CSS3, and JavaScript ES6+',
        'Build interactive reactive UIs with React and hooks',
        'Create REST APIs with Node.js, Express, and MongoDB databases',
      ],
      sections: [
        { title: 'Module 1: Web Fundamentals & DOM Manipulation', order: 0 },
      ],
      totalDuration: 120,
      totalLessons: 1,
      enrolledCount: 110,
      averageRating: 4.8,
      reviewCount: 94,
    });

    // Course 5 (Udemy Academind format): Production Distributed Systems
    const course5 = await Course.create({
      title: 'Enterprise Distributed Systems & Scalable Cloud Microservices',
      subtitle: 'Master asynchronous message brokers, distributed caching architectures, rate limiting, and resilient worker systems.',
      description: 'A deep dive into mission-critical backend patterns. Learn how engineering organizations scale to millions of concurrent requests using asynchronous message queues, distributed caching, idempotency, and fault-tolerant worker pools.',
      category: 'DevOps & Architecture',
      level: 'Intermediate',
      price: 69,
      currency: 'USD',
      instructor: instructor1._id,
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['Cloud Computing', 'System Architecture', 'Microservices', 'Distributed Systems'],
      requirements: ['Node.js fundamentals and backend concepts'],
      whatYouWillLearn: [
        'Design resilient asynchronous message pipelines with automated retries and backoff',
        'Implement distributed caching and concurrency control patterns',
        'Scale background worker pools using container orchestration',
      ],
      sections: [
        { title: 'Module 1: Message Broker & Queue Fundamentals', order: 0 },
        { title: 'Module 2: High Availability Workers & Reliability', order: 1 },
      ],
      totalDuration: 90,
      totalLessons: 2,
      enrolledCount: 35,
      averageRating: 4.8,
      reviewCount: 19,
    });

    // Course 6 (Free Course / Starter): UI/UX Design & Design Systems
    const course6 = await Course.create({
      title: 'UI/UX Design Masterclass: Modern Figma to Design Systems',
      subtitle: 'Design beautiful, accessible, and user-centric interfaces from scratch in Figma with auto-layout and components.',
      description: 'Learn wireframing, color theory, typography, design systems, and responsive component libraries.',
      category: 'Design & UI/UX',
      level: 'All Levels',
      price: 0, // Free
      currency: 'USD',
      instructor: instructor2._id,
      thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      status: 'published',
      tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
      requirements: ['Computer and free Figma account'],
      whatYouWillLearn: [
        'Master Figma auto-layout, variants, and component properties',
        'Build scalable design systems for cross-functional engineering teams',
        'Conduct usability testing and prototype interactive user flows',
      ],
      sections: [
        { title: 'Module 1: Design Principles & Foundations', order: 0 },
      ],
      totalDuration: 60,
      totalLessons: 1,
      enrolledCount: 142,
      averageRating: 4.9,
      reviewCount: 51,
    });

    console.log('[Seed] Courses catalog populated with Coursera & Udemy data.');

    // 3. Create Lessons for Course 1 (Using Blender Open Movies & Local Transcoded HLS)
    const lesson1_1 = await Lesson.create({
      course: course1._id,
      sectionTitle: 'Module 1: Enterprise System Architecture & Role-Based Security',
      title: '1.1 Enterprise System Architecture & Role-Based Security',
      description: 'Explore foundational enterprise architecture: schema design, token-based authentication with role hierarchies (student, instructor, administrator), and resilient API contracts. Video sample: Open Media Big Buck Bunny.',
      order: 0,
      contentType: 'video',
      isFreePreview: true,
      video: {
        rawFileName: 'big_buck_bunny.mp4',
        hlsMasterPlaylist: 'sample-lesson/master.m3u8',
        streamingUrl: OPEN_MEDIA.localHls, // local HLS generated by FFmpeg
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80',
        duration: 596,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
        renditions: [
          { resolution: '720p', playlistUrl: OPEN_MEDIA.localHls, bitrate: '2500k' }
        ]
      },
      resources: [
        { title: 'System Architecture Blueprint (PDF)', url: 'https://example.com/arch-spec.pdf' },
        { title: 'Production Starter Codebase', url: 'https://github.com/example/blueprint' }
      ]
    });

    const lesson1_2 = await Lesson.create({
      course: course1._id,
      sectionTitle: 'Module 2: Media Processing Pipelines & Distributed Edge Delivery',
      title: '2.1 Automated Cloud Media Processing & Adaptive Streaming',
      description: 'Step-by-step breakdown of ingesting high-definition video uploads, offloading compute-heavy tasks to background processing workers, generating multi-bitrate adaptive streams, and accelerating delivery across global edge networks.',
      order: 1,
      contentType: 'video',
      isFreePreview: false,
      video: {
        rawFileName: '02-media-pipeline.mp4',
        hlsMasterPlaylist: 'x36xhzz.m3u8',
        streamingUrl: OPEN_MEDIA.bigBuckBunnyHls, // Multi-bitrate HLS stream
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&q=80',
        duration: 480,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
        renditions: [
          { resolution: '720p', playlistUrl: OPEN_MEDIA.bigBuckBunnyHls, bitrate: '2500k' }
        ]
      }
    });

    const lesson1_3 = await Lesson.create({
      course: course1._id,
      sectionTitle: 'Module 3: Real-Time Interactive Classrooms & Low-Latency Collaboration',
      title: '3.1 Real-Time Interactive Media & Live Collaboration',
      description: 'Learn how peer-to-peer real-time communication protocols power browser-based high-definition audio, video, desktop screen sharing, and synchronized live chat rooms. Video stream: Open Media Sintel.',
      order: 2,
      contentType: 'video',
      isFreePreview: false,
      video: {
        rawFileName: 'sintel_stream.m3u8',
        hlsMasterPlaylist: 'sintel/playlist.m3u8',
        streamingUrl: OPEN_MEDIA.sintelHls, // Akamai HLS Sintel stream
        thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=640&q=80',
        duration: 888,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
        renditions: [
          { resolution: '720p', playlistUrl: OPEN_MEDIA.sintelHls, bitrate: '2500k' }
        ]
      }
    });

    const lesson1_4 = await Lesson.create({
      course: course1._id,
      sectionTitle: 'Module 4: Architectural Knowledge Assessment & Graduation',
      title: '4.1 Architectural Knowledge Assessment & Final Exam',
      description: 'Demonstrate your mastery of scalable web engineering, edge media delivery, real-time protocols, and enterprise application security.',
      order: 3,
      contentType: 'quiz',
      isFreePreview: false,
    });

    // 4. Create Lessons for Course 2 (Deep Learning) using Sintel & Tech Stock Videos
    await Lesson.create({
      course: course2._id,
      sectionTitle: 'Module 1: Transformer Core Mechanics',
      title: '1.1 Multi-Head Self-Attention from Scratch',
      description: 'Mathematical intuition and PyTorch implementation of Q, K, V matrices and scaled dot-product attention. Video sample: Sintel Blender Open Movie.',
      order: 0,
      contentType: 'video',
      isFreePreview: true,
      video: {
        rawFileName: 'sintel_1080p.mp4',
        streamingUrl: OPEN_MEDIA.sintelMp4,
        thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=640&q=80',
        duration: 888,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
      }
    });

    await Lesson.create({
      course: course2._id,
      sectionTitle: 'Module 2: Real-Time Streaming Inference',
      title: '2.1 Low-Latency Streaming LLM Endpoints with FastAPI',
      description: 'Server-Sent Events (SSE) and token-by-token streaming backends for interactive web applications. Video sample: Tears of Steel.',
      order: 1,
      contentType: 'video',
      isFreePreview: false,
      video: {
        rawFileName: 'tears_of_steel.mp4',
        streamingUrl: OPEN_MEDIA.tearsOfSteelMp4,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&q=80',
        duration: 734,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
      }
    });

    // 5. Create Lessons for Course 3 (AWS Solutions Architect) using Big Buck Bunny
    await Lesson.create({
      course: course3._id,
      sectionTitle: 'Module 1: Global Edge Storage & CloudFront',
      title: '1.1 Configuring CloudFront Origins, Behaviors & Edge Caching',
      description: 'Distributing video segments with zero latency across 450+ CloudFront edge locations worldwide.',
      order: 0,
      contentType: 'video',
      isFreePreview: true,
      video: {
        rawFileName: 'big_buck_bunny.mp4',
        streamingUrl: OPEN_MEDIA.bigBuckBunnyMp4,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=640&q=80',
        duration: 596,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
      }
    });

    // 6. Create Lessons for Course 6 (Design) using Pexels Tech video
    await Lesson.create({
      course: course6._id,
      sectionTitle: 'Module 1: Design Principles & Foundations',
      title: '1.1 Creating Dynamic Design Tokens & Auto-Layouts in Figma',
      description: 'Constructing robust UI component libraries ready for full-stack engineering handoff.',
      order: 0,
      contentType: 'video',
      isFreePreview: true,
      video: {
        rawFileName: 'pexels_tech_stream.mp4',
        streamingUrl: OPEN_MEDIA.pexelsTechMp4,
        thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=640&q=80',
        duration: 320,
        transcodeStatus: 'ready',
        transcodeProgress: 100,
      }
    });

    console.log('[Seed] Lessons created with Big Buck Bunny, Sintel, Tears of Steel, and Pexels open media.');

    // 7. Create Quiz for Lesson 1.4
    const quiz1 = await Quiz.create({
      course: course1._id,
      lesson: lesson1_4._id,
      title: 'Full-Stack Engineering & Scalable Systems Certification Exam',
      description: 'Pass this auto-graded comprehensive assessment with 70% or higher to complete the course and unlock your official verifiable certificate.',
      passingScore: 70,
      timeLimitMinutes: 10,
      questions: [
        {
          questionText: 'What is the primary benefit of offloading compute-heavy media processing tasks to asynchronous background worker queues?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'Serving video streams synchronously to frontend clients' },
            { id: 'opt_2', text: 'Isolating heavy CPU workloads so the primary web application server remains fast and responsive' },
            { id: 'opt_3', text: 'Handling user session sign-ins' },
            { id: 'opt_4', text: 'Managing database connection credentials' }
          ],
          correctAnswers: ['opt_2'],
          explanation: 'Compute-heavy tasks like media transcoding must be isolated in background queues so user-facing web requests are served without latency.',
          points: 1
        },
        {
          questionText: 'In adaptive bitrate video streaming, what is the core purpose of a master playlist manifest file?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'It compresses the entire video library into a single file' },
            { id: 'opt_2', text: 'It indexes available video resolutions and bitrates, enabling players to switch quality smoothly based on the viewer\'s network speed' },
            { id: 'opt_3', text: 'It stores encrypted payment tokens' },
            { id: 'opt_4', text: 'It sends automated email notifications' }
          ],
          correctAnswers: ['opt_2'],
          explanation: 'The master manifest enables video players to monitor available bandwidth and dynamically adapt between 1080p, 720p, and 360p without buffering.',
          points: 1
        },
        {
          questionText: 'What occurs during the initial signaling handshake of a real-time peer-to-peer video session?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'Endpoints exchange media capability descriptions and candidate network addresses before establishing a direct connection' },
            { id: 'opt_2', text: 'Video frames are buffered on disk before playback' },
            { id: 'opt_3', text: 'The client downloads the full video archive' },
            { id: 'opt_4', text: 'A background job is queued in cold storage' }
          ],
          correctAnswers: ['opt_1'],
          explanation: 'Signaling coordinates media formats and routing pathways between participants before direct real-time communication starts.',
          points: 1
        },
        {
          questionText: 'Why do modern learning platforms distribute media content through global edge Content Delivery Networks (CDNs)?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'CDNs cache media segments at edge servers geographically closest to learners, minimizing latency and buffering' },
            { id: 'opt_2', text: 'It replaces the web application server completely' },
            { id: 'opt_3', text: 'It restricts playback to only desktop computers' },
            { id: 'opt_4', text: 'It prevents students from taking quizzes' }
          ],
          correctAnswers: ['opt_1'],
          explanation: 'Edge caching brings media assets physically closer to learners around the world, eliminating lag and reducing application server load.',
          points: 1
        }
      ]
    });

    lesson1_4.quiz = quiz1._id;
    await lesson1_4.save();

    // Create Quiz for UI/UX Course (course6)
    const quizLessonUIUX = await Lesson.create({
      course: course6._id,
      title: '1.2 UI/UX Design Systems & Auto-Layout Quiz',
      sectionTitle: 'Section 1: Modern Figma Architecture',
      contentType: 'quiz',
      order: 1,
      isFreePreview: false,
      resources: [],
    });

    const quizUIUX = await Quiz.create({
      course: course6._id,
      lesson: quizLessonUIUX._id,
      title: 'Figma Auto-Layout & Design Tokens Assessment',
      description: 'Answer these questions to test your understanding of Figma tokens and responsive design systems. Passing score is 70%.',
      passingScore: 70,
      timeLimitMinutes: 10,
      questions: [
        {
          questionText: 'What is the primary advantage of using Figma Auto-Layout 5.0?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'It creates responsive layouts that automatically adjust spacing and dimensions based on content' },
            { id: 'opt_2', text: 'It exports PNG images in 4k resolution automatically' },
            { id: 'opt_3', text: 'It disables CSS styling for web components' },
            { id: 'opt_4', text: 'It encrypts Figma cloud documents' },
          ],
          correctAnswers: ['opt_1'],
          explanation: 'Figma Auto-Layout allows frames and components to grow or shrink dynamically as their internal content changes, mirroring modern CSS Flexbox and Grid.',
          points: 1,
        },
        {
          questionText: 'What are Design Tokens in a production design system?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'Cryptocurrency coins used to purchase UI templates' },
            { id: 'opt_2', text: 'Named variables that store design decisions such as colors, typography scales, spacing, and elevation' },
            { id: 'opt_3', text: 'Passwords used to access Figma files' },
            { id: 'opt_4', text: 'Watermarks placed on wireframes' },
          ],
          correctAnswers: ['opt_2'],
          explanation: 'Design tokens are platform-agnostic design values that provide a single source of truth between design in Figma and code in React or CSS.',
          points: 1,
        },
        {
          questionText: 'Which Figma feature allows defining component variants with interchangeable states (e.g., hover, active, disabled)?',
          questionType: 'multiple_choice',
          options: [
            { id: 'opt_1', text: 'Component Sets & Variant Properties' },
            { id: 'opt_2', text: 'Pixel Grid snapping' },
            { id: 'opt_3', text: 'Slice Tool' },
            { id: 'opt_4', text: 'Smart Animate alone' },
          ],
          correctAnswers: ['opt_1'],
          explanation: 'Component sets group related master components into variants with typed properties (boolean toggles, string dropdowns, and variant states).',
          points: 1,
        },
      ],
    });

    quizLessonUIUX.quiz = quizUIUX._id;
    await quizLessonUIUX.save();

    console.log('[Seed] Quizzes created.');

    // 8. Create Live Sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    await LiveSession.create({
      course: course1._id,
      instructor: instructor1._id,
      title: 'Interactive Masterclass: Architecting High-Performance Distributed Web Platforms',
      description: 'Join Dr. Alex Mercer for a live interactive masterclass covering system architecture design patterns, real-time collaboration protocols, and scalable cloud engineering.',
      roomId: 'room-webrtc-mastery-live',
      scheduledStartTime: tomorrow,
      scheduledDurationMinutes: 75,
      status: 'scheduled',
    });

    await LiveSession.create({
      course: course1._id,
      instructor: instructor1._id,
      title: 'Live Interactive Lab: Media Streaming Systems & Real-Time Collaboration',
      description: 'Live interactive classroom open now! Join the room to experience real-time two-way audio, video, desktop screen sharing, and collaborative discussion.',
      roomId: 'room-demo-active-class',
      scheduledStartTime: new Date(),
      scheduledDurationMinutes: 60,
      status: 'live',
    });

    console.log('[Seed] Live sessions created.');

    // 9. Create Enrollments
    // Student 1 (John) has completed all 4 lessons and earned an authentic certificate!
    const enrollment1 = await Enrollment.create({
      student: student1._id,
      course: course1._id,
      progressPercentage: 100,
      isCompleted: true,
      completedAt: new Date(),
      completedLessons: [
        { lesson: lesson1_1._id, completedAt: new Date(Date.now() - 86400000 * 3) },
        { lesson: lesson1_2._id, completedAt: new Date(Date.now() - 86400000 * 2) },
        { lesson: lesson1_3._id, completedAt: new Date(Date.now() - 86400000 * 1) },
        { lesson: lesson1_4._id, completedAt: new Date() },
      ],
      lastAccessedLesson: lesson1_4._id,
    });

    // Also enroll Ankur Singh (rc19150344@gmail.com) in Course 6 (Free Design Course) and Course 1
    await Enrollment.create({
      student: userRc._id,
      course: course6._id,
      progressPercentage: 50,
      isCompleted: false,
      completedLessons: [
        { lesson: quizLessonUIUX._id, completedAt: new Date() }
      ],
      lastAccessedLesson: quizLessonUIUX._id,
    });

    await Enrollment.create({
      student: userRc._id,
      course: course1._id,
      progressPercentage: 25,
      isCompleted: false,
      completedLessons: [
        { lesson: lesson1_1._id, completedAt: new Date() }
      ],
      lastAccessedLesson: lesson1_1._id,
    });

    // Record quiz submission for John
    await QuizSubmission.create({
      quiz: quiz1._id,
      student: student1._id,
      course: course1._id,
      score: 4,
      totalPoints: 4,
      percentage: 100,
      passed: true,
      attemptNumber: 1,
      answers: [
        { questionIndex: 0, selectedOptions: ['opt_2'], isCorrect: true, pointsEarned: 1 },
        { questionIndex: 1, selectedOptions: ['opt_2'], isCorrect: true, pointsEarned: 1 },
        { questionIndex: 2, selectedOptions: ['opt_1'], isCorrect: true, pointsEarned: 1 },
        { questionIndex: 3, selectedOptions: ['opt_1'], isCorrect: true, pointsEarned: 1 },
      ]
    });

    // Generate real PDF certificate for John
    const cert1 = await generateCertificate({
      student: student1,
      course: course1,
      instructor: instructor1,
      enrollmentId: enrollment1._id,
    });
    console.log(`[Seed] Generated verified certificate: ${cert1.certificateId} -> ${cert1.pdfUrl}`);

    // Student 2 (Emily) is in progress (50%)
    await Enrollment.create({
      student: student2._id,
      course: course1._id,
      progressPercentage: 50,
      isCompleted: false,
      completedLessons: [
        { lesson: lesson1_1._id, completedAt: new Date(Date.now() - 86400000) },
        { lesson: lesson1_2._id, completedAt: new Date() },
      ],
      lastAccessedLesson: lesson1_2._id,
    });

    // 10. Financial Transactions for Instructor Dashboard
    const tx1 = await Transaction.create({
      student: student1._id,
      course: course1._id,
      instructor: instructor1._id,
      amount: 89,
      currency: 'USD',
      platformFee: 26.70,
      instructorEarnings: 62.30,
      paymentProvider: 'stripe_test',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 14),
    });

    const tx2 = await Transaction.create({
      student: student2._id,
      course: course1._id,
      instructor: instructor1._id,
      amount: 89,
      currency: 'USD',
      platformFee: 26.70,
      instructorEarnings: 62.30,
      paymentProvider: 'stripe_test',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 5),
    });

    // Historic transactions to populate rich revenue charts
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      const pastDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await Transaction.create({
        student: student1._id,
        course: course1._id,
        instructor: instructor1._id,
        amount: 89 * (4 + i),
        currency: 'USD',
        platformFee: Math.round(89 * (4 + i) * 0.3 * 100) / 100,
        instructorEarnings: Math.round(89 * (4 + i) * 0.7 * 100) / 100,
        paymentProvider: 'stripe_test',
        status: 'completed',
        createdAt: pastDate,
      });
    }

    // Payout requests
    await PayoutRequest.create({
      instructor: instructor1._id,
      amount: 1280,
      payoutMethod: 'paypal',
      accountDetails: 'dr.alex.mercer@gmail.com',
      status: 'processed',
      requestedAt: new Date(Date.now() - 86400000 * 20),
      processedAt: new Date(Date.now() - 86400000 * 18),
      adminNotes: 'Processed via PayPal MassPay Batch #44901',
    });

    await PayoutRequest.create({
      instructor: instructor1._id,
      amount: 500,
      payoutMethod: 'paypal',
      accountDetails: 'dr.alex.mercer@gmail.com',
      status: 'pending',
      requestedAt: new Date(Date.now() - 86400000 * 1),
    });

    console.log('[Seed] Transactions and Payouts created.');
    console.log('\n================ SEED SUMMARY ================');
    console.log('✅ Coursera & Udemy Catalog: 6 courses across Web, AI, AWS, Design');
    console.log('✅ Open Movie Media Streams: Big Buck Bunny, Sintel, Tears of Steel, Pexels');
    console.log('✅ Admin & Lead Instructor: rc19160344@gmail.com / password123');
    console.log('✅ Secondary Alias:        rc19150344@gmail.com / password123');
    console.log(`✅ Sample Verified Certificate: ${cert1.certificateId}`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seed();
