# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** open a public issue

### 2. Email us privately at security@file-manager.dev (replace with actual email)

### 3. Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### 4. Response Timeline
- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue

## Security Measures

### Authentication
- JWT tokens with configurable secrets
- API key authentication for applications
- Bcrypt password hashing (12 rounds)

### Input Validation
- File type restrictions
- File size limits (10MB)
- Filename sanitization
- SQL injection protection

### Headers & CORS
- Configurable CORS origins
- Secure headers in production
- Environment-based configuration

### Data Protection
- Sensitive data not logged
- API keys properly scoped
- Secure file storage

## Security Best Practices

### For Developers
1. Never commit secrets or API keys
2. Use environment variables for configuration
3. Validate all user inputs
4. Follow secure coding practices
5. Keep dependencies updated

### For Users
1. Use strong JWT secrets in production
2. Configure CORS properly
3. Use HTTPS in production
4. Regularly rotate API keys
5. Monitor access logs

## Vulnerability Disclosure

Once a vulnerability is resolved:
1. We will coordinate disclosure timing with the reporter
2. We will credit the reporter (unless they prefer anonymity)
3. We will publish a security advisory
4. We will release a patch as soon as possible

## Contact

For security-related questions: security@file-manager.dev (replace with actual email)