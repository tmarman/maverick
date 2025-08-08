---
smartCategory:
  id: ui-ux
  name: User Interface & Experience
  team: User Interface & Experience
  color: #3B82F6
  categorizedAt: 2025-08-07T06:55:48.041Z
---



# Design 'What do you want to build?' Chat Interface with Org Form

## 📋 Description

Create a conversational interface where users describe what they want to build, and the chat intelligently fills out the organization and project creation forms. Make it feel like talking to a helpful assistant.

## 🎯 Acceptance Criteria

- [ ] Chat interface on empty projects page
- [ ] Organization creation form on the right side
- [ ] AI that extracts info from user messages to populate form
- [ ] Conversational flow that feels natural
- [ ] Form fields auto-populate based on chat responses
- [ ] Validation and error handling for form submission
- [ ] Smooth transition from chat to created project

## 📝 Implementation Notes

**Chat Experience Design:**
- Start with: "What do you want to build?"
- Follow-up questions: "What type of business?", "What's your industry?", "Online or physical location?"
- AI should intelligently extract: business name, type, industry, app features needed

**Form Integration:**
- Organization form slides in/animates as user chats
- Fields populate in real-time as AI extracts information
- User can edit form directly if needed
- Submit creates both organization and first project

## 🔗 Related Items

Parent: onboarding-flow-epic
Relates to: Fix smart snippets display issue (need working chat)
Dependencies: Working AI chat with smart snippets

## 📅 Progress Log

- **2025-08-07**: Feature defined, depends on chat fixes being completed