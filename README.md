# 🏎️ Nginebreak

> **Your Vehicle. Your Story.**
> Modern, lightweight vehicle maintenance tracker and digital garage web application.

---

## 🛠️ Tech Stack
* **Frontend:** React 19, Vite, React Router v7
* **Styling:** Vanilla CSS with custom Orange & Crisp White theme (`#FF4D00`)
* **Icons:** Lucide React
* **Database:** **Supabase (PostgreSQL)** with offline-capable `localforage` fallback
* **Date Utilities:** date-fns

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (or the port Vite provides) in your browser.

---

## 🗄️ Database & Cloud Sync (Supabase)

Nginebreak supports cloud PostgreSQL storage via **Supabase**.

* **Want to study how Supabase works in this project?**
  Read the complete [Supabase Study Guide (SUPABASE_GUIDE.md)](./SUPABASE_GUIDE.md).
* **Quick Setup:**
  1. Create a free project at [supabase.com](https://supabase.com).
  2. Copy and run the SQL in [`supabase_schema.sql`](./supabase_schema.sql) in your Supabase SQL Editor.
  3. Copy your project URL & Anon Key into `.env`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
  4. Restart the dev server (`npm run dev`).

*Note: If you don't configure Supabase, the app automatically works in **Local Mode** using your browser's IndexedDB storage!*

---

## 📁 Key Project Structure
```
enginebreak/
├── supabase_schema.sql           # PostgreSQL tables & RLS security policies
├── SUPABASE_GUIDE.md             # Supabase study guide & architecture notes
├── src/
│   ├── components/               # Navbar, badges, maintenance cards
│   ├── context/                  # GarageContext.jsx state management
│   ├── pages/                    # GarageDashboard, Vehicles, Profile, etc.
│   ├── services/
│       ├── CalculationEngine.js  # Maintenance intervals & status logic
│       ├── StorageService.js     # Dual-mode storage (Supabase + local cache)
│       └── supabaseClient.js     # Supabase initialization & config check
```
