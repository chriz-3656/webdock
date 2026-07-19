# WebDock

**Your web apps. One dock.**

WebDock is a blazing fast, lightweight native desktop environment that transforms your favorite websites and web apps into standalone native desktop applications.

Say goodbye to cluttered browser tabs. WebDock runs each of your web apps in an isolated, sandboxed environment using Electron's raw `WebContentsView` API—delivering unparalleled performance, lower memory usage, and zero browser extension bloat.

## 🚀 Features

- **Blazing Fast Performance**: By bypassing standard browser chrome and using raw native views, WebDock minimizes RAM usage and maximizes speed.
- **Unified Workspace**: Group all your essential tools—from GitHub and Figma to Spotify and Slack—into a single, organized dock.
- **Sandboxed Security**: Every website runs in a fully isolated partition, meaning your main browser's cookies and extensions cannot bleed into your apps.
- **Native Look & Feel**: Beautiful UI built with raw CSS, smooth animations, customized icons, and a perfectly integrated dark mode.
- **Dynamic Tab Management**: Apps are suspended in the background automatically, returning resources to your machine when you need them.

## 📦 Installation

To run the application locally:

```bash
# Clone the repository
git clone https://github.com/chriz-3656/webdock.git

# Navigate to the project directory
cd webdock

# Install dependencies
npm install

# Start the application
npm start
```

## 🛠️ Building for Production

WebDock uses `electron-builder` to package native executables for your operating system. 

```bash
# Compile TypeScript and prepare the build
npm run build

# Package the application (e.g. into an .AppImage for Linux or .exe for Windows)
npm run dist
```

Your compiled binaries will be available in the `dist/` directory!

## ⌨️ Shortcuts

- `Ctrl+Shift+I`: Open Developer Tools for the active web app
- Back/Forward/Reload: Navigate fluidly using the top bar

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you have ideas for new features, keyboard shortcuts, or visual polish.

## 📄 License

This project is licensed under the MIT License.
