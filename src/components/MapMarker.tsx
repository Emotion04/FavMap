import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { FavoritePlace } from '../types';

interface MapMarkerProps {
  place: FavoritePlace;
  onPress?: (place: FavoritePlace) => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ place, onPress }) => {
  return (
    <Marker
      coordinate={place.coordinate}
      title={place.name}
      description={place.address}
      onPress={() => onPress?.(place)}
    >
      <View style={styles.markerContainer}>
        <Text style={styles.markerIcon}>{place.icon}</Text>
        <Text style={styles.markerName} numberOfLines={1}>
          {place.name}
        </Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 32,
    opacity: 0.8,
  },
  markerName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
});

export default MapMarker;
