/**
 * Mock for react-native-signature-canvas
 * Creates a properly mocked component that can be used in tests
 */

import React from 'react';

// Create the mock component with proper hook setup
function SignatureCanvasComponent(props, ref) {
  // Set up the imperative handle for ref access
  React.useImperativeHandle(
    ref,
    () => ({
      clearSignature: jest.fn(),
      readSignature: jest.fn(() => Promise.resolve('')),
    }),
    []
  );

  // Handle onEnd callback with effect
  React.useEffect(() => {
    if (props.onEnd) {
      const timer = setTimeout(() => props.onEnd(), 100);
      return () => clearTimeout(timer);
    }
  }, [props.onEnd]);

  // Return a native element
  return React.createElement('RNSignatureCanvas', {
    testID: props.testID || 'signature-canvas',
    style: props.style,
  });
}

// Properly use forwardRef wrapper
const SignatureCanvas = React.forwardRef(SignatureCanvasComponent);
SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
