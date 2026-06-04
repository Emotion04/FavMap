import { FavoritesStorage } from '../../src/services/storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('FavoritesStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return empty array when no favorites are stored', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const result = await FavoritesStorage.getAll();

      // Assert
      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@favmap_favorites');
    });

    it('should return stored favorites', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const storedFavorites = [
        {
          id: '1',
          name: '测试地点',
          address: '测试地址',
          coordinate: { latitude: 39.9042, longitude: 116.4074 },
          icon: '⭐',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedFavorites));

      // Act
      const result = await FavoritesStorage.getAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('测试地点');
    });
  });

  describe('save', () => {
    it('should save favorites to storage', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockResolvedValue(undefined);

      const favorites = [
        {
          id: '1',
          name: '测试地点',
          address: '测试地址',
          coordinate: { latitude: 39.9042, longitude: 116.4074 },
          icon: '⭐',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ];

      // Act
      await FavoritesStorage.save(favorites);

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@favmap_favorites',
        JSON.stringify(favorites)
      );
    });
  });

  describe('add', () => {
    it('should add a new favorite to existing favorites', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const existingFavorites = [
        {
          id: '1',
          name: '现有地点',
          address: '现有地址',
          coordinate: { latitude: 39.9042, longitude: 116.4074 },
          icon: '⭐',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));
      AsyncStorage.setItem.mockResolvedValue(undefined);

      const newFavorite = {
        id: '2',
        name: '新地点',
        address: '新地址',
        coordinate: { latitude: 31.2397, longitude: 121.4998 },
        icon: '📌',
        createdAt: '2026-06-04T00:00:00.000Z',
        updatedAt: '2026-06-04T00:00:00.000Z',
      };

      // Act
      await FavoritesStorage.add(newFavorite);

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[1].name).toBe('新地点');
    });
  });

  describe('remove', () => {
    it('should remove a favorite by id', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const existingFavorites = [
        {
          id: '1',
          name: '地点1',
          address: '地址1',
          coordinate: { latitude: 39.9042, longitude: 116.4074 },
          icon: '⭐',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
        {
          id: '2',
          name: '地点2',
          address: '地址2',
          coordinate: { latitude: 31.2397, longitude: 121.4998 },
          icon: '📌',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));
      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Act
      await FavoritesStorage.remove('1');

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('2');
    });
  });

  describe('exportToJSON', () => {
    it('should export favorites as JSON string', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const existingFavorites = [
        {
          id: '1',
          name: '测试地点',
          address: '测试地址',
          coordinate: { latitude: 39.9042, longitude: 116.4074 },
          icon: '⭐',
          createdAt: '2026-06-04T00:00:00.000Z',
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));

      // Act
      const result = await FavoritesStorage.exportToJSON();

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('测试地点');
    });
  });
});
