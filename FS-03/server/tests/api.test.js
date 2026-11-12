import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../server.js';
import { getStreamingUrl } from '../config/aws.js';
import { Quiz } from '../models/Quiz.js';

describe('EduFlow LMS Core Suite', () => {
  let studentToken;
  let instructorToken;
  let testCourseId;

  beforeAll(async () => {
    // Wait for mongo connection if not ready
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduflow_lms');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) {
      server.close();
    }
  });

  describe('1. Health & Infrastructure', () => {
    it('GET /api/health should return online status and system flags', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.webrtc).toBe('enabled');
      expect(res.body.queue).toBe('active');
    });

    it('CloudFront / CDN helper correctly builds streaming paths', () => {
      const url = getStreamingUrl('course-101/lesson-1/master.m3u8');
      expect(url).toMatch(/master\.m3u8$/);
    });
  });

  describe('2. Authentication & Roles (Step 1)', () => {
    it('POST /api/auth/login should authenticate student and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.student@eduflow.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('student');
      studentToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate instructor', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr.alex@eduflow.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('instructor');
      instructorToken = res.body.token;
    });

    it('GET /api/auth/me should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('john.student@eduflow.com');
    });
  });

  describe('3. Courses & Lessons (Step 2 & 3)', () => {
    it('GET /api/courses should return published courses list', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.courses.length).toBeGreaterThan(0);
      testCourseId = res.body.courses[0]._id;
    });

    it('GET /api/courses/:id should return course details and lessons', async () => {
      const res = await request(app).get(`/api/courses/${testCourseId}`);
      expect(res.status).toBe(200);
      expect(res.body.course.title).toBeDefined();
      expect(res.body.lessons).toBeInstanceOf(Array);
    });

    it('POST /api/courses should block student from creating a course', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Illegal Student Course', description: 'Test', category: 'Web Development' });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Quizzes & Auto-Grading (Step 4)', () => {
    it('POST /api/quizzes/:id/submit should accurately auto-grade submission', async () => {
      // Find course 1 quiz
      const courseRes = await request(app).get(`/api/courses/${testCourseId}`);
      const quizLesson = courseRes.body.lessons.find(l => l.contentType === 'quiz');

      if (quizLesson && quizLesson.quiz) {
        const quizRes = await request(app)
          .get(`/api/quizzes/${quizLesson.quiz}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(quizRes.status).toBe(200);

        // Lookup quiz document to submit correct answers dynamically
        const quizDoc = await Quiz.findById(quizLesson.quiz);
        const answers = quizDoc.questions.map((q, idx) => ({
          questionIndex: idx,
          selectedOptions: q.correctAnswers,
        }));

        // Submit quiz answers
        const submitRes = await request(app)
          .post(`/api/quizzes/${quizLesson.quiz}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ answers });

        expect(submitRes.status).toBe(200);
        expect(submitRes.body.result.percentage).toBe(100);
        expect(submitRes.body.result.passed).toBe(true);
      }
    });
  });

  describe('5. Certificate Verification (Step 6)', () => {
    it('GET /api/certificates/verify/:certificateId should verify legitimate certificates', async () => {
      const certRes = await request(app)
        .get('/api/certificates/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(certRes.status).toBe(200);
      if (certRes.body.certificates.length > 0) {
        const sampleCert = certRes.body.certificates[0];
        const verifyRes = await request(app).get(`/api/certificates/verify/${sampleCert.certificateId}`);

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.verified).toBe(true);
        expect(verifyRes.body.certificate.studentName).toBe('Johnathan Cole');
        expect(verifyRes.body.certificate.verificationHash).toBeDefined();
      }
    });

    it('GET /api/certificates/verify/FAKE-ID should reject fake certificate', async () => {
      const res = await request(app).get('/api/certificates/verify/INVALID-FAKE-CERT-1234');
      expect(res.status).toBe(404);
      expect(res.body.verified).toBe(false);
    });
  });

  describe('6. Instructor Revenue & Payouts (Step 7)', () => {
    it('GET /api/instructor/dashboard-stats should return metrics for instructor', async () => {
      const res = await request(app)
        .get('/api/instructor/dashboard-stats')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.netEarnings).toBeGreaterThan(0);
      expect(res.body.coursePerformance).toBeInstanceOf(Array);
      expect(res.body.monthlyChartData).toBeInstanceOf(Array);
    });

    it('GET /api/instructor/dashboard-stats should block non-instructor', async () => {
      const res = await request(app)
        .get('/api/instructor/dashboard-stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});

