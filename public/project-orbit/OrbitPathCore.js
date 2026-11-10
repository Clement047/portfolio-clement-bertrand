export function bindOrbitPath(THREE){

const up = new THREE.Vector3(0, 1, 0);

// Orbite elliptique adaptée à sept cartes de largeur 7.
const ORBIT_RADIUS_X = 12.5;
const ORBIT_RADIUS_Z = 8.5;

const ORBIT_CENTER_Y = 0.62;
const ORBIT_CENTER_Z = -8.5;

function orbitPose(theta, cameraPosition, settings={}) {

  const rx=settings.radiusX??ORBIT_RADIUS_X,rz=settings.radiusZ??ORBIT_RADIUS_Z;
  const cy=settings.centerY??ORBIT_CENTER_Y,cz=settings.centerZ??ORBIT_CENTER_Z,vertical=settings.verticalAmplitude??.68;
  // Position sur l'ellipse
  const position = new THREE.Vector3(
    Math.sin(theta) * rx,
    cy - vertical * Math.cos(theta),
    cz + rz * Math.cos(theta)
  );

  // Tangente réelle à l'ellipse
  const tangent = new THREE.Vector3(
    rx * Math.cos(theta),
    vertical * Math.sin(theta),
    -rz * Math.sin(theta)
  ).normalize();

  // Orientation tangentielle de la carte
  const x = tangent.clone();

  const y = up.clone()
    .addScaledVector(x, -up.dot(x))
    .normalize();

  const z = new THREE.Vector3()
    .crossVectors(x, y)
    .normalize();

  // Conserver la face lisible vers la caméra
  // sans transformer la carte en billboard.
  if (
    cameraPosition &&
    z.dot(cameraPosition.clone().sub(position)) < 0
  ) {
    x.negate();
    z.negate();
  }

  const quaternion = new THREE.Quaternion()
    .setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(x, y, z)
    );

  if(cameraPosition&&(settings.faceCameraBlend??0)>0){
    const forward=cameraPosition.clone().sub(position).normalize(),screenUp=(settings.readabilityUp??up).clone();
    const right=new THREE.Vector3().crossVectors(screenUp,forward).normalize(),vertical=new THREE.Vector3().crossVectors(forward,right).normalize();
    const readable=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,vertical,forward));
    quaternion.slerp(readable,Math.max(0,Math.min(1,settings.faceCameraBlend)));
  }
  return {
    position,
    quaternion,
    tangent,
    normal: z
  };
}

return {orbitPose};
}
