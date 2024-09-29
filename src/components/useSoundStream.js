import { useEffect, useRef } from 'react';
import Sound from 'react-native-sound';

const useSoundStream = (stream) => {
  const soundRef = useRef(null);

  useEffect(() => {
    if (stream) {
      soundRef.current = new Sound(stream.toURL(), '', (error) => {
        if (error) {
          console.error('Failed to load audio stream:', error);
        } else {
          soundRef.current.play();
        }
      });
    }

    // Clean up when the component unmounts or the audio stream changes
    return () => {
      if (soundRef.current) {
        soundRef.current.stop(); // Stop playback
        soundRef.current.release(); // Release resources
      }
    };
  }, [stream]);

  return null;
};
export default useSoundStream;
