# 🧭 Meridian - DevOps Culture Enhancement Platform

![Meridian Logo](https://img.shields.io/badge/Meridian-DevOps_Platform-blue?style=for-the-badge&logo=github)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-00C7B7?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat&logo=nextdotjs)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=flat&logo=google)](https://ai.google.dev)

## 🎯 Elevator Pitch
Meridian fixes DevOps chaos: students learn with guided paths, professionals get AI insights, managers track team performance. One platform, zero confusion.

---

## 🌟 What is Meridian?

Meridian is a comprehensive DevOps culture enhancement platform that bridges the gap between learning and doing. It provides AI-powered insights, guided learning journeys, and data-driven management tools to transform how teams approach DevOps.

### 🎭 Three Experiences, One Platform

**🎓 Student Dashboard**
- Guided DevOps learning paths with real-world scenarios
- Hands-on labs and interactive modules
- Progress tracking and skill assessment
- Repository-based learning recommendations

**👨‍💻 Professional Dashboard**
- AI-powered GitHub repository analysis
- Real-time performance insights and metrics
- Code quality assessment and improvement suggestions
- Team collaboration tools and project management

**👨‍💼 Manager Dashboard**
- Team performance analytics and health monitoring
- Project status tracking and risk assessment
- Data-driven decision making tools
- Resource allocation and capacity planning

---

## 🚀 Key Features

### 🤖 AI-Powered Intelligence
- **Gemini AI Integration**: Advanced repository analysis and personalized recommendations
- **Predictive Analytics**: Project risk forecasting and team performance trends
- **Smart Insights**: Automated code quality assessment and improvement suggestions
- **Intelligent Learning**: Personalized DevOps learning paths based on skill level

### 📊 Real-Time Analytics
- **GitHub Integration**: Live repository data and commit analysis
- **Team Performance Metrics**: Velocity, quality scores, and productivity tracking
- **Project Health Monitoring**: Progress tracking, risk assessment, and timeline prediction
- **DevOps Culture Assessment**: Team collaboration and practices evaluation

### 🎯 Role-Based Experiences
- **Personalized Dashboards**: Tailored interfaces for different user roles
- **Progressive Learning**: From beginner to expert DevOps journey
- **Cross-Functional Collaboration**: Seamless team communication and project management
- **Data-Driven Insights**: Actionable recommendations for continuous improvement

---

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance API framework with automatic documentation
- **SQLite**: Lightweight database for rapid development (PostgreSQL-ready)
- **Python 3.13**: Latest Python features and performance improvements
- **Gemini AI API**: Google's advanced generative AI for intelligent insights

### Frontend
- **Next.js 14**: React framework with server-side rendering and optimization
- **TypeScript**: Type-safe development with enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Hooks**: Modern state management and component lifecycle

### AI & Analytics
- **Google Gemini**: Advanced AI for repository analysis and recommendations
- **GitHub API**: Real-time repository data and collaboration insights
- **Custom Analytics Engine**: Performance tracking and predictive modeling
- **Machine Learning**: Pattern recognition for team optimization

---

## 🔧 Installation & Setup

### Prerequisites
- Python 3.13+
- Node.js 18+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/itisaby/Meridian.git
cd Meridian
```

### 2. Backend Setup
```bash
cd Backend
pip install -r requirements.txt
cp .env.example .env
# Add your Gemini API key to .env file
python -m uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd meridian-nextjs
npm install
npm run dev
```

### 4. Environment Configuration
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to `Backend/.env`:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
3. Optional: Add GitHub token for enhanced repository analysis

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 📖 User Guide

### For Students
1. **Start Learning**: Choose from curated DevOps learning paths
2. **Practice**: Complete hands-on labs and real-world scenarios
3. **Track Progress**: Monitor your skill development and achievements
4. **Get Certified**: Earn recognition for completing learning modules

### For Professionals
1. **Connect Repository**: Link your GitHub repositories for analysis
2. **Review Insights**: Get AI-powered recommendations for improvement
3. **Monitor Performance**: Track code quality and team collaboration
4. **Optimize Workflow**: Implement suggested DevOps best practices

### For Managers
1. **View Analytics**: Access comprehensive team and project dashboards
2. **Track Progress**: Monitor project health and team performance
3. **Make Decisions**: Use data-driven insights for strategic planning
4. **Allocate Resources**: Optimize team capacity and project assignments

---

## 🎨 Project Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External APIs │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (GitHub/Gemini)│
│                 │    │                 │    │                 │
│ • Dashboards    │    │ • API Routes    │    │ • Repository    │
│ • User Interface│    │ • AI Services   │    │   Data          │
│ • Auth Context  │    │ • Database      │    │ • AI Analysis   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema
- **Users**: Authentication and profile management
- **Projects**: Team projects and repository associations
- **Learning Paths**: Educational content and progress tracking
- **Analytics**: Performance metrics and insights storage

---

## 🤖 AI Implementation

**Yes, I extensively integrated Google's Gemini AI throughout Meridian for intelligent DevOps insights and personalized experiences.**

### AI-Powered Features
- **Repository Analysis**: Gemini evaluates code quality, team collaboration patterns, and project health
- **Personalized Learning**: AI curates learning content based on individual progress and generates DevOps scenarios
- **Predictive Analytics**: AI models forecast project risks, team performance trends, and identify potential bottlenecks
- **Smart Recommendations**: Real-time actionable insights for improving DevOps practices across all user roles

### Technical Implementation
- Custom AI analysis engine integrated throughout backend services
- Dedicated API endpoints for AI-driven insights
- Real-time processing of GitHub data transformed into intelligent recommendations
- Role-based AI experiences tailored for Students, Professionals, and Managers

---

## 🏆 Technology Feedback

**Gemini API** was incredibly powerful for generating intelligent DevOps insights and repository analysis. The API responses were fast and contextually accurate for code quality assessment. **GitHub API** provided seamless integration for real-time repository data. **FastAPI** made backend development efficient with automatic documentation. **Next.js** delivered excellent performance for the dashboard interfaces. **SQLite** was perfect for rapid prototyping. Overall, this tech stack enabled rapid development of a comprehensive AI-powered platform.

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📈 Future Roadmap

### Phase 1: Core Enhancement
- [ ] Advanced learning modules with certification paths
- [ ] Enhanced AI-powered code review and suggestions
- [ ] Mobile application for on-the-go monitoring
- [ ] Integration with popular DevOps tools (Jenkins, Docker, Kubernetes)

### Phase 2: Enterprise Features
- [ ] Multi-tenant architecture for enterprise deployments
- [ ] Advanced security and compliance tracking
- [ ] Custom reporting and analytics dashboards
- [ ] White-label solutions for organizations

### Phase 3: Community Platform
- [ ] Developer community features and forums
- [ ] Knowledge sharing and best practices library
- [ ] Peer mentoring and collaboration tools
- [ ] Industry-specific DevOps templates

---

## 👨‍💻 About the Creator

**Arnab Maity** - Full Stack Developer & DevOps Enthusiast

- 🌐 [GitHub](https://github.com/itisaby)
- 📧 Contact: [your-email@domain.com]

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini AI**: For providing powerful AI capabilities
- **GitHub API**: For enabling seamless repository integration
- **FastAPI Community**: For the amazing web framework
- **Next.js Team**: For the incredible React framework
- **Open Source Community**: For the tools and libraries that made this possible

---

<div align="center">

**Made with ❤️ for the DevOps Community**

[![Star this repo](https://img.shields.io/github/stars/itisaby/Meridian?style=social)](https://github.com/itisaby/Meridian)
[![Follow on GitHub](https://img.shields.io/github/followers/itisaby?style=social)](https://github.com/itisaby)

</div>