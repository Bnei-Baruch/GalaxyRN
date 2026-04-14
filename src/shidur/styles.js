import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    viewer: {
        aspectRatio: 16 / 9,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noVideo: {
        aspectRatio: 16 / 9,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onAir: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'red',
        zIndex: 10,
        fontSize: 20,
        padding: 10,
        borderRadius: 20,
    },
});
