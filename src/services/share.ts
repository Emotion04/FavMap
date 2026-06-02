import { Share, Platform } from 'react-native';
import { FavoritePlace, ShareData } from '../types';

// 分享服务
export const ShareService = {
  // 分享单个地点
  async sharePlace(place: FavoritePlace): Promise<void> {
    const shareData: ShareData = {
      title: `我在 FavMap 收藏了 ${place.name}`,
      message: `${place.name}\n${place.address}\n\n使用 FavMap 查看更多详情`,
    };

    try {
      const result = await Share.share({
        title: shareData.title,
        message: shareData.message,
      });

      if (result.action === Share.sharedAction) {
        console.log('分享成功');
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  },

  // 分享多个地点
  async sharePlaces(places: FavoritePlace[]): Promise<void> {
    const placeList = places
      .map((p, i) => `${i + 1}. ${p.name} - ${p.address}`)
      .join('\n');

    const shareData: ShareData = {
      title: `我在 FavMap 收藏了 ${places.length} 个地点`,
      message: `我的收藏地点：\n\n${placeList}\n\n使用 FavMap 查看更多详情`,
    };

    try {
      const result = await Share.share({
        title: shareData.title,
        message: shareData.message,
      });

      if (result.action === Share.sharedAction) {
        console.log('分享成功');
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  },

  // 生成分享文本
  generateShareText(place: FavoritePlace): string {
    return `${place.name}\n${place.address}\n\n使用 FavMap 查看更多详情`;
  },
};
