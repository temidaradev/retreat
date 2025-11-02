# React Native Mobile App Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Android SDK Setup

If you get "Failed to resolve the Android SDK path" error:

1. Set ANDROID_HOME in your shell:
```bash
export ANDROID_HOME=/home/temidaradev/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

2. Add to your `~/.zshrc` or `~/.bashrc`:
```bash
export ANDROID_HOME=/home/temidaradev/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

3. Verify:
```bash
echo $ANDROID_HOME
adb version
```

## Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your Clerk publishable key
```

3. Start development server:
```bash
npm start
```

## Development

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile/
├── src/
│   ├── screens/        # Screen components
│   ├── components/      # Reusable components  
│   ├── services/        # API services
│   ├── hooks/          # Custom hooks
│   ├── navigation/     # Navigation setup
│   ├── utils/          # Utilities
│   ├── types/          # TypeScript types
│   └── config/         # Configuration
├── assets/             # Images, fonts
├── App.tsx            # Root component
├── app.json           # Expo config
└── package.json       # Dependencies
```

## Next Steps

1. ✅ Project structure created
2. ✅ API service ported
3. ✅ Navigation setup
4. 🔄 Port Dashboard screen (in progress)
5. ⏳ Add camera/file picker for receipts
6. ⏳ Implement offline storage
7. ⏳ Add push notifications
8. ⏳ Test on devices

## Building for Production

### iOS
```bash
npx eas build --platform ios
```

### Android
```bash
npx eas build --platform android
```

## Notes

- Using Expo for easier development and deployment
- Clerk authentication integrated
- Native camera and file picker ready to implement
- API service matches web version for consistency

