import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FavoritePlace } from '../types';
import { FavoritesStorage } from '../services/storage';
import { generateId } from '../utils/helpers';

interface FavoritesContextType {
  favorites: FavoritePlace[];
  loading: boolean;
  addFavorite: (place: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFavorite: (id: string, updates: Partial<FavoritePlace>) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  getFavoriteById: (id: string) => FavoritePlace | undefined;
  exportFavorites: () => Promise<string>;
  importFavorites: (json: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载收藏
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await FavoritesStorage.getAll();
      setFavorites(data);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加收藏
  const addFavorite = async (place: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlace: FavoritePlace = {
      ...place,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await FavoritesStorage.add(newPlace);
    setFavorites((prev) => [...prev, newPlace]);
  };

  // 更新收藏
  const updateFavorite = async (id: string, updates: Partial<FavoritePlace>) => {
    await FavoritesStorage.update(id, updates);
    setFavorites((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f))
    );
  };

  // 删除收藏
  const removeFavorite = async (id: string) => {
    await FavoritesStorage.remove(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  // 获取单个收藏
  const getFavoriteById = (id: string) => {
    return favorites.find((f) => f.id === id);
  };

  // 导出收藏
  const exportFavorites = async () => {
    return await FavoritesStorage.exportToJSON();
  };

  // 导入收藏
  const importFavorites = async (json: string) => {
    await FavoritesStorage.importFromJSON(json);
    await loadFavorites();
  };

  const value: FavoritesContextType = {
    favorites,
    loading,
    addFavorite,
    updateFavorite,
    removeFavorite,
    getFavoriteById,
    exportFavorites,
    importFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
