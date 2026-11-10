import * as THREE from './vendor/three.module.js';
import {bindGlassCards} from './GlassVideoCardCore.js';
export {bindGlassCards};
const defaults=bindGlassCards(THREE);
export const GlassVideoCard=defaults.GlassVideoCard;
export const createStudioEnvironment=defaults.createStudioEnvironment;
