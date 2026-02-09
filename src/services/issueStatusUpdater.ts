import * as vscode from 'vscode';
import { GitHubProject, GitHubItem, ProjectItem, IssueItem } from './githubService';
import { GitHubService } from './githubService';
import { ConfigurationService } from './configurationService';

export class IssueStatusUpdater {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  async updateIssueStatus(): Promise<void> {
    // Get configuration
    const organizations = ConfigurationService.getOrganizations();
    const defaultOwner = ConfigurationService.getDefaultOwner();
    const showQuickPickForOwner = ConfigurationService.getShowQuickPickForOwner();
    const statusOptions = ConfigurationService.getStatusOptions();
    const defaultProjectName = ConfigurationService.getDefaultProject();
    const workspaceProjects = ConfigurationService.getWorkspaceProjects();
    
    let owner: string | undefined;
    let projectFromWorkspace: any = null;
    
    // Handle workspace projects
    if (workspaceProjects.length > 0) {
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
        const projectItems = workspaceProjects.map(project => ({
          label: project.name,
          description: `${project.owner}${project.description ? ` - ${project.description}` : ''}`,
          owner: project.owner,
          isWorkspaceProject: true
        }));
        
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
    
    // Get owner if not already selected
    if (!owner) {
      if (showQuickPickForOwner && organizations.length > 0) {
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
      const projectData = await this.selectProject(owner, projectFromWorkspace, defaultProjectName);
      if (!projectData) {
        return;
      }

      const selectedIssue = await this.selectIssue(owner, projectData.selectedItem);
      if (!selectedIssue) {
        return;
      }

      const newStatus = await this.selectStatus(statusOptions);
      if (!newStatus) {
        return;
      }

      const issueData = await this.selectIssue(owner, projectData.selectedItem);
      if (!issueData) {
        return;
      }

      await this.executeStatusUpdate(projectData.project, issueData.issue);

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update issue: ${error}`);
    }
  }

  private async selectProject(owner: string, projectFromWorkspace: any, defaultProjectName: string): Promise<{ project: any, selectedItem: any } | null> {
    if (projectFromWorkspace) {
      const projects = await this.githubService.getProjects(owner);
      const foundProject = projects.find((p: GitHubProject) => p.title === projectFromWorkspace.label);
      
      if (!foundProject) {
        vscode.window.showErrorMessage(`Workspace project "${projectFromWorkspace.label}" not found in GitHub organization "${owner}"`);
        return null;
      }
      
      return {
        project: foundProject,
        selectedItem: {
          label: foundProject.title,
          description: `#${foundProject.number}`,
          id: foundProject.id,
          projectNumber: foundProject.number
        }
      };
    } else {
      const projects = await this.githubService.getProjects(owner);
      
      if (projects.length === 0) {
        vscode.window.showErrorMessage(`No projects found for owner "${owner}"`);
        return null;
      }

      const projectItems = projects
        .map((p: GitHubProject) => ({
          label: p.title,
          description: `#${p.number}`,
          id: p.id,
          projectNumber: p.number
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));

      let defaultProjectIndex = -1;
      if (defaultProjectName) {
        defaultProjectIndex = projectItems.findIndex((p: any) => p.label === defaultProjectName);
      }

      const selectedItem = await vscode.window.showQuickPick(projectItems, {
        placeHolder: "Select GitHub project",
        matchOnDescription: true,
        title: defaultProjectIndex >= 0 ? `Default: ${defaultProjectName}` : undefined
      });

      if (!selectedItem) {
        return null;
      }

      const selectedProject = projects.find((p: GitHubProject) => p.title === selectedItem.label);
      return {
        project: selectedProject,
        selectedItem
      };
    }
  }

  private async selectIssue(owner: string, selectedProject: any): Promise<{ issue: any, selectedItem: IssueItem } | null> {
    const items = await this.githubService.getProjectItems(owner, selectedProject.projectNumber);
    
    if (items.length === 0) {
      vscode.window.showErrorMessage(`No issues found in project`);
      return null;
    }

    const statusOptions = ConfigurationService.getStatusOptions();
    const issueItems = items
      .filter((item: GitHubItem) => item.content && item.content.number)
      .map((item: GitHubItem) => ({
        label: `#${item.content.number} - ${item.content.title}`,
        description: item.status || 'No Status',
        id: item.id,
        issueNumber: item.content.number
      }))
      .sort((a, b) => {
        const statusOrder = statusOptions.reduce((acc, status, index) => {
          acc[status] = index;
          return acc;
        }, {} as Record<string, number>);
        
        const aOrder = statusOrder[a.description] ?? statusOptions.length;
        const bOrder = statusOrder[b.description] ?? statusOptions.length;
        
        return aOrder - bOrder;
      });

    const selectedItem = await vscode.window.showQuickPick(issueItems, {
      placeHolder: "Select issue to update",
      matchOnDescription: true
    });

    if (!selectedItem) {
      return null;
    }

    const issue = items.find((item: GitHubItem) => item.id === selectedItem.id);
    return { issue, selectedItem };
  }

  private async selectStatus(statusOptions: string[]): Promise<string | null> {
    return await vscode.window.showQuickPick(statusOptions, {
      placeHolder: "Select project status"
    }) || null;
  }

  private async executeStatusUpdate(project: any, issue: any): Promise<void> {
    const statusOptions = ConfigurationService.getStatusOptions();
    const newStatus = await this.selectStatus(statusOptions);
    if (!newStatus) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Updating GitHub Project Status",
        cancellable: false,
      },
      async () => {
        await this.githubService.updateItemStatus(project, issue, newStatus);
      },
    );

    vscode.window.showInformationMessage(
      `Successfully updated issue #${issue.content.number} to "${newStatus}"`
    );
  }
}