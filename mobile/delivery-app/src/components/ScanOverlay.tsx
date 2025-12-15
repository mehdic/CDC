/**
 * ScanOverlay Component
 * Animated targeting overlay for QR code scanning
 *
 * Features:
 * - Animated corner brackets targeting the scan area
 * - Pulsing animation for visual feedback
 * - Scan status indicators (scanning, success, error)
 * - Accessibility support for screen readers
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

export interface ScanOverlayProps {
  readonly status?: 'idle' | 'scanning' | 'success' | 'error';
  readonly message?: string;
  readonly showCorners?: boolean;
  readonly showCenterBox?: boolean;
}

interface AnimationValues {
  readonly pulse: Animated.Value;
  readonly scan: Animated.Value;
}

/**
 * ScanOverlay Component
 * Provides visual targeting guidance for QR code scanning
 */
export const ScanOverlay: React.FC<ScanOverlayProps> = ({
  status = 'scanning',
  message,
  showCorners = true,
  showCenterBox = true,
}) => {
  const animationRef = useRef<AnimationValues>({
    pulse: new Animated.Value(0),
    scan: new Animated.Value(0),
  });

  // Start animations on mount
  useEffect(() => {
    if (status === 'scanning' || status === 'idle') {
      startAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [status]);

  /**
   * Start continuous animations
   */
  const startAnimations = (): void => {
    // Pulse animation for corners
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animationRef.current.pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animationRef.current.pulse, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    // Scan line animation (vertical sweep)
    const scanAnimation = Animated.loop(
      Animated.timing(animationRef.current.scan, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    );

    pulseAnimation.start();
    scanAnimation.start();
  };

  /**
   * Stop animations
   */
  const stopAnimations = (): void => {
    animationRef.current.pulse.setValue(0);
    animationRef.current.scan.setValue(0);
  };

  // Determine colors based on status
  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return {
          corner: '#059669',
          center: '#ECFDF5',
          border: '#059669',
        };
      case 'error':
        return {
          corner: '#DC2626',
          center: '#FEF2F2',
          border: '#DC2626',
        };
      default:
        return {
          corner: '#3B82F6',
          center: 'transparent',
          border: '#3B82F6',
        };
    }
  };

  const colors = getStatusColors();

  // Animated values for interpolation
  const pulseOpacity = animationRef.current.pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scanLinePosition = animationRef.current.scan.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`QR code scan overlay - ${status} status`}
      accessibilityHint="Position the QR code within the targeting box"
      accessibilityRole="image"
    >
      {/* Semi-transparent dark areas */}
      <View style={[styles.darkArea, styles.darkAreaTop]} />
      <View style={[styles.darkArea, styles.darkAreaBottom]} />
      <View style={[styles.darkArea, styles.darkAreaLeft]} />
      <View style={[styles.darkArea, styles.darkAreaRight]} />

      {/* Center scanning box */}
      {showCenterBox && (
        <View
          style={[
            styles.centerBox,
            {
              borderColor: colors.border,
              backgroundColor: colors.center,
            },
          ]}
        >
          {/* Animated scan line */}
          {status === 'scanning' && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.border,
                  top: scanLinePosition,
                },
              ]}
            />
          )}

          {/* Corner brackets */}
          {showCorners && (
            <>
              {/* Top-left corner */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.topLeftCorner,
                  {
                    borderTopColor: colors.corner,
                    borderLeftColor: colors.corner,
                    opacity: status === 'scanning' ? pulseOpacity : 1,
                  },
                ]}
              />

              {/* Top-right corner */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.topRightCorner,
                  {
                    borderTopColor: colors.corner,
                    borderRightColor: colors.corner,
                    opacity: status === 'scanning' ? pulseOpacity : 1,
                  },
                ]}
              />

              {/* Bottom-left corner */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.bottomLeftCorner,
                  {
                    borderBottomColor: colors.corner,
                    borderLeftColor: colors.corner,
                    opacity: status === 'scanning' ? pulseOpacity : 1,
                  },
                ]}
              />

              {/* Bottom-right corner */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.bottomRightCorner,
                  {
                    borderBottomColor: colors.corner,
                    borderRightColor: colors.corner,
                    opacity: status === 'scanning' ? pulseOpacity : 1,
                  },
                ]}
              />
            </>
          )}
        </View>
      )}

      {/* Status message */}
      {message && (
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.messageText,
              {
                color: colors.border,
              },
            ]}
            accessible={true}
            accessibilityLabel={message}
          >
            {message}
          </Text>
        </View>
      )}
    </View>
  );
};

const SCAN_BOX_SIZE = 280;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 3;
const SCAN_LINE_HEIGHT = 2;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dark areas (darken outside scan box)
  darkArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  darkAreaTop: {
    height: '35%',
    top: 0,
  },
  darkAreaBottom: {
    height: '35%',
    bottom: 0,
  },
  darkAreaLeft: {
    width: '12%',
    left: 0,
    top: '35%',
    height: '30%',
  },
  darkAreaRight: {
    width: '12%',
    right: 0,
    top: '35%',
    height: '30%',
  },

  // Center scanning box
  centerBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Animated scan line
  scanLine: {
    width: '100%',
    height: SCAN_LINE_HEIGHT,
    backgroundColor: '#3B82F6',
    ...StyleSheet.absoluteFillObject,
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_WIDTH,
  },
  topLeftCorner: {
    top: -CORNER_WIDTH,
    left: -CORNER_WIDTH,
    borderTopColor: '#3B82F6',
    borderLeftColor: '#3B82F6',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  topRightCorner: {
    top: -CORNER_WIDTH,
    right: -CORNER_WIDTH,
    borderTopColor: '#3B82F6',
    borderRightColor: '#3B82F6',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  bottomLeftCorner: {
    bottom: -CORNER_WIDTH,
    left: -CORNER_WIDTH,
    borderBottomColor: '#3B82F6',
    borderLeftColor: '#3B82F6',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bottomRightCorner: {
    bottom: -CORNER_WIDTH,
    right: -CORNER_WIDTH,
    borderBottomColor: '#3B82F6',
    borderRightColor: '#3B82F6',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },

  // Status message
  messageContainer: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
});

export default ScanOverlay;
