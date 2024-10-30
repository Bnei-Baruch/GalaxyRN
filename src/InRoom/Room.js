import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import Member from './Member';
import { ChatModal } from '../chat/ChatModal';
import { Shidur } from '../shidur/Shidur';
import { memberItemWidth } from './helper';
import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';
import MemberNoVideo from './MemberNoVideo';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';

const Room = () => {
  const { joinRoom, exitRoom, memberByFeed, activatePage, setShowBars } = useInRoomStore();
  const { isPortrait }                                                  = useInitsStore();
  const { audioMode }                                                   = useSettingsStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  const handleScrollEnd = e => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    activatePage(Math.round(contentOffsetX / memberItemWidth.get()));
  };
  const handleAnyPress  = () => {
    setShowBars(true);
    setTimeout(() => setShowBars(false), 1000);
  };

  return (
    <TouchableWithoutFeedback onPress={handleAnyPress}>
      <View style={styles.container}>
        <ChatModal />
        <TopBar />

        <View style={[styles.orientation, isPortrait ? styles.portrait : styles.landscape]}>
          <View style={isPortrait ? styles.shidurPortrait : styles.shidurLandscape}>
            <Shidur />
          </View>

          <ScrollView
            disableScrollViewPanResponder={true}
            snapToInterval={memberItemWidth.get()}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            //contentContainerStyle={styles.roomsContainer}
          >
            <View style={styles.roomsContainer}>

              {/*<MyRoomMedia />*/}
              {

                Object
                  .values(memberByFeed)
                  .map(m => (
                    !audioMode ?
                      <Member key={m.id} member={m} />
                      : <MemberNoVideo key={m.id} member={m} />
                  ))

              }
            </View>
          </ScrollView>

        </View>

        <BottomBar />
      </View>
    </TouchableWithoutFeedback>
  );
};
export default Room;

const styles = StyleSheet.create({
  container      : {
    flex           : 1,
    backgroundColor: 'black',
    padding        : 10
  },
  stickyHeader   : {
    flexDirection: 'column'
  },
  roomsContainer : {
    flex          : 1,
    flexDirection : 'row',
    flexWrap      : 'wrap',
    justifyContent: 'space-around',
  },
  orientation    : {
    flex    : 1,
    position: 'relative'
  },
  portrait       : { flexDirection: 'column' },
  landscape      : { flexDirection: 'row' },
  shidurPortrait : { width: '100%' },
  shidurLandscape: { maxWidth: '50%' }
});
