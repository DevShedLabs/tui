# DevShed TUI

A Terminal User Interface (TUI) for DevShed that allows developers to manage projects and tasks directly from their terminal environment.

## 🚀 Features

### ✅ Current Features

- **📁 Project Management**: List and create projects
- **📋 Task Management**: List, create, and comment on tasks  
- **🎯 Context Management**: Switch between projects and organizations
- **⚙️ Configuration System**: Automatic setup and persistent configuration
- **🔧 Interactive Setup**: Guided configuration with validation
- **🎨 Beautiful TUI**: React-based terminal interface with Ink

### 🚧 Planned Features

- **🔐 Authentication**: Secure login flow with DevShed API
- **📊 Real Data**: Live project and task data from DevShed API
- **🔍 Advanced Filtering**: Filter tasks by status, assignee, dates
- **📈 Project Analytics**: Task completion stats and project insights
- **🔄 Real-time Updates**: Live data synchronization
- **🎨 Themes**: Customizable color schemes and layouts

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- DevShed account and API access

### Install from Source

```bash
# Clone the repository
git clone <repository-url>
cd devshed-tui

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## 🚀 Quick Start

### 1. Initialize Configuration

Run DevShed TUI for the first time:

```bash
# This will prompt you to set up your configuration
devshed context show
```

Or manually initialize:

```bash
devshed init
```

You'll be prompted for:
- **API URL**: Your DevShed API endpoint (default: https://api.devshed.dev)
- **API Key**: Your DevShed API key
- **User ID**: Your DevShed user ID
- **Organization ID**: Your default organization
- **Project ID**: Current project (optional)

### 2. Start Using DevShed TUI

```bash
# Show current context
devshed context show

# List projects
devshed projects list

# List tasks for current project
devshed tasks list

# Get help
devshed --help
```

## 📚 Commands

### Project Management

```bash
# List all accessible projects
devshed projects list

# Create a new project
devshed projects create "My New Project"
```

### Task Management

```bash
# List tasks for current project
devshed tasks list

# List tasks for specific project
devshed tasks list project-id

# Create a new task
devshed tasks create project-id "Task title"

# Add comment to a task
devshed tasks comment task-id "My comment"
```

### Context Management

```bash
# Show current context and configuration
devshed context show

# Switch to a different project (permanent)
devshed context switch project project-id

# Switch to a different organization (permanent)
devshed context switch org org-id

# Temporarily use a project (session only)
devshed context use project "Project Name"

# Temporarily use an organization (session only)
devshed context use org "Organization Name"
```

### Configuration

```bash
# Initialize or reconfigure DevShed TUI
devshed init

# Show help for any command
devshed <command> --help
```

## 🚀 Shell Aliases

DevShed TUI's command structure is designed to work perfectly with shell aliases. Create your own shortcuts for lightning-fast workflows:

### Common Aliases

Add these to your `~/.bashrc`, `~/.zshrc`, or shell config:

```bash
# Project shortcuts
alias dpl="devshed projects list"
alias dps="devshed projects switch" 
alias dpr="devshed projects read"
alias dpc="devshed projects create"

# Task shortcuts  
alias dtl="devshed tasks list"
alias dts="devshed tasks switch"
alias dtr="devshed tasks read"
alias dtc="devshed tasks create"

# Context shortcuts
alias dc="devshed context show"
alias dcs="devshed context switch"

# Quick access
alias dp="devshed projects"
alias dt="devshed tasks"
```

### Power User Workflows

**Important:** Add basic aliases first, then workflow aliases below them:

```bash
# 1. First add all basic aliases above, then add these workflow aliases:

# Quick status check
alias status="devshed context show && echo && devshed tasks read"

# Start working (switch project, then task, then show details)
# Note: If project has no tasks, task switcher will auto-exit with helpful message
alias work="devshed projects switch && devshed tasks switch && devshed tasks read"

# Quick project overview
alias overview="devshed projects read && echo && devshed tasks list"

# Create task in current project (requires current project to be set)
alias newtask="devshed tasks create"

# Alternative: Use functions for complex workflows
# Note: Remove any existing aliases with the same name first, or use different names

# Option 1: Replace aliases with functions
unalias work status 2>/dev/null  # Remove aliases if they exist
work() {
    dps && dts && dtr
}

status() {
    dc && echo && dtr
}

# Option 2: Use different function names
startwork() {
    dps && dts && dtr
}

quickstatus() {
    dc && echo && dtr
}
```

### Example Usage

```bash
# Traditional way
devshed projects list
devshed projects switch
devshed tasks read

# With aliases (after basic aliases are defined)
dpl
dps  
dtr

# Workflow usage
work    # Switch project → switch task → show task details
status  # Show context + current task details
```

### 💡 Pro Tips

- **Alias Order Matters**: Define basic aliases before workflow aliases
- **Use Functions**: For complex workflows, shell functions work better than aliases
- **Name Conflicts**: Can't have both alias and function with same name - use `unalias` or different names
- **Reload Shell**: Run `source ~/.zshrc` (or your shell config) after adding aliases
- **Test Aliases**: Use `type work` to verify your alias/function is defined correctly
- **Debugging**: If you get parse errors, check for existing aliases: `alias | grep work`

The consistent `devshed <noun> <verb>` structure makes aliases intuitive and memorable!

## ⚙️ Configuration

DevShed TUI stores configuration in `~/.devshed/config.json`:

```json
{
  "apiUrl": "https://api.devshed.dev",
  "apiKey": "your-api-key",
  "userId": "your-user-id", 
  "defaultOrganizationId": "org-id",
  "currentProjectId": "project-id",
  "preferences": {
    "autoSaveContext": true,
    "showContextInPrompt": true,
    "contextPersistence": "session_and_config",
    "defaultTaskView": "compact"
  }
}
```

### Configuration Options

- **apiUrl**: DevShed API endpoint
- **apiKey**: Your API authentication key
- **userId**: Your DevShed user identifier
- **defaultOrganizationId**: Default organization for operations
- **currentProjectId**: Currently active project (changes when switching)
- **preferences**: User preferences for behavior and display

## 🛠️ Development

### Prerequisites

- Node.js 18+
- TypeScript knowledge
- Familiarity with React/Ink for TUI components

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

### Project Structure

```
devshed-tui/
├── src/
│   ├── commands/          # CLI command handlers
│   │   ├── projects.ts    # Project management commands
│   │   ├── tasks.ts       # Task management commands
│   │   └── context.ts     # Context switching commands
│   ├── components/        # Ink React components
│   │   ├── ProjectList.tsx
│   │   ├── TaskList.tsx
│   │   └── ContextDisplay.tsx
│   ├── utils/             # Utilities and helpers
│   │   ├── config.ts      # Configuration management
│   │   └── init.ts        # Setup and initialization
│   └── types/             # TypeScript type definitions
├── bin/                   # Executable entry point
└── dist/                  # Built JavaScript output
```

### Technology Stack

- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment  
- **Ink**: React-based TUI framework
- **Commander.js**: CLI argument parsing
- **Prompts**: Interactive user input

### Development Notes

- Uses ES modules with Node16 module resolution
- All relative imports must include `.js` extensions
- Configuration system uses singleton pattern
- Commands are modular and extensible

## 🔗 API Integration

DevShed TUI integrates with the DevShed API for:

- **Authentication**: Secure access to your DevShed data
- **Projects**: Retrieve and manage project information
- **Tasks**: Full task lifecycle management
- **Organizations**: Multi-organization support

### API Endpoints (Planned)

- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `GET /projects/{id}/tasks` - List project tasks
- `POST /tasks` - Create new task
- `POST /tasks/{id}/comments` - Add task comment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new functionality
- Update documentation for new features
- Follow existing code style and patterns

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

**Configuration not found**
```bash
# Re-initialize configuration
devshed init
```

**Command not working**
```bash
# Check if project is built
npm run build

# Verify configuration
devshed context show
```

**Permission errors**
```bash
# Make sure the binary is executable
chmod +x bin/devshed
```

### Getting Help

- Run `devshed --help` for command overview
- Run `devshed <command> --help` for specific command help
- Check the configuration with `devshed context show`

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and build system
- [x] CLI command structure
- [x] Configuration management
- [x] Basic TUI components

### Phase 2: API Integration 🚧
- [ ] DevShed API client
- [ ] Authentication flow
- [ ] Real project and task data
- [ ] Error handling and validation

### Phase 3: Enhanced Features 📋
- [ ] Advanced filtering and search
- [ ] Task status management
- [ ] Project analytics
- [ ] Bulk operations

### Phase 4: User Experience 🎨
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] Performance optimizations
- [ ] Offline mode

## Versioning
1. Bump version in package.json
2. Bump version in src/index.tx `.version('0.1.0');`

---

**Built with ❤️ for developers who live in the terminal**