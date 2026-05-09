export type ZIQDomain = 'Growth' | 'Operations' | 'Finance' | 'Community';

export interface ZIQSkill {
  id: string;
  name: string;
  description: string;
  domain: ZIQDomain;
  status: 'active' | 'beta' | 'inactive';
  icon: string;
  action: () => Promise<void>;
}

export interface ZIQVaultEntry {
  id: string;
  type: 'raw' | 'wiki' | 'output';
  title: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
