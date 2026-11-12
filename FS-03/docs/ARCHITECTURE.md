# EduFlow Live LMS: Full-Stack Architecture Documentation

## 1. High-Level System Architecture

EduFlow Live is an enterprise-grade Learning Management System engineered using the MERN stack with asynchronous media processing, WebRTC peer-to-peer streaming, and edge CDN distribution.

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 18 + Vite + Redux Toolkit)"]
        UI["Tailwind CSS Web Application"]
        Redux["Redux Toolkit Store\n(auth, courses, player, liveRoom, instructor)"]
        Player["Hls.js Adaptive Video Player\n(Quality Selector 360p/720p/Auto)"]
        WebRTCClient["WebRTC Media Engine\n(Mic, Cam, Screen Share, Audio)"]
    end

    subgraph CDN["Edge & Storage Layer"]
        CF["AWS CloudFront CDN\n(Edge Caching & Low-Latency Video Chunks)"]
        S3["AWS S3 / Local Video Storage\n(master.m3u8, .ts chunks, thumbnails)"]
    end

    subgraph Backend["API & Signaling Tier (Node.js + Express)"]
        Express["Express.js REST API Server\n(Port 5000)"]
        SocketServer["Socket.IO Signaling & Chat Server\n(WebRTC SDP Offer/Answer/ICE)"]
        AuthRBAC["JWT Auth & RBAC Middleware\n(Student, Instructor, Admin)"]
        CertEngine["PDFKit & Crypto Certificate Generator\n(SHA-256 Verification & QR Code)"]
    end

    subgraph QueueWorkers["Asynchronous Queue Tier"]
        BullQueue["BullMQ / Bull Job Queue\n(Redis 6379)"]
        Worker["Video Transcode Worker Process"]
        FFmpegBin["FFmpeg & FFprobe Transcoder\n(Multi-bitrate HLS: 720p, 360p)"]
    end

    subgraph Databases["Persistence Tier"]
        MongoDB[("MongoDB 8.0\n(Users, Courses, Lessons, Quizzes, Certificates, Transactions)")]
        RedisStore[("Redis Data Store\n(Queue State, Locks, Caching)")]
    end

    %% Client Interactions
    UI --> Redux
    UI --> Player
    UI --> WebRTCClient
    UI -- "REST API (JSON / JWT)" --> Express
    UI -- "Signaling & Chat" --> SocketServer

    %% Streaming Deliveries
    CF --> Player
    S3 --> CF

    %% Backend Services
    Express --> AuthRBAC
    Express --> CertEngine
    Express --> MongoDB
    Express -- "Enqueue Video Jobs" --> BullQueue
    BullQueue --> RedisStore
    BullQueue --> Worker
    Worker --> FFmpegBin
    FFmpegBin -- "Write HLS (.m3u8, .ts)" --> S3
    Worker -- "Socket Progress (0-100%)" --> SocketServer

    %% WebRTC Signaling
    SocketServer <--> WebRTCClient
```

---

## 2. Media Processing & Delivery Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Instructor as Instructor Client
    participant API as Express API Server
    participant Queue as BullMQ Video Queue
    participant Worker as Transcode Worker
    participant FFmpeg as FFmpeg Engine
    participant S3 as CloudFront / HLS Storage
    participant Socket as Socket.IO Hub
    actor Student as Student Client

    Instructor->>API: POST /api/lessons/:id/upload-video (multipart/form-data)
    API->>API: Save raw video to uploads/videos/
    API->>Queue: Enqueue Job (lessonId, rawFilePath, outputDir)
    API-->>Instructor: 202 Accepted (transcodeStatus: 'pending')
    
    Queue->>Worker: Dispatch Transcoding Job
    Worker->>Socket: Emit 'transcode-progress' (status: 'processing', 5%)
    Worker->>FFmpeg: Probe video duration & metadata (ffprobe)
    Worker->>FFmpeg: Transcode 720p Rendition (libx264, 2500k bitrate, 6s HLS segments)
    Worker->>FFmpeg: Transcode 360p Rendition (libx264, 800k bitrate, 6s HLS segments)
    Worker->>FFmpeg: Extract poster thumbnail at 00:00:01
    Worker->>Worker: Generate master.m3u8 manifest linking 720p & 360p
    Worker->>S3: Write master.m3u8 & .ts segments
    Worker->>Socket: Emit 'transcode-progress' (status: 'ready', 100%)
    Worker->>Worker: Update MongoDB Lesson document (streamingUrl, duration)

    Student->>API: GET /api/lessons/:id (enrolled check)
    API-->>Student: Lesson details with CloudFront HLS URL
    Student->>S3: Fetch master.m3u8 & .ts chunks via CloudFront CDN
    Student->>Student: Hls.js renders adaptive multi-bitrate video stream
```

---

## 3. WebRTC Live Classroom Signaling Protocol

```mermaid
sequenceDiagram
    autonumber
    actor PeerA as Peer A (Instructor)
    participant Socket as Socket.IO Signaling Server
    actor PeerB as Peer B (Student)

    PeerA->>Socket: join-room { roomId: 'room-webrtc-101', user }
    PeerB->>Socket: join-room { roomId: 'room-webrtc-101', user }
    Socket-->>PeerA: user-joined { socketId: PeerB.id, user: PeerB }

    PeerA->>PeerA: Create RTCPeerConnection & capture getUserMedia()
    PeerA->>PeerA: Generate SDP Offer
    PeerA->>Socket: offer { targetSocketId: PeerB.id, offer }
    Socket->>PeerB: offer { callerSocketId: PeerA.id, offer }

    PeerB->>PeerB: Set Remote Description (Offer)
    PeerB->>PeerB: Generate SDP Answer
    PeerB->>Socket: answer { targetSocketId: PeerA.id, answer }
    Socket->>PeerA: answer { responderSocketId: PeerB.id, answer }

    PeerA->>Socket: ice-candidate { targetSocketId: PeerB.id, candidate }
    Socket->>PeerB: ice-candidate { senderSocketId: PeerA.id, candidate }

    Note over PeerA,PeerB: Direct P2P Media Stream Established (Encrypted SRTP)
```

---

## 4. Database Schema Relationships

```mermaid
erDiagram
    User ||--o{ Course : creates
    User ||--o{ Enrollment : purchases
    User ||--o{ QuizSubmission : submits
    User ||--o{ Certificate : earns
    User ||--o{ Transaction : makes
    User ||--o{ PayoutRequest : requests
    
    Course ||--|{ Lesson : contains
    Course ||--o{ Enrollment : has
    Course ||--o{ LiveSession : hosts
    Course ||--o{ Review : receives
    
    Lesson ||--o| Quiz : includes
    Enrollment ||--o| Certificate : generates
    Enrollment ||--o| Transaction : originates_from
```

