import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';

const BottomBarIconWithText = ({
  iconName,
  text,
  extraStyle,
  showtext,
  direction,
}) => {
  const extraStylesArray = React.Children.toArray(extraStyle);
  const containerVariant = extraStylesArray[0];
  const iconVariant = extraStylesArray[1];
  const textVariant = extraStylesArray[1];

  const buttonStyles = React.useMemo(
    () =>
      [
        styles.container,
        typeof containerVariant === 'string'
          ? styles[containerVariant]
          : containerVariant,
      ].filter(Boolean),
    [containerVariant]
  );

  const iconBaseStyles = React.useMemo(
    () =>
      [
        styles.icon,
        typeof iconVariant === 'string' ? styles[iconVariant] : iconVariant,
      ].filter(Boolean),
    [iconVariant]
  );

  const textBaseStyles = React.useMemo(
    () =>
      [
        styles.text,
        baseStyles?.text,
        typeof textVariant === 'string' ? styles[textVariant] : textVariant,
      ].filter(Boolean),
    [textVariant]
  );

  const containerDirectionStyle = React.useMemo(() => {
    if (showtext === false) return [styles.notext, styles.icon_notext];
    if (direction === 'horizontal')
      return [styles.horizontal, styles.icon_horizontal];
    if (direction === 'vertical')
      return [styles.vertical, styles.icon_vertical];
    return [styles.horizontal, styles.icon_horizontal];
  }, [direction, showtext]);

  return (
    <View style={[...buttonStyles, containerDirectionStyle[0]]}>
      <Icon
        style={[...iconBaseStyles, containerDirectionStyle[1]]}
        name={iconName}
        size={24}
      />
      {(showtext === undefined || showtext) && (
        <Text style={[...textBaseStyles]} numberOfLines={1}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  notext: {
    paddingHorizontal: 12,
  },
  vertical: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  horizontal: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  icon: {
    // backgroundColor: 'blue',
  },
  icon_horizontal: {
    marginRight: 8,
  },
  icon_vertical: {
    marginBottom: 4,
  },
  icon_notext: {},
  rest: {
    backgroundColor: '#333',
    borderRadius: 16,
  },
  rest_icon: {
    color: '#ddd',
  },
  toggle_off: {
    backgroundColor: '#333',
    borderRadius: 24,
  },
  toggle_off_icon: {
    color: '#ddd',
  },
  toggle_on: {
    backgroundColor: '#FDB5B3',
    borderRadius: 16,
  },
  toggle_on_icon: {
    color: '#690608',
  },
  toggle_on_alt: {
    backgroundColor: '#FDEBB3',
    borderRadius: 16,
  },
  toggle_on_icon_alt: {
    color: '#6E2B04',
  },
  toggle_on_alt2: {
    backgroundColor: '#5FD2FF',
    borderRadius: 16,
  },
  toggle_on_icon_alt2: {
    color: '#003458',
  },
  toggle_on_alt2b: {
    backgroundColor: '#5FD2FF',
    // borderRadius:16,
  },
  toggle_off_disabled: {
    backgroundColor: '#292929',
  },
  toggle_off_disabled_icon: {
    color: '#575757',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    fontWeight: '600',
  },
});

export default BottomBarIconWithText;
