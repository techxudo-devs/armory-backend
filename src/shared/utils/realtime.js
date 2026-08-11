import pusher from "../../config/pusher.js";

/**
 * Fire a Pusher event. Returns a resolved promise when Pusher is not
 * configured so callers never have to branch. Always swallows errors so a
 * Pusher failure can never crash or delay an API response.
 */
export const triggerPusher = (channel, event, data = {}) => {
  if (!pusher) return Promise.resolve();

  return pusher.trigger(channel, event, data).catch((error) => {
    console.error(`[PUSHER] Failed to trigger "${event}" on "${channel}":`, error?.message ?? error);
  });
};
