const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router (send all requests to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log('\n🔓 Kosign Unlock Server Started');
  console.log('=====================================');
  console.log(`✅ Server running at: http://localhost:${port}`);
  console.log('✅ No internet connection required!');
  console.log('=====================================');
  console.log('\n💡 Open your browser and go to the URL above');
  console.log('🛑 Press Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Kosign Unlock server...');
  process.exit(0);
}); 