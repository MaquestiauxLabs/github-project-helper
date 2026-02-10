export interface GitHubProject {
  number: number;
  title: string;
  url: string;
  shortDescription?: string;
  public: boolean;
  closed: boolean;
  id: string;
  readme?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  status: string;
  type: string;
  content?: {
    type: string;
    number?: number;
    title?: string;
    url?: string;
    state?: string;
    repository?: string;
  };
}

export interface KanbanColumn {
  name: string;
  items: ProjectItem[];
}
