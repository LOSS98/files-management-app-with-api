# Contributing to File Manager

We welcome contributions to File Manager! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful and inclusive. We're building this project together.

## How to Contribute

### 1. Fork and Clone

```bash
git fork https://github.com/LOSS98/files-management-app-with-api
git clone https://github.com/LOSS98/files-management-app-with-api.git
cd files-management-app-with-api
```

### 2. Set up Development Environment

```bash
# Install dependencies
npm run install:all

# Set up environment
cp .env.example .env

# Start development servers
npm run dev
```

### 3. Development Guidelines

#### Code Style
- **No comments in code** - Keep code self-documenting
- **TypeScript strict mode** - All code must be properly typed
- **Clean imports** - Remove unused imports
- **Format dates** - Use dd/mm/yyyy format consistently

#### Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Follow secure coding practices
- All user inputs must be validated and sanitized

#### Testing
- Test your changes locally
- Ensure both frontend and backend start without errors
- Verify TypeScript compilation passes
- Check for security vulnerabilities with `npm audit`

### 4. Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Keep changes focused and atomic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # TypeScript check
   cd backend && npx tsc --noEmit
   cd frontend && npx tsc --noEmit
   
   # Start the application
   npm run dev
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### 5. Submitting Changes

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## Project Structure

```
file-manager/
├── backend/           # Fastify API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── auth.ts   # Authentication logic
│   │   └── ...
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── ...
├── .env.example      # Environment template
└── README.md
```

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production servers
npm run start

# Individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
```

## Reporting Issues

1. Search existing issues first
2. Use the issue template
3. Provide detailed reproduction steps
4. Include system information
5. Add relevant logs or screenshots

## Feature Requests

1. Check if the feature already exists
2. Describe the problem you're solving
3. Propose a solution
4. Consider backwards compatibility

## Questions?

- Open an issue for technical questions
- Check the README for common setup issues
- Review existing issues and PRs

Thank you for contributing to File Manager! 🚀