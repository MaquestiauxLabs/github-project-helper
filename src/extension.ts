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

        const issue = await vscode.window.showInputBox({
          prompt: "GitHub issue number",
          placeHolder: "123",
        });

        if (!issue) {
          return;
        }

        const status = await vscode.window.showQuickPick(
          ["Todo", "In Progress", "Done"],
          { placeHolder: "Select project status" },
        );

        if (!status) {
          return;
        }

        const command = `PROJECT=$(gh project view ${projectId} --owner ${owner} --format json | jq -r '.id'); FIELDS=$(gh project field-list ${projectId} --owner ${owner} --format json); FIELD=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .id'); OPTION=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="${status}") | .id'); ITEM=$(gh project item-list ${projectId} --owner ${owner} --format json | jq -r '.items[] | select(.content.number==${issue}) | .id'); gh project item-edit --id "$ITEM" --project-id "$PROJECT" --field-id "$FIELD" --single-select-option-id "$OPTION"`;
        
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
          `Successfully updated issue #${issue} to "${status}"`,
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