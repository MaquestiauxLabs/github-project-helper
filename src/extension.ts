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

      const project = await vscode.window.showInputBox({
        prompt: "GitHub project number",
        placeHolder: "2",
      });

      if (!project) {
        return;
      }

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

      try {
        const command = `PROJECT=$(gh project view ${project} --owner ${owner} --format json | jq -r '.id'); FIELDS=$(gh project field-list ${project} --owner ${owner} --format json); FIELD=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .id'); OPTION=$(echo "$FIELDS" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="${status}") | .id'); ITEM=$(gh project item-list ${project} --owner ${owner} --format json | jq -r '.items[] | select(.content.number==${issue}) | .id'); gh project item-edit --id "$ITEM" --project-id "$PROJECT" --field-id "$FIELD" --single-select-option-id "$OPTION"`;

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
          `Failed to update issue #${issue}: ${error}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
