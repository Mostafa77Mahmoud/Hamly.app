
#!/bin/bash

echo "🧹 Clearing cache and storage..."
rm -rf .expo node_modules/.cache

echo "📱 Starting Expo with cleared storage..."
echo "⚠️  Don't forget to clear browser storage too!"
echo ""
echo "Run this in browser console:"
echo "localStorage.clear(); location.reload();"
echo ""

npm run dev:web
