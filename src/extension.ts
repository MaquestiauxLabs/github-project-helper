import * as vscode from 'vscode';
import { IssueStatusUpdater } from './services/issueStatusUpdater';
import { WorkspaceProjectManager } from './services/workspaceProjectManager';

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "github-project-helper" is now active!',
  );

  const issueStatusUpdater = new IssueStatusUpdater();
  const workspaceProjectManager = new WorkspaceProjectManager();

  // Main command for updating issue status
  const updateStatusCommand = vscode.commands.registerCommand(
    "github-project-helper.updateStatus",
    () => issueStatusUpdater.updateIssueStatus()
  );

  // Command for adding workspace projects
  const addWorkspaceProjectCommand = vscode.commands.registerCommand(
    "github-project-helper.addWorkspaceProject",
    () => workspaceProjectManager.addWorkspaceProject()
  );

  // Command for removing workspace projects
  const removeWorkspaceProjectsCommand = vscode.commands.registerCommand(
    "github-project-helper.removeWorkspaceProjects",
    () => workspaceProjectManager.removeWorkspaceProjects()
  );

  // Register all commands
  context.subscriptions.push(
    updateStatusCommand,
    addWorkspaceProjectCommand,
    removeWorkspaceProjectsCommand
  );
}

export function deactivate() {}