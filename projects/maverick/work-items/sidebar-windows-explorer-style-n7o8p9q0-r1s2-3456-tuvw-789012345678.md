---
id: sidebar-windows-explorer-style-n7o8p9q0-r1s2-3456-tuvw-789012345678
title: "Redesign Sidebar to Windows Explorer Style"
type: ENHANCEMENT
status: IN_PROGRESS
priority: MEDIUM
functionalArea: SOFTWARE
effortLevel: "S"
scopeSize: "FOCUSED"
category: "UI Enhancement"
businessImpact: "Improves navigation UX by simplifying project folder structure"
createdAt: 2025-08-03T08:55:00.000Z
updatedAt: 2025-08-03T08:55:00.000Z
userRequested: true
aiCredits: 35
confidence: 95
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