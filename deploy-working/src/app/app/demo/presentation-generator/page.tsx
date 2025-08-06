'use client'

import PresentationGenerator from '@/components/PresentationGenerator'
import CockpitShell from '@/components/CockpitShell'

const PITCH_DECK_MARKDOWN = `# Goose + Maverick: The Self-Evolving Business Development Platform

## Slide 1: The Vision 🚀

### "What if every line of code you write becomes part of your business infrastructure?"

**Goose + Maverick = The first platform where local development and business operations are the same system.**

---

## Slide 2: The Problem We're Solving

### Current Reality: Fragmented Development Experience

- **Developers code locally** → Context gets lost in deployment
- **Business operations happen in separate platforms** → No connection to actual code
- **AI assistants work in isolation** → Each tool has different context
- **System architecture lives in developers' heads** → Knowledge silos, architectural drift

### The Pain Points:
❌ Context switching hell between local dev and business platforms  
❌ AI assistants that don't understand your business  
❌ Architecture decisions trapped in individual tools  
❌ Business formation completely disconnected from development  

---

## Slide 3: The Maverick Solution 🌀

### **One System. Two Interfaces. Infinite Possibilities.**

\`\`\`
Local Development (Goose)     ←→     Cloud Platform (Maverick Web)
     ↓                                        ↓
.maverick files define workspace          Git repository becomes
context and AI instructions              business infrastructure
\`\`\`

**Key Insight:** The same \`.maverick\` files that structure your local development become the foundation for your entire business platform.

---

## Slide 4: How .maverick Files Work

### **Fractal Business Architecture**

\`\`\`
company-root/
├── .maverick                 # Company-wide AI context
├── legal/
│   ├── .maverick            # Legal workspace: incorporation, contracts
│   └── instructions.md      # AI trained on corporate law
├── products/
│   ├── mobile-app/
│   │   ├── .maverick        # Product team workspace
│   │   ├── instructions.md  # React Native + business context
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── .maverick    # Feature-level workspace
│   │       │   └── instructions.md  # Auth-specific AI guidance
\`\`\`

**Physical folder structure = System architecture = Business organization**

---

## Slide 5: The Local Development Revolution

### **Goose Becomes Business-Context Aware**

When you run \`goose\` in any folder:

1. **📂 Discovers workspace hierarchy** by scanning for \`.maverick\` files
2. **🧠 Loads contextual AI instructions** from root → product → feature
3. **🏗️ Understands system architecture** and business requirements
4. **💡 Provides intelligent suggestions** based on complete business context

### Example:
\`\`\`bash
cd /my-startup/products/mobile-app/features/payments
goose "add Square payment processing"

# Goose automatically knows:
# ✅ This is a React Native mobile app
# ✅ Company policy requires Square for payments  
# ✅ Existing auth system to integrate with
# ✅ Security requirements for fintech
# ✅ Business formation status and compliance needs
\`\`\`

---

## Slide 6: The Spiral Effect 🌀

### **The Platform Builds Itself Through Templates**

**Phase 1: Seed Templates** (We Build)
- \`startup-root\` → Complete company infrastructure
- \`legal-incorporation\` → Delaware C-Corp setup
- \`saas-product\` → Modern SaaS with payments

**Phase 2: Community Templates** (Users Build)
- Every successful project becomes a template
- AI extracts patterns from successful companies
- Template marketplace with revenue sharing

**Phase 3: AI Templates** (System Builds)
- AI generates custom templates for specific needs
- Self-optimizing based on success metrics
- Predictive template recommendations

### **Result: Network effects where more usage → better templates → more success**

---

## Slide 7: Revolutionary Use Cases

### **1. Instant Business Formation**
\`\`\`bash
goose workspace init --template=fintech-startup
# Creates: Legal incorporation + Product development + Compliance + Payment processing
# All in one command, all AI-context aware
\`\`\`

### **2. Architectural Refactoring = Business Restructuring**
\`\`\`bash
# Move folders to split monolith into microservices
mv payments-feature payments-service/
# System automatically updates business architecture, team ownership, AI context
\`\`\`

### **3. Context-Aware Development**
- AI suggestions based on business stage (pre-seed vs Series A)
- Code recommendations that consider legal/compliance requirements
- Architecture decisions aligned with business goals

### **4. Template-Driven Everything**
- New team member? Generate onboarding workspace from template
- Entering new market? Use \`healthcare-compliance\` template
- Scaling team? Extract your patterns into templates for others

---

## Slide 8: The Economic Engine

### **Multi-Sided Marketplace Value Creation**

**For Template Creators:**
- 💰 Revenue share on template usage ($10-100 per instantiation)
- 🎯 Success royalties (1% of revenue from companies using template)
- 📈 Consulting opportunities for premium template support

**For Platform:**
- 🏪 Template marketplace (30% commission)
- 💼 Business formation ($500-2000 per incorporation)
- 💳 Square processing (revenue share on payment volume)
- 🏢 Enterprise licensing (custom templates, private marketplace)

**For Users:**
- ⚡ 10x faster time-to-market
- 🎯 Proven business patterns and architectures
- 🤖 AI that understands their specific context
- 🔄 Seamless local-to-cloud development flow

---

## Slide 9: Market Opportunity

### **Massive TAM at Intersection of Multiple Markets**

**Developer Tools Market:** $24B (GitHub, Vercel, Stripe)  
**Business Formation Market:** $4B (LegalZoom, Clerky)  
**Enterprise Software Market:** $600B (Salesforce, Microsoft)  
**AI/ML Platforms Market:** $62B (OpenAI, Anthropic)

### **Our Unique Position:**
We're not competing in any single market—we're creating a new category that combines all of them.

**Total Addressable Market: $690B+**

---

## Slide 10: Demo Scenario

### **"From Idea to Incorporated Business in 60 Seconds"**

**Step 1:** Developer has idea for fintech startup
\`\`\`bash
mkdir my-fintech-startup && cd my-fintech-startup
goose workspace init --template=fintech-startup
\`\`\`

**Step 2:** Goose generates complete structure:
- ✅ Delaware C-Corp incorporation workspace
- ✅ Product development with fintech compliance
- ✅ Square payment processing setup
- ✅ Banking compliance templates
- ✅ Team onboarding workflows

**Step 3:** Developer starts coding with full business context:
\`\`\`bash
cd products/banking-app
goose "add ACH transfer functionality"
# AI knows: banking regulations, compliance requirements, 
# existing auth system, company legal status
\`\`\`

**Step 4:** One command deploys business AND code:
\`\`\`bash
goose deploy --incorporate
# Files incorporation, sets up Square account, deploys app
\`\`\`

---

## Slide 11: The Meta-Moment 🌀

### **This Presentation IS the Platform in Action**

**What just happened:**
1. 💡 **You needed a pitch deck** → I generated markdown
2. 🎯 **You wanted a real presentation** → We're building the generator  
3. 🤖 **This becomes a template** → Others can generate presentations
4. 🔄 **Platform improves** → Every user need becomes everyone's feature

**This IS Maverick building itself through user needs!**

### **The Recursive Genius:**
\`\`\`
User Need → AI Response → Platform Evolution → Template Creation → Community Benefit
\`\`\`

**Every business need you express becomes a capability everyone else gets.**

---

## Slide 12: Investment Opportunity

### **Seed Round: $2M for 12-Month Runway**

**Key Metrics:**
- **Month 6:** 1,000 developers using Goose + Maverick
- **Month 12:** 100 businesses formed through platform
- **Month 24:** $10M Square payment volume processed
- **Month 36:** 50 enterprise customers, $100M+ ARR

### **Strategic Partnerships:**
🟡 **Square** (Revenue Partner) - Business formation + payments  
🟤 **Goose/Block** (Platform Partner) - Official extension  
⚫ **GitHub/Microsoft** (Integration Partner) - Enterprise sales  

**Partnership Value:** We become the connective tissue between local development, business operations, and cloud infrastructure.

---

## Slide 13: Call to Action

### **This is Our Moment**

**🎯 The Market is Ready:**
- Developers increasingly entrepreneurial
- AI tools becoming mainstream  
- Business formation getting automated
- Square needs developer ecosystem

**⚡ The Technology is Ready:**
- Goose provides perfect local integration point
- Git-native approach works with existing workflows
- AI context management is proven concept

**🚀 The Team is Ready:**
- Deep Square ecosystem knowledge
- Proven ability to build developer tools
- Understanding of business formation complexity

### **Join us in building the future of business development.**

**Let's turn every developer into a potential founder, and every line of code into business value.**`

export default function PresentationGeneratorPage() {
  return (
    <CockpitShell title="Presentation Generator Demo">
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🌀 Maverick Meta-Moment in Action
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            You just asked for a pitch deck, I generated markdown, you wanted a real presentation, 
            and now we're building the actual presentation generator! This is exactly how Maverick 
            works - every user need becomes everyone's feature.
          </p>
        </div>

        <PresentationGenerator
          markdownContent={PITCH_DECK_MARKDOWN}
          title="Goose + Maverick: The Self-Evolving Business Development Platform"
          theme="gradient"
        />

        <div className="mt-12 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🚀 What Happens Next?
          </h3>
          <div className="text-purple-800 space-y-2">
            <div>1. <strong>We perfect this generator</strong> → Beautiful presentations from any markdown</div>
            <div>2. <strong>Extract as template</strong> → "presentation-generator.maverick" for others</div>
            <div>3. <strong>Community improves it</strong> → Better themes, animations, export options</div>
            <div>4. <strong>AI optimizes everything</strong> → Self-improving presentation quality</div>
            <div>5. <strong>Platform evolves</strong> → Video generation, interactive demos, VR presentations</div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-300">
            <strong className="text-purple-900">The Spiral Effect:</strong> 
            <span className="text-purple-700"> Your need → Our feature → Everyone's benefit → Platform growth</span>
          </div>
        </div>
      </div>
    </CockpitShell>
  )
}