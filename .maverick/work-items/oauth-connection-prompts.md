---
smartCategory:
  id: ui-ux
  name: User Interface & Experience
  team: User Interface & Experience
  color: #3B82F6
  categorizedAt: 2025-08-07T06:55:55.390Z
---



# Build GitHub + Square Connection Prompts in Onboarding

## 📋 Description

Create compelling prompts that guide users to connect GitHub (required) and Square (recommended) accounts during onboarding. Make it clear why each connection is beneficial.

## 🎯 Acceptance Criteria

- [ ] GitHub connection prompt with clear value proposition
- [ ] Square connection prompt emphasizing "better with Square"
- [ ] Visual connection status indicators
- [ ] Ability to skip Square (but encourage connection)
- [ ] Error handling for OAuth failures
- [ ] Localhost redirect URLs for development
- [ ] Production redirect URLs for deployment

## 📝 Implementation Notes

**GitHub Messaging:** "Maverick requires GitHub to create and manage your project repositories"
**Square Messaging:** "Maverick is better with Square - connect for payment processing, business banking, and more"

**Current OAuth Issue:** Need to debug callback issues and set up proper redirect URLs for both local and production environments.

## 🔗 Related Items

Parent: onboarding-flow-epic
Relates to: Debug Square OAuth callback issues
Dependencies: OAuth redirect URL configuration

## 📅 Progress Log

- **2025-08-07**: Feature defined, OAuth debugging needed first