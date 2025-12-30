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
    // opacity:0.5,
    // width: '100%'
    // backgroundColor:'green'
  },
  buttonsSection: {
    marginBottom: 24,
    flexShrink: 1,
  },
  buttonsSectionHorizontal: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonsSectionsRow: {
    flexDirection: 'row',
    justifyContent: 'stretch',
    // display: 'flex',
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
    // width: '36%',
    flex: 1,
    paddingRight: 12,
    flexGrow: 1,
  },
  column: {
    flex: 1,
    flexGrow: 1.5,
    // width: '50%',
  },
  lastColumn: {
    // flex: 1,
    // flexShrink: 1,
    // width: '14%',
    paddingLeft: 12,
  },
  barContainer: {
    // marginLeft: 8,
    // marginRight: 8,
    alignItems: 'center',
  },
});
