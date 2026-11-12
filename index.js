import { selectedCloudDemo, mountCloudDemoNavigation } from './tools/clouds/cloudDemoNavigation.js';

if (selectedCloudDemo() === 'planet') {
  import('./tools/clouds/planetApproachClouds.js').catch(console.error);
} else {
  mountCloudDemoNavigation();
  import('./tools/clouds/cloudTestThreaded.js').catch(console.error);
}
