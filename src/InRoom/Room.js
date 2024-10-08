import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/in_room';
import { Text, StyleSheet, FlatList } from 'react-native';
import Member from './Member';
import Shidur from './Shidur';
import { TopBar } from '../topBar/TopBar';
import { ChatModal } from '../chat/ChatModal';
import MyRoomMedia from '../components/MyRoomVideo';

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
      <Text>feed ids</Text>
      {/*<ScrollView style={styles.roomsContainer}>
      </ScrollView>*/}
      <MyRoomMedia />
      <FlatList
        data={Object.values(memberByFeed)}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
      />
    </>
  );
};
export default Room;

const styles = StyleSheet.create({
  roomsContainer: {
    flex: 1,
  }
});
