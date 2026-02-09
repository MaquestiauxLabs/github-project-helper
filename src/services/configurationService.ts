import * as vscode from 'vscode';
import { WorkspaceProject } from './githubService';

export class ConfigurationService {
  private static readonly SECTION = 'githubProjectHelper';

  static getOrganizations(): string[] {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<string[]>('organizations') || [];
  }

  static getDefaultOwner(): string {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<string>('defaultOwner') || '';
  }

  static getDefaultProject(): string {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<string>('defaultProject') || '';
  }

  static getStatusOptions(): string[] {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<string[]>('statusOptions') || ["Todo", "In Progress", "Done"];
  }

  static getShowQuickPickForOwner(): boolean {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<boolean>('showQuickPickForOwner') !== false;
  }

  static getWorkspaceProjects(): WorkspaceProject[] {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<any[]>('workspaceProjects') || [];
  }

  static async updateWorkspaceProjects(projects: WorkspaceProject[]): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    await config.update('workspaceProjects', projects, vscode.ConfigurationTarget.Workspace);
  }

  static async addWorkspaceProject(project: WorkspaceProject): Promise<void> {
    const currentProjects = this.getWorkspaceProjects();
    const updatedProjects = [...currentProjects, project];
    await this.updateWorkspaceProjects(updatedProjects);
  }

  static async removeWorkspaceProjects(indices: number[]): Promise<void> {
    const currentProjects = this.getWorkspaceProjects();
    const updatedProjects = [...currentProjects];
    
    // Sort indices in descending order to avoid shifting issues
    const sortedIndices = indices.sort((a, b) => b - a);
    
    for (const index of sortedIndices) {
      updatedProjects.splice(index, 1);
    }
    
    await this.updateWorkspaceProjects(updatedProjects);
  }
}