# 🎓 Mr. Stylo Academy - Premium Mock Test Platform

A modern, responsive web application for creating and taking mock tests with full admin panel.

## ✨ Features

### 🚀 For Students
- Take mock tests with timer
- Instant results with detailed analysis
- Topic-wise performance report
- Leaderboard to compare scores
- Review answers with explanations

### 👨‍🏫 For Admin
- Create/Edit/Delete exams
- Manage categories
- View all results with filters
- Export results (PDF, Excel, JSON)
- System settings & configuration
- Backup & restore data
- Real-time analytics

### 📱 Technical Features
- Progressive Web App (PWA)
- Offline support
- Mobile responsive
- MathJax support (LaTeX)
- Firebase integration
- Local storage fallback
- Service Worker caching

## 🛠️ Installation

### Option 1: GitHub Pages (Recommended)
1. Fork this repository
2. Enable GitHub Pages in settings
3. Your site will be live at: `https://username.github.io/repo-name/`

### Option 2: Manual Setup
1. Download all files
2. Upload to your web server
3. Update Firebase config in `firebase-config.js`
4. Access via your domain

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database
3. Update `firebase-config.js` with your credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};