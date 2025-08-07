const WebSocket = require('ws');

console.log('🧪 Testing Claude Terminal WebSocket...');

// Test connection
const ws = new WebSocket('ws://localhost:5001/ws/claude-terminal?userId=test-user&projectId=test');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  
  // Send a ping
  setTimeout(() => {
    console.log('📤 Sending ping...');
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 1000);
  
  // Send a test command
  setTimeout(() => {
    console.log('📤 Sending test command...');
    ws.send(JSON.stringify({ type: 'input', data: 'Hello Claude! Can you help me?' }));
  }, 2000);
  
  // Close after 10 seconds
  setTimeout(() => {
    console.log('🚪 Closing connection...');
    ws.close();
  }, 10000);
});

ws.on('message', function message(data) {     
  try {
    const parsed = JSON.parse(data);
    console.log(`📨 Received [${parsed.type}]:`, parsed.data || parsed);
  } catch (error) {
    console.log('📨 Raw message:', data.toString());
  }
});

ws.on('close', function close(code, reason) {
  console.log(`🚪 WebSocket closed: ${code} - ${reason}`);
  process.exit(0);
});

ws.on('error', function error(err) {
  console.error('💥 WebSocket error:', err);
  console.error('Error details:', {
    message: err.message,
    code: err.code,
    type: err.type,
    target: err.target
  });
  process.exit(1);
});

// Timeout safety
setTimeout(() => {
  console.log('⏰ Test timeout - closing');
  ws.close();
  process.exit(1);
}, 15000);