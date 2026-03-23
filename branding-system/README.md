# 🎨 BrandFlow — Branding Process Management System

A complete role-based workflow system for managing branding requests from initiation to completion.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/your-org/branding-system.git
cd branding-system

# Install all dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, etc.
```

### 3. Seed the Database
```bash
cd backend
node src/scripts/seed.js
```

### 4. Run Development Servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000

### Demo Login Credentials
| Role        | Email                      | Password     |
|-------------|----------------------------|--------------|
| Admin       | admin@branding.com         | password123  |
| Marketplace | marketplace@branding.com   | password123  |
| MIS Team    | mis@branding.com           | password123  |
| Recce Team  | recce@branding.com         | password123  |
| Vendor      | vendor@branding.com        | password123  |

---

## 🐳 Docker Deployment (Recommended)

### Option A: Docker Compose (Single Server)

```bash
# 1. Clone the repo on your server
git clone https://github.com/your-org/branding-system.git
cd branding-system

# 2. Create production env file
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://yourdomain.com
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EOF

# 3. Start all services
docker compose up -d

# 4. Seed the database (first time only)
docker compose exec backend node src/scripts/seed.js
```

Application runs on http://your-server-ip

### Option B: Render.com (Free Tier)

**Backend (Web Service)**
1. Connect GitHub repo
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Add environment variables from `.env.example`

**Frontend (Static Site)**
1. Root directory: `frontend`
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

**Database**: Use MongoDB Atlas (free tier)

### Option C: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy frontend
cd ../frontend
railway init
railway up
```

### Option D: AWS (Production Scale)

**Architecture:**
```
Route 53 (DNS)
    ↓
CloudFront (CDN + HTTPS)
    ↓              ↓
S3 (Frontend)   ALB (Load Balancer)
                    ↓
             ECS Fargate (Backend)
                    ↓
         DocumentDB / Atlas (MongoDB)
                    ↓
             S3 (File Uploads)
```

**Steps:**
1. Deploy MongoDB Atlas cluster in ap-south-1
2. Build and push Docker images to ECR
3. Create ECS Fargate service with the backend image
4. Deploy frontend build to S3 + CloudFront
5. Configure ALB to route /api/* to ECS

---

## 🔧 Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Random secret for JWT signing (32+ chars) | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3 | ❌ |
| `AWS_S3_BUCKET` | S3 bucket name for uploads | ❌ |
| `EMAIL_HOST` | SMTP host for notifications | ❌ |
| `EMAIL_USER` | SMTP email address | ❌ |
| `EMAIL_PASS` | SMTP app password | ❌ |

---

## 📁 Project Structure

```
branding-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── middleware/       # Auth, upload middleware
│   │   ├── models/          # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── BrandingRequest.js
│   │   │   └── Notification.js
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── requests.js  # Core workflow
│   │   │   ├── recce.js
│   │   │   ├── vendors.js
│   │   │   ├── dashboard.js
│   │   │   └── notifications.js
│   │   ├── services/        # Email service
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/      # Layout, StatusBadge, WorkflowTracker
│   │   ├── context/         # Auth context
│   │   ├── pages/           # All page components
│   │   ├── utils/           # API client, status helpers
│   │   └── styles/          # Global CSS
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Requests
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/requests` | All | List requests (filtered by role) |
| POST | `/api/requests` | Marketplace/Admin | Create request |
| GET | `/api/requests/:id` | All | Get request detail |
| PUT | `/api/requests/:id/assign-recce` | MIS/Admin | Assign to recce |
| PUT | `/api/requests/:id/approve` | Admin | Approve/reject |
| PUT | `/api/requests/:id/assign-vendor` | MIS/Admin | Assign to vendor |

### Recce
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| PUT | `/api/recce/:id/update` | Recce | Update progress + images |
| PUT | `/api/recce/:id/complete` | Recce | Submit final report |

### Vendors
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/vendors` | MIS/Admin | List vendors |
| PUT | `/api/vendors/:id/start` | Vendor | Start work |
| PUT | `/api/vendors/:id/complete` | Vendor | Mark complete + images |

### Dashboard & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Role-specific KPIs |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Role-based access control (RBAC) on every endpoint
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- File type validation (images + PDF only)
- 10MB file size limit
- CORS restricted to frontend URL
- Passwords hashed with bcrypt (12 rounds)
- Non-root Docker user

---

## 📊 Database Schema (Key Fields)

### BrandingRequest
```
requestNumber   BR-2024-0001 (auto-generated)
status          created → assigned_to_recce → recce_in_progress → awaiting_approval → approved/rejected → assigned_to_vendor → work_completed
location        { address, city, state, pincode, landmark }
recce           { notes, estimatedCost, images[], siteCondition, feasibility }
approval        { approvedBy, finalBudget, comment }
vendorWork      { actualCost, images[], notes }
activities      [] — full audit log
sla             { createdAt, assignedToRecceAt, recceCompletedAt, ... }
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2024 BrandFlow
