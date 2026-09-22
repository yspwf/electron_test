import { useCallback, useEffect, useState } from 'react';
import type { Article } from '../types';

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [aRes, fRes] = await Promise.all([
      window.articlesAPI.list(),
      window.articlesAPI.folders.list(),
    ]);
    if (aRes.ok && aRes.data) setArticles(aRes.data);
    else setError(aRes.error ?? '加载文章失败');

    if (fRes.ok && fRes.data) setFolders(fRes.data);
    else setError(fRes.error ?? '加载文件夹失败');

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createArticle = useCallback(
    async (title?: string, folder?: string, content?: string) => {
      const res = await window.articlesAPI.create(title, folder, content);
      if (res.ok && res.data) {
        await refresh();
        return res.data;
      }
      setError(res.error ?? '新建失败');
      return null;
    },
    [refresh]
  );

  const updateArticle = useCallback(
    async (
      folder: string,
      id: string,
      patch: Partial<Pick<Article, 'title' | 'content'>>
    ) => {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === id && a.folder === folder
            ? { ...a, ...patch, updatedAt: Date.now() }
            : a
        )
      );
      const res = await window.articlesAPI.save(folder, id, patch);
      if (!res.ok) setError(res.error ?? '保存失败');
    },
    []
  );

  const removeArticle = useCallback(
    async (folder: string, id: string) => {
      const res = await window.articlesAPI.remove(folder, id);
      if (res.ok) await refresh();
      else setError(res.error ?? '删除失败');
    },
    [refresh]
  );

  const moveArticle = useCallback(
    async (from: string, id: string, to: string) => {
      const res = await window.articlesAPI.move(from, id, to);
      if (res.ok) await refresh();
      else setError(res.error ?? '移动失败');
    },
    [refresh]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const res = await window.articlesAPI.folders.create(name);
      if (res.ok) await refresh();
      else setError(res.error ?? '新建文件夹失败');
      return res.data ?? null;
    },
    [refresh]
  );

  const removeFolder = useCallback(
    async (name: string) => {
      const res = await window.articlesAPI.folders.remove(name);
      if (res.ok) await refresh();
      else setError(res.error ?? '删除文件夹失败');
    },
    [refresh]
  );

  const renameFolder = useCallback(
    async (oldName: string, newName: string) => {
      const res = await window.articlesAPI.folders.rename(oldName, newName);
      if (res.ok) await refresh();
      else setError(res.error ?? '重命名失败');
    },
    [refresh]
  );

  return {
    articles,
    folders,
    loading,
    error,
    refresh,
    createArticle,
    updateArticle,
    removeArticle,
    moveArticle,
    createFolder,
    removeFolder,
    renameFolder,
  };
}