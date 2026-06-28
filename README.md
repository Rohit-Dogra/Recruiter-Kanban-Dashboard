# HirerMind - AI-powered Recruitment Platform

𝐇𝐢𝐫𝐞𝐫𝐌𝐢𝐧𝐝 is a full-stack AI-powered recruitment platform designed to streamline the entire hiring process. The platform enables organizations to create and manage job postings, track candidates through various hiring stages, conduct application screening with custom questions, schedule interviews, and analyze hiring metrics. Built with modern web technologies, it features secure user authentication and integrates AI capabilities for generating interview questions, making recruitment more efficient and data-driven.

𝗠𝗮𝗶𝗻 𝗙𝘂𝗻𝗰𝘁𝗶𝗼𝗻 𝗣𝗼𝗶𝗻𝘁𝘀

1. 𝐉𝐨𝐛 𝐌𝐚𝐧𝐚𝐠𝐞𝐦𝐞𝐧𝐭: Create, edit, and manage job postings
2. 𝐂𝐚𝐧𝐝𝐢𝐝𝐚𝐭𝐞 𝐏𝐢𝐩𝐞𝐥𝐢𝐧𝐞: Track candidates through hiring stages
3. 𝐀𝐩𝐩𝐥𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐒𝐲𝐬𝐭𝐞𝐦: Custom application forms with screening questions
4. 𝐈𝐧𝐭𝐞𝐫𝐯𝐢𝐞𝐰 𝐒𝐜𝐡𝐞𝐝𝐮𝐥𝐢𝐧𝐠: Schedule and manage interviews
5. 𝐀𝐧𝐚𝐥𝐲𝐭𝐢𝐜𝐬 𝐃𝐚𝐬𝐡𝐛𝐨𝐚𝐫𝐝: Track hiring metrics and performance
6. 𝐔𝐬𝐞𝐫 𝐀𝐮𝐭𝐡𝐞𝐧𝐭𝐢𝐜𝐚𝐭𝐢𝐨𝐧: Secure login and registration system
7. 𝐀𝐈-𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝 𝐉𝐨𝐛 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: Generate JD and  other requirement according to Job role using AI
7. 𝐀𝐈-𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: Generate custom interview questions using AI


## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- shadcn-ui components
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- MySQL database with Sequelize ORM
- JWT authentication
- Express-validator for input validation

## Project Structure

```
hirer-mind/
├── src/                 # Frontend React application
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── backend/            # Node.js API server
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   └── routes/         # API routes
└── public/             # Static assets
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)
- npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd hirer-mind
```

2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Set up the database
```bash
# Create database and tables
mysql -u root -p < backend/database.sql
```

4. Configure environment variables
- Copy `backend/.env.example` to `backend/.env`
- Update database credentials and JWT secret
- Set `VITE_API_URL` in root `.env` file

5. Start the application
```bash
# Start both frontend and backend
npm run dev:all

# Or start separately
npm run dev      # Frontend (port 8080)
npm run backend  # Backend (port 5000)
```

## API Endpoints

- `/api/auth` - Authentication (login, register, password reset)
- `/api/jobs` - Job management
- `/api/candidates` - Candidate operations
- `/api/applications` - Application handling
- `/api/interviews` - Interview scheduling
- `/api/dashboard` - Analytics data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
