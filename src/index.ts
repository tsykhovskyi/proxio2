import { RunSshServer } from './server';
import { RunHttpProxy } from './proxy';

const tunnels = RunSshServer();

RunHttpProxy(tunnels);
