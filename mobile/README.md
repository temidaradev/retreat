# Retreat Mobile App

React Native mobile application for Retreat - Receipt & Warranty Manager.

## Features

- 📱 Native iOS and Android app
- 🔐 Clerk authentication integration
- 📷 Camera integration for receipt photos
- 📄 PDF receipt upload
- 📧 Email forwarding setup
- 🔔 Warranty expiration notifications
- 🌙 Dark/Light theme support
- 💾 Offline storage support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://api.retreat-app.tech
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

3. Start development server:
```bash
npm start
```

## Development

- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm start` - Start Expo dev server

## Building

Use EAS Build for production builds:
```bash
npx eas build --platform ios
npx eas build --platform android
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/        # Screen components
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation setup
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── assets/             # Images, fonts, etc.
└── app.json           # Expo configuration
```

