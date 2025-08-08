---
smartCategory:
  id: infrastructure-devops
  name: Infrastructure & DevOps
  team: Infrastructure & DevOps
  color: #EF4444
  categorizedAt: 2025-08-07T06:55:51.588Z
---



# Deploy Maverick Node.js App to flywithmaverick.com

## 📋 Requirement

**User Clarification**: "This should largely be the same nodejs project we're pushing to"

Deploy the current Maverick Node.js application (this codebase) to the newly registered flywithmaverick.com domain.

## 🎯 Deployment Strategy

### Current Architecture
- **Custom Node.js Server**: `server.js` with WebSocket support
- **Next.js 15.4**: App Router with React 18.3
- **Database**: SQL Server with Prisma ORM
- **Port**: Currently running on 5001
- **Features**: Claude Code integration, real-time features, file-based work items

### Production Requirements
1. **Domain Configuration**: Point flywithmaverick.com to production server
2. **SSL Certificate**: HTTPS setup for secure connections
3. **Environment Setup**: Production environment variables
4. **Database**: Production SQL Server instance
5. **File Storage**: Persistent storage for work items and projects
6. **WebSocket Support**: Maintain Claude Code real-time features

## 🚀 Implementation Steps

### Phase 1: Infrastructure Setup
- [ ] Choose hosting provider (Vercel, Railway, AWS, etc.)
- [ ] Configure production database
- [ ] Set up environment variables
- [ ] Configure custom server deployment

### Phase 2: Domain & DNS
- [ ] Configure DNS records for flywithmaverick.com
- [ ] Set up SSL certificate (Let's Encrypt or provider SSL)
- [ ] Configure domain routing to Node.js app
- [ ] Test domain accessibility

### Phase 3: Production Deployment
- [ ] Deploy Node.js application with WebSocket support
- [ ] Configure production build process
- [ ] Set up database migrations
- [ ] Test all features in production

### Phase 4: Monitoring & Optimization
- [ ] Set up application monitoring
- [ ] Configure logging and error tracking
- [ ] Performance optimization for production
- [ ] Backup and disaster recovery

## 🔧 Technical Considerations

### Custom Server Deployment
Since we use a custom Node.js server (`server.js`) instead of standard Next.js:
- Need hosting that supports custom server deployment
- WebSocket support required for Claude Code integration
- File system access for markdown-based work items

### Environment Variables
```bash
# Production Environment
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://flywithmaverick.com
NEXTAUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Hosting Options
1. **Railway**: Good for Node.js apps with custom servers
2. **Render**: Supports WebSockets and custom servers
3. **AWS EC2**: Full control but more setup
4. **DigitalOcean**: VPS with Docker deployment

## 📊 Success Criteria

- [ ] flywithmaverick.com loads the Maverick application
- [ ] HTTPS SSL certificate working properly
- [ ] All features functional in production
- [ ] WebSocket connections working for Claude Code
- [ ] Database connected and migrations applied
- [ ] File-based work items persisting correctly
- [ ] Performance acceptable for production use

## 🔗 Related Configuration

### DNS Records
```
A Record: flywithmaverick.com → [Server IP]
CNAME: www.flywithmaverick.com → flywithmaverick.com
```

### SSL Certificate
- Use Let's Encrypt for free SSL
- Configure automatic renewal
- Ensure WebSocket connections work over WSS

### Production Build
```bash
# Build process
npm run build
npm run start

# Or custom server
node server.js
```

---

**Priority**: HIGH - Production Launch Requirement  
**Business Impact**: Establishes official platform presence  
**Effort Level**: M (Standard deployment with custom server considerations)  

> This deployment makes Maverick officially accessible to the world at flywithmaverick.com, transforming it from a development project into a live platform.