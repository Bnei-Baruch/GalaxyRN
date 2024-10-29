import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, ScrollView, View } from 'react-native';
import Member from './Member';
import { BottomBar } from '../bottomBar/BottomBar';
import { ChatModal } from '../chat/ChatModal';
import { TopBar } from '../topBar/TopBar';
import { Shidur } from '../shidur/Shidur';
import { memberItemWidth } from './helper';

const Room = () => {
  const { joinRoom, exitRoom, memberByFeed, activatePage } = useInRoomStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  const handleScrollEnd = e => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    activatePage(Math.round(contentOffsetX / memberItemWidth));
  };
  return (
    <View style={styles.container}>
      <ChatModal />

      <View style={styles.stickyHeader}>
        <TopBar />
        <Shidur />
      </View>
      <ScrollView
        disableScrollViewPanResponder={true}
        snapToInterval={memberItemWidth}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        <View style={styles.roomsContainer}>

          {/*<MyRoomMedia />*/}
          {
            Object.values(memberByFeed).map(m => <Member key={m.id} member={m} />)
          }
        </View>
      </ScrollView>

      <BottomBar />
    </View>
  );
};
export default Room;

const styles = StyleSheet.create({
  container     : {
    flex           : 1,
    backgroundColor: 'green',
  },
  stickyHeader  : {
    flexDirection: 'column'
  },
  roomsContainer: {
    flex          : 1,
    flexDirection : 'row',
    flexWrap      : 'wrap',
    justifyContent: 'space-between',
  }
});
