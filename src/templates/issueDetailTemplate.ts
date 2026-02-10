import issueDetailHtml from "./issueDetail.html";

export interface IssueDetail {
  title: string;
  number: number;
  state: string;
  type: string;
  typeField?: string; // e.g., "Feature", "Bug"
  repository: string;
  body: string;
  url: string;
  labels?: string[];
  assignees?: string[];
  status?: string; // e.g., "Todo", "In Progress", "Done"
  availableStatuses?: string[]; // Available status options
  itemId?: string; // Item ID for status changes
}

export function getLoadingHtml(
  issueTitle: string,
  escapeHtml: (text: string) => string,
): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Loading Issue</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }

          .back-button {
            padding: 8px 16px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .back-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 60px 20px;
            text-align: center;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--vscode-descriptionForeground);
            border-top-color: var(--vscode-foreground);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-text {
            font-size: 16px;
            font-weight: 500;
          }

          .issue-title {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Loading issue details...</h1>
          <button class="back-button" id="backButton">← Back</button>
        </div>

        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Please wait</div>
          <div class="issue-title">Loading: ${escapeHtml(issueTitle)}</div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById("backButton").addEventListener("click", () => {
            vscode.postMessage({ command: "backToKanban" });
          });
        </script>
      </body>
    </html>
  `;
}

export function getIssueDetailHtml(
  issue: IssueDetail,
  escapeHtml: (text: string) => string,
): string {
  const stateClass = issue.state.toLowerCase() === "open" ? "open" : "closed";
  const typeClass =
    issue.type === "PULL_REQUEST" || issue.type === "PullRequest"
      ? "pull-request"
      : "issue";
  const typeLabel =
    issue.type === "PULL_REQUEST" || issue.type === "PullRequest"
      ? "PR"
      : "ISSUE";
  const bodyText =
    issue.body || '<div class="empty-body">No description provided</div>';

  // Generate assignees HTML
  const assigneesHtml =
    (issue.assignees || []).length > 0
      ? (issue.assignees || [])
          .map(
            (assignee) =>
              `<div class="sidebar-item">${escapeHtml(assignee)}</div>`,
          )
          .join("")
      : '<div class="sidebar-empty">Unassigned</div>';

  // Generate labels HTML in sidebar
  const labelsHtml =
    (issue.labels || []).length > 0
      ? (issue.labels || [])
          .map(
            (label) => `<span class="issue-label">${escapeHtml(label)}</span>`,
          )
          .join("")
      : '<div class="sidebar-empty">No labels</div>';

  // Generate type field HTML in sidebar
  const typeFieldHtml = issue.typeField
    ? `<span class="badge-field">${escapeHtml(issue.typeField)}</span>`
    : '<div class="sidebar-empty">No type</div>';

  // Generate status HTML in sidebar with dropdown
  let statusHtml: string;
  if (issue.availableStatuses && issue.availableStatuses.length > 0) {
    const optionsHtml = issue.availableStatuses
      .map(
        (s) =>
          `<option value="${escapeHtml(s)}" ${s === issue.status ? "selected" : ""}>${escapeHtml(s)}</option>`,
      )
      .join("");
    statusHtml = `<select class="status-select" id="statusSelect" data-item-id="${escapeHtml(issue.itemId || "")}">
      ${optionsHtml}
    </select>`;
  } else {
    statusHtml = issue.status
      ? `<span class="badge-field">${escapeHtml(issue.status)}</span>`
      : '<div class="sidebar-empty">No status</div>';
  }

  // Generate sidebar HTML
  const sidebarHtml = `
    <div class="sidebar">
      <div class="sidebar-card">
        <div class="card-title">Status</div>
        <div class="card-content">
          ${statusHtml}
        </div>
      </div>

      <div class="sidebar-card">
        <div class="card-title">Assignees</div>
        <div class="card-content">
          ${assigneesHtml}
        </div>
      </div>

      <div class="sidebar-card">
        <div class="card-title">Labels</div>
        <div class="card-content">
          ${labelsHtml}
        </div>
      </div>

      <div class="sidebar-card">
        <div class="card-title">Type</div>
        <div class="card-content">
          ${typeFieldHtml}
        </div>
      </div>

      <button class="external-link" id="openOnGithub" title="Open on GitHub">
        <span>Open on GitHub</span>
        <span>↗</span>
      </button>
    </div>
  `;

  return issueDetailHtml
    .replace("{{ISSUE_TITLE}}", escapeHtml(issue.title))
    .replace(/{{ISSUE_NUMBER}}/g, `#${issue.number}`)
    .replace(/{{ISSUE_STATE}}/g, escapeHtml(issue.state.toUpperCase()))
    .replace("{{ISSUE_STATE_CLASS}}", stateClass)
    .replace("{{ISSUE_TYPE}}", typeLabel)
    .replace("{{ISSUE_TYPE_CLASS}}", typeClass)
    .replace("{{ISSUE_REPOSITORY}}", escapeHtml(issue.repository))
    .replace("{{ISSUE_BODY}}", escapeHtml(bodyText))
    .replace("{{ISSUE_URL}}", escapeHtml(issue.url))
    .replace("{{ISSUE_SIDEBAR}}", sidebarHtml);
}
