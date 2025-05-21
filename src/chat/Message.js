import { StyleSheet, View, Text } from 'react-native';
import { isRTLString } from './helper';

export const Message = ({ msg }) => {
  const { text = '', user, time } = msg;
  const isRtl = isRTLString(text || '');
  return (
    <View style={[styles.container, (isRtl ? styles.containerRtl : styles.containerLtr)]}>
      <View style={styles.containerTime}>
        <Text style={styles.text}>{user?.display || ''}</Text>
        <Text style={styles.time}>{time || ''}</Text>
      </View>
      <Text style={styles.text} >{text || ''}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container    : {
    padding        : 20,
    marginBottom   : 2,
    backgroundColor: '#eaeaea',
  },
  containerRtl : {
    direction: 'rtl',
    textAlign: 'right',
  },
  containerLtr : {
    direction: 'ltr',
    textAlign: 'left',
  },
  containerTime: {
    flexDirection: 'row',
  },
  time         : {
    color      : 'grey',
    fontStyle  : 'italic',
    marginLeft : 5,
    marginRight: 5
  },
  text: {
    color: 'black',
  }
});
