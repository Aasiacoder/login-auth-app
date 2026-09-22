# Secure Access Hub

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://login-auth-app.lovable.app

## Project Description

What I Built

A login application called Aegis using Lovable (React frontend) connected to Supabase for authentication and database. Live link: https://login-auth-app.lovable.app/

How It Works — End to End

1. New user signs up

User goes to the Sign Up page, enters email and password.
On submit, the frontend calls Supabase Auth's sign-up function.
Supabase creates the account (in a pending unverified state) and sends a confirmation email automatically.
The UI shows: "Check your email to confirm your account, then log in."

2. Email verification

User opens their inbox, clicks the "Verify Email" link Supabase sent.
This hits a Supabase-hosted confirmation endpoint that marks the account as verified — this doesn't touch my app's code directly, it's Supabase's built-in auth handling.

3. Login

User returns to the app and logs in with email/password.
The frontend sends these credentials to Supabase Auth, which checks them against the securely hashed password stored in Supabase's auth.users table (I never see or store raw passwords myself).
On success, Supabase returns a session token (JWT), which the frontend stores to keep the user logged in.

4. Protected Home screen

Once authenticated, the user is redirected to the Home screen showing "Hello World."
This route is protected — if someone isn't logged in and tries to access it directly, they're bounced back to Login. The app checks the session token before rendering the page.
The user's last login is tracked and stored in a users_profile table in the Supabase database, tied to their user ID.

5. Logout

Clicking Logout clears the session token, ending the authenticated state and returning the user to the Login screen.

Extra features I added beyond the minimum requirement:

Forgot password flow (sends a secure reset email, with expired-link handling)
Real-time form validation with inline error messages (e.g., "That email and password don't match")
Confirm-password check on sign-up
Loading states on buttons for better UX

## Tech Stack

TypeScript
CSS
Supabase
