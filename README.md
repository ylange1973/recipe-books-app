# My Recipe Books

A family recipe collection app built with React + Firebase.

## Deploy in 5 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Test locally
```bash
npm run dev
```
Open http://localhost:5173

### 3. Push to GitHub
1. Create a new repo at github.com (e.g. `recipe-books-app`)
2. Run:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/recipe-books-app.git
git push -u origin main
```

### 4. Deploy to Vercel
1. Go to vercel.com → "Add New Project"
2. Import your GitHub repo
3. Leave all settings as default — Vercel auto-detects Vite
4. Click **Deploy**

Your app will be live at `https://recipe-books-app.vercel.app` (or similar).

### 5. Share with beta users
Share the Vercel URL. Users register themselves with email + password.

## Firebase setup reminder
- Firestore rules: currently in test mode — tighten before going public
- Authentication: Email/Password enabled
- Project: my-recipe-books-22c8a

## Tech stack
- React 18 + Vite
- Firebase Auth + Firestore
- Claude API (recipe extraction + translation)
