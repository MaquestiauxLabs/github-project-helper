import * as vscode from "vscode";
import { GitHubCli } from "./githubCli";
import {
  getIssueDetailHtml,
  getLoadingHtml,
  IssueDetail,
} from "./templates/issueDetailTemplate";
import { getKanbanHtml } from "./templates/kanbanTemplate";
import { getSelectorHtml } from "./templates/selectorTemplate";
import { GitHubProject, KanbanColumn, ProjectItem } from "./types";
import { escapeHtml, getItemHtml } from "./utils/htmlUtils";

export class UnifiedPanel {
  public static currentPanel: UnifiedPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _onStatusChanged:
    | ((itemId: string, newStatus: string) => void)
    | undefined;
  private _currentView: "selector" | "kanban" | "issue" = "selector";
  private _currentOwner: string = "";
  private _currentProject: GitHubProject | null = null;
  private _currentKanbanColumns: KanbanColumn[] = [];
  private _currentIssue: IssueDetail | null = null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "searchProjects":
            await this.handleSearchProjects(message.owner);
            break;
          case "selectProject":
            this.handleProjectSelection(message.owner, message.project);
            break;
          case "backToSelector":
            this.showProjectSelector();
            break;
          case "openItem":
            if (message.itemId) {
              await this.handleOpenItem(message.itemId);
            }
            break;
          case "backToKanban":
            this.showKanban(
              this._currentOwner,
              this._currentProject!,
              this._currentKanbanColumns,
            );
            break;
          case "openOnGithub":
            if (message.url) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            break;
          case "updateItemStatus":
            if (this._onStatusChanged) {
              this._onStatusChanged(message.itemId, message.newStatus);
            }
            // Update the item in the kanban columns
            for (const column of this._currentKanbanColumns) {
              const itemIndex = column.items.findIndex(
                (i) => i.id === message.itemId,
              );
              if (itemIndex !== -1) {
                const item = column.items[itemIndex];
                // Remove from current column
                column.items.splice(itemIndex, 1);
                // Add to new column
                const newColumn = this._currentKanbanColumns.find(
                  (c) => c.name === message.newStatus,
                );
                if (newColumn) {
                  item.status = message.newStatus;
                  newColumn.items.push(item);
                }
                break;
              }
            }
            // Refresh the issue detail view with the new status
            if (this._currentIssue) {
              this._currentIssue.status = message.newStatus;
              this.showIssueDetail(this._currentIssue);
            }
            break;
        }
      },
      null,
      this._disposables,
    );
  }

  public static createOrShow(extensionUri: vscode.Uri): UnifiedPanel {
    const column = vscode.ViewColumn.One;

    if (UnifiedPanel.currentPanel) {
      UnifiedPanel.currentPanel._panel.reveal(column);
      UnifiedPanel.currentPanel.showProjectSelector();
      return UnifiedPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      "githubProjectsUnified",
      "GitHub Projects",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    UnifiedPanel.currentPanel = new UnifiedPanel(panel, extensionUri);
    UnifiedPanel.currentPanel.showProjectSelector();
    return UnifiedPanel.currentPanel;
  }

  public onStatusChanged(
    callback: (itemId: string, newStatus: string) => void,
  ) {
    this._onStatusChanged = callback;
  }

  public showProjectSelector() {
    this._currentView = "selector";
    this._panel.title = "GitHub Projects";
    this._panel.webview.html = getSelectorHtml();
  }

  public showKanban(
    owner: string,
    project: GitHubProject,
    columns: KanbanColumn[],
  ) {
    this._currentView = "kanban";
    this._currentOwner = owner;
    this._currentProject = project;
    this._currentKanbanColumns = columns;
    this._panel.title = `${owner} / ${project.title}`;
    this._panel.webview.html = getKanbanHtml(
      owner,
      project.title,
      columns,
      escapeHtml,
      (item: ProjectItem) => getItemHtml(item, escapeHtml),
    );
  }

  private async handleSearchProjects(owner: string) {
    try {
      this._panel.webview.postMessage({
        command: "searchStarted",
      });

      const projects = await GitHubCli.listProjects(owner);

      this._panel.webview.postMessage({
        command: "searchCompleted",
        projects: projects,
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: "searchError",
        error: error.message,
      });
    }
  }

  private handleProjectSelection(owner: string, project: GitHubProject) {
    if ((this as any)._onProjectSelectedCallback) {
      (this as any)._onProjectSelectedCallback(owner, project);
    }
  }

  private async handleOpenItem(itemId: string) {
    // Find the item in the current kanban columns
    let selectedItem: ProjectItem | null = null;
    for (const column of this._currentKanbanColumns) {
      const item = column.items.find((i) => i.id === itemId);
      if (item) {
        selectedItem = item;
        break;
      }
    }

    if (!selectedItem) {
      vscode.window.showErrorMessage("Could not find the selected item");
      return;
    }

    const itemTitle = selectedItem.content?.title || selectedItem.title;

    // Show loading state
    this.showLoadingIssue(itemTitle);

    try {
      // Fetch the issue details in a single GraphQL call
      let body = "";
      let labels: string[] = [];
      let typeField = "";
      let assignees: string[] = [];
      let state =
        selectedItem.content?.state || selectedItem.status || "unknown";
      let title = selectedItem.content?.title || selectedItem.title;
      let url = selectedItem.content?.url || "";

      if (selectedItem.content?.repository && selectedItem.content?.number) {
        const details = await GitHubCli.getIssueDetails(
          selectedItem.content.repository,
          selectedItem.content.number,
        );
        body = details.body;
        labels = details.labels;
        typeField = details.issueType;
        assignees = details.assignees;
        state = details.state || state;
        title = details.title || title;
        url = details.url || url;
      }

      // Get available statuses from current kanban columns
      const availableStatuses = this._currentKanbanColumns.map(
        (col) => col.name,
      );

      // Create issue detail object
      const issue: IssueDetail = {
        title: title,
        number: selectedItem.content?.number || 0,
        state: state,
        type: selectedItem.type,
        typeField: typeField,
        repository: selectedItem.content?.repository || "unknown",
        body: body,
        url: url,
        labels: labels,
        assignees: assignees,
        status: selectedItem.status,
        availableStatuses: availableStatuses,
        itemId: itemId,
      };

      this.showIssueDetail(issue);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error loading issue: ${error.message}`);
    }
  }

  private _getItemBody(item: ProjectItem): string {
    // This is kept for backward compatibility but is no longer used
    // The body is now fetched from GitHub when opening the issue detail
    const type = item.type || item.content?.type || "DRAFT_ISSUE";
    const state = item.content?.state || item.status || "unknown";

    return `Type: ${type}\nState: ${state}`;
  }

  public showIssueDetail(issue: IssueDetail) {
    this._currentView = "issue";
    this._currentIssue = issue;
    this._panel.title = `${issue.number} - ${issue.title}`;
    this._panel.webview.html = getIssueDetailHtml(issue, escapeHtml);
  }

  private showLoadingIssue(issueTitle: string) {
    this._currentView = "issue";
    this._panel.title = "Loading...";
    this._panel.webview.html = getLoadingHtml(issueTitle, escapeHtml);
  }

  public onProjectSelected(
    callback: (owner: string, project: GitHubProject) => void,
  ) {
    (this as any)._onProjectSelectedCallback = callback;
  }

  public dispose() {
    UnifiedPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
