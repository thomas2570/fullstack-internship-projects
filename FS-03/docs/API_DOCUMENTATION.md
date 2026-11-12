# EduFlow Live LMS: REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Users (`/api/auth`)

### `POST /api/auth/register`
Creates a new student or instructor account.
- **Access**: Public
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "student", // "student" | "instructor"
  "headline": "Full-Stack Engineer"
}
```
- **Response** `201 Created`:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "673...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student"
  }
}
```

### `POST /api/auth/login`
Authenticates user and returns JWT bearer token.
- **Access**: Public
- **Body**: `{ "email": "dr.alex@eduflow.com", "password": "password123" }`

### `GET /api/auth/me`
Retrieves current authenticated profile.
- **Access**: Private (Bearer Token)

---

## 2. Courses (`/api/courses`)

### `GET /api/courses`
Lists published courses with filtering and sorting.
- **Query Parameters**:
  - `category`: Filter by category (e.g. `Web Development`)
  - `level`: Filter by level (e.g. `Advanced`)
  - `search`: Keyword search matching title, description, or tags
  - `sort`: `popular` | `rating` | `price_asc` | `price_desc`

### `GET /api/courses/:identifier`
Returns complete course details, syllabus sections, lessons preview, and enrollment status.

### `POST /api/courses`
Creates a new course.
- **Access**: Private (`instructor`, `admin`)
- **Body**:
```json
{
  "title": "Production Distributed Systems with BullMQ",
  "subtitle": "Learn message queues and worker scaling",
  "description": "Deep dive into Redis and BullMQ...",
  "category": "DevOps & Architecture",
  "level": "Intermediate",
  "price": 69
}
```

---

## 3. Lessons & Video Transcoding (`/api/lessons`)

### `POST /api/lessons`
Creates a lesson in a course module.
- **Access**: Private (`instructor`, `admin`)
- **Body**:
```json
{
  "courseId": "673...",
  "title": "Introduction to HLS Streaming",
  "sectionTitle": "Module 1",
  "contentType": "video",
  "isFreePreview": true
}
```

### `POST /api/lessons/:id/upload-video`
Uploads raw video and enqueues FFmpeg transcoding job into BullMQ.
- **Access**: Private (`instructor`, `admin`)
- **Content-Type**: `multipart/form-data`
- **Field**: `video` (file: MP4, WebM, MOV)
- **Response** `202 Accepted`:
```json
{
  "success": true,
  "message": "Video uploaded successfully. Transcoding job queued.",
  "jobId": "12",
  "lesson": {
    "_id": "673...",
    "videoStatus": "pending",
    "transcodeProgress": 0
  }
}
```

### `GET /api/lessons/:id`
Retrieves lesson details and CloudFront HLS streaming URL (`master.m3u8`).
- **Access**: Free preview is public; regular lessons require active Enrollment or instructor ownership.

### `GET /api/lessons/:id/transcode-status`
Polls transcode progress (0-100%) and streaming URL.

---

## 4. Quizzes & Auto-Grading (`/api/quizzes`)

### `POST /api/quizzes`
Creates an auto-graded assessment.
- **Access**: Private (`instructor`, `admin`)
- **Body**:
```json
{
  "courseId": "673...",
  "lessonId": "673...",
  "title": "Architecture Knowledge Check",
  "passingScore": 70,
  "questions": [
    {
      "questionText": "What does HLS stand for?",
      "options": [
        { "id": "opt_1", "text": "HTTP Live Streaming" },
        { "id": "opt_2", "text": "High Latency Service" }
      ],
      "correctAnswers": ["opt_1"],
      "explanation": "HLS was developed by Apple for adaptive media delivery."
    }
  ]
}
```

### `POST /api/quizzes/:id/submit`
Submits quiz answers, triggers auto-grading, calculates points, updates course progress, and issues certificate if course completes.
- **Access**: Private (`student`)
- **Body**:
```json
{
  "answers": [
    { "questionIndex": 0, "selectedOptions": ["opt_1"] }
  ]
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "result": {
    "score": 1,
    "totalPoints": 1,
    "percentage": 100,
    "passed": true,
    "passingScore": 70,
    "answers": [...]
  },
  "earnedCertificate": { ... }
}
```

---

## 5. Live Classes (`/api/live`)

### `GET /api/live`
Lists all active and upcoming live sessions.

### `GET /api/live/room/:roomId`
Returns room metadata and instructor info for WebRTC session.

### `POST /api/live/schedule`
Schedules a live virtual classroom.
- **Access**: Private (`instructor`, `admin`)
- **Body**:
```json
{
  "courseId": "673...",
  "title": "Live Masterclass: Real-Time WebRTC Architecture",
  "scheduledStartTime": "2026-11-12T18:00:00.000Z",
  "scheduledDurationMinutes": 60
}
```

---

## 6. Certificates (`/api/certificates`)

### `GET /api/certificates/verify/:certificateId`
Public verification endpoint.
- **Access**: Public
- **Response** `200 OK`:
```json
{
  "success": true,
  "verified": true,
  "certificate": {
    "certificateId": "EDF-2026-F62058D4",
    "studentName": "Johnathan Cole",
    "courseTitle": "Full-Stack Web Architecture: Modern MERN & WebRTC",
    "instructorName": "Dr. Alex Mercer",
    "issueDate": "2026-11-10T11:41:30.000Z",
    "verificationHash": "d8a1c8f4...",
    "pdfUrl": "/uploads/certificates/EDF-2026-F62058D4.pdf"
  }
}
```

### `GET /api/certificates/download/:certificateId`
Streams generated high-resolution PDF certificate as an attachment.

---

## 7. Payments & Instructor Revenue (`/api/payments` & `/api/instructor`)

### `POST /api/payments/confirm`
Completes test checkout:
- Creates `Transaction`
- Splits 70% to instructor earnings / 30% to platform
- Enrolls student into course
- **Access**: Private

### `GET /api/instructor/dashboard-stats`
Returns instructor financial metrics:
- Gross revenue, net earnings, pending balance, withdrawn amount
- Monthly revenue chart aggregation
- Course performance breakdown
- Recent sales transactions
- **Access**: Private (`instructor`, `admin`)

### `POST /api/instructor/payout-request`
Submits payout request (min $10) via PayPal or Bank Transfer.
- **Access**: Private (`instructor`, `admin`)

