import { ProjectItem } from "../types";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getItemHtml(
  item: ProjectItem,
  escapeHtmlFn: (text: string) => string,
): string {
  const title = item.content?.title || item.title;
  const type = item.type || item.content?.type || "DRAFT_ISSUE";
  const url = item.content?.url || "";
  const repo = item.content?.repository || "";

  let typeClass = "draft-issue";
  let typeLabel = "Draft";

  if (type === "ISSUE" || type === "Issue") {
    typeClass = "issue";
    typeLabel = "Issue";
  } else if (type === "PULL_REQUEST" || type === "PullRequest") {
    typeClass = "pull-request";
    typeLabel = "PR";
  }

  return `
            <div class="kanban-item" draggable="true" data-url="${escapeHtmlFn(url)}" data-item-id="${escapeHtmlFn(item.id)}" data-item-title="${escapeHtmlFn(title)}">
                <div class="item-title">
                  ${escapeHtmlFn(title)}
                  <button class="item-open-btn" data-item-id="${escapeHtmlFn(item.id)}" title="View details" aria-label="View issue details">↗</button>
                </div>
                <div class="item-meta">
                    <span class="item-type ${typeClass}">${typeLabel}</span>
                    ${repo ? `<span class="item-repo">${escapeHtmlFn(repo)}</span>` : ""}
                    ${item.content?.number ? `<span>#${item.content.number}</span>` : ""}
                </div>
            </div>
        `;
}
