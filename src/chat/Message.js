import { StyleSheet, View } from 'react-native';
import { isRTLString, textWithLinks } from './helper';

export const Message = ({ msg }) => {
  const { text, user, time } = msg;
  const isRtl                = isRTLString(text);
  return (
    <View style={[styles.container, (isRtl ? styles.containerRtl : styles.containerLtr)]}>
      <View>
        <i style={styles.time}>{time}</i> -
        <View
          display="inline"
          color={user.role.match(/^(admin|root)$/) ? 'secondary' : 'textSecondary'}
        >
          {user.display}
        </View>
        :
      </View>
      {textWithLinks(text)}
    </View>
  );
};

const styles = StyleSheet.create({
  container   : {
    flex           : 1,
    padding        : 24,
    backgroundColor: '#eaeaea',
  },
  containerRtl: {
    direction: 'rtl',
    textAlign: 'right',
  },
  containerLtr: {
    direction: 'ltr',
    textAlign: 'left',
  },
  time        : {
    color: 'grey'
  }
});
