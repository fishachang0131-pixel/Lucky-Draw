export interface Participant {
  id: string;
  name: string;
}

export type AppMode = 'setup' | 'draw' | 'group';

export interface Prize {
  id: string;
  name: string;
  count: number;
}

export interface Group {
  id: number;
  members: Participant[];
}
