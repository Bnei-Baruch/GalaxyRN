import { StyleSheet } from 'react-native';

export const buttonsPaneStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  panelWrapper: {
    borderRadius: 32,
    padding: 16,
    alignSelf: 'stretch',
  },
  buttonsSection: {
    marginBottom: 24,
    flexShrink: 1,
  },
  buttonsSectionHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsSectionsRow: {
    flexDirection: 'row',
    justifyContent: 'stretch',
  },
  buttonsSectionLast: {
    marginBottom: 0,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 8,
  },
  buttonsBlock: {},
  button_50: {
    width: '50%',
  },
  button_25: {
    width: '25%',
  },
  button_33: {
    width: '33.3333333%',
  },
  button_100: {
    width: '100%',
  },
  text: {
    marginLeft: 8,
    color: '#7f7f7f',
  },
  firstColumn: {
    flex: 1,
    paddingRight: 12,
    flexGrow: 1,
  },
  column: {
    flex: 1,
    flexGrow: 1.5,
  },
  lastColumn: {
    paddingLeft: 12,
  },
  barContainer: {
    alignItems: 'center',
  },
});
