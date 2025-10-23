# Retreat Frontend

A modern React application for managing receipts and warranty information.

## Features

- 🔐 **Authentication**: Clerk.dev integration for secure user management
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- 🎨 **Modern UI**: Built with Tailwind CSS and Lucide React icons
- 📊 **Dashboard**: Clean interface to view and manage receipts
- 🔍 **Search**: Find receipts quickly with search functionality
- 📤 **Upload**: Support for PDF uploads and email text parsing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Clerk authentication:
   - Create an account at [clerk.dev](https://clerk.dev)
   - Create a new application
   - Copy your publishable key
   - Create a `.env.local` file with:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_key_here
   ```

3. Start the development server:
```bash
npm run dev
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Clerk.dev** for authentication
- **Lucide React** for icons
- **React Router** for navigation

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx    # Main dashboard component
│   └── Landing.tsx      # Landing page for unauthenticated users
├── App.tsx             # Main app component with routing
├── main.tsx           # App entry point
└── index.css          # Global styles with Tailwind
```

## Next Steps

- Connect to backend API
- Implement receipt parsing logic
- Add email forwarding functionality
- Set up payment processing for premium features