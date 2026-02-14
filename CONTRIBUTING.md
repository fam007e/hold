# Contributing to HOLD

Thank you for your interest in contributing to HOLD! We want to make contributing to this project as easy and transparent as possible.

## Security Warning

> [!IMPORTANT]
> Because HOLD is a Zero Knowledge application, any change to the cryptographic flow in `src/lib/security.ts` or `src/lib/HoldsContext.tsx` requires extreme scrutiny. Ensure you understand the Web Crypto API before proposing changes to these files.

## Development Setup

1. **Node.js**: Ensure you are using a compatible Node.js version (`^20.19.0 || ^22.13.0 || >=24`).

2. **Clone the repo**:
   ```bash
   git clone https://github.com/USER/hold.git
   cd hold
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in your Firebase credentials.

4. **Run local server**:
   ```bash
   npm run dev
   ```

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Update the documentation (README.md, etc.) if necessary.
5. Open a Pull Request referencing the relevant issue.

## Code Style

- Use Prettier for formatting.
- Follow TypeScript best practices (Project targets ES2022).
- Prefer functional components and hooks.
- Keep CSS in component-specific files.

## Community Standards

Please be respectful and patient. We aim to foster a collaborative and welcoming environment for all contributors.
