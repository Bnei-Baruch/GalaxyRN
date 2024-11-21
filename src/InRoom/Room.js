import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import { ChatModal } from '../chat/ChatModal';
import { useInitsStore } from '../zustand/inits';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';
import { baseStyles } from '../constants';
import Members from './Members';
import { Shidurs } from '../shidur/Shidurs';

const Room = () => {
  const { joinRoom, exitRoom, setShowBars } = useInRoomStore();
  const { isPortrait }                      = useInitsStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  const handleAnyPress = () => setShowBars(true);

  return (
    <View style={styles.container}>
      <ChatModal />
      <TopBar />
      <View style={[styles.orientation, isPortrait ? styles.portrait : styles.landscape]}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={baseStyles.full}
        >
          <TouchableWithoutFeedback onPress={handleAnyPress}>
            <View style={styles.scrollContent}>
              <Shidurs key="shidurs" />
              <Members key="members" />
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
  container    : {
    flex           : 1,
    backgroundColor: 'black',
    padding        : 10
  },
  orientation  : {
    flex    : 1,
    position: 'relative',
  },
  scrollContent: {
    flex     : 1,
    minHeight: '100%'
  },
  portrait     : { flexDirection: 'column' },
  landscape    : { flexDirection: 'row' },
});
