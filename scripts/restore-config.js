#!/usr/bin/env node

/**
 * Configuration Restore Script
 * Restores the original Azure SQL database configuration
 */

const fs = require('fs')

console.log('🔄 Restoring Original Configuration')
console.log('===================================')

try {
  // Restore original files
  if (fs.existsSync('.env.local.backup')) {
    fs.copyFileSync('.env.local.backup', '.env.local')
    fs.unlinkSync('.env.local.backup')
    console.log('✅ Restored .env.local')
  }

  if (fs.existsSync('prisma/schema.prisma.backup')) {
    fs.copyFileSync('prisma/schema.prisma.backup', 'prisma/schema.prisma')
    fs.unlinkSync('prisma/schema.prisma.backup')
    console.log('✅ Restored prisma/schema.prisma')
  }

  // Clean up temporary files
  if (fs.existsSync('.env.local.temp')) {
    fs.unlinkSync('.env.local.temp')
    console.log('✅ Cleaned up temporary .env.local.temp')
  }

  if (fs.existsSync('prisma/schema.prisma.temp')) {
    fs.unlinkSync('prisma/schema.prisma.temp')
    console.log('✅ Cleaned up temporary prisma/schema.prisma.temp')
  }

  // Remove test database
  if (fs.existsSync('dev.db')) {
    fs.unlinkSync('dev.db')
    console.log('✅ Removed test database')
  }

  console.log('')
  console.log('🎉 Configuration restored successfully!')
  console.log('You can now run: npx prisma generate')
  console.log('To reconnect to your Azure SQL database')

} catch (error) {
  console.error('❌ Restore failed:', error.message)
}