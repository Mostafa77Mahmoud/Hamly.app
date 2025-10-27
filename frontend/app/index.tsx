
import { View } from 'react-native';

// This component renders nothing - all navigation logic is handled by RootLayoutNav in _layout.tsx
// which properly waits for auth state and welcome tutorial status before redirecting
export default function Index() {
  return <View style={{ flex: 1 }} />;
}
