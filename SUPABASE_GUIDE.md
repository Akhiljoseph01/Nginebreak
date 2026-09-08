# 🚀 Supabase Quick Study Guide for Nginebreak

A simple, minimal guide to understanding how **Supabase** connects to this project, why it was chosen, and how to set it up in 5 minutes.

---

## 1. What is Supabase?

**Supabase** is an open-source, cloud-hosted backend platform built entirely on top of **PostgreSQL** (the world's most trusted relational database).

Think of it as:
> **Real PostgreSQL Database + Instant REST API + User Authentication + File Storage**

Unlike traditional databases where you must write a Node.js/Express backend server to query the database, Supabase provides an **auto-generated secure API** that your Vite + React app can query directly from the browser.

---

## 2. Why Supabase for Nginebreak's MVP?

| Requirement | Traditional Database (e.g., Neon / AWS RDS) | Supabase |
| :--- | :--- | :--- |
| **Backend Server** | ❌ Needs a dedicated backend (Express, Nest, etc.) | ✅ **Zero backend required** (connects directly from Vite React) |
| **Security** | Handled in server code | ✅ **Row Level Security (RLS)** directly in Postgres |
| **Free Tier Storage** | ~500 MB DB | ✅ **500 MB PostgreSQL DB + 1 GB Free File Storage** (for car photos/receipts) |
| **Offline Mode** | Must be custom-built | ✅ Nginebreak uses a **dual-mode**: works offline locally & syncs to Supabase |

---

## 3. How It Works in Nginebreak

```
+-------------------------------------------------------------+
|                     Nginebreak React UI                     |
|  (GarageDashboard, Vehicles, VehicleProfile, Maintenance)   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|             src/services/StorageService.js                  |
|  - Checks if Supabase credentials exist                     |
|  - If YES: Queries Supabase PostgreSQL                      |
|  - If NO / Offline: Falls back to local IndexedDB (Cache)   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               @supabase/supabase-js Client                  |
|       (Communicates securely using your Anon Public Key)    |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                   Supabase Cloud (PostgreSQL)               |
|  - vehicles table                                           |
|  - maintenance_modules table                                |
|  - service_history table                                    |
+-------------------------------------------------------------+
```

---

## 4. 5-Minute Setup Guide

### Step 1: Create a Free Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (GitHub or email).
2. Click **New Project**.
3. Choose a name (e.g., `nginebreak-db`), enter a database password, and select the region closest to you.
4. Wait ~1 minute for your database to provision.

### Step 2: Create the Database Tables
1. In your Supabase dashboard, click the **SQL Editor** tab in the left sidebar (icon with `>_`).
2. Open the file `supabase_schema.sql` in this project repository.
3. Copy all its content, paste it into the Supabase SQL Editor, and click **Run**.
4. That's it! Tables (`vehicles`, `maintenance_modules`, `service_history`) and security policies are created.

### Step 3: Connect to Nginebreak
1. In your Supabase dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy two values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> `anon` `public` key
3. Open the `.env` file in the root of this project and paste them:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

4. Restart your Vite dev server:
```bash
npm run dev
```

The app will automatically detect your Supabase connection! Any vehicle you add will now be stored in your live cloud PostgreSQL database.

---

## 5. Key Files to Study in this Codebase

1. [supabase_schema.sql](file:///d:/work/project/enginebreak/supabase_schema.sql)
   * The SQL commands that define the relational schema, foreign keys, cascade deletes, and security policies.
2. [src/services/supabaseClient.js](file:///d:/work/project/enginebreak/src/services/supabaseClient.js)
   * Where the Supabase client is initialized using Vite's `import.meta.env`.
3. [src/services/StorageService.js](file:///d:/work/project/enginebreak/src/services/StorageService.js)
   * The bridge between the React components and the database. Notice how each function has Supabase cloud sync while keeping local caching active.
4. [.env.example](file:///d:/work/project/enginebreak/.env.example)
   * The template showing required environment variables.

---

## 6. What About Photos / Vehicle Images?
Supabase includes **Supabase Storage** (1 GB free). When you want to add photo uploads for vehicles or receipts:
1. Create a bucket named `vehicle-media` in Supabase Storage.
2. Upload the file using `supabase.storage.from('vehicle-media').upload(...)`.
3. Save the returned public URL in the vehicle record.
