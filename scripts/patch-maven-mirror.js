/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const searchDir = path.join(__dirname, '../node_modules');

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let patched = false;

    // Replace mavenCentral() with Google Mirror
    if (content.includes('mavenCentral()')) {
      content = content.replace(/mavenCentral\(\)/g, "maven { url 'https://maven-central.storage-download.googleapis.com/maven2/' }");
      patched = true;
    }

    // Replace direct Maven Central URLs
    if (content.includes('repo.maven.apache.org/maven2')) {
        content = content.replace(/https:\/\/repo\.maven\.apache\.org\/maven2/g, "https://maven-central.storage-download.googleapis.com/maven2");
        patched = true;
    }
    
    // Replace JCenter (often causes issues too)
    if (content.includes('jcenter()')) {
        content = content.replace(/jcenter\(\)/g, "maven { url 'https://maven-central.storage-download.googleapis.com/maven2/' }");
        patched = true;
    }

    if (patched) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Patched: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error patching ${filePath}:`, err);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  
  try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walk(filePath);
        } else if (file.endsWith('build.gradle') || file.endsWith('build.gradle.kts') || file.endsWith('settings.gradle') || file.endsWith('settings.gradle.kts')) {
          patchFile(filePath);
        }
      }
  } catch (e) {
      console.warn(`Could not read dir ${dir}: ${e.message}`);
  }
}

console.log('Starting Maven Central mirror patch for node_modules...');
walk(searchDir);
console.log('Patch complete.');
