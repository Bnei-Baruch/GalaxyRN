import { useInits } from './Inits';
import Room from './Room';
import { Text } from 'react-native';

const InRoom = () => {
  const ready = useInits();

  return ready ? <Room /> : <Text>preparing of room</Text>;
};
export default InRoom;