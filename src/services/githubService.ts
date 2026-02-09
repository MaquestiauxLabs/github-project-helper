import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitHubProject {
  title: string;
  number: number;
  id: string;
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

  async getProjectItems(owner: string, projectNumber: number): Promise<GitHubItem[]> {
    const { stdout: itemsJson } = await execAsync(`gh project item-list ${projectNumber} --owner ${owner} --format json`);
    const response = JSON.parse(itemsJson);
    return response.items || [];
  }

  async updateItemStatus(owner: string, projectNumber: number, issueNumber: number, newStatus: string): Promise<void> {
    const projectId = await this.getProjectId(owner, projectNumber);
    const statusFieldId = await this.getStatusFieldId(owner, projectNumber);
    const statusOptionId = await this.getStatusOptionId(owner, projectNumber, newStatus);
    const itemId = await this.getItemId(owner, projectNumber, issueNumber);

    if (!projectId || !statusFieldId || !statusOptionId || !itemId) {
      throw new Error('Failed to extract required IDs from GitHub API');
    }

    await execAsync(`gh project item-edit --id "${itemId}" --project-id "${projectId}" --field-id "${statusFieldId}" --single-select-option-id "${statusOptionId}"`);
  }

  private async getProjectId(owner: string, projectNumber: number): Promise<string | null> {
    const { stdout } = await execAsync(`gh project view ${projectNumber} --owner ${owner} --format json | jq -r '.id'`);
    return stdout.trim() || null;
  }

  private async getStatusFieldId(owner: string, projectNumber: number): Promise<string | null> {
    const { stdout } = await execAsync(`gh project field-list ${projectNumber} --owner ${owner} --format json | jq -r '.fields[] | select(.name=="Status") | .id'`);
    return stdout.trim() || null;
  }

  private async getStatusOptionId(owner: string, projectNumber: number, newStatus: string): Promise<string | null> {
    const { stdout } = await execAsync(`gh project field-list ${projectNumber} --owner ${owner} --format json | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="${newStatus}") | .id'`);
    return stdout.trim() || null;
  }

  private async getItemId(owner: string, projectNumber: number, issueNumber: number): Promise<string | null> {
    const { stdout } = await execAsync(`gh project item-list ${projectNumber} --owner ${owner} --format json | jq -r '.items[] | select(.content.number==${issueNumber}) | .id'`);
    return stdout.trim() || null;
  }
}