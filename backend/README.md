# HirerMind Backend

This is the backend API for HirerMind, an AI-powered recruitment platform.

## Tech Stack

- Node.js
- Express
- MySQL with Sequelize ORM
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v14+)
- MySQL (v8+)

### Installation

1. Clone the repository
2. Navigate to the backend directory
   ```
   cd backend
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Create a .env file based on .env.example and update the values
5. Set up the database
   ```
   mysql -u root -p < database.sql
   ```
6. Start the server
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user info (protected)

### Jobs

- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get a job by ID
- `POST /api/jobs` - Create a new job (protected)
- `GET /api/jobs/user/me` - Get jobs posted by current user (protected)
- `PUT /api/jobs/:id` - Update a job (protected)
- `DELETE /api/jobs/:id` - Delete a job (protected)

## Database Schema

### Users

- id (PK)
- firstName
- lastName
- email (unique)
- password (hashed)
- company
- role
- teamSize
- resetPasswordToken
- resetPasswordExpire
- createdAt
- updatedAt

### Jobs

- id (PK)
- title
- company
- location
- type
- salary
- department
- experience
- description
- requirements
- benefits
- deadline
- isRemote
- skills (JSON array)
- status
- userId (FK)
- createdAt
- updatedAt
