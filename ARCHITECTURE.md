# 🏗️ Meridian Architecture Diagram

## 🎯 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MERIDIAN DEVOPS PLATFORM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   🎓 STUDENT    │    │ 👨‍💻 PROFESSIONAL │    │ 👨‍💼 MANAGER     │    │  🤖 AI AGENTS   │
│   DASHBOARD     │    │   DASHBOARD     │    │   DASHBOARD     │    │                 │
│                 │    │                 │    │                 │    │ • Learning AI   │
│ • Learning Path │    │ • Repo Analysis │    │ • Team Analytics│    │ • Code AI       │
│ • Progress      │    │ • Performance   │    │ • Project Mgmt  │    │ • Manager AI    │
│ • Assessments   │    │ • Insights      │    │ • Decision Data │    │                 │
│                 │    │                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          └──────────────────────┼──────────────────────┼──────────────────────┘
                                 │                      │
                   ┌─────────────┴──────────────────────┴─────────────┐
                   │                                                  │
                   │            🌐 NEXT.JS FRONTEND                   │
                   │                                                  │
                   │  • TypeScript + React                           │
                   │  • Tailwind CSS                                 │
                   │  • Role-Based Routing                           │
                   │  • Real-time UI Updates                         │
                   │  • Responsive Design                            │
                   │                                                  │
                   └─────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS + JWT Auth
                                 │
                   ┌─────────────┴────────────────────────────────────┐
                   │                                                  │
                   │            ⚡ FASTAPI BACKEND                    │
                   │                                                  │
                   │  • Python 3.13                                  │
                   │  • Async/Await Architecture                     │
                   │  • Auto API Documentation                       │
                   │  • Role-Based Access Control                    │
                   │  • Request Validation                           │
                   │                                                  │
                   └─────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         │                       │                       │
┌────────▼────────┐    ┌─────────▼─────────┐    ┌───────▼───────┐
│                 │    │                   │    │               │
│  💾 DATABASE    │    │   🤖 AI SERVICES   │    │ 🔗 EXTERNAL   │
│     LAYER       │    │                   │    │    APIs       │
│                 │    │                   │    │               │
│ • SQLite/       │    │ • Gemini AI       │    │ • GitHub API  │
│   PostgreSQL    │    │ • Custom Analytics│    │ • OAuth       │
│ • User Mgmt     │    │ • Repo Analyzer   │    │ • Rate Limits │
│ • Projects      │    │ • Learning Engine │    │ • Webhooks    │
│ • Analytics     │    │ • Predictions     │    │               │
│ • Learning Data │    │                   │    │               │
│                 │    │                   │    │               │
└─────────────────┘    └───────────────────┘    └───────────────┘
```

---

## 🔧 Detailed Component Architecture

### 🎨 Frontend Layer (Next.js)

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 PAGES LAYER                                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │   Student   │ Professional│   Manager   │   Shared Pages  │  │
│  │ Dashboard   │  Dashboard  │ Dashboard   │                 │  │
│  │             │             │             │ • Auth          │  │
│  │ • Learning  │ • Repo      │ • Team      │ • Settings      │  │
│  │ • Progress  │   Analysis  │   Analytics │ • Profile       │  │
│  │ • Assess.   │ • Performance│ • Projects │ • Landing       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                 │
│  🧩 COMPONENTS LAYER                                           │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │    Charts   │    Forms    │   Layout    │   UI Elements   │  │
│  │             │             │             │                 │  │
│  │ • Analytics │ • Profile   │ • Header    │ • Buttons       │  │
│  │ • Progress  │ • Settings  │ • Sidebar   │ • Cards         │  │
│  │ • Metrics   │ • Login     │ • Footer    │ • Modals        │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                 │
│  🔧 UTILITIES LAYER                                            │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ Token Mgmt  │ API Client  │   Context   │     Hooks       │  │
│  │             │             │             │                 │  │
│  │ • Auth      │ • HTTP      │ • Auth      │ • useAuth       │  │
│  │ • Storage   │ • Errors    │ • Theme     │ • useApi        │  │
│  │ • Security  │ • Cache     │ • User      │ • useAnalytics  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### ⚡ Backend Layer (FastAPI)

```
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🛣️ API ROUTES LAYER                                           │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │    Auth     │  Analytics  │  Manager    │   Learning      │  │
│  │   Routes    │   Routes    │   Routes    │    Routes       │  │
│  │             │             │             │                 │  │
│  │ • Login     │ • Repo      │ • Team      │ • Paths         │  │
│  │ • Register  │   Analysis  │   Data      │ • Progress      │  │
│  │ • Profile   │ • Performance│ • Projects │ • Assessments   │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                 │
│  🏢 SERVICES LAYER                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ AI Analysis │   GitHub    │  Profile    │   Database      │  │
│  │  Service    │  Service    │  Service    │    Service      │  │
│  │             │             │             │                 │  │
│  │ • Gemini    │ • Repo Data │ • User Mgmt │ • CRUD Ops      │  │
│  │   Integration│ • API Calls │ • Settings  │ • Migrations    │  │
│  │ • Analytics │ • Rate Limit│ • Auth      │ • Connections   │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                 │
│  💾 DATA MODELS LAYER                                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │    Users    │  Projects   │  Analytics  │  Learning       │  │
│  │             │             │             │                 │  │
│  │ • Profile   │ • Metadata  │ • Metrics   │ • Paths         │  │
│  │ • Auth      │ • Teams     │ • History   │ • Progress      │  │
│  │ • Settings  │ • Status    │ • Reports   │ • Assessments   │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI SERVICES ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🧠 GEMINI AI CORE                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Google Gemini API                       │ │
│  │                                                             │ │
│  │  • Natural Language Processing                             │ │
│  │  • Code Analysis & Review                                  │ │
│  │  • Predictive Analytics                                    │ │
│  │  • Personalized Recommendations                            │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                   │                             │
│  ⚙️ AI SERVICE LAYER            │                             │
│  ┌─────────────┬─────────────────┼─────────────┬─────────────┐ │
│  │ Repo        │    Learning     │   Manager   │   Core      │ │
│  │ Analyzer    │    AI Engine    │   AI        │   Utils     │ │
│  │             │                 │             │             │ │
│  │ • Code      │ • Path Gen      │ • Team      │ • Prompt    │ │
│  │   Quality   │ • Progress      │   Analytics │   Templates │ │
│  │ • Security  │ • Personalize  │ • Insights  │ • Response  │ │
│  │ • Patterns  │ • Assessments  │ • Forecasts │   Parsing   │ │
│  └─────────────┴─────────────────┴─────────────┴─────────────┘ │
│                                                                 │
│  📊 AI DATA PIPELINE                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Input → Processing → Analysis → Output → Storage          │ │
│  │                                                             │ │
│  │  GitHub   Gemini    Insights   Dashboard   Database        │ │
│  │  Data  →  AI API →  Engine  →  Updates  →  Storage         │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 USER INTERACTION                                           │
│   │                                                             │
│   ▼                                                             │
│  🌐 Frontend (Next.js)                                         │
│   │                                                             │
│   ▼                                                             │
│  🔐 Authentication & Authorization                              │
│   │                                                             │
│   ▼                                                             │
│  ⚡ Backend API (FastAPI)                                      │
│   │                                                             │
│   ├─────────────────┬─────────────────┬─────────────────┐       │
│   ▼                 ▼                 ▼                 ▼       │
│  💾 Database       🤖 AI Services    🔗 GitHub API    📊 Cache  │
│   │                 │                 │                 │       │
│   │                 ▼                 ▼                 │       │
│   │               🧠 Gemini AI      📈 Repo Data        │       │
│   │                 │                 │                 │       │
│   │                 ▼                 ▼                 │       │
│   │               📋 Analysis       📊 Metrics          │       │
│   │                 │                 │                 │       │
│   └─────────────────┼─────────────────┼─────────────────┘       │
│                     │                 │                         │
│                     ▼                 ▼                         │
│                   📱 Dashboard Updates                          │
│                     │                                           │
│                     ▼                                           │
│                   👤 User Interface                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🛡️ FRONTEND SECURITY                                          │
│  • JWT Token Management                                        │
│  • Role-Based UI Rendering                                     │
│  • HTTPS Enforcement                                           │
│  • Input Validation                                            │
│  • XSS Protection                                              │
│                                                                 │
│  🔐 API SECURITY                                               │
│  • JWT Authentication                                          │
│  • Role-Based Access Control (RBAC)                           │
│  • Rate Limiting                                               │
│  • Request Validation                                          │
│  • CORS Configuration                                          │
│                                                                 │
│  🗄️ DATA SECURITY                                             │
│  • Environment Variables                                       │
│  • API Key Management                                          │
│  • Database Encryption                                         │
│  • Secure Connections                                          │
│  • Data Sanitization                                           │
│                                                                 │
│  🔗 EXTERNAL API SECURITY                                     │
│  • OAuth 2.0 Integration                                       │
│  • Secure Token Storage                                        │
│  • API Rate Limiting                                           │
│  • Error Handling                                              │
│  • Audit Logging                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE SCHEMA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👥 USERS                    📚 LEARNING_PATHS                 │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │ • id (PK)       │        │ • id (PK)       │                │
│  │ • name          │   ┌────┤ • user_id (FK)  │                │
│  │ • email         │   │    │ • title         │                │
│  │ • role          │   │    │ • description   │                │
│  │ • github_token  │   │    │ • progress      │                │
│  │ • created_at    │   │    │ • status        │                │
│  └─────────────────┘   │    └─────────────────┘                │
│           │             │                                       │
│           │             │    📊 ANALYTICS                      │
│           │             │    ┌─────────────────┐               │
│           │             │    │ • id (PK)       │               │
│           └─────────────┼────┤ • user_id (FK)  │               │
│                         │    │ • project_id    │               │
│                         │    │ • metrics       │               │
│                         │    │ • timestamp     │               │
│                         │    │ • type          │               │
│                         │    └─────────────────┘               │
│                         │                                       │
│  🗂️ PROJECTS            │    🏷️ PROJECT_MEMBERS               │
│  ┌─────────────────┐    │    ┌─────────────────┐               │
│  │ • id (PK)       │    │    │ • project_id    │               │
│  │ • name          │    └────┤ • user_id (FK)  │               │
│  │ • description   │         │ • role          │               │
│  │ • manager_id    │─────────┤ • joined_at     │               │
│  │ • status        │         │ • permissions   │               │
│  │ • created_at    │         └─────────────────┘               │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 PRODUCTION ENVIRONMENT                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Load Balancer                          │ │
│  └─────────────┬───────────────────────────┬───────────────────┘ │
│                │                           │                     │
│  ┌─────────────▼───────────┐    ┌─────────▼───────────┐         │
│  │     Frontend Tier       │    │     Backend Tier    │         │
│  │   (Next.js / Vercel)    │    │  (FastAPI / Railway)│         │
│  │                         │    │                     │         │
│  │ • Static Assets         │    │ • API Endpoints     │         │
│  │ • CDN Distribution      │    │ • Business Logic    │         │
│  │ • Edge Functions        │    │ • AI Integration    │         │
│  └─────────────────────────┘    └─────────┬───────────┘         │
│                                           │                     │
│                                ┌─────────▼───────────┐         │
│                                │    Database Tier    │         │
│                                │ (PostgreSQL/Cloud)  │         │
│                                │                     │         │
│                                │ • User Data         │         │
│                                │ • Analytics         │         │
│                                │ • Backups           │         │
│                                └─────────────────────┘         │
│                                                                 │
│  🔗 EXTERNAL INTEGRATIONS                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ GitHub API  │  Gemini AI  │  OAuth Providers │  Monitoring │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Frontend**: CDN distribution, edge caching
- **Backend**: Load balancing, microservices architecture
- **Database**: Read replicas, sharding strategies
- **AI Services**: Request queuing, response caching

### Performance Optimization
- **Caching**: Redis for session management and API responses
- **Database**: Indexing, query optimization, connection pooling
- **API**: Rate limiting, request batching, async processing
- **Frontend**: Code splitting, lazy loading, image optimization

### Monitoring & Observability
- **Application Monitoring**: Performance metrics, error tracking
- **Infrastructure**: Resource utilization, uptime monitoring
- **Security**: Audit logs, intrusion detection
- **Business Metrics**: User engagement, feature usage analytics

---

*This architecture diagram represents the current implementation of Meridian and serves as a blueprint for future enhancements and scaling strategies.*
