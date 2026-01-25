# Manual Penetration Testing: Demystified
## What Exactly Do Pen Testers Do That Commands £2,000-10,000?

## 🎯 The Truth About Manual Penetration Testing

### The Reality:
- **70% is learnable methodology** that can be documented and followed
- **20% is experience** knowing where to look based on patterns
- **10% is creativity** in chaining vulnerabilities together

Most pen testers follow standardized methodologies like PTES (Penetration Testing Execution Standard) or OWASP Testing Guide. **You don't need to be a genius - you need to be systematic.**

## 📋 Manual Testing Methodology (What Pen Testers Actually Do)

### Phase 1: Business Logic Testing (The "Expensive" Part)

#### 1.1 Transaction Manipulation
```markdown
WHAT THEY TEST:
- Can I buy a £100 item for £1 by manipulating the cart?
- Can I transfer negative amounts to gain money?
- Can I bypass payment by manipulating order status?

HOW TO TEST IT YOURSELF:
1. Add item to cart (£100)
2. Intercept request with Burp Suite (free tool)
3. Change price parameter to 1
4. Complete checkout
5. Check if system accepts it

EXAMPLE ATTACK:
POST /api/checkout
{
  "items": [{
    "id": 123,
    "price": 100,  // Change to 1
    "quantity": 1
  }]
}
```

#### 1.2 Race Conditions
```markdown
WHAT THEY TEST:
- Can I use a discount code multiple times simultaneously?
- Can I withdraw money twice before balance updates?
- Can I claim a limited resource multiple times?

HOW TO TEST IT YOURSELF:
1. Set up multiple browser tabs/sessions
2. Prepare the same action (e.g., apply coupon)
3. Execute simultaneously using a script:

```bash
# Simple race condition test
for i in {1..10}; do
  curl -X POST https://api.example.com/apply-coupon \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"code":"DISCOUNT50"}' &
done
wait
```

#### 1.3 Privilege Escalation Through Business Logic
```markdown
WHAT THEY TEST:
- Can a user become admin by manipulating registration?
- Can I access premium features without paying?
- Can I approve my own requests?

HOW TO TEST:
1. Register as normal user
2. Intercept registration response
3. Look for role/permission fields
4. Try injecting: "role": "admin" in requests
5. Test if elevated permissions work

REAL EXAMPLE:
POST /api/user/update-profile
{
  "name": "John",
  "email": "john@example.com",
  "role": "admin"  // Injected field
}
```

### Phase 2: Authentication & Session Testing

#### 2.1 JWT Manipulation
```markdown
WHAT THEY TEST:
- Can I forge JWT tokens?
- Can I change my user ID in the token?
- Is the signature properly verified?

HOW TO TEST:
1. Decode JWT at jwt.io
2. Change "sub" (user ID) or "role"
3. Try token without signature (alg: none attack)
4. Test if server accepts modified token

EXAMPLE:
// Original JWT payload
{
  "sub": "user123",
  "role": "user",
  "exp": 1234567890
}

// Modified payload
{
  "sub": "admin",
  "role": "admin",
  "exp": 9999999999
}
```

#### 2.2 Session Fixation
```markdown
WHAT THEY TEST:
- Can I force a user to use my session?
- Do sessions persist after logout?
- Can I hijack sessions through XSS?

TEST STEPS:
1. Get a valid session ID
2. Send link with session to victim
3. Wait for victim to login
4. Use the same session ID
5. Check if you're logged in as victim
```

### Phase 3: Advanced Input Validation

#### 3.1 Second-Order SQL Injection
```markdown
WHAT THEY TEST:
- Stored payloads that execute later
- Injection through trusted sources

EXAMPLE:
1. Register username: admin'--
2. System stores this "safely"
3. Later, password reset uses:
   SELECT * FROM users WHERE username = 'admin'--'
4. SQL injection triggers on retrieval, not input

HOW TO TEST:
- Input payloads in all stored fields
- Monitor where data gets used later
- Check logs, emails, reports for execution
```

#### 3.2 LDAP/NoSQL/GraphQL Injection
```markdown
BEYOND SQL:
- LDAP: username=admin)(&(password=*)
- NoSQL: {"$gt": ""}
- GraphQL: Query manipulation for data exposure

TEST APPROACH:
1. Identify the backend technology
2. Use specific injection patterns
3. Monitor for different error messages
4. Exploit successful injections
```

### Phase 4: File Upload Exploitation

#### 4.1 Advanced Bypass Techniques
```markdown
WHAT THEY TEST:
- Double extensions: file.jpg.php
- Null bytes: file.php%00.jpg
- Content-Type manipulation
- Polyglot files (valid image + PHP code)

ACTUAL TEST:
1. Create polyglot file:
   echo '<?php system($_GET["cmd"]); ?>' >> legitimate.jpg
2. Upload with various tricks
3. Find uploaded location
4. Execute with: /uploads/legitimate.jpg?cmd=whoami
```

### Phase 5: API Security Testing

#### 5.1 GraphQL Introspection Exploitation
```markdown
WHAT THEY TEST:
- Can I discover hidden API endpoints?
- Can I bypass rate limits with batch queries?
- Can I cause DoS with nested queries?

EXAMPLE ATTACK:
{
  query IntrospectionQuery {
    __schema {
      types {
        name
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
}
```

#### 5.2 API Parameter Pollution
```markdown
TEST TECHNIQUE:
GET /api/user?id=1&id=2
- Which ID is used?
- Can this bypass validation?
- Can this access unauthorized data?
```

### Phase 6: Social Engineering Vectors (The Human Element)

#### 6.1 Information Disclosure Testing
```markdown
WHAT THEY CHECK:
- Error messages revealing system info
- User enumeration through different responses
- Timing attacks for user existence

EXAMPLE:
Login with invalid user: "User not found" (200ms)
Login with valid user, wrong password: "Invalid password" (500ms)
-> Can enumerate valid usernames
```

#### 6.2 Password Reset Exploitation
```markdown
COMMON FLAWS:
- Predictable reset tokens
- Reset tokens in URL (logged in proxies)
- No expiration on reset links
- Reset link doesn't invalidate old password

TEST PROCESS:
1. Request reset for victim@example.com
2. Request reset for attacker@example.com
3. Compare tokens for patterns
4. Try token reuse/prediction
```

## 🛠️ Tools Professional Pen Testers Use (All Available to You)

### Free Tools:
1. **Burp Suite Community** - HTTP proxy and scanner
2. **OWASP ZAP** - Web app security scanner
3. **SQLMap** - Automated SQL injection
4. **Metasploit** - Exploitation framework
5. **Nmap** - Network discovery
6. **Wireshark** - Network protocol analyzer
7. **John the Ripper** - Password cracker
8. **Hydra** - Login brute forcer

### Paid Tools (Optional):
1. **Burp Suite Pro** (£399/year) - Advanced scanning
2. **Nessus** (£2,990/year) - Vulnerability scanner
3. **Cobalt Strike** (£3,500/year) - Advanced exploitation

**You can do 90% of testing with free tools!**

## 📚 How to Learn Manual Penetration Testing

### 1. Free Learning Resources:
- **PortSwigger Web Security Academy** (Free, excellent)
- **OWASP WebGoat** (Practice vulnerable app)
- **PentesterLab** (Some free exercises)
- **HackTheBox** (Some free machines)
- **TryHackMe** (Some free rooms)

### 2. Certifications (What pen testers have):
- **CEH** (Certified Ethical Hacker) - £950
- **OSCP** (Offensive Security) - £1,150
- **PNPT** (Practical Network Penetration Tester) - £399

**But you don't need these to test your own app!**

### 3. Time to Learn:
- **Basic proficiency**: 2-3 months
- **Intermediate skills**: 6 months
- **Professional level**: 1-2 years

## 💰 Why Do Pen Testers Charge So Much?

### What You're Really Paying For:

1. **Liability Insurance** (£500-2000/year)
   - They take legal responsibility

2. **Certification Costs** (£2000-5000)
   - CEH, OSCP, CISSP, etc.

3. **Report Writing** (40% of their time)
   - 50-100 page professional reports
   - Executive summaries
   - Detailed remediation steps

4. **Experience & Speed**
   - They've seen 1000s of apps
   - Know where to look immediately
   - Can chain vulnerabilities creatively

5. **Legal Protection**
   - Authorized testing agreement
   - They handle compliance requirements
   - Professional indemnity

## 🎯 DIY Manual Testing Checklist

### Week 1: Business Logic
- [ ] Test all payment flows with Burp Suite
- [ ] Check for race conditions in critical functions
- [ ] Test authorization on all admin functions
- [ ] Verify all state transitions

### Week 2: Authentication & Sessions
- [ ] Test password reset flow completely
- [ ] Check JWT implementation
- [ ] Test session timeout and invalidation
- [ ] Verify MFA bypass isn't possible

### Week 3: Input Validation
- [ ] Test all input fields with fuzzing
- [ ] Check for second-order injections
- [ ] Test file upload restrictions
- [ ] Verify API rate limiting

### Week 4: Advanced Testing
- [ ] Check for XXE in XML processing
- [ ] Test for SSRF vulnerabilities
- [ ] Verify no insecure deserialization
- [ ] Check for command injection

## 🚀 Our Recommended Approach

### Option 1: Full DIY (£0)
1. **Learn basics** (1 month) using free resources
2. **Run automated scans** (OWASP ZAP)
3. **Follow manual checklist** above
4. **Document findings** professionally
5. **Fix and retest**

**Pros**: Free, educational, continuous
**Cons**: Time investment, no certification

### Option 2: Hybrid Approach (£500-1000)
1. **Do automated testing** yourself (80%)
2. **Learn basic manual testing** (2 weeks)
3. **Hire freelance tester** for specific areas:
   - Just business logic testing (£500)
   - Just authentication testing (£500)
4. **Fix and retest** yourself

**Pros**: Balanced cost/benefit, learning opportunity
**Cons**: Still some cost, partial coverage

### Option 3: Annual Validation (£2000/year)
1. **Implement our automated testing** (continuous)
2. **Do quarterly manual testing** yourself
3. **Annual professional pen test** for certification
   - Negotiate reduced scope (£2000 vs £10000)
   - Since you've already found/fixed most issues

**Pros**: Best of both worlds, certification
**Cons**: Some annual cost

## 📊 The Truth About Value

### What £10,000 Pen Test Gets You:
- 5 days of testing
- 50-page report
- Certificate of testing
- Found vulnerabilities (10-50 typically)
- Remediation advice

### What Our Approach Gets You:
- 365 days of automated testing
- Real-time vulnerability detection
- Immediate remediation
- Developer education
- 80% of vulnerabilities found automatically
- Manual testing skills developed in-house

## 🎓 Conclusion: You CAN Do This!

**The "secret" of manual penetration testing:**
1. **It's 70% methodology** - which you now have
2. **20% experience** - which you'll gain
3. **10% creativity** - which comes with practice

**You don't need to pay £10,000 to someone who:**
- Uses the same free tools you can use
- Follows the same OWASP methodology
- Tests the same vulnerabilities
- Writes a report you could write

**What makes sense:**
- Automate 80% (our plan)
- Learn the manual 20% (this guide)
- Get annual certification if required (£2000)
- Save £8,000+ per year
- Have continuous security vs point-in-time

## 🔐 Final Secret

Most vulnerabilities pen testers find are:
1. **Missing rate limiting** (easy to test)
2. **Weak passwords** (automated scan)
3. **Outdated dependencies** (npm audit)
4. **Missing security headers** (automated check)
5. **Information disclosure** (error messages)
6. **Broken access control** (systematic testing)

**These aren't genius-level discoveries - they're systematic checks anyone can learn!**

---

*The pen testing industry doesn't want you to know this, but with 2-3 months of learning and the right tools, you can do 90% of what they do. The other 10% is experience in creative vulnerability chaining - but even that can be learned.*

*Document created: January 23, 2026*
*Purpose: Demystifying manual penetration testing*