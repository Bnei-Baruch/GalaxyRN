import { useEffect } from 'react';
import { useInRoomStore } from '../zustand/in_room';
import { Text } from 'react-native';
import Member from './Member';
import Shidur from './Shidur';
import { TopBar } from '../topBar/TopBar';

const Room = () => {
  const { joinRoom, exitRoom, memberByFeed } = useInRoomStore();

  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  /* initClient = (reconnect, retry = 0) => {
     this.setState({ delay: true })
     const { user, shidur } = this.state

     log.info('[client] Got config: ', config)
     this.initJanus(user, config, retry)
     if (!reconnect && shidur) {
       JanusStream.initStreaming()
     }
   }*/
  console.log('render Members', Object.values(memberByFeed));
  return (
    <>
      <TopBar />
      <Shidur />
      <Text>feed ids</Text>
      {Object.values(memberByFeed).map(m => <Member key={m.id} member={m} />)}
    </>
  );
};
export default Room;