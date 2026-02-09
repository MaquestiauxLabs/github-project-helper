# GitHub Project Helper

A VS Code extension that helps you manage GitHub Project V2 statuses directly from your editor. This extension integrates with GitHub CLI to provide a seamless workflow for updating issue statuses within GitHub Projects.

## Features

- 🚀 **Project Selection**: Browse and select from your GitHub organization's projects
- 📋 **Issue Management**: View all issues from a selected project with their current status
- 🏷️ **Status Updates**: Update issue status (Todo, In Progress, Done) with a single click
- 🔄 **Real-time Updates**: Fetches live data from your GitHub projects
- 📊 **Status Visualization**: Issues are sorted by status (Todo → In Progress → Done) for better prioritization
- 🏢 **Workspace Projects**: Configure frequently used projects for quick access
- ⚙️ **Customizable Settings**: Configure organizations, default values, and status options
- 🎯 **Smart Defaults**: Pre-fill organization and project selections for faster workflow

## Requirements

### Prerequisites

Before using this extension, you need:

1. **GitHub CLI (`gh`)**: Install and authenticate with GitHub

   ```bash
   # Install GitHub CLI
   # macOS: brew install gh
   # Windows: winget install GitHub.cli
   # Linux: sudo apt install gh   # or appropriate package manager

   # Authenticate with GitHub
   gh auth login
   ```

2. **jq**: JSON processor for command line

   ```bash
   # macOS: brew install jq
   # Windows: choco install jq
   # Linux: sudo apt install jq
   ```

3. **GitHub Access**: Make sure you have access to the organization's projects

### VS Code Requirements

- VS Code version 1.109.0 or higher

## Installation

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

## Usage

### Basic Usage

1. **Open Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. **Run Command**: Type "Update GitHub Issue Status" and select it
3. **Follow the Prompts**:
   - Enter your GitHub organization/owner name (e.g., "my-org")
   - Select a project from the dropdown list
   - Choose an issue to update from the project's issues
   - Select the new status (Todo, In Progress, or Done)

### Step-by-Step Examples

#### Basic Usage
1. Press `Ctrl+Alt+G` (or `Ctrl+Shift+P` → "GPH: Update GitHub Issue Status")
2. Choose selection method:
   - **Select from workspace projects** (if configured)
   - **Browse GitHub** (normal flow)
3. Enter/select organization name
4. Select project from dropdown
5. Choose issue to update
6. Select new status

#### Using Workspace Projects
1. Configure workspace projects in settings or use "GPH: Add Project to Workspace"
2. Press `Ctrl+Alt+G`
3. Select "Select from workspace projects"
4. Choose from your pre-configured projects
5. Continue with issue selection and status update

#### Managing Workspace Projects
1. **Add project**: `Ctrl+Shift+P` → "GPH: Add Project to Workspace"
   - Enter organization
   - Select project from GitHub
   - Add optional description
2. **Remove projects**: `Ctrl+Shift+P` → "GPH: Remove Workspace Projects"
   - Select projects to remove (multi-select)
   - Confirm removal

### Status Display

Issues are displayed with their current status:
- **Todo**: Items that need to be started
- **In Progress**: Currently being worked on
- **Done**: Completed items
- **No Status**: Items without a status assigned
- **Custom**: Any status options you configure

### Sorting

- **Projects**: Sorted alphabetically by name
- **Issues**: Sorted by status priority based on your `statusOptions` configuration

## Commands

| Command | Description | Keyboard Shortcut |
|---------|-------------|------------------|
| `github-project-helper.updateStatus` | Update GitHub Project issue status | `Ctrl+Alt+G` (Mac: `Cmd+Alt+G`) |
| `github-project-helper.addWorkspaceProject` | Add project to workspace for quick access | None |
| `github-project-helper.removeWorkspaceProjects` | Remove projects from workspace configuration | None |

## Configuration

### Extension Settings

You can configure the extension through VS Code settings (`Ctrl+,`) or by editing your `.vscode/settings.json` file:

#### Organizations
```json
{
  "githubProjectHelper.organizations": [
    "MyOrg",
    "AnotherOrg",
    "OpenSourceProject"
  ]
}
```

#### Workspace Projects
```json
{
  "githubProjectHelper.workspaceProjects": [
    {
      "name": "Frontend Development",
      "owner": "MyOrg",
      "description": "Main frontend project"
    },
    {
      "name": "Backend API",
      "owner": "MyOrg",
      "description": "REST API services"
    }
  ]
}
```

#### Default Values
```json
{
  "githubProjectHelper.defaultOwner": "MyOrg",
  "githubProjectHelper.defaultProject": "Frontend Development"
}
```

#### Custom Status Options
```json
{
  "githubProjectHelper.statusOptions": [
    "Todo",
    "In Progress", 
    "Review",
    "Testing",
    "Done"
  ]
}
```

#### UI Preferences
```json
{
  "githubProjectHelper.showQuickPickForOwner": true
}
```

### Managing Workspace Projects

Instead of manually editing JSON, you can use the built-in commands:

1. **Add Project to Workspace**:
   - Press `Ctrl+Shift+P`
   - Type "GPH: Add Project to Workspace"
   - Enter organization name
   - Select project from dropdown
   - Add optional description

2. **Remove Workspace Projects**:
   - Press `Ctrl+Shift+P`
   - Type "GPH: Remove Workspace Projects"
   - Select projects to remove (multi-select supported)

### Keyboard Shortcuts

The extension includes a default shortcut:
- `Ctrl+Alt+G` (Mac: `Cmd+Alt+G`) - Update GitHub Issue Status

You can customize shortcuts:
1. Open VS Code settings (`Ctrl+,`)
2. Go to "Keyboard Shortcuts" (`Ctrl+K Ctrl+S`)
3. Search for "GitHub Project Helper"
4. Click the pencil icon to modify shortcuts

## Troubleshooting

### Common Issues

#### "Failed to fetch projects"

- **Cause**: GitHub CLI not authenticated or no internet connection
- **Solution**: Run `gh auth login` to authenticate

#### "No projects found for owner"

- **Cause**: Incorrect organization name or no access to projects
- **Solution**: Verify the organization name and ensure you have the necessary permissions

#### "No issues found in project"

- **Cause**: The project exists but has no linked issues
- **Solution**: Add some issues to your GitHub Project

#### Command failed: "invalid number"

- **Cause**: Internal error with project number handling
- **Solution**: Report the issue with steps to reproduce

#### "Cannot find name 'child_process'" or "Cannot find name 'util'"

- **Cause**: TypeScript configuration issue
- **Solution**: Restart VS Code after installation

### Debug Mode

To enable debug logging:

1. Open VS Code
2. Go to Help → Toggle Developer Tools
3. Check the Console tab for detailed error messages

### Permissions Required

The extension needs these GitHub permissions:

- Read access to organization projects
- Write access to project items (for status updates)

## Development

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

### Project Structure

```
github-project-helper/
├── src/
│   ├── extension.ts      # Main extension logic
│   └── test/
│       └── extension.test.ts
├── package.json          # Extension configuration
├── tsconfig.json         # TypeScript configuration
├── webpack.config.js      # Build configuration
└── README.md             # This file
```

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request to [MaquestiauxLabs/github-project-helper](https://github.com/MaquestiauxLabs/github-project-helper)

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 0.0.1 (Initial Release)
- Project selection from GitHub organizations
- Issue listing with status display
- Status update functionality (Todo, In Progress, Done)
- Automatic sorting of projects and issues
- Progress indicators for long-running operations
- Error handling and user feedback
- Workspace project management with UI commands
- Comprehensive settings for organizations, defaults, and status options
- Keyboard shortcut support (`Ctrl+Alt+G`)
- Smart default value pre-filling
- Multi-select for removing workspace projects

## Support

If you encounter any issues or have feature requests:

1. **Check the Issues**: Browse existing [GitHub Issues](https://github.com/MaquestiauxLabs/github-project-helper/issues)
2. **Create a New Issue**: If your problem isn't already reported, create a new issue with:
   - VS Code version
   - Extension version
   - Steps to reproduce
   - Error messages
   - System information

## Related Extensions

- [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) - Official GitHub extension for VS Code
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Git supercharged

## Privacy Notice

This extension:

- Only communicates with GitHub's API via GitHub CLI
- Does not store or transmit any personal data
- Does not track usage or collect analytics
- Runs entirely locally on your machine

## Acknowledgments

- [GitHub CLI](https://cli.github.com/) - For the amazing command-line interface
- [jq](https://stedolan.github.io/jq/) - For JSON processing
- [VS Code API](https://code.visualstudio.com/api) - For the extension framework

---

**Note**: This extension is not affiliated with GitHub, Inc. It's an independent tool built to enhance your GitHub Projects workflow.
