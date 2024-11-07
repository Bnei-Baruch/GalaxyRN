import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import { ChatModal } from '../chat/ChatModal';
import { Shidur } from '../shidur/Shidur';
import { useInitsStore } from '../zustand/inits';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';
import { baseStyles } from '../constants';
import Members from './Members';

const Room = () => {
  const { joinRoom, exitRoom, setShowBars } = useInRoomStore();
  const { isPortrait }                      = useInitsStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  const handleAnyPress = () => {
    setShowBars(true);
    setTimeout(() => setShowBars(false), 1000);
  };

  return (
    <View style={styles.container}>
      <ChatModal />
      <TopBar />

      <View style={[styles.orientation, isPortrait ? styles.portrait : styles.landscape]}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={[baseStyles.full, { backgroundColor: 'blue' }]}
        >
          <TouchableWithoutFeedback onPress={handleAnyPress} style={[baseStyles.full, {
            backgroundColor: 'orange',
            height         : '100%'
          }]}>
            <View style={[baseStyles.full, { backgroundColor: 'green' }]}>
              <View style={isPortrait ? styles.shidurPortrait : styles.shidurLandscape}>
                <Shidur />
              </View>
              <Members />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
      <BottomBar />
    </View>
  );
};
export default Room;

const styles = StyleSheet.create({
  container      : {
    flex           : 1,
    backgroundColor: 'black',
    padding        : 10
  },
  orientation    : {
    flex           : 1,
    position       : 'relative',
  },
  portrait       : { flexDirection: 'column' },
  landscape      : { flexDirection: 'row' },
  shidurPortrait : { width: '100%' },
  shidurLandscape: { maxWidth: '50%' }
});
