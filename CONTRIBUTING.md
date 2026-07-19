# Contributing to WebDock

First off, thank you for considering contributing to WebDock! It's people like you that make WebDock such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check if there's already an [issue](https://github.com/chriz-3656/webdock/issues) for it. If not, feel free to open one!

## Setting up your development environment

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/webdock.git
   ```
3. **Install dependencies**:
   ```bash
   cd webdock
   npm install
   ```
4. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

## Development Guidelines

WebDock is built with a strong philosophy of **minimalism and performance**.
- **No Heavy Frameworks**: The renderer is built in vanilla TypeScript/HTML/CSS. Please do not introduce React, Vue, or TailwindCSS. We rely on raw DOM manipulation for speed.
- **Strict Typing**: Ensure all TypeScript compiles without errors (`npm run build`).
- **Security**: Never expose `nodeIntegration` to the renderer. Always use the `preload.ts` context bridge for IPC communication.

## Submitting a Pull Request

1. Commit your changes with a descriptive, concise commit message.
2. Push your branch to your fork.
3. Open a Pull Request against the `main` branch of the official repository.
4. Provide a clear description of what your PR solves or adds.

## Code Style

- Use 2 spaces for indentation.
- Prefer `const` and `let` over `var`.
- Keep CSS heavily organized by component blocks.

Thank you for helping us make WebDock incredible!
