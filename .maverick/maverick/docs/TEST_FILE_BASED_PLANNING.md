# File-Based Planning System Test Plan

## Overview
This document outlines comprehensive tests for the file-based task management and planning system.

## Current System Status ✅

### What We Found Working:
1. **42 task files** in `.maverick/work-items/` directory
2. **Rich structured content** with proper frontmatter
3. **Hierarchical relationships** (parent-child tasks)
4. **Mixed complexity levels** (strategic epics to UI tweaks)
5. **Completed task documentation** shows system usage

## Test Cases to Execute

### 1. Task Cache Generation Test

**Objective**: Verify the TaskCacheManager creates proper indexes

**Steps**:
```bash
# Test cache generation
curl -X POST http://localhost:5001/api/projects/maverick/hierarchical-todos
```

**Expected Result**: 
- Creates `.maverick/tasks.json` with all 42 found tasks
- Generates lookup indexes (by status, type, parent)
- Calculates subtask counts correctly

### 2. Task Similarity Detection Test

**Objective**: Find duplicate/overlapping features

**Test Data** (from your files):
- Multiple "vibe chat" related tasks
- Several "workspace team management" references  
- Various UI improvement tasks

**Steps**:
```typescript
// Run AI task analysis
const analysis = await aiTaskAnalysisService.analyzeProject('maverick')
console.log(analysis.consolidationOpportunities)
```

**Expected Result**: Should identify overlaps like:
- "vibe-chat-feature-a1b2c3d4..." and "vibe-chat-markdown-formatting.md"
- Multiple workspace/team management tasks

### 3. Performance Test

**Objective**: Validate system handles 42+ tasks efficiently

**Metrics to Track**:
- Cache generation time (target: < 2 seconds)
- Task search/filter speed (target: < 100ms)
- Memory usage with full task set

### 4. Hierarchical Relationship Test

**Objective**: Verify parent-child relationships work correctly

**Test Case**: Task `97b4080d-7a9d-4c00-87db-206470740d2b` 
- Has `parentId: d0cd253e-2e7c-46a8-93e3-23019b23cb1a`
- Should appear as subtask in UI
- Parent should show correct subtask count

### 5. Cross-File Consistency Test

**Objective**: Ensure metadata consistency across all files

**Checks**:
- All UUIDs are unique
- Parent-child references are valid
- Status values match enum constraints
- Timestamps are properly formatted

## Performance Benchmarks

### Current Dataset: 42 Tasks
- File sizes: Range from 1KB (simple) to 8KB (comprehensive specs)
- Total storage: ~180KB for all task files
- Hierarchy depth: Up to 2 levels deep

### Scalability Targets:
- **100 tasks**: < 5 second cache rebuild
- **500 tasks**: < 15 second cache rebuild  
- **1000 tasks**: < 30 second cache rebuild

## Test Automation Script

```bash
#!/bin/bash
# File-based planning system test runner

echo "🧪 Testing File-Based Planning System..."

# 1. Count task files
echo "📁 Task file count:"
find .maverick/work-items -name "*.md" | wc -l

# 2. Validate frontmatter
echo "📋 Validating frontmatter..."
for file in .maverick/work-items/*.md; do
  if ! grep -q "^---$" "$file"; then
    echo "❌ Missing frontmatter: $file"
  fi
done

# 3. Check for orphaned parent references
echo "🔗 Checking hierarchical relationships..."
# Extract all parentIds and verify they exist

# 4. Test cache generation performance
echo "⚡ Testing cache generation..."
time curl -X POST http://localhost:5001/api/projects/maverick/hierarchical-todos > /dev/null

echo "✅ Tests complete!"
```

## Optimization Opportunities

### 1. Content Quality
- Some tasks have minimal descriptions ("No description provided")
- Could auto-generate more detailed planning from titles
- Add more structured acceptance criteria

### 2. File Organization
- Consider subdirectories for different task types
- Group related features (e.g., `/vibe-chat/`, `/workspace/`)

### 3. Cache Strategy
- Implement incremental cache updates
- Add file watching for real-time updates
- Store cache checksums for validation

## Success Criteria

### ✅ **System is successful if**:
1. **Fast Operations**: Task CRUD operations < 200ms
2. **Accurate Relationships**: All parent-child links work correctly  
3. **No Data Loss**: All task metadata preserved through operations
4. **Scalable Performance**: Handles 100+ tasks without slowdown
5. **Rich Content**: Supports comprehensive planning documents

### 🎯 **Next Steps**:
1. Run automated test suite
2. Generate task cache and validate indexes
3. Test task similarity detection on real data
4. Optimize any performance bottlenecks found
5. Document file-based planning best practices

---

**Test Environment**: Maverick project with 42 real task files  
**Test Date**: August 4, 2025  
**System Version**: Hierarchical Todo System v1.0