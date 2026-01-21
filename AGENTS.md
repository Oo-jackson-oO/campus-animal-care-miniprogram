# AGENTS.md - Development Guidelines for Campus Stray Animal Care Mini Program

## Project Overview
This is a WeChat Mini Program with a Node.js/Express backend. The project uses:
- **Frontend**: WeChat Mini Program (JavaScript ES6+, WXML, WXSS)
- **Backend**: Node.js 18+, Express.js, MySQL 8.0+
- **Testing**: Jest (configured but no test files yet)
- **Database**: MySQL with mysql2/promise
- **Validation**: Joi
- **Logging**: Winston

## Build, Lint, and Test Commands

### Backend Commands (run from `/backend` directory)
```bash
# Install dependencies
npm install

# Start development server (with nodemon auto-restart)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run a single test file
npm test -- tests/unit/model.test.js

# Run tests with coverage
npm test -- --coverage

# Initialize database
npm run init-db

# Run linter (if ESLint is added)
npx eslint .
```

### WeChat Mini Program
- Open project in **WeChat Developer Tools**
- Use WeChat DevTools console for debugging
- No CLI build commands available - use the IDE

### Database Commands
```bash
# Initialize database schema
mysql -u root -p < database/init.sql

# Import sample data
mysql -u root -p campus_animal_care < database/sample_data.sql
```

## Code Style Guidelines

### General Principles
- Follow **Airbnb JavaScript Style Guide** for backend code
- Use **ES6+** features (arrow functions, destructuring, async/await)
- Keep functions small and focused (max 30-40 lines per function)
- Avoid code duplication - extract reusable logic

### Naming Conventions
- **Files**: camelCase for JS files (`dataService.js`), kebab-case for pages (`product-detail.js`)
- **Classes**: PascalCase (`BaseModel`, `UserService`)
- **Variables/Constants**: camelCase (`userInfo`, `MAX_RETRY`)
- **Database Tables**: snake_case (`user_donations`, `animal_records`)
- **Database Columns**: snake_case (`created_at`, `is_deleted`)
- **API Routes**: kebab-case (`/api/animals`, `/api/donations`)
- **Git Commits**: `<type>(<scope>): <subject>` where type is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Imports and Dependencies
```javascript
// Backend - require statements (no ES modules yet)
const express = require('express');
const config = require('../config/config');

// Group imports: external first, then internal
// Use absolute paths from project root in requires
```

### Code Formatting
- **Indentation**: 2 spaces (configured in project.config.json)
- **Line length**: 100 characters maximum
- **Semicolons**: Required (standard JavaScript)
- **Quotes**: Single quotes preferred, double quotes allowed
- **Trailing commas**: No trailing commas in object/array literals

### Error Handling
```javascript
// Backend - use try/catch in async functions
async function createUser(data) {
    try {
        const result = await database.insert(data);
        logger.database('INSERT', 'users', 'Created user');
        return result;
    } catch (error) {
        logger.error('Failed to create user', { data, error: error.message });
        throw error; // Re-throw for upstream handling
    }
}

// Use custom error classes for specific error types
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

// Handle errors with middleware (see backend/middleware/errorHandler.js)
```

### Database Operations
- Use **prepared statements** to prevent SQL injection (already implemented in BaseModel)
- Always include `status = 1` condition for soft-delete queries
- Use transactions for multi-table operations
- Log all database operations with `logger.database()`

### API Response Format
```javascript
// Success response
res.json({
    code: 200,
    message: 'Success',
    data: { ... }
});

// Error response
res.status(400).json({
    code: 400,
    message: 'Validation failed',
    errors: [...]
});
```

### Comments and Documentation
- Use JSDoc for all functions in backend code
- Include @param and @returns types
- Add Chinese comments for complex logic (project is Chinese)
- Keep comments up-to-date with code changes

### WeChat Mini Program Specific
- Use `wx.` APIs only (not browser APIs)
- Handle deprecated APIs (see API迁移指南.md for migration patterns)
- Use `systemInfoManager` from `utils/systemInfo.js` for system info
- Use `async/await` with `try/catch` in page methods
- Use `dataService.js` for data layer abstraction

### Security Best Practices
- Never commit `.env` files or credentials
- Validate all user input with Joi schemas
- Use parameterized queries for database operations
- Implement rate limiting on all API endpoints
- Sanitize output to prevent XSS (output encoding)

### Testing Guidelines
- Write tests before implementing features (TDD recommended)
- Use descriptive test names: `should return 400 when required fields missing`
- Mock database calls in unit tests
- Aim for 80%+ test coverage on backend routes
- Test edge cases and error scenarios

## Important Files
- `backend/server.js` - Express server entry point
- `backend/models/BaseModel.js` - Base CRUD operations
- `backend/middleware/errorHandler.js` - Error handling middleware
- `utils/dataService.js` - Frontend data layer abstraction
- `API迁移指南.md` - WeChat API migration patterns

## Environment Setup
1. Copy `backend/config.example.env` to `backend/.env`
2. Configure database credentials and JWT secret
3. Import database schema from `database/init.sql`
4. Run `npm install` in backend directory
5. Start with `npm run dev`
