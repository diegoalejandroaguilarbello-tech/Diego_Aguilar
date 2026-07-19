export type ProjectRecord = {
  id: number;
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl: string;
  repoUrl: string;
  imageUrl: string;
  imageKey: string;
  imageAlt: string;
  isFeatured: boolean;
  isPublished: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectPayload = Omit<ProjectRecord, "id" | "createdAt" | "updatedAt" | "isActive">;
