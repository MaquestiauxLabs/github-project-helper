import * as vscode from "vscode";
import { GitHubCli } from "./githubCli";
import { GitHubProject, KanbanColumn, ProjectItem } from "./types";
import { UnifiedPanel } from "./unifiedPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("GitHub Projects extension is now active!");

  // Register the main command
  const openProjectsCommand = vscode.commands.registerCommand(
    "test-gh-interfacing.openGitHubProjects",
    async () => {
      await openGitHubProjectKanban(context);
    },
  );

  context.subscriptions.push(openProjectsCommand);
}

async function openGitHubProjectKanban(context: vscode.ExtensionContext) {
  try {
    // Step 1: Check if GitHub CLI is installed
    const isInstalled = await GitHubCli.isInstalled();
    if (!isInstalled) {
      const install = "Install GitHub CLI";
      const choice = await vscode.window.showErrorMessage(
        "GitHub CLI (gh) is not installed. Please install it to use this extension.",
        install,
        "Cancel",
      );

      if (choice === install) {
        vscode.env.openExternal(vscode.Uri.parse("https://cli.github.com/"));
      }
      return;
    }

    // Step 2: Check if user is authenticated
    const isAuthenticated = await GitHubCli.isAuthenticated();
    if (!isAuthenticated) {
      const authenticate = "Authenticate";
      const choice = await vscode.window.showErrorMessage(
        'You are not authenticated with GitHub CLI. Please run "gh auth login" in the terminal.',
        authenticate,
        "Cancel",
      );

      if (choice === authenticate) {
        const terminal = vscode.window.createTerminal("GitHub Auth");
        terminal.show();
        terminal.sendText("gh auth login");
      }
      return;
    }

    // Step 3: Open the unified panel with project selector
    const unifiedPanel = UnifiedPanel.createOrShow(context.extensionUri);

    // Handle project selection
    unifiedPanel.onProjectSelected(
      async (owner: string, project: GitHubProject) => {
        await loadAndDisplayProject(context, unifiedPanel, owner, project);
      },
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
    console.error(error);
  }
}

async function loadAndDisplayProject(
  context: vscode.ExtensionContext,
  unifiedPanel: UnifiedPanel,
  owner: string,
  project: GitHubProject,
) {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Loading project ${project.title}`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: "Fetching project items..." });
        const items = await GitHubCli.getProjectItems(owner, project.number);

        progress.report({ message: "Fetching status fields..." });
        const statusOptions = await GitHubCli.getProjectFieldOptions(
          owner,
          project.number,
        );

        progress.report({ message: "Organizing kanban board..." });
        const columns = organizeItemsByStatus(items, statusOptions);

        // Display the Kanban view in the unified panel
        unifiedPanel.showKanban(owner, project, columns);

        // Handle status changes from Kanban interactions
        unifiedPanel.onStatusChanged(
          async (itemId: string, newStatus: string) => {
            try {
              await GitHubCli.updateItemStatus(
                project.id,
                itemId,
                newStatus,
                owner,
                project.number,
              );
              vscode.window.showInformationMessage(
                `Item status updated to "${newStatus}"`,
              );
            } catch (error: any) {
              vscode.window.showErrorMessage(
                `Failed to update status: ${error.message}`,
              );
            }
          },
        );
      },
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error loading project: ${error.message}`);
    console.error(error);
  }
}

function organizeItemsByStatus(
  items: ProjectItem[],
  statusOptions: string[],
): KanbanColumn[] {
  // Create columns for each status
  const columnMap = new Map<string, ProjectItem[]>();

  // Initialize all columns
  statusOptions.forEach((status) => {
    columnMap.set(status, []);
  });

  // Add a column for items without status
  columnMap.set("No Status", []);

  // Organize items into columns
  items.forEach((item) => {
    const status = item.status || "No Status";

    if (columnMap.has(status)) {
      columnMap.get(status)!.push(item);
    } else {
      // If status is not in our predefined list, add it to "No Status"
      columnMap.get("No Status")!.push(item);
    }
  });

  // Convert map to array of columns, filtering out empty "No Status" column
  const columns: KanbanColumn[] = [];

  statusOptions.forEach((status) => {
    columns.push({
      name: status,
      items: columnMap.get(status) || [],
    });
  });

  // Add "No Status" column only if it has items
  const noStatusItems = columnMap.get("No Status") || [];
  if (noStatusItems.length > 0) {
    columns.push({
      name: "No Status",
      items: noStatusItems,
    });
  }

  return columns;
}

export function deactivate() {}
