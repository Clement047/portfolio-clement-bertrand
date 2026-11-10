import * as THREE from './vendor/three.module.js';
import {bindOrbitPath} from './OrbitPathCore.js';
export {bindOrbitPath};
export const orbitPose=bindOrbitPath(THREE).orbitPose;
