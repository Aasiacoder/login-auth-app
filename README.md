# Secure Access Hub

Build a simple login application in React.js with the following requirements:

Pages & Flow:

A Login screen with email and password fields, a "Log In" button, and a link to a Sign Up screen.

A Sign Up screen with email and password fields to create a new account.

After successful login, redirect the user to a protected "Home" screen that displays "Hello World" in large, centered text.

If a non-authenticated user tries to access the Home screen directly, redirect them back to the Login screen.

Add a "Log Out" button on the Home screen that ends the session and returns to Login.

Authentication & Database:

Use Supabase for authentication (email/password) and as the backend database.

On successful login, store the user's ID and last login timestamp in a users_profile table in Supabase, and display the last login time on the Home screen.

Design & Animation:

Dark theme throughout the app.

Soft gradient blur shapes in the background (subtle, not distracting).

A hero-style 3D animated icon or illustration on the Login screen (e.g., a subtly rotating or floating 3D lock/shield icon).

Smooth page transition animations between Login, Sign Up, and Home screens — each transition should have its own distinct animation style (e.g., fade for login→home, slide for login↔signup).

Keep all animations minimal and tasteful — no flashy or excessive motion, just enough to feel polished and modern.

Clean, modern typography and spacing; the overall feel should be premium and minimal, not cluttered.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://login-auth-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa9faecc-5304-4383-aa16-c6b25dbef43d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
