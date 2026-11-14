# Shop Rent Management System

Web application for managing rent and electricity for 13 shops.

**Stack:** Supabase (PostgreSQL + Auth + Row Level Security) + Vanilla JavaScript

## Features (MVP)

- Secure login (email + password)
- Dashboard with overview of expected vs collected rent and outstanding
- Shop profiles (tenant, monthly rent, meter, status)
- Record rent payments (cash / bKash / bank)
- Record electricity bills per shop (readings + amount)
- Track paid / unpaid electricity
- Monthly reports
- Mobile-friendly responsive UI
- **Row Level Security** — only authenticated users can read or write data

## Setup Steps

### 1. Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Copy your Project URL and anon/public key

### 2. Run the Schema
1. In Supabase Dashboard → **SQL Editor**
2. Paste and run the full contents of `sql/schema.sql`
3. This creates tables, indexes, RLS policies, and seeds 13 shops

### 3. Create your login user
1. Go to **Authentication → Users**
2. Click **Add user** → Create a new user with email + password

### 4. Configure the App
1. Open `public/js/config.js`
2. Replace the placeholders with your Supabase URL and anon key

---

## Deploy to Vercel (Recommended)

### Method 1: Deploy from GitHub (Best)

1. Create a new GitHub repository and upload the project files
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Important settings:
   - **Framework Preset**: Other
   - **Root Directory**: `public`
   - Leave Build Command and Output Directory empty
5. Click **Deploy**

### Method 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# From the project root
cd shop-rent-app
vercel

# When asked:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: shop-rent-manager (or any name)
# - In which directory is your code located? ./public
```

### Method 3: Drag & Drop

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the entire `public` folder onto the page
3. Deploy

---

## After Deployment

1. Your app will be live at a URL like:  
   `https://shop-rent-manager.vercel.app`

2. Open the URL → you should see the login screen

3. Sign in with the user you created in Supabase

### Important Notes for Production

- Make sure you updated `public/js/config.js` with your real Supabase keys **before** deploying
- In Supabase → Authentication → URL Configuration, add your Vercel domain to **Redirect URLs** and **Site URL** (optional but recommended)
- The free Vercel plan is more than enough for this app

---

## Project Structure

```
shop-rent-app/
├── README.md
├── sql/
│   ├── schema.sql
│   └── rls-migration.sql
└── public/                  ← This is what you deploy
    ├── index.html
    ├── styles.css
    └── js/
        ├── config.js        ← Put your Supabase keys here
        ├── supabase.js
        └── app.js
```

## Local Development

```bash
npx serve public
```

Then open the URL it gives you (usually http://localhost:3000).

## Next Steps
- Tenant portal
- Payment reminders
- Multi-owner support with stricter RLS
```