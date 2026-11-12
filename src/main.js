// Root page: M0 system check (backend reachability + device capabilities).
import { runBackendChecks, runDeviceChecks } from './shared/diagnostics.js';

const backend = document.getElementById('backend');
const device = document.getElementById('device');

async function run() {
  backend.replaceChildren();
  device.replaceChildren();
  runDeviceChecks(device);
  await runBackendChecks(backend);
}

document.getElementById('rerun').addEventListener('click', run);
run();
