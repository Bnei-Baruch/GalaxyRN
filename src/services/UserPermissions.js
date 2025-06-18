import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AccountSettings from '../auth/AccountSettings';
import DebugMode from '../settings/DebugMode';

const UserPermissions = () => {
  const handleContactSupport = () => {
    Linking.openURL('mailto:help@kli.one');
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <AccountSettings withTitle={false} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>User Permission</Text>
        <Text style={styles.text}>Please contact help@kli.one</Text>
        <TouchableOpacity style={styles.sendBtn} onPress={handleContactSupport}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
        <DebugMode />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  top: {
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  text: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
  },
  sendBtn: {
    backgroundColor: '#4b7bec',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserPermissions;
