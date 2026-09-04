import { useState, useEffect } from 'react';
import { NetInfoState, useNetInfo } from '@react-native-community/netinfo';

export const useOnlineStatus = () => {
  const netInfo = useNetInfo();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(netInfo.isConnected ?? true);
  }, [netInfo.isConnected]);

  return {
    isOnline,
    isConnected: netInfo.isConnected,
    type: netInfo.type,
    isInternetReachable: netInfo.isInternetReachable,
  };
};
