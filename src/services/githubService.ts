import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitHubProject {
  title: string;
  number: number;
  id: string;
  fields?: GitHubField[];
}

export interface GitHubField {
  id: string;
  name: string;
  dataType: string;
  options?: GitHubFieldOption[];
}

export interface GitHubFieldOption {
  id: string;
  name: string;
}

export interface GitHubItem {
  id: string;
  title: string;
  number: number;
  state: string;
  status: string;
  content: {
    number: number;
    title: string;
    state: string;
    url: string;
  };
}

export interface WorkspaceProject {
  name: string;
  owner: string;
  description?: string;
}

export interface ProjectItem {
  label: string;
  description: string;
  id: string;
}

export interface IssueItem {
  label: string;
  description: string;
  id: string;
  issueNumber: number;
}

export class GitHubService {
  async getProjects(owner: string): Promise<GitHubProject[]> {
    const { stdout: projectsJson } = await execAsync(`gh project list --owner ${owner} --format json`);
    const response = JSON.parse(projectsJson);
    return response.projects || [];
  }

  async getProjectWithFields(owner: string, projectNumber: number): Promise<GitHubProject | null> {
    // Get project details
    const { stdout: projectJson } = await execAsync(`gh project view ${projectNumber} --owner ${owner} --format json`);
    const project = JSON.parse(projectJson);
    
    // Get project fields
    const { stdout: fieldsJson } = await execAsync(`gh project field-list ${projectNumber} --owner ${owner} --format json`);
    const fieldsResponse = JSON.parse(fieldsJson);
    
    return {
      ...project,
      fields: fieldsResponse.fields || []
    };
  }

  async getProjectItems(owner: string, projectNumber: number): Promise<GitHubItem[]> {
    const { stdout: itemsJson } = await execAsync(`gh project item-list ${projectNumber} --owner ${owner} --format json`);
    const response = JSON.parse(itemsJson);
    return response.items || [];
  }

  async updateItemStatus(project: GitHubProject, item: GitHubItem, newStatus: string): Promise<void> {
    const projectId = project.id;
    const statusField = project.fields?.find(field => field.name === 'Status');
    
    if (!statusField) {
      throw new Error('Status field not found in project');
    }
    
    const statusOption = statusField.options?.find(option => option.name === newStatus);
    
    if (!statusOption) {
      throw new Error(`Status option "${newStatus}" not found in project`);
    }

    const itemId = item.id;

    await execAsync(`gh project item-edit --id "${itemId}" --project-id "${projectId}" --field-id "${statusField.id}" --single-select-option-id "${statusOption.id}"`);
  }
}