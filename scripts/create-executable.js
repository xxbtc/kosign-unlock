const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Creating Single Executable Package...\n');

// First, install pkg if not available
try {
    execSync('pkg --version', { stdio: 'ignore' });
} catch (error) {
    console.log('📦 Installing pkg...');
    execSync('npm install -g pkg', { stdio: 'inherit' });
}

// Configuration
const distDir = 'dist-executable';
const packageName = 'kosign-unlock-executable';
const packageDir = path.join(distDir, packageName);

// Clean and create directories
console.log('📁 Setting up directories...');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(packageDir, { recursive: true });

// Copy build directory
console.log('📦 Copying build files...');
execSync(`cp -r build "${packageDir}/"`, { stdio: 'inherit' });

// Create server for pkg
const pkgServer = `const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// For pkg, we need to reference the snapshot filesystem
const buildPath = path.join(__dirname, 'build');

app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log('\\n🔓 Kosign Unlock Server Started');
  console.log('=====================================');
  console.log(\`✅ Server running at: http://localhost:\${port}\`);
  console.log('✅ No internet connection required!');
  console.log('=====================================');
  console.log('\\n💡 Open your browser and go to the URL above');
  console.log('🛑 Press Ctrl+C to stop the server\\n');
});`;

fs.writeFileSync(path.join(packageDir, 'server-pkg.js'), pkgServer);

// Create package.json for pkg
const pkgPackage = {
    name: "kosign-unlock-executable",
    version: "1.0.0",
    main: "server-pkg.js",
    pkg: {
        targets: ["node16-win-x64", "node16-macos-x64", "node16-linux-x64"],
        assets: ["build/**/*"]
    },
    dependencies: {
        express: "^4.18.2"
    }
};

fs.writeFileSync(
    path.join(packageDir, 'package.json'), 
    JSON.stringify(pkgPackage, null, 2)
);

// Install dependencies and build
console.log('⬇️  Installing dependencies...');
process.chdir(packageDir);
execSync('npm install', { stdio: 'inherit' });

console.log('🔨 Building executables...');
execSync('pkg . --out-path executables', { stdio: 'inherit' });

console.log('\n✅ Executables created successfully!');
console.log('📍 Location:', path.resolve('executables'));

// List created files
const executableDir = path.join(packageDir, 'executables');
if (fs.existsSync(executableDir)) {
    const files = fs.readdirSync(executableDir);
    console.log('\n📁 Created executables:');
    files.forEach(file => {
        const stats = fs.statSync(path.join(executableDir, file));
        console.log(`  • ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    });
}

process.chdir('../../');

console.log('\n🎉 Done! Users can now run the executable directly!'); 