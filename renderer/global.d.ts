import type { Article } from './types';

export interface IPCResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ArticlesAPI {
  list: () => Promise<IPCResult<Article[]>>;
  read: (folder: string, id: string) => Promise<IPCResult<Article | null>>;
  create: (
    title?: string,
    folder?: string,
    content?: string
  ) => Promise<IPCResult<Article>>;
  save: (
    folder: string,
    id: string,
    payload: { title?: string; content?: string }
  ) => Promise<IPCResult<Article | null>>;
  remove: (folder: string, id: string) => Promise<IPCResult<boolean>>;
  move: (from: string, id: string, to: string) => Promise<IPCResult<Article>>;
  revealDir: () => Promise<IPCResult<string>>;

  folders: {
    list: () => Promise<IPCResult<string[]>>;
    create: (name: string) => Promise<IPCResult<string>>;
    remove: (name: string) => Promise<IPCResult<boolean>>;
    rename: (oldName: string, newName: string) => Promise<IPCResult<string>>;
  };
}

declare global {
  interface Window {
    articlesAPI: ArticlesAPI;
  }
}