/**
 * Type declarations for @react-native-community/geofencing
 * Provides geofencing capabilities for React Native applications
 */

declare module '@react-native-community/geofencing' {
  export interface CircularRegion {
    latitude: number;
    longitude: number;
    radius: number;
    identifier: string;
    notifyOnEntry?: boolean;
    notifyOnExit?: boolean;
  }

  export interface GeofenceEvent {
    identifier: string;
    transitionType: 'entry' | 'exit' | 'dwell';
  }

  const Geofencing: {
    addCircularRegion(region: CircularRegion): Promise<void>;
    removeRegion(identifier: string): Promise<void>;
    onGeofenceTransition(callback: (event: GeofenceEvent) => void): void;
    stopMonitoring(): Promise<void>;
  };

  export default Geofencing;
}
