/**
 * Signature Capture Component
 * Touch-based signature pad using react-native-signature-canvas
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// @ts-expect-error - No type definitions available for react-native-signature-canvas
import SignatureCanvas from 'react-native-signature-canvas';

export interface SignatureCaptureProps {
  onCapture: (signature: string) => void;
  onClear: () => void;
  label?: string;
  required?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onCapture,
  onClear,
  label = 'Signature',
  required = false,
}) => {
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleSignatureEnd = () => {
    setHasSignature(true);
  };

  const handleOK = (signature: string) => {
    if (signature) {
      onCapture(signature);
      setHasSignature(true);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
    onClear();
  };

  const handleEmpty = () => {
    setHasSignature(false);
  };

  // HTML/CSS for signature canvas
  const webStyle = `
    .m-signature-pad {
      box-sizing: border-box;
      border: 1px solid #DDD;
      border-radius: 8px;
      background-color: #FFF;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body,html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasSignature && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            testID="signature-clear-button"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.canvasContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={handleEmpty}
          onEnd={handleSignatureEnd}
          webStyle={webStyle}
          descriptionText=""
          autoClear={false}
          backgroundColor="white"
          penColor="black"
          minWidth={2}
          maxWidth={4}
          dataURL=""
          testID="signature-canvas"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.instruction}>Sign above with your finger</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#DC3545',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6C757D',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  canvasContainer: {
    height: 200,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  footer: {
    marginTop: 8,
  },
  instruction: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default SignatureCapture;
