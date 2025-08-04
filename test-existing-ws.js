const WebSocket = require('ws');

console.log('🧪 Testing existing Claude Code WebSocket...');

// Test the existing Claude Code WebSocket
const ws = new WebSocket('ws://localhost:5001/api/claude-code/ws?sessionId=test&userId=test-user');

ws.on('open', function open() {
  console.log('✅ Existing WebSocket connected successfully!');
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
  console.error('💥 WebSocket error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏰ Test timeout');
  ws.close();
  process.exit(1);
}, 8000);