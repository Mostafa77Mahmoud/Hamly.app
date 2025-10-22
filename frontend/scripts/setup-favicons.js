#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const assetsDir = path.join(__dirname, '../assets/images');

console.log('📦 Setting up favicons...');

// Copy icon files
const iconFiles = [
  { src: 'icon.png', dest: 'apple-touch-icon.png' },
  { src: 'icon.png', dest: 'favicon.png' },
  { src: 'icon.png', dest: 'icon-192.png' }
];

iconFiles.forEach(({ src, dest }) => {
  const srcPath = path.join(assetsDir, src);
  const destPath = path.join(distDir, dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${src} → ${dest}`);
  }
});

// Create manifest.json
const manifest = {
  name: 'Hamly',
  short_name: 'Hamly',
  description: 'تطبيق متابعة الحمل والصحة',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#e91e63',
  icons: [
    {
      src: '/favicon.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/apple-touch-icon.png',
      sizes: '192x192',
      type: 'image/png'
    }
  ]
};

fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Created manifest.json');

// Update index.html with icon links
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Check if icons are already added
  if (!html.includes('rel="manifest"')) {
    // Find the closing </head> tag
    const headCloseIndex = html.indexOf('</head>');
    if (headCloseIndex !== -1) {
      const iconLinks = `  <link rel="manifest" href="/manifest.json" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#e91e63" />`;
      
      html = html.slice(0, headCloseIndex) + iconLinks + html.slice(headCloseIndex);
      fs.writeFileSync(indexPath, html);
      console.log('✅ Updated index.html with icon links');
    }
  } else {
    console.log('ℹ️  Icon links already present in index.html');
  }
}

console.log('🎉 Favicon setup complete!');
