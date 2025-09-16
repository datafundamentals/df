export interface PageAuthor {
  uid: string;
  resourceGraph: ResourceGraph;
  pages: Page[];
}

export interface Page {
  id: string;
  uid: string;
  site: string;
  dateCreated: Date;
  dateLastUpdated: Date;
  resourceGraph: ResourceGraph;
}

export interface Player {
  uid: string;
  resourceGraph: ResourceGraph;
  projects: Project[];
  points: number;
}

export interface Project {
  id: string;
  uid: string;
  points: number;
  resourceGraph: ResourceGraph;
  projectElectives?: ProjectElective[];
}

export interface Elective {
  id: string;
  key: string;
  points: number;
  resourceGraph: ResourceGraph;
}

export interface ProjectElective {
  id: string;
  key: string;
  uid: string;
  points: number;
  resourceGraph: ResourceGraph;
}

export interface ResourceGraph {
  name: string;
  image?: URL[];
  video?: URL[];
  site?: URL[];
  imageUpload?: URL[];
  videoUpload?: URL[];
  markdown?: string;
}

export type UrlMediaType = 'video' | 'image' | 'site' | 'void';
export type MakeAdd = 'make' | 'add';
export type Urlish = URL | string;
export type LinkResource = { urlMediaType: UrlMediaType; url: URL; makeAdd: MakeAdd } | undefined;
export type ResourcePageType = 'pageAuthor' | 'pageAuthor.page' | 'player' | 'player.project' | 'player.project.elective' | 'void';
