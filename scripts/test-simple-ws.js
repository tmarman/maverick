const WebSocket = require('ws');

console.log('🧪 Testing simple WebSocket connection...');

// Test connection with required userId parameter
const ws = new WebSocket('ws://localhost:5001/ws/claude-terminal?userId=test-user');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  ws.close();
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
}, 10000);