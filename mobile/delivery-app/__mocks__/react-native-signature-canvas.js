/**
 * Mock for react-native-signature-canvas
 */

import React from 'react';

const SignatureCanvas = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    clearSignature: jest.fn(),
    readSignature: jest.fn(),
  }));

  return React.createElement('SignatureCanvas', {
    testID: props.testID || 'signature-canvas',
  });
});

export default SignatureCanvas;
