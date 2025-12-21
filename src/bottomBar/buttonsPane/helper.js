import { StyleSheet } from 'react-native';

export const buttonsPaneStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  panelWrapper: {
    borderRadius: 32,
    padding: 16,
  },
  buttonsSection: {
    marginBottom: 24,
    flexShrink: 1,
  },

  buttonsSectionsRow: {
    flexDirection: 'row',
    justifyContent: 'stretch',
    display: 'flex',
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
  button_33: {
    width: '33.3333333%',
  },
  text: {
    marginLeft: 8,
    color: '#7f7f7f',
  },
  firstColumn: {
    width: '50%',
    paddingRight: 12,
  },
  lastColumn: {
    width: '50%',
    paddingLeft: 12,
  },
  bottomBarContainer: {
    marginLeft: 8,
    marginRight: 8,
    alignItems: 'center',
  },
});
