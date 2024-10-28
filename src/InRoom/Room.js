import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, FlatList, View } from 'react-native';
import Member from './Member';
import { Shidur } from '../shidur/Shidur';
import { TopBar } from '../topBar/TopBar';
import { BottomBar } from '../bottomBar/BottomBar';
import MyRoomMedia from '../components/MyRoomVideo';
import { ChatModal } from '../chat/ChatModal';

const Room = () => {
  const { joinRoom, exitRoom, memberByFeed } = useInRoomStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  const renderItem = ({ item }) => (
    <Member key={item.id} member={item} />
  );

  return (
    <>
      <TopBar />
      <Shidur />
      <ChatModal />
      <View style={styles.roomsContainer}>
        <MyRoomMedia />
        {
          Object.values(memberByFeed).map(m => <Member key={m.id} member={m} />)
        }
        <FlatList
          data={Object.values(memberByFeed)}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
        />
      </View>

      <BottomBar />
    </>
  );
};
export default Room;

const styles = StyleSheet.create({
  roomsContainer: {}
});
