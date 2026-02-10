import { KanbanColumn, ProjectItem } from "../types";
import kanbanHtml from "./kanban.html";

export function getKanbanHtml(
  owner: string,
  projectTitle: string,
  columns: KanbanColumn[],
  escapeHtml: (text: string) => string,
  getItemHtml: (item: ProjectItem) => string,
): string {
  // Generate column HTML
  const columnsHtml = columns
    .map(
      (column) => `
            <div class="kanban-column" data-column="${escapeHtml(column.name)}">
                <div class="column-header">
                    <h3>${escapeHtml(column.name)}</h3>
                    <span class="item-count">${column.items.length}</span>
                </div>
                <div class="column-items" data-drop-zone="${escapeHtml(column.name)}">
                    ${
                      column.items.length > 0
                        ? column.items.map((item) => getItemHtml(item)).join("")
                        : '<div class="empty-column">No items</div>'
                    }
                </div>
            </div>
        `,
    )
    .join("");

  // Replace placeholders in the HTML template
  return kanbanHtml
    .replace("{{PROJECT_TITLE}}", escapeHtml(projectTitle))
    .replace("{{PROJECT_OWNER}}", escapeHtml(owner))
    .replace("{{KANBAN_COLUMNS}}", columnsHtml);
}
