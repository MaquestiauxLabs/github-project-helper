import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GitHubService } from './githubService';
import { ConfigurationService } from './configurationService';
import { WorkspaceProject } from './githubService';

const execAsync = promisify(exec);

export class WorkspaceProjectManager {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  async addWorkspaceProject(): Promise<void> {
    const owner = await vscode.window.showInputBox({
      prompt: "GitHub organization/owner",
      placeHolder: "MyOrg",
    });
    
    if (!owner) {
      return;
    }
    
    try {
      const projects = await this.githubService.getProjects(owner);
      
      if (projects.length === 0) {
        vscode.window.showErrorMessage(`No projects found for owner "${owner}"`);
        return;
      }
      
      const projectItems = projects.map(p => ({
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
      
      const newProject: WorkspaceProject = {
        name: selectedProject.label,
        owner: selectedProject.owner,
        description: description || undefined
      };
      
      await ConfigurationService.addWorkspaceProject(newProject);
      
      vscode.window.showInformationMessage(
        `Added "${selectedProject.label}" to workspace projects`
      );
      
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to fetch projects: ${error}`
      );
    }
  }

  async removeWorkspaceProjects(): Promise<void> {
    const workspaceProjects = ConfigurationService.getWorkspaceProjects();
    
    if (workspaceProjects.length === 0) {
      vscode.window.showInformationMessage("No workspace projects configured");
      return;
    }
    
    const projectItems = workspaceProjects.map((project, index) => ({
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
    
    const indicesToRemove = selectedProjects.map((item: any) => item.index);
    await ConfigurationService.removeWorkspaceProjects(indicesToRemove);
    
    vscode.window.showInformationMessage(
      `Removed ${selectedProjects.length} project(s) from workspace`
    );
  }
}