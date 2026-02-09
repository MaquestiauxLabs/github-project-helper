import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "github-project-helper" is now active!',
  );

  const updateStatusCommand = vscode.commands.registerCommand(
    "github-project-helper.updateStatus",
    async () => {
      // Get configuration
      const config = vscode.workspace.getConfiguration('githubProjectHelper');
      const organizations = config.get<string[]>('organizations') || [];
      const defaultOwner = config.get<string>('defaultOwner') || '';
      const showQuickPickForOwner = config.get<boolean>('showQuickPickForOwner') !== false;
      const statusOptions = config.get<string[]>('statusOptions') || ["Todo", "In Progress", "Done"];
      const defaultProjectName = config.get<string>('defaultProject') || '';
      
      const workspaceProjects = config.get<any[]>('workspaceProjects') || [];
      let owner: string | undefined;
      let projectFromWorkspace: any = null;
      
      if (workspaceProjects.length > 0) {
        // First check if user wants to use workspace project
        const projectItems = workspaceProjects.map(project => ({
          label: project.name,
          description: `${project.owner}${project.description ? ` - ${project.description}` : ''}`,
          owner: project.owner,
          isWorkspaceProject: true
        }));
        
        const useWorkspaceProject = await vscode.window.showQuickPick([
          { label: 'Select from workspace projects', description: 'Choose from pre-configured projects' },
          { label: 'Browse GitHub', description: 'Select organization and browse projects' }
        ], {
          placeHolder: "How would you like to select a project?",
          title: "GitHub Project Helper"
        });
        
        if (!useWorkspaceProject) {
          return;
        }
        
        if (useWorkspaceProject.label === 'Select from workspace projects') {
          const selectedWorkspaceProject = await vscode.window.showQuickPick(projectItems, {
            placeHolder: "Select workspace project",
            title: "GitHub Project Helper"
          });
          
          if (!selectedWorkspaceProject) {
            return;
          }
          
          projectFromWorkspace = selectedWorkspaceProject;
          owner = selectedWorkspaceProject.owner;
        }
      }
      
      if (!owner) {
        if (showQuickPickForOwner && organizations.length > 0) {
          // Show quick pick with organizations + custom input
          const orgItems = organizations.map(org => ({
            label: org,
            description: org === defaultOwner ? 'Default' : undefined
          }));
          
          const selected = await vscode.window.showQuickPick([
            ...orgItems,
            { label: 'Enter custom organization...', description: 'Type any GitHub organization' }
          ], {
            placeHolder: "Select GitHub organization",
            title: "GitHub Project Helper"
          });
          
          if (!selected) {
            return;
          }
          
          if (selected.label === 'Enter custom organization...') {
            owner = await vscode.window.showInputBox({
              prompt: "GitHub owner/organization",
              placeHolder: defaultOwner || "MaquestiauxLabs",
              value: defaultOwner
            });
          } else {
            owner = selected.label;
          }
        } else {
          // Show input box
          owner = await vscode.window.showInputBox({
            prompt: "GitHub owner/organization",
            placeHolder: defaultOwner || "MaquestiauxLabs",
            value: defaultOwner
          });
        }
      }

      if (!owner) {
        return;
      }

      try {
        let selectedProject: any = null;
        
        if (projectFromWorkspace) {
          // Use workspace project - find it in GitHub
          const { stdout: projectsJson } = await execAsync(`gh project list --owner ${owner} --format json`);
          const response = JSON.parse(projectsJson);
          const projectsArray = response.projects || [];
          
          const foundProject = projectsArray.find((p: any) => p.title === projectFromWorkspace.label);
          
          if (!foundProject) {
            vscode.window.showErrorMessage(`Workspace project "${projectFromWorkspace.label}" not found in GitHub organization "${owner}"`);
            return;
          }
          
          selectedProject = {
            label: foundProject.title,
            description: `#${foundProject.number}`,
            id: foundProject.id
          };
        } else {
          // Browse GitHub projects
          const { stdout: projectsJson } = await execAsync(`gh project list --owner ${owner} --format json`);
          const response = JSON.parse(projectsJson);
          
          // Projects are nested under a "projects" property
          const projectsArray = response.projects || [];
          
          if (projectsArray.length === 0) {
            vscode.window.showErrorMessage(`No projects found for owner "${owner}"`);
            return;
          }

          const projectItems = projectsArray
            .map((p: any) => ({
              label: p.title,
              description: `#${p.number}`,
              id: p.id
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          // Pre-select default project if it exists
          let defaultProjectIndex = -1;
          if (defaultProjectName) {
            defaultProjectIndex = projectItems.findIndex((p: any) => p.label === defaultProjectName);
          }

          selectedProject = await vscode.window.showQuickPick(projectItems, {
            placeHolder: "Select GitHub project",
            matchOnDescription: true,
            title: defaultProjectIndex >= 0 ? `Default: ${defaultProjectName}` : undefined
          });

          if (!selectedProject) {
            return;
          }
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
          }))
          .sort((a: any, b: any) => {
            // Sort by status: Todo -> In Progress -> Done
            const statusOrder = { 'Todo': 0, 'In Progress': 1, 'Done': 2 };
            const aStatus = a.description;
            const bStatus = b.description;
            
            const aOrder = statusOrder[aStatus as keyof typeof statusOrder] ?? 3;
            const bOrder = statusOrder[bStatus as keyof typeof statusOrder] ?? 3;
            
            return aOrder - bOrder;
          });

        const selectedIssue = await vscode.window.showQuickPick(issueItems, {
          placeHolder: "Select issue to update",
          matchOnDescription: true
        });

        if (!selectedIssue) {
          return;
        }

        const issueNumber = (selectedIssue as any).issueNumber;

        const status = await vscode.window.showQuickPick(
          statusOptions,
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

  // Command to add workspace project
  const addWorkspaceProjectCommand = vscode.commands.registerCommand(
    "github-project-helper.addWorkspaceProject",
    async () => {
      const config = vscode.workspace.getConfiguration('githubProjectHelper');
      const workspaceProjects = config.get<any[]>('workspaceProjects') || [];
      
      const owner = await vscode.window.showInputBox({
        prompt: "GitHub organization/owner",
        placeHolder: "MyOrg",
      });
      
      if (!owner) {
        return;
      }
      
      try {
        // Fetch projects to show available options
        const { stdout: projectsJson } = await execAsync(`gh project list --owner ${owner} --format json`);
        const response = JSON.parse(projectsJson);
        const projectsArray = response.projects || [];
        
        if (projectsArray.length === 0) {
          vscode.window.showErrorMessage(`No projects found for owner "${owner}"`);
          return;
        }
        
        const projectItems = projectsArray.map((p: any) => ({
          label: p.title,
          description: `#${p.number}`,
          id: p.id,
          owner: owner
        }));
        
        const selectedProject = await vscode.window.showQuickPick(projectItems, {
          placeHolder: "Select project to add to workspace",
          matchOnDescription: true
        });
        
        if (!selectedProject) {
          return;
        }
        
        const description = await vscode.window.showInputBox({
          prompt: "Optional description for this workspace project",
          placeHolder: "Main frontend project",
        });
        
        // Add to workspace projects
        const newProject = {
          name: (selectedProject as any).label,
          owner: (selectedProject as any).owner,
          description: description || undefined
        };
        
        const updatedProjects = [...workspaceProjects, newProject];
        await config.update('workspaceProjects', updatedProjects, vscode.ConfigurationTarget.Workspace);
        
        vscode.window.showInformationMessage(
          `Added "${(selectedProject as any).label}" to workspace projects`
        );
        
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to fetch projects: ${error}`
        );
      }
    }
  );
  
  // Command to remove workspace projects
  const removeWorkspaceProjectsCommand = vscode.commands.registerCommand(
    "github-project-helper.removeWorkspaceProjects",
    async () => {
      const config = vscode.workspace.getConfiguration('githubProjectHelper');
      const workspaceProjects = config.get<any[]>('workspaceProjects') || [];
      
      if (workspaceProjects.length === 0) {
        vscode.window.showInformationMessage("No workspace projects configured");
        return;
      }
      
const projectItems = workspaceProjects.map((project: any, index: number) => ({
          label: project.name,
          description: `${project.owner}${project.description ? ` - ${project.description}` : ''}`,
          index: index
        }));
        
        const selectedProjects = await vscode.window.showQuickPick(projectItems, {
          placeHolder: "Select projects to remove",
          canPickMany: true
        });
        
        if (!selectedProjects || selectedProjects.length === 0) {
          return;
        }
        
        // Remove selected projects
        const indicesToRemove = selectedProjects.map((item: any) => item.index).sort((a: number, b: number) => b - a);
      const updatedProjects = [...workspaceProjects];
      
      for (const index of indicesToRemove) {
        updatedProjects.splice(index, 1);
      }
      
      await config.update('workspaceProjects', updatedProjects, vscode.ConfigurationTarget.Workspace);
      
      vscode.window.showInformationMessage(
        `Removed ${selectedProjects.length} project(s) from workspace`
      );
    }
  );

  context.subscriptions.push(updateStatusCommand, addWorkspaceProjectCommand, removeWorkspaceProjectsCommand);
}

export function deactivate() {}