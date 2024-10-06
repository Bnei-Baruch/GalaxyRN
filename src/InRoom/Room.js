import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/in_room';
import { Text } from 'react-native';
import Member from './Member';
import Shidur from './Shidur';
import { TopBar } from '../topBar/TopBar';
import { ChatModal } from '../chat/ChatModal';

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
      {Object.values(memberByFeed).map(m => <Member key={m.id} member={m} />)}
    </>
  );
};
export default Room;