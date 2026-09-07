# Smart Exam Taker - Mobile App

A React Native mobile application for students to take exams offline with AI-powered grading.

## Tech Stack

- **React Native** with **Expo** - Cross-platform mobile development
- **Expo Router** - File-based routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TypeScript** - Type safety
- **StyleSheet** - Native styling (no Tailwind/NativeWind)

## Features

### Authentication
- Email/password registration (student role)
- Login/logout
- Password reset
- Profile management
- Secure token storage

### Student Dashboard
- View available exams
- View exam attempts and scores
- Profile settings with theme customization
- Offline mode indicator

### Exam Taking
- Face capture for identity verification
- Multiple question types (multiple choice, true/false, short answer, essay)
- Timer with auto-submit
- Real-time answer saving

### Offline Support
- Network status detection
- Offline queue for failed submissions
- Automatic sync when back online
- Local data persistence

### Theme System
- Light/Dark/System mode
- Dynamic text scaling (0.8x - 1.2x)
- Persistent preferences

## Project Structure

```
mobile-app/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout with ThemeProvider
│   ├── (auth)/              # Authentication screens
│   │   ├── index.tsx       # Auth redirect
│   │   ├── login.tsx       # Login screen
│   │   ├── register.tsx    # Registration screen
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   └── (student)/           # Student screens
│       ├── index.tsx       # Dashboard
│       ├── profile.tsx     # Profile settings
│       ├── exams/           # Exam screens
│       │   ├── index.tsx   # Available exams
│       │   ├── [id].tsx    # Exam details
│       │   └── take.tsx    # Take exam
│       └── attempts/       # Attempt screens
│           ├── index.tsx   # My attempts
│           └── [id].tsx    # Attempt details
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   └── common/             # Common components
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── api/                # API clients
│   │   ├── client.ts       # Axios instance
│   │   ├── auth.ts         # Auth API
│   │   ├── exams.ts        # Exams API
│   │   └── attempts.ts     # Attempts API
│   ├── storage/            # Storage utilities
│   │   ├── async-storage.ts
│   │   └── secure-storage.ts
│   ├── theme/              # Theme system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── theme.ts
│   └── utils/              # Utilities
│       └── offlineQueue.ts
├── store/                  # Zustand stores
│   ├── authStore.ts
│   ├── examStore.ts
│   └── attemptStore.ts
├── hooks/                  # Custom hooks
│   └── useOnlineStatus.ts
├── constants/
│   └── api.ts              # API endpoints
├── package.json
├── app.json                # Expo config
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
cd mobile-app
npm install
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Environment Variables

The app uses the following API configuration in `constants/api.ts`:

```typescript
BASE_URL: __DEV__ ? 'http://localhost:8000/api/v1' : 'https://api.smartexamtaker.com/api/v1'
```

Update this to match your backend API URL.

## API Integration

The app integrates with the following backend endpoints:

### Auth
- `POST /auth/register` - Register as student
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `PATCH /auth/profile` - Update profile
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Exams
- `GET /exams/available` - Get available exams for student
- `GET /exams/:id` - Get exam details
- `POST /exams/:id/start` - Start an exam
- `POST /exams/:id/complete` - Complete an exam

### Attempts
- `GET /attempts/me` - Get my attempts
- `GET /attempts/:id` - Get attempt details
- `POST /attempts/start` - Start an attempt (with face capture)
- `POST /attempts/:id/submit` - Submit answers

## Security

- **Secure Storage** - Auth tokens stored in Expo SecureStore
- **Generic Errors** - No detailed error messages exposed to users
- **HTTPS** - Production API uses HTTPS
- **Input Validation** - Form validation on all inputs

## Offline Support

The app supports offline exam taking:

1. **Network Detection** - Uses `@react-native-community/netinfo`
2. **Offline Queue** - Failed submissions are queued locally
3. **Auto Sync** - Queued items sync when connection restored
4. **Local Persistence** - Exam data cached locally

## Theme Customization

Users can customize:
- **Theme Mode** - Light, Dark, or System
- **Text Scale** - 0.8x, 1.0x, or 1.2x

Preferences are persisted using AsyncStorage.

## Development Notes

### Removing Tailwind
The project was migrated from Tailwind/NativeWind to pure StyleSheet:
- Removed `tailwind.config.js`
- Removed `nativewind.config.js`
- All components use StyleSheet instead

### Expo Router
- File-based routing in `app/` directory
- Route groups: `(auth)`, `(student)`
- Typed routes enabled in `app.json`

### State Management
- Zustand with persist middleware
- Separate stores for auth, exams, and attempts
- Offline status tracking in attempt store

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Troubleshooting

### Camera Permissions
The app requires camera permissions for face capture. Ensure permissions are properly configured in `app.json`.

### Network Issues
If API calls fail, check:
1. Backend API is running
2. API URL in `constants/api.ts` is correct
3. Network connectivity
4. CORS settings on backend

### Theme Not Applying
Ensure `ThemeProvider` wraps the entire app in `app/_layout.tsx`.

## License

Part of the Smart Exam Taker project.
