import React from 'react';
import { Animated, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);
const AnimatedText = Animated.createAnimatedComponent(Text);

const BottomBarIconWithText = ({
  iconName,
  text,
  extraStyle,
  showtext,
  direction,
}) => {
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;
  const containerAnim = React.useRef(new Animated.Value(1)).current;
  const iconAnim = React.useRef(new Animated.Value(1)).current;
  const textAnim = React.useRef(new Animated.Value(1)).current;

  const extraStylesArray = React.Children.toArray(extraStyle);
  const containerVariant = extraStylesArray[0];
  const iconVariant = extraStylesArray[1];
  const textVariant = extraStylesArray[1];

  const resolvedShowText = React.useMemo(() => {
    if (Array.isArray(showtext)) {
      const portraitValue = showtext[0];
      const landscapeValue = showtext.length > 1 ? showtext[1] : showtext[0];
      return isPortrait ? portraitValue : landscapeValue;
    }
    return showtext;
  }, [isPortrait, showtext]);

  const shouldShowText = resolvedShowText ?? true;

  const buttonStyles = React.useMemo(() => {
    const _styles = [
      styles.container,
      Platform.OS === 'android' && shouldShowText
        ? { paddingVertical: 8 }
        : { paddingVertical: 12 },
    ];
    return [
      ..._styles,
      typeof containerVariant === 'string'
        ? styles[containerVariant]
        : containerVariant,
    ].filter(Boolean);
  }, [containerVariant, shouldShowText]);

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

  const flattenedContainer = React.useMemo(
    () => StyleSheet.flatten(buttonStyles) || {},
    [buttonStyles]
  );

  const flattenedIcon = React.useMemo(
    () => StyleSheet.flatten(iconBaseStyles) || {},
    [iconBaseStyles]
  );

  const flattenedText = React.useMemo(
    () => StyleSheet.flatten(textBaseStyles) || {},
    [textBaseStyles]
  );

  const targetContainerBackground =
    flattenedContainer.backgroundColor ??
    styles.container.backgroundColor ??
    'transparent';
  const targetContainerRadius =
    flattenedContainer.borderRadius ?? styles.container.borderRadius ?? 0;
  const targetIconColor = flattenedIcon.color ?? styles.icon.color ?? '#ffffff';
  const targetTextColor =
    flattenedText.color ??
    baseStyles?.text?.color ??
    styles.text.color ??
    '#ffffff';

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

  const [textTransition, setTextTransition] = React.useState(() => ({
    fromColor: targetTextColor,
    toColor: targetTextColor,
  }));

  React.useEffect(() => {
    setContainerTransition(prev => {
      if (
        prev.toBg === targetContainerBackground &&
        prev.toRadius === targetContainerRadius
      ) {
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

  React.useEffect(() => {
    setTextTransition(prev => {
      if (prev.toColor === targetTextColor) {
        return prev;
      }
      return {
        fromColor: prev.toColor,
        toColor: targetTextColor,
      };
    });
  }, [targetTextColor]);

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

  React.useEffect(() => {
    if (textTransition.fromColor !== textTransition.toColor) {
      textAnim.setValue(0);
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [textTransition, textAnim]);

  const animatedContainerStyle = React.useMemo(
    () => ({
      backgroundColor: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [containerTransition.fromBg, containerTransition.toBg],
      }),
      borderRadius: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          containerTransition.fromRadius,
          containerTransition.toRadius,
        ],
      }),
    }),
    [containerAnim, containerTransition]
  );

  const animatedIconStyle = React.useMemo(
    () => ({
      color: iconAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [iconTransition.fromColor, iconTransition.toColor],
      }),
    }),
    [iconAnim, iconTransition]
  );

  const animatedTextStyle = React.useMemo(
    () => ({
      color: textAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [textTransition.fromColor, textTransition.toColor],
      }),
    }),
    [textAnim, textTransition]
  );

  const containerDirectionStyle = React.useMemo(() => {
    if (shouldShowText === false) {
      return [styles.notext, styles.icon_notext];
    }

    const orientationDirection = isPortrait ? direction?.[0] : direction?.[1];

    if (orientationDirection === 'vertical') {
      return [styles.vertical, styles.icon_vertical];
    }

    return [styles.horizontal, styles.icon_horizontal];
  }, [direction, isPortrait, shouldShowText]);

  return (
    <Animated.View
      style={[
        ...buttonStyles,
        containerDirectionStyle[0],
        animatedContainerStyle,
      ]}
    >
      <AnimatedIcon
        style={[
          ...iconBaseStyles,
          containerDirectionStyle[1],
          animatedIconStyle,
        ]}
        name={iconName}
        size={24}
      />
      {(shouldShowText === undefined || shouldShowText) && (
        <AnimatedText
          style={[...textBaseStyles, animatedTextStyle]}
          numberOfLines={1}
        >
          {text}
        </AnimatedText>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
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
  rest_disabled: {
    backgroundColor: '#272727',
    borderRadius: 16,
  },
  rest_disabled_icon: {
    color: '#575757',
  },
  rest_alt: {
    backgroundColor: '#EF171E',
    borderRadius: 16,
  },
  rest_icon_alt: {
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
    // textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    flexShrink: 1,
    minWidth: 0,
    fontWeight: '600',
    // backgroundColor: 'blue',
  },
});

export default BottomBarIconWithText;
