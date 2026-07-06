import { FlagixClient } from '@flagix/sdk-core';
import { SDK_KEY, BASE_URL } from './config.js';

export const flagix = new FlagixClient({
  sdkKey: SDK_KEY,
  baseUrl: BASE_URL,
  persistent: false,
});
