
#!/usr/bin/env node

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetWelcome() {
  try {
    await AsyncStorage.removeItem('hasSeenWelcomeTutorial');
    console.log('✅ Welcome tutorial flag reset successfully!');
    console.log('');
    console.log('🌐 Now clear browser localStorage:');
    console.log('');
    console.log('Option 1: Open browser console (F12) and run:');
    console.log('  localStorage.removeItem("hasSeenWelcomeTutorial"); location.reload();');
    console.log('');
    console.log('Option 2: Clear all storage (recommended):');
    console.log('  localStorage.clear(); location.reload();');
    console.log('');
    console.log('Then refresh the page to see welcome screens!');
  } catch (error) {
    console.error('❌ Error resetting welcome flag:', error);
  }
}

resetWelcome();
