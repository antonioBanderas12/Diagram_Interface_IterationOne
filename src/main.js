import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from "gsap";

document.addEventListener('DOMContentLoaded', function() {
  const scene = new THREE.Scene();
  // addGridHelper(scene);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 25;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth - 18, window.innerHeight - 18);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // const controls = new OrbitControls(camera, renderer.domElement);

  // Lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  // Variables
  const zA = 0;
  const zB = -25;
  const zC = -50;
  const zD = -75;
  const zE = -100;


  const boxSize = 5;
  let targetPosition = new THREE.Vector3();
  let currentLookAt = new THREE.Vector3(0, 0, 0);  // Camera focus point
  const boxes = [];
  let hoveredCube = null;

  
  //viewVariables
  let view = 0;
  let currentParent = null;
  let viewZero = new THREE.Vector3(0, 0, 0)
  let rotateZero = new THREE.Euler()

  





  function createBox(zLevel, parentReference, color, group = 0) {  // Default to 0 if not provided
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, 5);
    const material = new THREE.MeshStandardMaterial({ color, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    
    cube.userData.level = zLevel;
    cube.userData.parent = parentReference;
    cube.userData.group = group;
    cube.userData.children = [];
    
    if (parentReference) {
      parentReference.userData.children.push(cube);
    }

    scene.add(cube);
    boxes.push(cube);
    // updateInitPositions();
    return cube;
  }


  function updateInitPositions() {
    const levelSpacing = 25;   // Adjust the distance between levels
    const groupSpacing = 15;   // Space between groups within the same parent cluster
    const boxSpacing = 7;      // Space between individual boxes
  
    // Organize cubes by levels
    const levels = {};
    boxes.forEach(cube => {
      const level = cube.userData.level;
      if (!levels[level]) levels[level] = [];
      levels[level].push(cube);
    });
  
    // Loop through each level
    Object.keys(levels).forEach((zLevel, levelIndex) => {
      const cubesAtLevel = levels[zLevel];
      
      // Group cubes by their parent reference
      const parentGroups = {};
      cubesAtLevel.forEach(cube => {
        const parentKey = cube.userData.parent?.id || 'root';
        if (!parentGroups[parentKey]) parentGroups[parentKey] = [];
        parentGroups[parentKey].push(cube);
      });
  
      // Position each parent group
      let offsetX = 0; // Track horizontal position for each parent group
      Object.keys(parentGroups).forEach((parentKey, groupIndex) => {
          const cubesInGroup = parentGroups[parentKey];

          // Group cubes by cluster within the parent group
          const clusters = {};
          cubesInGroup.forEach(cube => {
              const cluster = cube.userData.group;
              if (!clusters[cluster]) clusters[cluster] = [];
              clusters[cluster].push(cube);
          });

          // Position each cluster within the parent group
          let clusterOffsetX = 0; // Track horizontal position for each cluster within the parent group
          Object.keys(clusters).forEach((clusterKey, clusterIndex) => {
              const cubesInCluster = clusters[clusterKey];

              // Arrange cubes in rows and columns within the cluster
              const cols = Math.ceil(Math.sqrt(cubesInCluster.length));
              cubesInCluster.forEach((cube, i) => {
                  const col = i % cols;
                  const row = Math.floor(i / cols);

                  // Calculate positions
                  const x = offsetX + clusterOffsetX + col * boxSpacing;
                  const y = row * boxSpacing;
                  const z = -levelIndex * levelSpacing;  // Place at correct z-level
                  
                  // Set the position of the cube
                  cube.position.set(x, y, z);
              });

              // Increment the offset for the next cluster within the same parent group
              clusterOffsetX += (cols + 1) * boxSpacing;  // Add spacing for the next cluster
          });

          // Increment the offset for the next parent group
          offsetX += (clusterOffsetX + groupSpacing);
      });
    });
  }





  // function addGridHelper(scene) {
  //   const gridHelper = new THREE.GridHelper(50, 10);
  //   scene.add(gridHelper);
  // }

  // Click detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove, false);

  function onClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const visibleBoxes = boxes.filter(box => box.visible);
    const intersects = raycaster.intersectObjects(visibleBoxes);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      currentParent = clickedObject;
      navigateToChildren(clickedObject);
    }
  }

  function navigateToChildren(parentReference) {
    const children = parentReference.userData.children;
    if (children.length === 0) return;

    boxes.forEach(cube => cube.visible = false);
    parentReference.visible = true;
    children.forEach(child => child.visible = true);

    // Calculate bounding box of children
    const boundingBox = new THREE.Box3();
    children.forEach(child => boundingBox.expandByObject(child));

    // Center point and size
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = boundingBox.getSize(new THREE.Vector3()).length();

    // Adjust camera position and focus
    const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
    targetPosition.set(center.x, center.y, center.z + distance + 5); // Extra space
    currentLookAt.copy(center);
  }

  document.getElementById('reverseButton').addEventListener('click', () => {
    if (!currentParent || !currentParent.userData.parent) return; 
    
    const parentBox = currentParent.userData.parent;  // Get the parent of the current box
    currentParent = parentBox;  // Update currentParent
  
    // Show only the parent and its children
    boxes.forEach(cube => cube.visible = false);  
    parentBox.visible = true;
    parentBox.userData.children.forEach(child => child.visible = true);
  
    // Adjust camera to focus on parent and its children
    navigateToChildren(parentBox);
  });
  




// Add GSAP for smooth animation
document.getElementById('changeView').addEventListener('click', () => {
  if (view == 0) {
    viewZero.copy(camera.position);
    rotateZero.copy(camera.rotation);
    view = 1;

    const boundingBox = new THREE.Box3();
    boxes.forEach(cube => boundingBox.expandByObject(cube));

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = boundingBox.getSize(new THREE.Vector3()).length();
    const distance = size;

    const targetPosition = new THREE.Vector3(center.x, center.y + distance, center.z);
    const lookAtTarget = new THREE.Vector3().copy(camera.position); // Start from current position

    // Smooth transition of camera position and lookAt using GSAP
    gsap.to(camera.position, {
      duration: 1, // Transition duration in seconds
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      ease: "power2.inOut" // Smooth easing function
    });

    gsap.to(lookAtTarget, {
      duration: 1,
      x: center.x,
      y: center.y,
      z: center.z,
      ease: "power2.inOut",
      onUpdate: () => {
        if (gsap.getProperty(camera.position, 'y') > targetPosition.x * 0.4) {
          camera.lookAt(lookAtTarget);
        }
      }
    });
setTimeout(() => {
  boxes.forEach(cube => cube.visible = true);
}, 1000)


  } else if (view == 1) {
    view = 0;

    // Transition the camera back to the original position and rotation
    gsap.to(camera.position, {
      duration: 1, // Transition duration in seconds
      x: viewZero.x,
      y: viewZero.y,
      z: viewZero.z,
      onUpdate: () => {
        // Start looking at the original position when 70% of the transition is completed
        if (gsap.getProperty(camera.position, 'x') === viewZero.x) {
          camera.lookAt(viewZero);
        }
      },
    });
    gsap.to(camera.rotation, {
      duration: 1,
      x: rotateZero.x,
      y: rotateZero.y,
      z: rotateZero.z,
    });

    // Make boxes invisible and show the parent elements
    boxes.forEach(cube => cube.visible = false);
    currentParent.visible = false;
    currentParent.userData.children.forEach(child => child.visible = true);
  }
});












function onHover(cube) {
  if (cube) {
    let children = cube.userData.children;
    // Create a highlight or outline effect
      if (cube.visible) {
        if (cube.userData.children.length > 0){
          if (!cube.userData.outline) {
            const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xF7E0C0, side: THREE.BackSide, wireframe: true });
            const outlineGeometry = new THREE.BoxGeometry(boxSize * 1.2, boxSize * 1.2, 5 * 1.2); // Slightly larger box
            const outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
            outlineCube.position.copy(cube.position);
            scene.add(outlineCube);
            cube.userData.outline = outlineCube;
          }
          if (view == 1){
            children.forEach(child => {

              const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xF7E0C0, side: THREE.BackSide, wireframe: true });
              const outlineGeometry = new THREE.BoxGeometry(boxSize * 1.2, boxSize * 1.2, 5 * 1.2); // Slightly larger box
              const outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
              outlineCube.position.copy(child.position);
              scene.add(outlineCube);
              child.userData.outline = outlineCube;
          });
          }
        }
     }
  }
}

// Remove the hover effect
function removeHover(cube) {
  if (cube && cube.userData.outline) {
    scene.remove(cube.userData.outline);
    cube.userData.outline = null;
  }
}



function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(boxes);

  if (intersects.length > 0) {
    const cube = intersects[0].object;

    if (hoveredCube !== cube) {
      removeHover(hoveredCube);
      if (hoveredCube) {
        let children = hoveredCube.userData.children;
        children.forEach(child => removeHover(child));
      }
      onHover(cube);
      hoveredCube = cube;
    }
  } else {
    removeHover(hoveredCube);
    if (hoveredCube) {
      let children = hoveredCube.userData.children;
      children.forEach(child => removeHover(child));
    }
    hoveredCube = null;
  }
}







  // Animation loop
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
 if(view == 0){
      camera.position.lerp(targetPosition, 0.05);
 }
  
    renderer.render(scene, camera);
  }
  animate();




  // Example boxes
// Parent level 0
const white = 0xFFFFFF; 
const red = 0xFF0000;
const blue = 0x0000FF;
const green = 0x00FF00;

const cA = createBox(zA, null, white);
scene.add(cA);


const cBa = createBox(zB, cA, red);
const cBb = createBox(zB, cA, white);


const child3 = createBox(zC, cBa, blue,1);
const child4 = createBox(zC, cBa, blue,1);
const child5 = createBox(zC, cBa, green,2);
const child6 = createBox(zC, cBa, green,2);


const child13 = createBox(zC, cBa, red);
const child14 = createBox(zC, cBa, red);
const child15 = createBox(zC, cBa, red);
const child16 = createBox(zC, cBa, red);


const child7 = createBox(zC, cBb, white);
const child8 = createBox(zC, cBb, white);
const child9 = createBox(zC, cBb, white);
const child10 = createBox(zC, cBb, white);

const child17 = createBox(zC, cBb, white);
const child18 = createBox(zC, cBb, white);
const child19 = createBox(zC, cBb, white);
const child110 = createBox(zC, cBb, white);





const child03 = createBox(zD, child3, red);
const child04 = createBox(zD, child3, red);
const child05 = createBox(zD, child3, red);
const child06 = createBox(zD, child3, red);


const child013 = createBox(zD, child13, red);
const child014 = createBox(zD, child13, red);
const child015 = createBox(zD, child13, red);
const child016 = createBox(zD, child13, red);


const child07 = createBox(zD, child7, white);
const child08 = createBox(zD, child7, white);
const child09 = createBox(zD, child7, white);
const child010 = createBox(zD, child7, white);

const child017 = createBox(zD, child17, white);
const child018 = createBox(zD, child17, white);
const child019 = createBox(zD, child17, white);
const child0110 = createBox(zD, child17, white);



for (let i = 0; i < 20; i++) {
  createBox(zE, child0110, white);
}


updateInitPositions();

});
