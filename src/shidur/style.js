import { StyleSheet } from 'react-native';
import { SHIDUR_BAR_ZINDEX } from '../consts';

const styles = StyleSheet.create({
    toolbar: {
        padding: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: SHIDUR_BAR_ZINDEX,
    },
    toolbarBtnsGroup: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
    },
});

export default styles;