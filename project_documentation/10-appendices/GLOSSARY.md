# Glossary
## NextSaaS - Terms and Definitions

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document defines key terms and concepts used in NextSaaS documentation.

---

## A

### Access Token
JWT token used for API authentication. Expires in 15 minutes.

### API
Application Programming Interface. RESTful API for NextSaaS.

### Audit Log
Immutable record of all important user actions and system events.

### Authentication
Process of verifying user identity (login, registration).

### Authorization
Process of determining user permissions and access rights.

---

## B

### Backend
Server-side application (Node.js + Express + TypeScript).

### bcrypt
Password hashing algorithm used for password storage.

---

## C

### CORS
Cross-Origin Resource Sharing. Configuration for cross-origin requests.

### Cookie
HTTP-only cookie used for token storage (accessToken, refreshToken).

---

## D

### Database
PostgreSQL database for data persistence.

### Deployment
Process of releasing application to production.

---

## E

### E2E Tests
End-to-end tests that test complete user flows.

### Environment
Deployment environment (development, test, staging, production).

---

## F

### Feature Flag
Configuration that enables/disables features dynamically.

### Frontend
Client-side application (React + TypeScript + Vite).

---

## G

### GDPR
General Data Protection Regulation. Compliance requirements.

---

## H

### Health Check
Endpoint that verifies application and database health.

### HTTP-only Cookie
Cookie that cannot be accessed via JavaScript (XSS protection).

---

## J

### JWT
JSON Web Token. Used for authentication tokens.

---

## M

### MFA
Multi-Factor Authentication. Additional security layer (TOTP, Email OTP).

### Middleware
Express middleware for authentication, validation, logging, etc.

### Migration
Database schema change managed by Prisma.

---

## N

### Notification
User notification (email, in-app, SMS).

---

## O

### OAuth
OAuth authentication (Google, GitHub, Microsoft).

### ORM
Object-Relational Mapping. Prisma is the ORM used.

---

## P

### Payment Provider
Payment gateway (Stripe, Razorpay, Cashfree).

### PII
Personally Identifiable Information. Data that identifies individuals.

### Prisma
Type-safe database ORM for TypeScript.

---

## R

### RBAC
Role-Based Access Control. Permission system based on roles.

### Refresh Token
JWT token used to refresh access tokens. Expires in 30 days.

### Route
API endpoint handler.

---

## S

### Service
Business logic layer in backend architecture.

### Session
Database record storing refresh token information.

---

## T

### TDD
Test-Driven Development. Writing tests before implementation.

### TOTP
Time-based One-Time Password. MFA method using authenticator apps.

---

## U

### User
Application user with email, password, role, etc.

---

## V

### Validation
Process of verifying and sanitizing user input.

---

## W

### Webhook
HTTP callback from external services (payment providers).

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
