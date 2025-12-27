# Template Fit Assessment: Decision Framework

## How to Know If Your Template Fits a Use Case

This document provides a practical framework to evaluate whether your template is suitable for a specific project **before** you start building.

---

## 🎯 Core Principle

**Use the template when it saves time. Don't use it when it creates more work than starting fresh.**

---

## 📊 Quick Decision Matrix

### Use Template If: ✅

- [ ] **Tech Stack Match**: Project uses same stack as template (Node.js/Express OR Python/FastAPI)
- [ ] **Similar Architecture**: Project needs same architecture pattern (monolith, API-first, etc.)
- [ ] **Standard Features Needed**: Project needs auth, database, basic CRUD operations
- [ ] **Time Saving**: Template saves 50%+ of setup/boilerplate time
- [ ] **Low Customization**: Less than 30% of template needs modification

### Don't Use Template If: ❌

- [ ] **Different Tech Stack**: Project needs different language/framework
- [ ] **Different Architecture**: Needs microservices, serverless, or other patterns
- [ ] **Heavy Customization**: More than 50% of template needs modification
- [ ] **Unique Requirements**: Project has fundamentally different needs
- [ ] **Learning Curve Too High**: Team would spend more time learning template than building from scratch

---

## 🔍 Detailed Assessment Framework

### Assessment Scorecard

Rate each criterion from 1-5 (1 = Poor fit, 5 = Perfect fit). Total score determines fit.

**Total Score Guide:**
- **40-50 points**: ✅ **Excellent fit** - Use template confidently
- **30-39 points**: 🟡 **Good fit** - Use template but expect some customization
- **20-29 points**: 🟠 **Marginal fit** - Consider using template, but weigh alternatives
- **<20 points**: ❌ **Poor fit** - Don't use template, build custom

---

## 📋 Assessment Criteria (10 criteria, 5 points each = 50 max)

### 1. Technology Stack Alignment (5 points)

**Questions:**
- Does project need the same backend framework? (Express, FastAPI, etc.)
- Does project need the same database? (PostgreSQL)
- Does project need the same frontend? (React, Vue, or API-only)
- Does project need the same ORM? (Prisma, SQLAlchemy, etc.)

**Scoring:**
- **5 points**: All components match (same stack)
- **4 points**: Minor differences (different ORM, but same language)
- **3 points**: Some differences (different frontend, but same backend)
- **2 points**: Major differences (different backend language)
- **1 point**: Completely different stack

**Example:**
- ✅ **Good Fit**: Template (Node.js/Express/PostgreSQL), Project (Node.js/Express/PostgreSQL) = **5 points**
- ❌ **Poor Fit**: Template (Node.js/Express), Project (Python/Django) = **1 point**

---

### 2. Architecture Pattern Match (5 points)

**Questions:**
- Does project need same deployment model? (monolith, microservices, serverless)
- Does project need same database strategy? (single DB, multi-tenant, sharding)
- Does project need same scaling approach? (vertical, horizontal)

**Scoring:**
- **5 points**: Exact architecture match
- **4 points**: Minor adjustments needed
- **3 points**: Some architectural changes required
- **2 points**: Significant architectural differences
- **1 point**: Completely different architecture

**Example:**
- ✅ **Good Fit**: Template (monolith), Project (monolith) = **5 points**
- ❌ **Poor Fit**: Template (monolith), Project (microservices) = **2 points**

---

### 3. Feature Requirements Match (5 points)

**Questions:**
- Does project need authentication? (if template has it)
- Does project need payment processing? (if template has it)
- Does project need email notifications? (if template has it)
- Does project need file uploads? (if template has it)
- Does project need multi-tenancy? (if template has it)

**Scoring:**
- **5 points**: 80-100% of template features are needed
- **4 points**: 60-79% of template features are needed
- **3 points**: 40-59% of template features are needed
- **2 points**: 20-39% of template features are needed
- **1 point**: <20% of template features are needed

**Example:**
- ✅ **Good Fit**: Template has auth, payments, email; Project needs all three = **5 points**
- ❌ **Poor Fit**: Template has auth, payments, email, multi-tenancy; Project only needs basic API = **2 points**

---

### 4. Customization Effort (5 points)

**Questions:**
- How much of template needs modification? (estimate %)
- How complex are the customizations? (simple config vs code changes)
- How many modules need to be removed/replaced?

**Scoring:**
- **5 points**: <10% customization needed (mostly config)
- **4 points**: 10-25% customization needed (minor code changes)
- **3 points**: 25-50% customization needed (moderate changes)
- **2 points**: 50-75% customization needed (significant changes)
- **1 point**: >75% customization needed (essentially rewriting)

**Example:**
- ✅ **Good Fit**: Only need to change config (env vars, branding) = **5 points**
- ❌ **Poor Fit**: Need to replace auth system, payment system, and database structure = **1 point**

---

### 5. Time Savings (5 points)

**Questions:**
- How much time does template save? (setup, boilerplate, common features)
- How long to customize template vs build from scratch?
- Does template accelerate development or slow it down?

**Scoring:**
- **5 points**: Saves 70%+ of setup time, accelerates development
- **4 points**: Saves 50-69% of setup time, some acceleration
- **3 points**: Saves 30-49% of setup time, neutral impact
- **2 points**: Saves <30% of setup time, minimal benefit
- **1 point**: No time savings, actually slower

**Example:**
- ✅ **Good Fit**: Template saves 2 weeks of setup/boilerplate work = **5 points**
- ❌ **Poor Fit**: Template requires 1 week to adapt, would take 3 days to build from scratch = **2 points**

---

### 6. Team Familiarity (5 points)

**Questions:**
- Does team understand template structure?
- Does team know how to use template modules?
- Is there documentation/support available?

**Scoring:**
- **5 points**: Team is familiar, documentation is clear
- **4 points**: Team can learn quickly, good docs
- **3 points**: Some learning curve, adequate docs
- **2 points**: Significant learning curve, poor docs
- **1 point**: Team doesn't understand template, no docs

**Example:**
- ✅ **Good Fit**: Team built template, knows it well = **5 points**
- ❌ **Poor Fit**: New team member, no documentation = **1 point**

---

### 7. Project Timeline (5 points)

**Questions:**
- Is there time to learn/adapt template?
- Is deadline tight or flexible?
- Can project afford template learning curve?

**Scoring:**
- **5 points**: Flexible timeline, time to learn template
- **4 points**: Reasonable timeline, some learning time
- **3 points**: Normal timeline, neutral impact
- **2 points**: Tight timeline, template adds risk
- **1 point**: Very tight deadline, template is risky

**Example:**
- ✅ **Good Fit**: 2-month project, can spend 1 week on template = **5 points**
- ❌ **Poor Fit**: 1-week project, template needs 3 days to adapt = **1 point**

---

### 8. Maintenance Impact (5 points)

**Questions:**
- Can project maintain template updates?
- Will template updates break project?
- Is project long-term or one-off?

**Scoring:**
- **5 points**: Long-term project, can maintain template
- **4 points**: Medium-term project, some maintenance
- **3 points**: Short-term project, minimal maintenance
- **2 points**: One-off project, template maintenance overhead
- **1 point**: Quick prototype, template is overkill

**Example:**
- ✅ **Good Fit**: Long-term SaaS product, ongoing maintenance = **5 points**
- ❌ **Poor Fit**: 1-month prototype, template maintenance overhead = **2 points**

---

### 9. Project Complexity (5 points)

**Questions:**
- Is project simple enough for template?
- Is project too complex for template?
- Does template support project complexity level?

**Scoring:**
- **5 points**: Perfect complexity match
- **4 points**: Slightly more/less complex, manageable
- **3 points**: Some complexity mismatch
- **2 points**: Significant complexity mismatch
- **1 point**: Template is too simple/complex for project

**Example:**
- ✅ **Good Fit**: Standard CRUD app, template fits perfectly = **5 points**
- ❌ **Poor Fit**: Complex ML/data pipeline, template is web-focused = **1 point**

---

### 10. Business Requirements Alignment (5 points)

**Questions:**
- Do business requirements align with template capabilities?
- Are there conflicting requirements?
- Does template support business model?

**Scoring:**
- **5 points**: Requirements perfectly aligned
- **4 points**: Minor misalignment, easy to resolve
- **3 points**: Some misalignment, manageable
- **2 points**: Significant misalignment, challenging
- **1 point**: Requirements conflict with template

**Example:**
- ✅ **Good Fit**: SaaS product, template has multi-tenancy, payments = **5 points**
- ❌ **Poor Fit**: Internal tool needs LDAP auth, template only has JWT = **2 points**

---

## 🚦 Decision Tree Workflow

```
START: New Project Request
│
├─ Question 1: Same tech stack?
│   ├─ NO → ❌ Don't use template (Score: <20)
│   └─ YES → Continue
│
├─ Question 2: Same architecture pattern?
│   ├─ NO → 🟠 Consider alternatives (Score: 20-29)
│   └─ YES → Continue
│
├─ Question 3: Need 50%+ of template features?
│   ├─ NO → ❌ Don't use template (Score: <20)
│   └─ YES → Continue
│
├─ Question 4: Customization <30%?
│   ├─ NO → 🟠 Evaluate carefully (Score: 20-29)
│   └─ YES → Continue
│
├─ Question 5: Time savings >50%?
│   ├─ NO → ❌ Don't use template
│   └─ YES → Continue
│
└─ Complete Full Assessment → Score 30+ = ✅ Use template
```

---

## 📊 Assessment Worksheet

**Project Name**: _________________  
**Date**: _________________  
**Assessed By**: _________________

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| 1. Technology Stack Alignment | ___/5 | |
| 2. Architecture Pattern Match | ___/5 | |
| 3. Feature Requirements Match | ___/5 | |
| 4. Customization Effort | ___/5 | |
| 5. Time Savings | ___/5 | |
| 6. Team Familiarity | ___/5 | |
| 7. Project Timeline | ___/5 | |
| 8. Maintenance Impact | ___/5 | |
| 9. Project Complexity | ___/5 | |
| 10. Business Requirements Alignment | ___/5 | |
| **TOTAL SCORE** | **___/50** | |

**Decision**: 
- [ ] ✅ **Use Template** (40-50 points)
- [ ] 🟡 **Use Template with Caution** (30-39 points)
- [ ] 🟠 **Evaluate Alternatives** (20-29 points)
- [ ] ❌ **Don't Use Template** (<20 points)

**Rationale**: 
_________________________________________________
_________________________________________________

---

## 🔴 Red Flags (Stop Immediately)

If you see **any** of these, **don't use the template**:

1. ❌ **Completely Different Tech Stack**
   - Template: Node.js, Project: Python → **STOP**

2. ❌ **Fundamental Architecture Mismatch**
   - Template: Monolith, Project: Microservices → **STOP**

3. ❌ **<20% Feature Overlap**
   - Template has auth/payments/email, Project only needs API → **STOP**

4. ❌ **>75% Customization Needed**
   - Need to rewrite most modules → **STOP**

5. ❌ **No Time Savings**
   - Adapting template takes longer than building from scratch → **STOP**

6. ❌ **Team Doesn't Understand Template**
   - High learning curve, tight deadline → **STOP**

7. ❌ **Unique Requirements**
   - Project needs something template can't provide → **STOP**

---

## ✅ Green Flags (Go Ahead)

If you see **all** of these, **use the template confidently**:

1. ✅ **Same Tech Stack**
   - Template and project use same languages/frameworks

2. ✅ **Same Architecture**
   - Both use monolith, or both use microservices

3. ✅ **80%+ Feature Match**
   - Project needs most template features

4. ✅ **<25% Customization**
   - Mostly config changes, minimal code changes

5. ✅ **50%+ Time Savings**
   - Template saves significant setup time

6. ✅ **Team Knows Template**
   - Team understands how to use it

7. ✅ **Requirements Align**
   - Business needs match template capabilities

---

## 📝 Real-World Examples

### Example 1: Good Fit ✅

**Project**: SaaS Product Management Tool

**Template Features**: Auth, Payments, Email, Multi-tenancy, RBAC

**Assessment**:
- ✅ Same stack (Node.js/Express/PostgreSQL)
- ✅ Same architecture (monolith)
- ✅ Needs all template features
- ✅ Only branding/config changes needed
- ✅ Saves 2 weeks of setup time
- ✅ Team built the template

**Score**: **48/50** → **✅ Use Template**

---

### Example 2: Marginal Fit 🟡

**Project**: E-commerce API for Mobile App

**Template Features**: Auth, Payments, Email, File Uploads

**Assessment**:
- ✅ Same stack (Node.js/Express)
- ✅ Same architecture (API-only)
- ✅ Needs auth, payments, email (3/4 features)
- 🟡 Needs custom auth flow (OAuth for mobile)
- 🟡 Needs different payment integration
- ✅ Saves 1 week of setup time

**Score**: **32/50** → **🟡 Use Template with Caution** (expect customizations)

---

### Example 3: Poor Fit ❌

**Project**: Data Processing Pipeline (Python/Spark)

**Template Features**: Auth, Payments, Email, Web App

**Assessment**:
- ❌ Different stack (Template: Node.js, Project: Python)
- ❌ Different architecture (Template: Web app, Project: Data pipeline)
- ❌ Doesn't need any template features
- ❌ Completely different use case
- ❌ No time savings

**Score**: **8/50** → **❌ Don't Use Template**

---

### Example 4: Wrong Fit ❌

**Project**: Simple Static Landing Page

**Template Features**: Full-stack app with auth, database, etc.

**Assessment**:
- ✅ Same stack (React)
- ❌ Different architecture (Template: Full-stack, Project: Static site)
- ❌ Doesn't need backend features
- ❌ Template is overkill
- ❌ Adds unnecessary complexity

**Score**: **12/50** → **❌ Don't Use Template** (Use Next.js static export instead)

---

## 🔄 Pre-Project Checklist

Before starting a project, ask yourself:

1. **Tech Stack Match**?
   - [ ] Same backend framework
   - [ ] Same database
   - [ ] Same frontend (or API-only)

2. **Architecture Match**?
   - [ ] Same deployment model
   - [ ] Same scaling approach
   - [ ] Same database strategy

3. **Feature Match**?
   - [ ] Need 50%+ of template features
   - [ ] Template has required features
   - [ ] No conflicting requirements

4. **Customization**?
   - [ ] <30% customization needed
   - [ ] Mostly config changes
   - [ ] No major rewrites

5. **Time Savings**?
   - [ ] Saves 50%+ of setup time
   - [ ] Accelerates development
   - [ ] Worth learning curve

6. **Team Ready**?
   - [ ] Team knows template
   - [ ] Documentation available
   - [ ] Support available

**If 4+ checkboxes = ✅ Use Template**  
**If 3 checkboxes = 🟡 Evaluate Carefully**  
**If <3 checkboxes = ❌ Don't Use Template**

---

## 📈 Monitoring Fit During Project

### Early Warning Signs (First Week)

If you notice these in the first week, **reassess**:

1. 🟡 Spending more time adapting template than building features
2. 🟡 Removing more modules than using
3. 🟡 Fighting template architecture
4. 🟡 Team frustrated with template
5. 🟡 Behind schedule due to template issues

**Action**: Complete assessment again, consider pivoting

---

### Mid-Project Checkpoint (Week 2-3)

**Questions**:
- Is template still saving time? → ✅ Continue
- Are we fighting the template? → 🟡 Reassess
- Should we have built custom? → ❌ Consider pivot

---

## 🎯 Decision Framework Summary

| Score Range | Decision | Action |
|-------------|----------|--------|
| **40-50** | ✅ **Excellent Fit** | Use template confidently, proceed immediately |
| **30-39** | 🟡 **Good Fit** | Use template, but plan for some customizations |
| **20-29** | 🟠 **Marginal Fit** | Evaluate alternatives, consider hybrid approach |
| **<20** | ❌ **Poor Fit** | Don't use template, build custom solution |

---

## 💡 Alternative Strategies

### If Template Doesn't Fit:

1. **Use Existing Boilerplates**
   - Next.js starter templates
   - NestJS CLI
   - Django admin
   - Rails scaffolding

2. **Hybrid Approach**
   - Use template for parts that fit
   - Build custom for parts that don't
   - Extract modules you need

3. **Build Custom**
   - Start from scratch
   - Copy useful patterns from template
   - Build only what you need

4. **Wait and Adapt**
   - Build custom this time
   - Learn what's needed
   - Add to template for next project

---

## 📋 Quick Reference Card

**Print this and use for every project:**

```
TEMPLATE FIT QUICK CHECK
─────────────────────────

Tech Stack Match?     [ ] YES  [ ] NO
Architecture Match?   [ ] YES  [ ] NO
50%+ Features Needed? [ ] YES  [ ] NO
<30% Customization?   [ ] YES  [ ] NO
50%+ Time Savings?    [ ] YES  [ ] NO

DECISION:
✅ 4-5 YES = Use Template
🟡 2-3 YES = Evaluate Carefully  
❌ 0-1 YES = Don't Use Template
```

---

**Remember**: The goal is to **save time and effort**, not to use the template for everything. If it doesn't fit, build custom. It's better to spend 3 days building from scratch than 2 weeks fighting a template that doesn't fit.

