import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

const SampleComponent = () => (
  <View>
    <Text>Testing is ready</Text>
  </View>
);

describe('Testing Setup Verification', () => {
  it('renders successfully', () => {
    const { getByText } = render(<SampleComponent />);
    expect(getByText('Testing is ready')).toBeTruthy();
  });
});
