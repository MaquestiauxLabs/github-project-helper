# GitHub Project Helper

A VS Code extension that provides a **full-featured kanban board interface** for managing GitHub Project V2 directly within your editor. This extension brings the power of GitHub Projects to your VS Code workspace with a beautiful, drag-and-drop web interface.

## 🚀 Key Features

### 📋 **Full Kanban Board Interface**

- **Beautiful kanban board** with drag-and-drop functionality
- **Multi-column layout** based on your project's status field options
- **Real-time status updates** by dragging items between columns
- **Visual feedback** with hover effects and smooth transitions
- **Column item counts** that update dynamically

### 🎯 **Three-Panel Navigation System**

- **Project Selector**: Search and browse GitHub organizations and projects
- **Kanban Board**: Interactive board for managing project items
- **Issue Details View**: Comprehensive information sidebar with interactive status updates

### ⚡ **Advanced UI Features**

- **Modern web-based interface** that integrates seamlessly with VS Code themes
- **Drag-and-drop** functionality for instant status changes
- **Real-time updates** without page refreshes
- **Loading states** and progress indicators
- **Responsive design** that adapts to your VS Code theme
- **Accessibility features** including ARIA labels and keyboard navigation

### 🔗 **Deep GitHub Integration**

- **GitHub CLI integration** for reliable data fetching and updates
- **GraphQL queries** for detailed issue information
- **Support for private projects** and organizations
- **Real-time data synchronization** with GitHub Projects
- **Error handling** and fallback mechanisms

### 📊 **Rich Issue Information**

- **Issue cards** display:
  - Title with external GitHub links
  - Type badges (Issue, PR, Draft)
  - Repository name and issue number
  - Current status and assignees
  - Labels with visual tags

### 🎨 **Modern Web Architecture**

- **Single unified panel** that transitions between different views
- **Efficient data fetching** with intelligent caching
- **Minimal API calls** through smart batching
- **Webview message passing** for async operations

## 📋 Requirements

### Prerequisites

1. **GitHub CLI (`gh`)**: Install and authenticate with GitHub

   ```bash
   # Install GitHub CLI
   # macOS: brew install gh
   # Windows: winget install GitHub.cli
   # Linux: sudo apt install gh   # or appropriate package manager

   # Authenticate with GitHub
   gh auth login
   ```

2. **jq**: JSON processor for command line (required for GitHub CLI integration)

   ```bash
   # macOS: brew install jq
   # Windows: choco install jq
   # Linux: sudo apt install jq
   ```

### VS Code Requirements

- VS Code version 1.109.0 or higher

## 🚀 Installation

### From Marketplace (Recommended)

1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for "GitHub Project Helper"
4. Click "Install"

### From VSIX

1. Download the latest `.vsix` file from the [Releases](https://github.com/MaquestiauxLabs/github-project-helper/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` to open the Command Palette
4. Type "Extensions: Install from VSIX..." and select it
5. Navigate to and select the downloaded `.vsix` file
6. Reload VS Code when prompted

### From Source

1. Clone this repository
2. Open the repository in VS Code
3. Press `F5` to open a new Extension Development Host window
4. The extension will be available in the new window

## 💻 Usage

### Getting Started

1. **Open Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. **Run Command**: Type "GitHub Project Helper: Open Kanban Board" and select it
3. **Project Selection**:
   - Enter any GitHub username or organization name
   - Browse through available projects with visual cards
   - Select a project to open the kanban board

### Using the Kanban Board

#### **Navigation**

- **Project Selector** → **Kanban Board** → **Issue Details**
- Use the back button or navigation breadcrumbs to return to previous views

#### **Managing Issues**

- **Drag and drop** items between columns to update their status
- **Click on items** to view detailed information
- **External links** open issues directly in GitHub
- **Hover effects** provide visual feedback

#### **Issue Details Panel**

- View comprehensive issue information in a clean sidebar layout
- **Interactive status dropdown** for quick status changes
- View assignees, labels, and issue metadata
- **"Open on GitHub" button** for direct navigation

### Status Management

The kanban board automatically creates columns based on your project's status field:

- **Status options** are fetched directly from your GitHub Project
- **Custom statuses** are fully supported
- **Real-time updates** reflect changes immediately
- **Visual indicators** show item counts per column

### Project Types Supported

- **Personal projects** (your own repositories)
- **Organization projects** (team collaboration)
- **Private projects** (with proper permissions)
- **Public projects** (open source projects)

## 🎮 Commands

| Command                                 | Description                     | Keyboard Shortcut               |
| --------------------------------------- | ------------------------------- | ------------------------------- |
| `github-project-helper.openKanbanBoard` | Open the kanban board interface | `Ctrl+Alt+G` (Mac: `Cmd+Alt+G`) |

## 🔧 Configuration

The extension provides sensible defaults out of the box, but you can customize certain behaviors through VS Code settings:

```json
{
  // Optional: Default organization to pre-fill in project selector
  "githubProjectHelper.defaultOwner": "your-org"
}
```

## 🏗️ Architecture

### Project Structure

```text
src/
├── extension.ts              # Main extension entry point
├── unifiedPanel.ts          # Core webview management (293 lines)
├── githubCli.ts            # GitHub API integration (212 lines)
├── types.ts                # TypeScript interfaces
├── templates/              # HTML templates for each UI view
│   ├── kanban.html        # Kanban board with drag-drop (335 lines)
│   ├── selector.html      # Project search interface (447 lines)
│   ├── issueDetail.html   # Detailed issue view
│   └── *.ts               # Template generation logic
└── utils/
    └── htmlUtils.ts       # HTML utilities and item rendering
```

### Technical Stack

- **TypeScript** (ES2022, Node16 modules)
- **VS Code Extension API**
- **GitHub CLI (gh)** integration
- **Webpack** for bundling
- **HTML/CSS/JavaScript** for the webview UI
- **GraphQL** via GitHub CLI for detailed data fetching

## 🔍 Troubleshooting

### Common Issues

#### "GitHub CLI not authenticated"

- **Solution**: Run `gh auth login` to authenticate with GitHub

#### "No projects found for owner"

- **Cause**: Incorrect organization name or no access permissions
- **Solution**: Verify the organization name and ensure you have necessary permissions

#### "Failed to load project items"

- **Cause**: Network issues or GitHub API problems
- **Solution**: Check internet connection and try again

#### Drag-and-drop not working

- **Cause**: Webview security restrictions or VS Code version incompatibility
- **Solution**: Ensure VS Code is updated to latest version

### Debug Mode

To enable debug logging:

1. Open VS Code
2. Go to Help → Toggle Developer Tools
3. Check the Console tab for detailed error messages

## 🛠️ Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/MaquestiauxLabs/github-project-helper.git
cd github-project-helper

# Install dependencies
npm install

# Compile the extension
npm run compile

# Run in development mode
npm run watch
```

### Running Tests

```bash
# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style and TypeScript conventions
- Test your changes thoroughly with different project types
- Ensure the kanban board functionality works correctly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📈 Changelog

### Version 2.0.0 - Complete UI Overhaul

- **New kanban board interface** with drag-and-drop functionality
- **Three-panel navigation system** (selector → kanban → details)
- **Modern web-based UI** replacing command-line interface
- **Real-time status updates** through drag-and-drop
- **Comprehensive issue details panel** with interactive elements
- **Enhanced GitHub CLI integration** with GraphQL support
- **Improved error handling** and user feedback
- **Accessibility improvements** and keyboard navigation
- **VS Code theme integration** for seamless appearance

### Previous Versions

- Command-line interface for status updates
- Quick pick dialogs for project and issue selection
- Workspace project management features

## 🆘 Support

If you encounter any issues or have feature requests:

1. **Check the Issues**: Browse existing [GitHub Issues](https://github.com/MaquestiauxLabs/github-project-helper/issues)
2. **Create a New Issue**: If your problem isn't already reported, create a new issue with:
   - VS Code version
   - Extension version
   - Steps to reproduce
   - Screenshots if applicable
   - Error messages from developer console

## 🔗 Related Extensions

- [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) - Official GitHub extension for VS Code
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Git supercharged

## 🔒 Privacy Notice

This extension:

- Only communicates with GitHub's API via GitHub CLI
- Does not store or transmit any personal data
- Does not track usage or collect analytics
- Runs entirely locally on your machine
- Respects your privacy and GitHub's terms of service

## 🙏 Acknowledgments

- [GitHub CLI](https://cli.github.com/) - For the amazing command-line interface
- [jq](https://stedolan.github.io/jq/) - For JSON processing
- [VS Code API](https://code.visualstudio.com/api) - For the extension framework
- [GitHub Projects](https://docs.github.com/issues/planning-and-tracking-with-projects) - For the project management platform

---

**Note**: This extension is not affiliated with GitHub, Inc. It's an independent tool built to enhance your GitHub Projects workflow within VS Code.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MaquestiauxLabs/github-project-helper&type=Date)](https://star-history.com/#MaquestiauxLabs/github-project-helper&Date)
