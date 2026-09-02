# 🎓 Campus Lost & Found

A community-driven digital noticeboard designed for college and university campuses. Built with **React Native (Expo)** for cross-platform mobile delivery and a **Node.js / Express / MongoDB** backend.

---

## 🌟 Key Features

- **📌 Interactive Noticeboard**: Filter lost and found items by Category (*ID Card, Keys, Phone, Bag, Wallet, etc.*), Location (*Library, Canteen, Parking, Classrooms*), and Date.
- **📸 Visual Evidence**: Real-time photo capture and gallery uploads powered by Cloudinary with automatic optimization.
- **🔒 Secure Claim Verification**: Finders can record private notes (e.g., specific markings, serial numbers) hidden from public view to securely verify claimant ownership proofs.
- **🤝 Contact & Return Workflow**: Once proof is accepted, finders and claimants can directly connect via one-tap Call and Email actions.
- **📬 Real-time Notifications**: Automated alerts for submitted claims, approved claims, and item status updates.
- **📰 Editorial Noticeboard Aesthetic**: A curated, vintage-inspired palette with tactile feedback and responsive design.

---

## 🏗️ Project Architecture

```
lost-found-app/
├── app/                  # Expo Router file-based screens & navigation
│   ├── (tabs)/           # Tab screens (Noticeboard, Found, Claims, Alerts, Profile)
│   ├── _layout.jsx       # Root navigation layout
│   ├── login.jsx         # User authentication login
│   ├── report.jsx        # Report Lost / Found Item form
│   └── signup.jsx        # New student registration
├── components/           # Reusable UI widgets (DrawerMenu, DatePicker, etc.)
├── constants/            # Design system, color tokens, and typography
├── context/              # Global state (AuthContext, DrawerContext)
├── server/               # Express.js backend API
│   ├── middleware/       # Auth (JWT) & file upload handlers
│   ├── models/           # Mongoose schemas (User, LostItem, FoundItem, Claim, Notification)
│   ├── routes/           # REST endpoints (/auth, /lost-items, /found-items, /claims, etc.)
│   ├── scripts/          # Database seeding and cleanup utilities
│   ├── utils/            # Cloudinary, email, and socket helpers
│   ├── server.js         # Entry point for backend server
│   └── package.json      # Server dependencies
├── utils/                # Client API client (Axios) & token storage
└── package.json          # Mobile app dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Expo Go** on your physical iOS/Android device or an Android/iOS emulator
- **MongoDB** (Local instance or MongoDB Atlas URI)

---

### 2. Server Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in your MongoDB connection string, JWT secret, and Cloudinary credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lost-found-app
   JWT_SECRET=your_jwt_secret_key_here
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Seed initial campus data (optional):
   ```bash
   node scripts/seedProvidedData.js
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

---

### 3. Mobile App Setup

1. From the project root directory:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

3. Scan the QR code using the **Expo Go** app on Android or the Camera app on iOS.

---

## 🛡️ Security & Privacy

- Sensitive environment variables (`.env`) are strictly excluded from git tracking.
- Finder private verification notes are never exposed in public noticeboard API responses.
- Passwords are encrypted using salted bcrypt hashing.
- Student accounts are scoped by college email domain.
