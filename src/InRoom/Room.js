import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/in_room';
import { Text, ScrollView } from 'react-native';
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

  return (
    <>
      <TopBar />
      <Shidur />
      <ChatModal />
      <Text>feed ids</Text>
      <ScrollView>
        <MyRoomMedia />
        {Object.values(memberByFeed).map(m => <Member key={m.id} member={m} />)}
      </ScrollView>
    </>
  );
};
export default Room;