import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const BottomBarIconWithText = ({ iconName, text, extraStyle }) => {
  const containerAnim = React.useRef(new Animated.Value(1)).current;
  const iconAnim = React.useRef(new Animated.Value(1)).current;

  const extraStylesArray = React.Children.toArray(extraStyle);
  const containerVariant = extraStylesArray[0];
  const iconVariant = extraStylesArray[1];

  const buttonStyles = React.useMemo(
    () => [
      styles.container,
      typeof containerVariant === 'string' ? styles[containerVariant] : containerVariant,
    ].filter(Boolean),
    [containerVariant],
  );

  const iconBaseStyles = React.useMemo(
    () => [
      styles.icon,
      typeof iconVariant === 'string' ? styles[iconVariant] : iconVariant,
    ].filter(Boolean),
    [iconVariant],
  );

  const flattenedContainer = React.useMemo(
    () => StyleSheet.flatten(buttonStyles) || {},
    [buttonStyles],
  );

  const flattenedIcon = React.useMemo(
    () => StyleSheet.flatten(iconBaseStyles) || {},
    [iconBaseStyles],
  );

  const targetContainerBackground =
    flattenedContainer.backgroundColor ?? styles.container.backgroundColor ?? 'transparent';
  const targetContainerRadius =
    flattenedContainer.borderRadius ?? styles.container.borderRadius ?? 0;
  const targetIconColor = flattenedIcon.color ?? styles.icon.color ?? '#ffffff';

  const [containerTransition, setContainerTransition] = React.useState(() => ({
    fromBg: targetContainerBackground,
    toBg: targetContainerBackground,
    fromRadius: targetContainerRadius,
    toRadius: targetContainerRadius,
  }));

  const [iconTransition, setIconTransition] = React.useState(() => ({
    fromColor: targetIconColor,
    toColor: targetIconColor,
  }));

  React.useEffect(() => {
    setContainerTransition(prev => {
      if (prev.toBg === targetContainerBackground && prev.toRadius === targetContainerRadius) {
        return prev;
      }
      return {
        fromBg: prev.toBg,
        toBg: targetContainerBackground,
        fromRadius: prev.toRadius,
        toRadius: targetContainerRadius,
      };
    });
  }, [targetContainerBackground, targetContainerRadius]);

  React.useEffect(() => {
    setIconTransition(prev => {
      if (prev.toColor === targetIconColor) {
        return prev;
      }
      return {
        fromColor: prev.toColor,
        toColor: targetIconColor,
      };
    });
  }, [targetIconColor]);

  // Smoothly interpolate container background and icon tint when variants change.
  React.useEffect(() => {
    if (
      containerTransition.fromBg !== containerTransition.toBg ||
      containerTransition.fromRadius !== containerTransition.toRadius
    ) {
      containerAnim.setValue(0);
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [containerTransition, containerAnim]);

  React.useEffect(() => {
    if (iconTransition.fromColor !== iconTransition.toColor) {
      iconAnim.setValue(0);
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [iconTransition, iconAnim]);

  const animatedContainerStyle = React.useMemo(
    () => ({
      backgroundColor: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [containerTransition.fromBg, containerTransition.toBg],
      }),
      borderRadius: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [containerTransition.fromRadius, containerTransition.toRadius],
      }),
    }),
    [containerAnim, containerTransition],
  );

  const animatedIconStyle = React.useMemo(
    () => ({
      color: iconAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [iconTransition.fromColor, iconTransition.toColor],
      }),
    }),
    [iconAnim, iconTransition],
  );

  return (
    <Animated.View style={[...buttonStyles, animatedContainerStyle]}>
      <AnimatedIcon style={[...iconBaseStyles, animatedIconStyle]} name={iconName} size={24} />
      {/* <Text style={[styles.text, baseStyles.text]} numberOfLines={1}>{text}</Text> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    // flexDirection: 'column',
    paddingHorizontal: 12,
    borderRadius:24,
    // marginHorizontal:4,
    // width:'100%'
  },
  icon: {
    // backgroundColor:'blue',
    // display:'flex',
    // margin:0
  },
  rest:{
    backgroundColor:"#333",
  },
  resticon:{
    color:'#ddd',
  },
  pressed: {
    backgroundColor:'#FDB5B3',
    borderRadius:16,
  },
  pressedicon:{
    color:'#690608',
  },
  pressedalt: {
    backgroundColor:'#FDEBB3',
    borderRadius:16,
  },
  pressediconalt:{
    color:'#6E2B04',
  },
  disabled:{
    backgroundColor:"#292929",
  },
  disabledicon:{
    color:'#575757',
  },  
  text: {
    fontSize: 11,
    textAlign: 'center',
    whiteSpace: 'nowrap', 
    overflow: 'hidden',
  },
  
});

export default BottomBarIconWithText;
