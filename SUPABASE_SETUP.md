# Admin setup (Supabase), one time, about 10 minutes

The website works without any of this (it shows its built-in menu). Do these steps to get the `/admin` page,
where you can add, edit, hide, reorder and delete menu items and upload photos.

## 1. Create the project
1. Go to https://supabase.com and sign up (free).
2. Click **New project**. Name it `ds-divine-crust`, set a database password (save it somewhere), pick the region closest to India (Mumbai if shown).

## 2. Create the tables and photo storage
1. In the project, open **SQL Editor** > **New query**.
2. Open `supabase/schema.sql` from this folder, copy everything, paste it, click **Run**.

## 3. Create the admin login
1. Open **Authentication** > **Users** > **Add user** > **Create new user**.
2. Enter your email and a strong password. Tick **Auto Confirm User**.
3. Open **Authentication** > **Sign In / Providers** (or **Settings**) and turn **off** "Allow new users to sign up",
   so that only the user you created can log in.

## 4. Connect the website
1. Open **Project Settings** > **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In this folder, copy `.env.example` to a new file named `.env` and fill it in:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   The anon key is meant to be public. Never use the **service_role** key anywhere in this project.
4. Restart `npm run dev`.

## 5. Use it
1. Open http://localhost:5173/admin and sign in.
2. First time only: click **Import the current menu** to copy today's menu into the database.
3. Add or edit items. Photos are resized to 1200px WebP automatically when you upload.

## When you deploy (Netlify or Vercel)
Add the same two values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's **Environment variables**
settings. `public/_redirects` and `vercel.json` already make `/admin` work.

## Costing calculator (admin only)
The costing calculator lives at `/admin/calc`. It is only visible after you sign in at `/admin`
(there is a "Costing calculator" button on the admin page). Anyone not signed in is sent to the login.

One-time setup:
1. Supabase > **SQL Editor** > **New query**, paste everything from `supabase/calc.sql`, click **Run**.
2. Sign in at `/admin`, click **Costing calculator**.

To bring over data from your old calculator (the Express + MongoDB version): in the old app go to
**Settings** and export the database as JSON, then in the new calculator go to **Settings** and import that file.
The old `D:\calc` server is no longer needed.
