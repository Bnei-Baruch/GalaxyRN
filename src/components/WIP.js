import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

const WIP = ({ isReady, children }) => {
  return isReady ? children : (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color="grey"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: 'black'
  }
});

export default WIP;