import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import GlassCard from '../components/GlassCard';
import { FavoritePlace } from '../types';
import { FAVORITE_ICONS } from '../utils/constants';

interface EditScreenProps {
  place: FavoritePlace;
  onBack: () => void;
  onSave: (place: FavoritePlace) => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ place, onBack, onSave }) => {
  const { colors } = useTheme();
  const { updateFavorite } = useFavorites();
  const [name, setName] = useState(place.name);
  const [address, setAddress] = useState(place.address);
  const [notes, setNotes] = useState(place.notes || '');
  const [tags, setTags] = useState(place.tags?.join(', ') || '');
  const [selectedIcon, setSelectedIcon] = useState(place.icon);
  const [saving, setSaving] = useState(false);

  // 保存修改
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入地点名称');
      return;
    }

    setSaving(true);
    try {
      const updatedPlace: Partial<FavoritePlace> = {
        name: name.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        icon: selectedIcon,
      };

      await updateFavorite(place.id, updatedPlace);

      Alert.alert('成功', '收藏已更新', [
        {
          text: '确定',
          onPress: () => onSave({ ...place, ...updatedPlace }),
        },
      ]);
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>编辑收藏</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Text style={[styles.saveText, { color: colors.primary }]}>
            {saving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 基本信息 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>基本信息</Text>

          <Text style={[styles.label, { color: colors.text }]}>名称</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="请输入地点名称"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.label, { color: colors.text }]}>地址</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={address}
            onChangeText={setAddress}
            placeholder="请输入地址"
            placeholderTextColor={colors.textSecondary}
          />
        </GlassCard>

        {/* 图标选择 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>选择图标</Text>
          <View style={styles.iconGrid}>
            {FAVORITE_ICONS.map((item) => (
              <TouchableOpacity
                key={item.emoji}
                onPress={() => setSelectedIcon(item.emoji)}
                style={[
                  styles.iconItem,
                  selectedIcon === item.emoji && styles.iconItemSelected,
                ]}
              >
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* 备注和标签 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>备注和标签</Text>

          <Text style={[styles.label, { color: colors.text }]}>备注</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="添加备注..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text }]}>标签（用逗号分隔）</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={tags}
            onChangeText={setTags}
            placeholder="例如：餐厅, 美食, 朋友聚会"
            placeholderTextColor={colors.textSecondary}
          />
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconItemSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconEmoji: {
    fontSize: 24,
  },
});

export default EditScreen;
