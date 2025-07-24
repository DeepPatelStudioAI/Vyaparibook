// debug.js - A simple script to run the server and catch any errors
try {
  require('./index.js');
} catch(e) {
  console.error('Error loading server:', e);
}