# Lakhushya

Lakhushya is a full-stack donation coordination platform that connects donors, NGOs, volunteers, and admins in one workflow. It helps manage donation requests, NGO approvals, volunteer assignment, OTP-based handovers, live tracking, and admin monitoring.

## Overview

The platform is designed to make the donation journey visible and reliable from start to finish:

- Donors can create donations, track progress, fulfill NGO requests, and share feedback.
- NGOs can raise need requests, review incoming donations, and receive final deliveries.
- Volunteers can accept pickup tasks, verify pickup and delivery OTPs, and complete logistics.
- Admins can verify NGOs, monitor donations, review analytics, and manage the ecosystem.

## Core Features

- Role-based dashboards for Donor, NGO, Volunteer, and Admin
- Donation creation and management
- NGO need request publishing and donor fulfillment
- Smart NGO and volunteer routing based on distance and location matching
- OTP verification for pickup and final delivery
- Real-time updates with Socket.IO
- Live donation tracking and route summary
- NGO verification workflow
- Donor feedback collection
- Event creation and listing
- Analytics and admin monitoring

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Axios
- Leaflet

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Nodemailer
- Socket.IO

## Project Structure

```text
lakhushya/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── scripts/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── config.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Main Workflow

1. A donor creates a donation.
2. The backend assigns the nearest suitable NGO.
3. If pickup is required, the backend assigns a volunteer.
4. The donor shares a pickup OTP with the volunteer.
5. The volunteer verifies pickup and transports the donation.
6. The NGO shares a final delivery OTP.
7. The volunteer verifies delivery and completes the flow.
8. The donor can then submit feedback.

## Main Modules

### Backend

- `backend/server.js`: Main Express server, routes, matching logic, OTP flow, live tracking, and Socket.IO
- `backend/models/User.js`: User schema for Donor, NGO, Volunteer, and Admin
- `backend/models/Donation.js`: Donation schema, statuses, route tracking, and OTP checkpoints
- `backend/models/Request.js`: NGO need request schema
- `backend/models/Feedback.js`: Donor feedback schema
- `backend/models/Event.js`: NGO event schema

### Frontend

- `frontend/src/App.js`: App routing
- `frontend/src/pages/Home.jsx`: Landing page
- `frontend/src/pages/Login.jsx`: Login screen
- `frontend/src/pages/Register.jsx`: Registration with OTP verification
- `frontend/src/pages/ForgotPassword.jsx`: Forgot password flow
- `frontend/src/pages/dashboards/DonorDashboard.jsx`: Donor workflow
- `frontend/src/pages/dashboards/NGODashboard.jsx`: NGO workflow
- `frontend/src/pages/dashboards/VolunteerDashboard.jsx`: Volunteer workflow
- `frontend/src/pages/dashboards/AdminDashboard.jsx`: Admin workflow

## Environment Variables

Create a `.env` file inside `backend/` and configure the values below as needed.

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/lakhushya_db

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASS=
MAIL_FROM=

MAX_NGO_DISTANCE_KM=70
PREFERRED_VOLUNTEER_DISTANCE_KM=70
```

Notes:

- If SMTP credentials are not configured, the backend falls back to a JSON mail transport.
- The frontend is currently configured to call `http://localhost:5001`.

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd lakhushya
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Running the Project

### Start backend

From `backend/`:

```bash
npm start
```

Expected default backend URL:

```text
http://localhost:5001
```

### Start frontend

From `frontend/`:

```bash
npm start
```

Expected default frontend URL:

```text
http://localhost:3000
```

## Available Scripts

### Backend

```bash
npm start
npm run dev
npm run backfill:locations
npm run reassign:pending-donations
```

### Frontend

```bash
npm start
npm run build
npm test
```

## Key API Areas

### Authentication

- `POST /send-otp`
- `POST /verify-otp`
- `POST /register`
- `POST /login`
- `POST /reset-password`
- `GET /user/:userId`

### Donations

- `POST /donation/create`
- `GET /donation/:donorId`
- `GET /donation/details/:id`
- `GET /ngo/donations/:ngoId`
- `POST /ngo/accept/:id`
- `POST /ngo/decline/:id`
- `GET /volunteer/pickups/:volunteerId`
- `POST /volunteer/accept/:id`
- `POST /volunteer/decline/:id`

### OTP and Delivery Verification

- `POST /donation/:id/pickup/verify`
- `POST /donation/:id/pickup/otp/send`
- `POST /donation/:id/ngo-delivery/verify`
- `POST /donation/:id/self-delivery/verify`

### Tracking

- `POST /tracking/location`
- `GET /tracking/:donationId`
- `GET /donation/:id/qr`
- `POST /qr/verify`

### Requests

- `POST /request/create`
- `GET /request/all`
- `POST /request/accept/:requestId`

### Admin

- `GET /admin/users`
- `GET /admin/pending-ngos`
- `POST /admin/verify-ngo/:userId`
- `POST /admin/reject-ngo/:userId`
- `GET /admin/donations`
- `GET /admin/analytics`
- `GET /admin/live-map`

### Feedback and Events

- `POST /feedback`
- `GET /admin/feedback`
- `POST /events/create`
- `GET /events`

## Real-Time Updates

Socket.IO is used for live platform updates such as:

- donation status changes
- live tracking updates
- user-specific donation updates
- room-based donation subscriptions

Backend socket rooms include:

- `user:<userId>`
- `donation:<donationId>`

## Database Models

Important collections used by the project:

- `User`
- `Donation`
- `Request`
- `Feedback`
- `Event`
- `Admin`
- `NGO`
- `Volunteer`
- `Pickup`
- `Complaint`

## Current Notes

- Backend `dev` currently runs `node server.js`, so code changes require a restart.
- Backend tests are not configured yet.
- The root repository did not previously contain a top-level README; this file serves as the main project documentation.

## Future Improvements

- Add automated backend tests
- Add Swagger or Postman API documentation
- Add environment sample file
- Add role-based route protection on the frontend
- Add better OTP resend and audit logging flows
- Add deployment instructions

## License

This project is currently distributed without an explicit license file. Add one before public distribution if needed.
