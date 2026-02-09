import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "github-project-helper" is now active!',
  );

  const disposable = vscode.commands.registerCommand(
    "github-project-helper.updateStatus",
    async () => {
      const owner = await vscode.window.showInputBox({
        prompt: "GitHub owner/organization",
        placeHolder: "MaquestiauxLabs",
      });

      if (!owner) {
        return;
      }

      try {
        const { stdout: projectsJson } = await execAsync(`gh project list --owner ${owner} --format json`);
        const response = JSON.parse(projectsJson);
        
        // Projects are nested under a "projects" property
        const projectsArray = response.projects || [];
        
        if (projectsArray.length === 0) {
          vscode.window.showErrorMessage(`No projects found for owner "${owner}"`);
          return;
        }

        const projectItems = projectsArray.map((p: any) => ({
          label: p.title,
          description: `#${p.number}`,
          id: p.id
        }));

        const selectedProject = await vscode.window.showQuickPick(projectItems, {
          placeHolder: "Select GitHub project",
          matchOnDescription: true
        });

        if (!selectedProject) {
          return;
        }

        const projectId = (selectedProject as any).id;
        const projectNumber = (selectedProject as any).description?.replace('#', '');

        // Fetch issues from the selected project using the project number
        const { stdout: itemsJson } = await execAsync(`gh project item-list ${projectNumber} --owner ${owner} --format json`);
        const itemsResponse = JSON.parse(itemsJson);
        
        const itemsArray = itemsResponse.items || [];
        
        if (itemsArray.length === 0) {
          vscode.window.showErrorMessage(`No issues found in project`);
          return;
        }

        const issueItems = itemsArray
          .filter((item: any) => item.content && item.content.number) // Only show items with issue numbers
          .map((item: any) => ({
            label: `#${item.content.number} - ${item.content.title}`,
            description: item.status || 'No Status',
            id: item.id,
            issueNumber: item.content.number
          }));

        const selectedIssue = await vscode.window.showQuickPick(issueItems, {
          placeHolder: "Select issue to update",
          matchOnDescription: true
        });

        if (!selectedIssue) {
          return;
        }

        const issueNumber = (selectedIssue as any).issueNumber;

        const status = await vscode.window.showQuickPick(
          ["Todo", "In Progress", "Done"],
          { placeHolder: "Select project status" },
        );

        if (!status) {
          return;
        }

        const command = `PROJECT=$(gh project view ${projectNumber} --owner ${owner} --format json | jq -r '.id'); FIELDS=$(gh project field-list ${projectNumber} --owner ${owner} --format json); FIELD=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .id'); OPTION=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="${status}") | .id'); ITEM=$(gh project item-list ${projectNumber} --owner ${owner} --format json | jq -r '.items[] | select(.content.number==${issueNumber}) | .id'); gh project item-edit --id "$ITEM" --project-id "$PROJECT" --field-id "$FIELD" --single-select-option-id "$OPTION"`;
        
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Updating GitHub Project Status",
            cancellable: false,
          },
          async () => {
            await execAsync(command);
          },
        );

        vscode.window.showInformationMessage(
          `Successfully updated issue #${issueNumber} to "${status}"`,
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to update issue: ${error}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}