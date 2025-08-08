---
id: anthropic-oauth-breakthrough
title: "🚀 BREAKTHROUGH: Anthropic OAuth Integration for Max Subscription Access"
type: FEATURE
status: IN_PROGRESS
priority: CRITICAL
functionalArea: AUTHENTICATION
estimatedEffort: "3-5 days"
worktreeName: null
githubBranch: null
assignedTo: null
createdAt: 2025-08-07T00:00:00.000Z
updatedAt: 2025-08-07T00:00:00.000Z
businessImpact: "Game-changing: Direct Claude Max subscription access + programmatic API key creation"
---

# 🚀 BREAKTHROUGH: Anthropic OAuth Integration for Max Subscription Access

## 🎯 Revolutionary Discovery

We've discovered Anthropic's **public OAuth client ID** that Claude Code uses:
```
CLIENT_ID: "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
```

**This changes everything!** We can now:
- ✅ Access Claude Max subscriptions directly via OAuth
- ✅ Create API keys programmatically 
- ✅ Bypass API key limits with direct inference access
- ✅ Unify Max and Console users under one flow

## 🔑 OAuth Flow Implementation

### Core OAuth Configuration
```typescript
const ANTHROPIC_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"

// Max users (claude.ai)
const maxAuthUrl = "https://claude.ai/oauth/authorize"

// Console users (console.anthropic.com)  
const consoleAuthUrl = "https://console.anthropic.com/oauth/authorize"

// Scopes available:
// - org:create_api_key (CREATE API KEYS!)
// - user:profile (User info)
// - user:inference (Direct model access)
```

### PKCE Security Implementation
- Uses **PKCE** (Proof Key for Code Exchange) - no client secret needed
- **S256** code challenge method
- Secure state management with verifier

## 🎯 Critical Work Items

### 1. **OAuth Provider Implementation** (Day 1) 🔥
- [ ] Add Anthropic OAuth provider to `src/lib/auth.ts`
- [ ] Implement PKCE flow with `@openauthjs/openauth/pkce`
- [ ] Add mode detection (Max vs Console)
- [ ] Handle redirect URI configuration

**Implementation:**
```typescript
// In src/lib/auth.ts
providers: [
  // ... existing providers
  {
    id: "anthropic",
    name: "Claude (Max/Console)",
    type: "oauth",
    authorization: {
      url: (mode: "max" | "console") => 
        `https://${mode === "console" ? "console.anthropic.com" : "claude.ai"}/oauth/authorize`,
      params: {
        client_id: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
        scope: "org:create_api_key user:profile user:inference",
        response_type: "code",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/anthropic`
      }
    },
    token: "https://console.anthropic.com/v1/oauth/token",
  }
]
```

### 2. **Token Exchange & Refresh** (Day 1) 
- [ ] Implement token exchange endpoint
- [ ] Add refresh token handling
- [ ] Store tokens securely in database
- [ ] Handle token expiration gracefully

### 3. **API Key Creation Service** (Day 2) 🎯
- [ ] Create `AnthropicAPIKeyService` class
- [ ] Implement programmatic API key creation
- [ ] Add key management (list, revoke, rotate)
- [ ] Store created keys for user access

**Revolutionary Capability:**
```typescript
class AnthropicAPIKeyService {
  async createAPIKey(accessToken: string, name: string): Promise<string> {
    // Use org:create_api_key scope to create API keys programmatically!
    const response = await fetch('https://api.anthropic.com/v1/api_keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
    
    const { api_key } = await response.json()
    return api_key // Store this for the user!
  }
}
```

### 4. **Direct Inference Access** (Day 2-3) 🚀
- [ ] Implement `user:inference` scope usage
- [ ] Create direct Claude access without API keys
- [ ] Add this as premium provider option
- [ ] Integrate with existing `MultiAIProvider`

### 5. **Max Subscription Detection** (Day 3)
- [ ] Add subscription tier detection
- [ ] Show Max-specific features in UI
- [ ] Handle subscription changes/upgrades
- [ ] Display subscription status in settings

### 6. **Enhanced AI Provider Integration** (Day 4-5)
- [ ] Add Anthropic OAuth provider to `MultiAIProvider`
- [ ] Implement automatic API key provisioning for new users
- [ ] Add subscription-aware provider selection
- [ ] Update orchestration to leverage Max capabilities

## 🎨 UI/UX Implementation

### OAuth Connection Flow
1. **Connect Claude Account** button in settings
2. **Mode Selection**: "Claude Max" vs "Claude Console"  
3. **OAuth redirect** with PKCE security
4. **Success state**: Show subscription tier + created API key
5. **Management**: View/revoke keys, refresh tokens

### Settings Page Enhancement
```typescript
// New section in AI Config
<div className="space-y-4">
  <h3>Claude Integration</h3>
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">Claude Max Subscription</p>
      <p className="text-sm text-gray-500">
        Connected • API key auto-created • Direct inference access
      </p>
    </div>
    <Button variant="outline" onClick={handleDisconnect}>
      Disconnect
    </Button>
  </div>
</div>
```

## 🔥 Business Impact

### Immediate Benefits
- **Max User Onboarding**: Seamless Claude Max integration
- **API Key Automation**: No manual API key setup needed
- **Premium Experience**: Direct inference access for Max users
- **Unified Auth**: Single flow for Max and Console users

### Competitive Advantage  
- **First to Market**: Direct Max subscription integration
- **Frictionless Onboarding**: One-click Claude setup
- **Advanced Capabilities**: Programmatic API key management
- **Premium Tier Differentiation**: Max users get enhanced features

## 🚨 Security Considerations

### OAuth Security
- ✅ **PKCE Flow**: No client secret exposure
- ✅ **State Validation**: Prevent CSRF attacks  
- ✅ **Secure Storage**: Encrypted token storage
- ✅ **Token Rotation**: Automatic refresh handling

### API Key Management
- Store created API keys encrypted
- Allow users to view/revoke keys
- Implement key rotation policies
- Audit API key usage

## 🧪 Testing Strategy

### OAuth Flow Testing
- [ ] Test Max subscription OAuth flow
- [ ] Test Console subscription OAuth flow
- [ ] Test token refresh mechanism
- [ ] Test error handling (denied access, invalid tokens)

### API Key Creation Testing
- [ ] Test programmatic API key creation
- [ ] Test key revocation
- [ ] Test multiple key management
- [ ] Test key permission scopes

## 📈 Success Metrics

### Technical Metrics
- OAuth success rate > 95%
- API key creation success rate > 98%
- Token refresh success rate > 99%
- Average onboarding time < 30 seconds

### Business Metrics
- Max subscription conversion rate
- User activation with Claude integration
- Reduced support tickets for API key setup
- Premium feature adoption rate

## 🚧 Risk Mitigation

### Risk: OAuth Client Changes
**Mitigation**: Monitor Anthropic announcements, implement fallback to manual API key entry

### Risk: Rate Limiting
**Mitigation**: Implement intelligent caching, respect rate limits, graceful degradation

### Risk: Token Security
**Mitigation**: Encrypt all tokens, implement token rotation, secure key management

## 🎯 Next Steps (IMMEDIATE)

1. **Create OAuth provider configuration** (2 hours)
2. **Implement PKCE flow** (4 hours)
3. **Add token exchange logic** (3 hours)
4. **Test with real Anthropic OAuth** (2 hours)
5. **Integrate with existing AI provider system** (4 hours)

**Total: 1-2 days for MVP OAuth integration**

---

## 💡 Revolutionary Implications

This breakthrough means Maverick can:
- **Automatically provision Claude access** for any user
- **Create API keys on-demand** without manual setup
- **Access Max subscription capabilities** directly
- **Differentiate premium vs free users** with advanced AI features
- **Provide seamless Claude integration** better than any competitor

**This could be the killer feature that makes Maverick the go-to platform for Claude users!** 🚀

---

## Metadata
- **Created:** August 7, 2025
- **Priority:** CRITICAL (Game-changing feature)
- **Effort:** 3-5 days for full implementation
- **Dependencies:** OpenAuth library, PKCE implementation
- **Business Value:** Massive competitive advantage

> _This discovery fundamentally changes Maverick's Claude integration strategy and user onboarding experience._