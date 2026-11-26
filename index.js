import { selectedCloudDemo, mountCloudDemoNavigation, watchCloudDemoHistory } from './tools/clouds/cloudDemoNavigation.js';

const demo = selectedCloudDemo();
const retryKey = 'cloud-lab-import-retry';
const route = location.pathname + location.search;
const loaders = {
  planet: () => import('./tools/clouds/planetApproachClouds.js'),
  fluid: () => import('./tools/clouds/fluidClouds.js'),
  flat: () => import('./tools/clouds/cloudTestThreaded.js'),
};

function retryInterruptedImport(error) {
  if (!(error instanceof TypeError) ||
      !/failed to fetch dynamically imported module|importing a module script failed/i.test(error.message)) {
    return false;
  }
  try {
    if (sessionStorage.getItem(retryKey) === route) return false;
    sessionStorage.setItem(retryKey, route);
  } catch {
    return false;
  }
  location.reload();
  return true;
}

function showLoadError(error) {
  console.error(error);
  if (retryInterruptedImport(error)) return;
  const panel = document.createElement('dialog');
  const heading = document.createElement('h2');
  heading.textContent = 'Could not load clouds';
  const details = document.createElement('p');
  details.textContent = error?.message || String(error);
  const retry = document.createElement('button');
  retry.textContent = 'Reload demo';
  retry.addEventListener('click', () => location.reload());
  panel.append(heading, details, retry);
  document.body.append(panel);
  panel.showModal();
}

watchCloudDemoHistory();
if (demo === 'flat') mountCloudDemoNavigation();
loaders[demo]().then(() => {
  try {
    sessionStorage.removeItem(retryKey);
  } catch {
    // The app also runs with storage disabled.
  }
}, showLoadError);
