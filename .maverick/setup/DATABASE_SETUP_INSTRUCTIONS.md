# 🗄️ Azure Database + NextAuth Setup Instructions

## ✅ What I've Completed for You:

### **✅ Step 2: Dependencies & Configuration**
- Updated `package.json` with all NextAuth dependencies
- Created Prisma schema with all required tables
- Generated Prisma client
- Created authentication configuration files
- Added database scripts to package.json

### **✅ Step 3: SQL Database Script**
- Generated complete SQL schema for Azure PostgreSQL
- Created foreign key constraints and indexes
- Added verification and setup scripts

## 🚀 What You Need to Do:

### **Step 1: Update Environment Variables**
Add these to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your_generated_secret_here_32_chars_minimum
NEXTAUTH_URL=http://localhost:3000

# Azure Database Configuration  
DATABASE_URL="postgresql://username:password@yourserver.postgres.database.azure.com:5432/yourdatabase?sslmode=require"

# Square API (you already have these)
SQUARE_CLIENT_ID=your_square_client_id
SQUARE_CLIENT_SECRET=your_square_client_secret
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

### **Step 4: Install Dependencies**
```bash
npm install
```

### **Step 5: Run the SQL Script**
Execute the contents of `database-setup.sql` on your Azure PostgreSQL database. You can:

**Option A: Azure Portal Query Editor**
1. Go to your Azure PostgreSQL database
2. Open Query Editor
3. Copy/paste the entire `database-setup.sql` content
4. Execute

**Option B: psql Command Line**
```bash
psql "postgresql://username:password@yourserver.postgres.database.azure.com:5432/yourdatabase?sslmode=require" -f database-setup.sql
```

**Option C: pgAdmin or other GUI tool**
1. Connect to your Azure database
2. Open SQL query window
3. Paste the SQL script and execute

### **Step 6: Verify Database Setup**
```bash
npm run db:verify
```

This will test the connection and verify all tables are created correctly.

### **Step 7: Generate Prisma Client (if needed)**
```bash
npm run db:generate
```

## 📋 SQL Script Summary

The `database-setup.sql` file creates:

### **NextAuth Required Tables:**
- `users` - User accounts with email/password
- `Account` - OAuth account connections (Square, etc.)
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

### **Maverick Business Tables:**
- `square_connections` - Square OAuth tokens and merchant data
- `businesses` - Business formation information
- `business_formations` - Formation workflow tracking
- `chat_sessions` - Chat wizard session data

### **Indexes & Constraints:**
- Unique indexes on email, session tokens, Square merchant IDs
- Foreign key relationships for data integrity
- Proper cascade delete behavior

## 🔧 Available Commands

After setup, you can use these commands:

```bash
# Verify database connection
npm run db:verify

# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

## 🎯 Next Steps After Database Setup

Once your database is running:

1. **Update Login/Register Pages** - Replace custom auth with NextAuth
2. **Test Authentication Flows** - Both email/password and Square OAuth
3. **Integrate Chat Wizard** - Save user sessions to database
4. **Add Session Provider** - Wrap app with NextAuth session context

## 🚨 Troubleshooting

### **Connection Issues:**
- Verify Azure firewall allows your IP
- Check connection string format
- Ensure SSL mode is set to `require`

### **Permission Issues:**
- Verify database user has CREATE, INSERT, UPDATE, DELETE permissions
- Check if user can create tables and indexes

### **Prisma Issues:**
- Run `npm run db:generate` after any schema changes
- Clear `node_modules` and reinstall if needed

## 🔐 Security Notes

- **Never commit** `.env.local` to version control
- **Use strong passwords** for database users
- **Enable Azure firewall** rules appropriately
- **Rotate secrets** regularly in production

Your Azure database will be production-ready with enterprise-grade authentication! 🚀