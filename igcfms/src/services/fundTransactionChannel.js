const CHANNEL_KEY = 'fund-transaction-event';
const BROADCAST_CHANNEL_NAME = 'fund-transaction-channel';

let broadcastChannel = null;

const serializeEvent = (event) => ({
  ...event,
  timestamp: Date.now(),
});

const ensureBroadcastChannel = () => {
  if (broadcastChannel || typeof window === 'undefined') return broadcastChannel;

  if ('BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }

  return broadcastChannel;
};

const emitViaLocalStorage = (payload) => {
  const serialized = JSON.stringify(payload);
  localStorage.setItem(CHANNEL_KEY, serialized);
  requestAnimationFrame(() => {
    try {
      localStorage.removeItem(CHANNEL_KEY);
    } catch (clearError) {
      console.warn('Failed to clear fund transaction broadcast key', clearError);
    }
  });
};

export const broadcastFundTransaction = (event) => {
  try {
    const payload = serializeEvent(event);
    console.log('[FundTransactionChannel] Broadcasting event', payload);

    const channel = ensureBroadcastChannel();
    if (channel) {
      channel.postMessage(payload);
    }

    emitViaLocalStorage(payload);
  } catch (error) {
    console.error('Failed to broadcast fund transaction event:', error);
  }
};

export const subscribeToFundTransactions = (callback) => {
  const handlePayload = (payload) => {
    if (!payload) return;
    try {
      console.log('[FundTransactionChannel] Received event', payload);
      callback(payload);
    } catch (handlerError) {
      console.error('Error handling fund transaction event:', handlerError);
    }
  };

  const storageHandler = (event) => {
    if (event.key !== CHANNEL_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue);
      handlePayload(payload);
    } catch (parseError) {
      console.error('Failed to parse fund transaction event:', parseError);
    }
  };

  window.addEventListener('storage', storageHandler);

  const channel = ensureBroadcastChannel();
  let channelHandler = null;
  if (channel) {
    channelHandler = (event) => handlePayload(event.data);
    channel.addEventListener('message', channelHandler);
  }

  return () => {
    window.removeEventListener('storage', storageHandler);
    if (channel) {
      if (channelHandler) {
        channel.removeEventListener('message', channelHandler);
      }
      channel.close();
      broadcastChannel = null;
    }
  };
};
