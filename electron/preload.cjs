// Shell flag detected by src/lib/shell.ts → selects the EXE capability profile.
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('pointElectron', { shell: 'exe', versions: process.versions });
