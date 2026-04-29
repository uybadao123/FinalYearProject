//(auth)/_layout.tsx

// This is the layout for all auth screens (login, register, etc.)

import { Stack } from 'expo-router';


export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}