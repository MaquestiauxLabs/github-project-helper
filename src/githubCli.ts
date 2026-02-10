import { exec } from "child_process";
import { promisify } from "util";
import { GitHubProject, ProjectItem } from "./types";

const execAsync = promisify(exec);

export class GitHubCli {
  /**
   * Check if GitHub CLI is installed
   */
  static async isInstalled(): Promise<boolean> {
    try {
      await execAsync("gh --version");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { stdout } = await execAsync("gh auth status");
      return stdout.includes("Logged in");
    } catch {
      return false;
    }
  }

  /**
   * List projects for a given owner (user or organization)
   */
  static async listProjects(owner: string): Promise<GitHubProject[]> {
    try {
      const command = `gh project list --owner ${owner} --format json --limit 100`;
      const { stdout } = await execAsync(command);

      const projects = JSON.parse(stdout);
      return projects.projects || [];
    } catch (error: any) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  /**
   * Get project items with their status
   */
  static async getProjectItems(
    owner: string,
    projectNumber: number,
  ): Promise<ProjectItem[]> {
    try {
      // First, we need to get the project items
      const command = `gh project item-list ${projectNumber} --owner ${owner} --format json --limit 100`;
      const { stdout } = await execAsync(command);

      const data = JSON.parse(stdout);
      return data.items || [];
    } catch (error: any) {
      throw new Error(`Failed to get project items: ${error.message}`);
    }
  }

  /**
   * Get available status field options for a project
   */
  static async getProjectFieldOptions(
    owner: string,
    projectNumber: number,
  ): Promise<string[]> {
    try {
      const command = `gh project field-list ${projectNumber} --owner ${owner} --format json`;
      const { stdout } = await execAsync(command);

      const fields = JSON.parse(stdout);

      // Find the Status field
      const statusField = fields.fields?.find(
        (f: any) =>
          f.name.toLowerCase() === "status" ||
          f.type === "PROJECT_V2_FIELD_SINGLE_SELECT",
      );

      if (statusField && statusField.options) {
        return statusField.options.map((opt: any) => opt.name);
      }

      // Default statuses if we can't find them
      return ["Todo", "In Progress", "Done"];
    } catch (error: any) {
      // Return default statuses if command fails
      return ["Todo", "In Progress", "Done"];
    }
  }

  /**
   * Get field metadata including field IDs and option IDs
   */
  private static async getFieldMetadata(
    owner: string,
    projectNumber: number,
  ): Promise<Map<string, Map<string, string>>> {
    try {
      const command = `gh project field-list ${projectNumber} --owner ${owner} --format json`;
      const { stdout } = await execAsync(command);

      const fields = JSON.parse(stdout);
      const fieldMap = new Map<string, Map<string, string>>();

      // Find the Status field
      const statusField = fields.fields?.find(
        (f: any) =>
          f.name.toLowerCase() === "status" ||
          f.type === "PROJECT_V2_FIELD_SINGLE_SELECT",
      );

      if (statusField) {
        const optionMap = new Map<string, string>();
        if (statusField.options) {
          statusField.options.forEach((opt: any) => {
            optionMap.set(opt.name, opt.id);
          });
        }
        fieldMap.set(statusField.id, optionMap);
      }

      return fieldMap;
    } catch (error: any) {
      throw new Error(`Failed to get field metadata: ${error.message}`);
    }
  }

  /**
   * Update an item's status in a project
   */
  static async updateItemStatus(
    projectId: string,
    itemId: string,
    newStatus: string,
    owner?: string,
    projectNumber?: number,
  ): Promise<void> {
    try {
      // If owner and projectNumber are provided, get the field metadata
      if (owner && projectNumber) {
        const fieldMetadata = await this.getFieldMetadata(owner, projectNumber);

        // Get the first field (Status field)
        const statusFieldEntry = fieldMetadata.entries().next();
        if (!statusFieldEntry.done) {
          const [fieldId, optionMap] = statusFieldEntry.value;
          const optionId = optionMap.get(newStatus);

          if (optionId) {
            const command = `gh project item-edit --id ${itemId} --project-id ${projectId} --field-id ${fieldId} --single-select-option-id ${optionId}`;
            await execAsync(command);
            return;
          }
        }
      }

      // Fallback: try to get field info from project context
      throw new Error(`Unable to find option ID for status "${newStatus}"`);
    } catch (error: any) {
      throw new Error(`Failed to update item status: ${error.message}`);
    }
  }

  /**
   * Get issue details via GraphQL (title, body, state, url, issue type, labels, assignees)
   */
  static async getIssueDetails(
    repository: string,
    issueNumber: number,
  ): Promise<{
    title: string;
    body: string;
    state: string;
    url: string;
    issueType: string;
    labels: string[];
    assignees: string[];
  }> {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      throw new Error("Invalid repository format");
    }

    const query = `query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){issue(number:$number){title body state url issueType{name} labels(first:50){nodes{name}} assignees(first:50){nodes{login}}}}}`;
    const command = `gh api graphql -f query='${query}' -f owner='${owner}' -f repo='${repo}' -F number=${issueNumber}`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    const issue = data?.data?.repository?.issue;

    if (!issue) {
      throw new Error("Issue not found");
    }

    return {
      title: issue.title || "",
      body: issue.body || "",
      state: issue.state || "",
      url: issue.url || "",
      issueType: issue.issueType?.name || "",
      labels: (issue.labels?.nodes || []).map((node: any) => node.name),
      assignees: (issue.assignees?.nodes || []).map((node: any) => node.login),
    };
  }
}
