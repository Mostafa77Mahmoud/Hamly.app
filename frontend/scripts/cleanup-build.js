
const fs = require('fs');
const path = require('path');

function cleanupDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist`);
    return;
  }

  const files = fs.readdirSync(dir);
  let removedFiles = 0;
  let removedDirs = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      cleanupDirectory(filePath);
      // Remove empty directories
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        removedDirs++;
        console.log(`Removed empty directory: ${filePath}`);
      }
    } else if (stat.size === 0) {
      fs.unlinkSync(filePath);
      removedFiles++;
      console.log(`Removed empty file: ${filePath}`);
    }
  });

  console.log(`\nCleanup complete:`);
  console.log(`- Removed ${removedFiles} empty files`);
  console.log(`- Removed ${removedDirs} empty directories`);
}

// Start cleanup from dist directory
cleanupDirectory(path.join(__dirname, '..', 'dist'));
