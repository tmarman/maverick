---
smartCategory:
  id: ui-ux
  name: User Interface & Experience
  team: User Interface & Experience
  color: #3B82F6
  categorizedAt: 2025-08-07T06:55:56.894Z
---



# Redesign Sidebar to Windows Explorer Style

## 📋 User Feedback

**User Request**: "In the left sidebar, we can kind of assume any project we're tracking is 'active' so we don't need that pill. Maybe we just think about this as a folder, Windows Explorer styles?"

## 🎯 Design Changes

### Remove Status Pills
- Remove "ACTIVE" badges from project items
- Assume all tracked projects are active by default
- Clean up visual clutter in sidebar

### Windows Explorer Style
- Folder-like hierarchy display
- Clean, minimal folder icons
- Expandable/collapsible project sections
- Simple text-based navigation
- No unnecessary badges or pills

## 🎨 New Design Approach

```
📁 Projects
├── 📁 Maverick
│   ├── 📄 Overview
│   ├── 📋 Tasks
│   ├── 💬 Vibe
│   ├── 👥 Team
│   └── ⚙️ Settings
├── 📁 Square Integration
└── 📁 Client Portal
```

## 🔧 Implementation

Update the ProjectSidebar component to:
- Remove status badges
- Use folder icons instead of project type indicators
- Simplify navigation hierarchy
- Focus on clean, explorer-style presentation

---

**Self-Dogfooding**: Work item created during development session for sidebar UX improvement