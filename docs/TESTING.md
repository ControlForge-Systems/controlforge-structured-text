# Testing & Git Workflow

This project uses a comprehensive testing strategy with automated pre-commit validation.

## Test Commands

```bash
# Fast unit tests only (1-3 seconds)
npm run test:unit

# Comprehensive E2E tests (15-30 seconds)
npm run test:e2e

# Run all tests (unit + E2E)
npm test

# Manual pre-commit validation
npm run test:pre-commit

# Watch mode for development
npm run test:watch
```

## Pre-Commit Hook

**Automatic validation before every commit:**

1. ⚡ **Unit tests run first** (fast feedback)
2. 🧪 **E2E tests run second** (comprehensive validation)
3. ✅ **Commit only proceeds if both pass**

### Workflow:
```bash
git add .
git commit -m "Your commit message"
# → Unit tests run automatically
# → E2E tests run automatically
# → Commit succeeds only if all tests pass
```

### Benefits:
- 🚫 **Prevents broken code** from entering the repository
- ⚡ **Fast feedback** with unit tests first
- 🔍 **Comprehensive validation** with E2E tests
- 📈 **Maintains code quality** automatically

## Test Structure

```
src/test/
├── unit/                         # Fast unit tests
│   └── validator.unit.test.ts    # Test business logic
└── e2e/                          # Comprehensive integration tests  
    └── extension.e2e.test.ts     # Test VS Code integration
```

## Bypassing Pre-Commit (Emergency Only)

```bash
# Skip pre-commit hook (not recommended)
git commit -m "Emergency fix" --no-verify
```
