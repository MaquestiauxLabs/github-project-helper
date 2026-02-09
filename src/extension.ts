import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "github-project-helper" is now active!',
  );

  const disposable = vscode.commands.registerCommand(
    "github-project-helper.updateStatus",
    async () => {
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

      vscode.window.showInformationMessage(
        `Updating issue #${issue} to "${status}"`,
      );
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
