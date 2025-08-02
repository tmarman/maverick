require('dotenv').config({ path: '.env.local' })
const { Connection, Request } = require('tedious')

const config = {
  server: 'marmandb.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: 'tmarman',
      password: 'y*!8pf3QjZ%nOsh9'
    }
  },
  options: {
    database: 'maverick',
    encrypt: true,
    trustServerCertificate: true,
    port: 1433,
    connectTimeout: 30000,
    requestTimeout: 30000,
    enableArithAbort: true
  }
}

console.log('🔍 Detailed Database Connection Debug')
console.log('====================================')
console.log('Server:', config.server)
console.log('Database:', config.options.database)
console.log('User:', config.authentication.options.userName)
console.log('Encrypt:', config.options.encrypt)
console.log('Trust Certificate:', config.options.trustServerCertificate)

const connection = new Connection(config)

connection.on('connect', (err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message)
    console.error('Error code:', err.code)
    console.error('State:', err.state)
    console.error('Class:', err.class)
    console.error('Server name:', err.serverName)
    console.error('Proc name:', err.procName)
    console.error('Line number:', err.lineNumber)
    process.exit(1)
  } else {
    console.log('✅ Connected successfully!')
    
    // Test a simple query
    const request = new Request('SELECT COUNT(*) as user_count FROM users', (err, rowCount) => {
      if (err) {
        console.error('❌ Query failed:', err.message)
      } else {
        console.log(`📊 Query completed, ${rowCount} rows returned`)
      }
      connection.close()
    })
    
    request.on('row', (columns) => {
      console.log('👥 User count:', columns[0].value)
    })
    
    connection.execSql(request)
  }
})

connection.on('debug', (text) => {
  console.log('🐛 Debug:', text)
})

connection.on('infoMessage', (info) => {
  console.log('ℹ️  Info:', info.message)
})

connection.on('errorMessage', (error) => {
  console.error('🚨 Error message:', error.message)
})

console.log('🔌 Attempting connection...')
connection.connect()