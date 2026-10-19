import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Expose your API methods here
});