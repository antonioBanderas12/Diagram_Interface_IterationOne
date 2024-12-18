import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from "gsap";
import * as functions from './functions.js';


document.addEventListener('DOMContentLoaded', function() {

  //setup
  const scene = new THREE.Scene();

  addGridHelper(scene);

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


  //Variables

  const boxSize = 5;
  let targetPosition = new THREE.Vector3();
  let currentLookAt = new THREE.Vector3(0, 0, 0);  // Camera focus point
  const boxes = [];
  let hoveredCube = null;
  let structure = 0;
  let relations = 1;
  let explore = true;


  let mode = structure;
  let currentGroup = 0;
  const reverseButton = document.getElementById('reverseButton');

  const white = 0xFFFFFF; 
  const red = 0xFF0000;
  const blue = 0x0000FF;
  const green = 0x00FF00;


  

// bigCube
  const bigCubeSize = 150; // Size of the big cube
  const bigCubeGeometry = new THREE.BoxGeometry(bigCubeSize, bigCubeSize, bigCubeSize);
  const bigCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
  const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
  scene.add(bigCube);  




//createBoxes
  function createBox(name, description, status, parentReferences = [], relations = [], group = null) {

    let colour = white;
    if(status === "Olympian") {
      colour = green;
    } else if(status === "Primordial") {
      colour = blue;
    } else if(status === "Giant") {
      colour = red;
    } else if(status === "Titan" || status === "Titaness") {
      colour = 0xEF5B9C;
    } else{
      colour = white;
    }


    const geometry = new THREE.BoxGeometry(boxSize, boxSize, 5);
    const material = new THREE.MeshStandardMaterial({ color: colour, transparent: true,opacity: 1, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);

    cube.userData.group = group;
    cube.userData.children = [];
    cube.userData.parents = parentReferences;
    cube.userData.name = name;
    cube.userData.description = description;
    cube.userData.status = status;
    cube.userData.relations = relations;


    let zLevel = 0;
    if (parentReferences === null) {
      zLevel = 0;

    } else if (parentReferences.length > 0) {
      const parent = parentReferences[0];
      zLevel = parent.userData.level - 25; // Place 25 units behind the parent
    }


    cube.userData.level = zLevel;

  
    // Ensure parentReferences is always treated as an array
    parentReferences = parentReferences ? (Array.isArray(parentReferences) ? parentReferences : [parentReferences]) : [];
  
    // Safely add this cube to each parent
    parentReferences.forEach(parent => {
      if (parent) {
        if (!parent.userData.children) {
          parent.userData.children = [];  // Initialize children array if it doesn't exist
        }
        parent.userData.children.push(cube);
        parent.add(cube);  // Attach to the parent in the scene graph
      }
    });
    scene.add(cube);
    boxes.push(cube);
    return cube;
  }





  










  // Click detection and naigation
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove, false);
  function onClick(event) {
    if(mode === structure && explore){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    const visibleBoxes = boxes.filter(box => box.visible);
    const intersects = raycaster.intersectObjects(visibleBoxes);
    
  
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

    

      const children = clickedObject.userData.children;
      let groupBoxes =[];
      children.forEach(box => {
          if (!groupBoxes.includes(box.userData.group)) {
            groupBoxes.push(box.userData.group);
          }
        });

      if(children.length === 0) return;

      if (groupBoxes.length  === 1) {
        console.log("Single Child");
        currentGroup = children[0].userData.group;
        navigateToChildren(currentGroup, clickedObject);
        return;
      }
      else{
        showChildGroupsOverlay(children, clickedObject);
      }
    }
   }
}













  


//changeMode

// structure button
document.getElementById('structure').addEventListener('click', () => {
    structurePos();
    explore = false;
    mode = structure;
    reverseButton.style.display = 'none';
    manNavigation();
    changeMode()

    let hiddenBoxes = boxes.filter(box => !box.visible);
    hiddenBoxes.forEach(cube => easeInBoxes(cube));

  });


// relations button
document.getElementById('relations').addEventListener('click', () => {
  relationsPos();
  explore = false;
  mode = relations;
  reverseButton.style.display = 'none';
  boxes.forEach(box => box.visible = true);
  manNavigation();
  changeMode()
  });





// explore structure
  document.getElementById('explore').addEventListener('click', () => {
    structureExplorePos();


    setTimeout(() => {
      explorationView()
      boxes.forEach(box => box.visible = false);
      boxes.filter(box => box.userData.group === currentGroup).forEach(box => box.visible = true);
    }, 1000);

    setTimeout(() => {
      
    explore = true;
    reverseButton.style.display = 'block';

    // boxes.filter(box => box.userData.group === !currentGroup).forEach(box => easeOutBoxes(box));

  }, 1500);

   });













//reverse
document.getElementById('reverseButton').addEventListener('click', () => {
  if(mode === structure && explore){
  let parentGroups = [];
  
  // Gather unique parent groups
  let groupBoxes = boxes.filter(box => box.userData.group === currentGroup);
  groupBoxes.forEach(box => {
    box.userData.parents.forEach(parent => {
      if (!parentGroups.includes(parent.userData.group)) {
        parentGroups.push(parent.userData.group);
      }
    });
  });



  // Handle no parents case
  if (parentGroups.length === 0) {
    alert("No parent groups found.");
    return;
  }

  // If only one parent exists, navigate directly
  if (parentGroups.length === 1) {
    currentGroup = parentGroups[0];
    navigateToParent(currentGroup);
    return;
  }

  // If multiple parents, present selection to the user
  const existingOverlay = document.querySelector('.overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  const groupSelection = document.createElement('div');
  groupSelection.classList.add('group-selection');
  overlay.appendChild(groupSelection);


  parentGroups.forEach(group => {
    const groupButton = document.createElement('button');
    groupButton.textContent = `Group ${group}`;  // Display the group number or name
    groupButton.addEventListener('click', () => {
      event.stopPropagation();
      closeOverlay(overlay);
      updateCurrentGroup(group);  // Pass the selected group
      navigateToParent(currentGroup);
    });
    groupSelection.appendChild(groupButton);
  });

  document.body.appendChild(overlay);
  }

});







//mousemove and hover
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

      onHover(cube);
      hoveredCube = cube;
    }
  } else {
    // Remove hover effects if no cube is intersected
    removeHover(hoveredCube);
    hoveredCube = null;
  }
}
function onHover(cube) {
  if (cube && cube.visible) {

   if(mode === structure && explore){

      if (cube.userData.children.length > 0){

       
       createOutline(cube);
      }
   }

   if (mode === structure && !explore) {
     createOutline(cube);
     cube.userData.children?.forEach(child => {
       createOutline(child)
       createLine(cube, child);
   });
     cube.userData.parents?.forEach(parent => {
       createOutline(parent)
       createLine(cube, parent);
   });
   }
   if(mode === relations && !explore) {
     createOutline(cube);
     cube.userData.relations?.forEach(child => {
       createOutline(child)
       createLine(cube, child);
   });
   }
 }
}


















// helpers
// helpers
// helpers
// helpers
// helpers
// helpers
// helpers
// helpers
// helpers

// navigation helpers
function addGridHelper(scene) {
  const gridHelper = new THREE.GridHelper(50, 10);
  scene.add(gridHelper);
}
const axesHelper = new THREE.AxesHelper( 500 ); scene.add( axesHelper );

function manNavigation() {

  let isDragging = false;
  let prevMousePosition = { x: 0, y: 0 };
  
  const canvas = document.querySelector('canvas'); 
  
  canvas.addEventListener('wheel', (event) => {
    if (mode === structure && !explore) {
      camera.position.z += event.deltaY * 0.1; 
    }

    if (mode === relations && !explore) {
      camera.position.x -= event.deltaY * 0.1; 
    }
  });
  
  canvas.addEventListener('mousedown', (event) => {
    if (mode === structure && !explore) {
      isDragging = true;
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }

    if (mode === relations && !explore) {
      isDragging = true;
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }
  });
  
  canvas.addEventListener('mousemove', (event) => {
    if (mode === structure && !explore && isDragging) {
      const deltaX = (event.clientX - prevMousePosition.x) * 0.1; // Adjust drag sensitivity
      const deltaY = (event.clientY - prevMousePosition.y) * 0.1;
  
      // Modify camera's x and z positions based on drag
      camera.position.x -= deltaX;
      camera.position.y += deltaY;
  
      // Update previous mouse position
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }


    if (mode === relations && !explore && isDragging) {
      const deltaX = (event.clientX - prevMousePosition.x) * 0.1; // Adjust drag sensitivity
      const deltaY = (event.clientY - prevMousePosition.y) * 0.1;
  
      // Since the plane is rotated, modify the camera's z and y positions
      camera.position.z -= deltaX;
      camera.position.y += deltaY;
  
      // Update previous mouse position
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    if (mode === structure && !explore) isDragging = false;

    if (mode === relations && !explore) isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    if (mode === structure && !explore) isDragging = false;

    if (mode === relations && !explore) isDragging = false;
  });
};


function changeMode() {
  const targetPosition = new THREE.Vector3(0,0,0);
  const rot = new THREE.Euler();


  if (mode === structure && !explore) {
    targetPosition.z += bigCubeSize;
    rot.set(0, 0, 0); // 90 degrees in radians
  }


  if (mode === relations && !explore) {
    targetPosition.x -= bigCubeSize;

    rot.set(Math.PI / 2, -Math.PI / 2, Math.PI / 2); // 90 degrees in radians
  }



  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: "power2.inOut" // Smooth easing function
  });

  gsap.to(camera.rotation, {
    duration: 1,
    x: rot.x,
    y: rot.y,
    z: rot.z,
    ease: "power2.inOut"
  });
}



function explorationView() {
    
  const group = boxes.filter(child => child.userData.group === currentGroup);
  if (group.length === 0) return;

  // boxes.forEach(cube => cube.visible = false);
  // parent.visible = true;
  // parentesGroup.forEach(child => child.visible = true);


  const boundingBox = new THREE.Box3();
  group.forEach(cube => boundingBox.expandByObject(cube));
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  const targetPosition = new THREE.Vector3();
  const rot = new THREE.Euler();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5);



  if (mode === structure && explore) {

    // targetPosition.set(currentGroup.position.x, currentGroup.position.y, currentGroup.position.z + 25);
    rot.set(0, 0, 0);
  }


  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: "power2.inOut" // Smooth easing function
  });

  gsap.to(camera.rotation, {
    duration: 1,
    x: rot.x,
    y: rot.y,
    z: rot.z,
    ease: "power2.inOut"
  });

}





// structure explore helpers
function showChildGroupsOverlay(children, parent) {
  // Example: Dynamically create an HTML overlay with the available groups
  
  const existingOverlay = document.querySelector('.overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // boxes.forEach(box => {
  //   box.visible = false;
  // });
  
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  const groupSelection = document.createElement('div');
  groupSelection.classList.add('group-selection');
  overlay.appendChild(groupSelection);

  let posGroups = [];
  children.forEach(child => {
    if (!posGroups.includes(child.userData.group)) {
      posGroups.push(child.userData.group);
    }
  });

  posGroups.forEach(group => {
    const groupButton = document.createElement('button');
    groupButton.textContent = `Group ${group}`;  // Display the group number or name
    // groupButton.removeEventListener('click', previousHandler);
    groupButton.addEventListener('click', () => {
      event.stopPropagation();
      closeOverlay(overlay);
      updateCurrentGroup(group);  // Pass the selected group
      navigateToChildren(currentGroup, parent);      // Close the overlay after selection
    });
    groupSelection.appendChild(groupButton);
  });

  document.body.appendChild(overlay);
}

function updateCurrentGroup(selectedChildGroup) {
  currentGroup = selectedChildGroup;  // This group is chosen by the user
}

function closeOverlay(overlay) {
  overlay.style.display = 'none';  // Immediate hide
  setTimeout(() => {
    overlay.remove();  // Ensure removal
  }, 100);  // Delay for cleanup (short duration)
}


function navigateToChildren(selectedGroup, parent) {
  const children = parent.userData.children.filter(child => child.userData.group === selectedGroup);
  if (children.length === 0) return;

  boxes.forEach(cube => cube.visible = false);
  parent.visible = true;
  children.forEach(child => child.visible = true);

  const boundingBox = new THREE.Box3();
  children.forEach(child => boundingBox.expandByObject(child));

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5); // Extra space
  currentLookAt.copy(center);
}

function navigateToParent(selectedGroup) {
  const parentesGroup = boxes.filter(child => child.userData.group === selectedGroup);
  if (parentesGroup.length === 0) return;

  boxes.forEach(cube => cube.visible = false);
  parent.visible = true;
  parentesGroup.forEach(child => child.visible = true);

  const boundingBox = new THREE.Box3();
  parentesGroup.forEach(child => boundingBox.expandByObject(child));

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5); // Extra space
  currentLookAt.copy(center);
}




//easing animations
function easeInBoxes(cube) {
  cube.visible = true;
  cube.material.opacity = 0;
  cube.material.transparent = true;

  const totalDuration = 1000; // total fade-in duration in milliseconds
  const stepDuration = 20; // the interval between opacity updates
  let currentOpacity = 0;
  
  const fadeInInterval = setInterval(() => {
    currentOpacity += stepDuration / totalDuration; // increase opacity based on step duration
    cube.material.opacity = currentOpacity;

    // Once the opacity reaches 1, clear the interval
    if (currentOpacity >= 1) {
      clearInterval(fadeInInterval);
    }
  }, stepDuration);
}

function easeOutBoxes(cube) {
  cube.visible = true;
  cube.material.opacity = 1; // Start fully visible
  cube.material.transparent = true;

  const totalDuration = 700; // Total fade-out duration in milliseconds
  const stepDuration = 20; // The interval between opacity updates
  let currentOpacity = 1; // Start at full opacity
  
  const fadeOutInterval = setInterval(() => {
    currentOpacity -= stepDuration / totalDuration; // Gradually decrease opacity
    cube.material.opacity = currentOpacity;

    // Once the opacity reaches 0, clear the interval
    if (currentOpacity <= 0) {
      clearInterval(fadeOutInterval);
      cube.visible = false; // Hide the cube when opacity is 0
    }
  }, stepDuration);
}



// hovering
function createLine(startCube, endCube, color = 0xF7E0C0) {
  const material = new THREE.LineBasicMaterial({ color });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    startCube.position.clone(),
    endCube.position.clone()
  ]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  // Store the line in userData of the startCube for cleanup
  if (!startCube.userData.lines) {
    startCube.userData.lines = [];
  }
  startCube.userData.lines.push(line);
}

function removeLines(cube) {
  if (cube && cube.userData.lines) {
    cube.userData.lines.forEach(line => scene.remove(line));
    cube.userData.lines = null;
  }
}

function createOutline(cube, color = 0xF7E0C0) {
  if (cube && !cube.userData.outline) {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, wireframe: true });
    const outlineGeometry = new THREE.BoxGeometry(boxSize * 1.2, boxSize * 1.2, boxSize * 1.2); // Slightly larger box
    const outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineCube.position.copy(cube.position);
    scene.add(outlineCube);
    cube.userData.outline = outlineCube;
  }
}

function removeOutline(cube) {
  if (cube && cube.userData.outline) {
    scene.remove(cube.userData.outline);
    cube.userData.outline = null;
  }
}

function removeHover(cube) {
  if (cube) {
    removeOutline(cube);
    
    removeLines(cube);

    cube.userData.children?.forEach(child => {
      removeOutline(child)
      removeLines(child);
  });
    cube.userData.parents?.forEach(parent => {
      removeOutline(parent)
      removeLines(parent);
  });

  cube.userData.relations?.forEach(child => {
    removeOutline(child)
    removeLines(child);
});
  }
}





// positions

// structure
function structurePos() {
  setTimeout(() => {
  
    const levelSpacing = 25; // Distance between levels (y-axis)
    const groupSpacing = 50; // Distance between groups within a level (x-axis)
    const boxSpacing = 7;    // Distance between boxes within a cluster (x-axis)

    // Set z-position to the front face of the big cube
    const zFrontFace = bigCubeSize / 2;

    const levels = {};
    boxes.forEach(cube => {
      const level = cube.userData.level;
      if (!levels[level]) levels[level] = [];
      levels[level].push(cube);
    });

    // Calculate the total height of all levels to center along the y-axis
    const totalLevels = Object.keys(levels).length;
    const totalHeight = (totalLevels - 1) * levelSpacing;
    const centerYOffset = totalHeight / 2;

    Object.keys(levels).forEach((yLevel, levelIndex) => {
      const cubesAtLevel = levels[yLevel];

      // Group cubes by their `group` value
      const clusters = {};
      cubesAtLevel.forEach(cube => {
        const cluster = cube.userData.group;
        if (!clusters[cluster]) clusters[cluster] = [];
        clusters[cluster].push(cube);
      });

      // Calculate total width of all clusters, including box spacing
      let totalWidth = 0;
      Object.values(clusters).forEach((cubesInCluster) => {
        const clusterWidth = (cubesInCluster.length - 1) * boxSpacing;
        totalWidth += clusterWidth + groupSpacing;
      });
      totalWidth -= groupSpacing; // Remove the last unnecessary group spacing

      const levelOffsetX = -totalWidth / 2;

      let currentX = levelOffsetX;

      Object.keys(clusters).forEach((clusterKey) => {
        const cubesInCluster = clusters[clusterKey];

        cubesInCluster.forEach((cube, i) => {
          const x = currentX + i * boxSpacing;               // Spread along the x-axis
          const y = centerYOffset - levelIndex * levelSpacing; // Spread along the y-axis
          const z = zFrontFace;                                 // Fixed on the front face

          // Animate the cube's position
          gsap.to(cube.position, {
            duration: 1,
            x: x,
            y: y,
            z: z,
            ease: "power2.inOut",
          });
        });

        // Update currentX for the next cluster
        currentX += (cubesInCluster.length - 1) * boxSpacing + groupSpacing;
      });
    });
  }, 500);
}


function structureExplorePos() {
  // setTimeout(() => {
  const levelSpacing = 25; // Distance between levels on the z-axis
  const groupSpacing = 50; // Distance between groups within a level
  const boxSpacing = 7;    // Distance between boxes within a cluster

  const levels = {};
  boxes.forEach(cube => {
    const level = cube.userData.level;
    if (!levels[level]) levels[level] = [];
    levels[level].push(cube);
  });

  Object.keys(levels).forEach((zLevel, levelIndex) => {
    const cubesAtLevel = levels[zLevel];

    // Group cubes by their `group` value
    const clusters = {};
    cubesAtLevel.forEach(cube => {
      const cluster = cube.userData.group;
      if (!clusters[cluster]) clusters[cluster] = [];
      clusters[cluster].push(cube);
    });

    const totalWidth = Object.keys(clusters).length * groupSpacing;
      const levelOffsetX = -totalWidth / 2;

    Object.keys(clusters).forEach((clusterKey, clusterIndex) => {
      const cubesInCluster = clusters[clusterKey];

      const clusterOffsetX = levelOffsetX + clusterIndex * groupSpacing;

      const cols = Math.ceil(Math.sqrt(cubesInCluster.length));
      cubesInCluster.forEach((cube, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = clusterOffsetX + col * boxSpacing;
        const y = row * boxSpacing;
        const z = -levelIndex * levelSpacing; // Place at the correct z-level


        gsap.to(cube.position, {
          duration: 1,
          x: x,
          y: y,
          z: z,
          ease: "power2.inOut",
        });

        // Set the position of the cube
        // cube.position.set(x, y, z);
      });
    });
  });
// }, 500);
}


//relations
function relationsPos() {
setTimeout(() => {
  
  const groupSpacing = 50;    // Spacing between groups
  const cloudSpread = 30;     // Spread of cubes within each group
  const minDistance = 10;     // Minimum distance between cubes to avoid overlap
  const maxAttempts = 20;     // Max retries to find a non-overlapping position   // Assuming the big cube has a size of 100 units

  // Group cubes by their `group` value
  const clusters = {};
  boxes.forEach(cube => {
    const cluster = cube.userData.group;
    if (!clusters[cluster]) clusters[cluster] = [];
    clusters[cluster].push(cube);
  });

  // Arrange groups in a grid layout
  const groupKeys = Object.keys(clusters);
  const numCols = Math.ceil(Math.sqrt(groupKeys.length));
  const numRows = Math.ceil(groupKeys.length / numCols);

  // Calculate total width and height of the grid to center the layout
  const totalWidth = (numCols - 1) * groupSpacing;
  const totalHeight = (numRows - 1) * groupSpacing;

  // Offsets to center the grid on the left face
  const centerZOffset = -totalWidth / 2;
  const centerYOffset = totalHeight / 2;
  const leftFaceX = -bigCubeSize / 2; // Position along the left face

  groupKeys.forEach((clusterKey, index) => {
    // Calculate grid position for each group (using z and y instead of x and y)
    const col = index % numCols;
    const row = Math.floor(index / numCols);
    const groupZ = centerZOffset + col * groupSpacing;   // Spread groups along the z-axis
    const groupY = centerYOffset - row * groupSpacing;   // Spread groups along the y-axis

    const cubesInCluster = clusters[clusterKey];

    // Position cubes within each group with collision avoidance
    const placedPositions = []; // Store placed positions to check for collisions

    cubesInCluster.forEach(cube => {
      let validPosition = false;
      let randomZ, randomY, randomX;
      let attempts = 0;

      while (!validPosition && attempts < maxAttempts) {
        randomZ = groupZ + (Math.random() - 0.5) * cloudSpread;  // Random spread along z-axis //(Math.random() - 0.5) 
        randomY = groupY + (Math.random() - 0.5) * cloudSpread;  // Random spread along y-axis
        randomX = leftFaceX;                                      // Align on the left face

        // Ensure cubes do not overlap within the group
        validPosition = placedPositions.every(pos => {
          const dx = pos.x - randomX;
          const dy = pos.y - randomY;
          const dz = pos.z - randomZ;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          return distance >= minDistance;
        });

        attempts++;
      }

      gsap.to(cube.position, {
        duration: 1,            // Animation duration in seconds
        x: randomX,
        y: randomY,
        z: randomZ,
        ease: "power2.inOut",   // Smooth easing function
      });

      // Save the new position to avoid overlaps
      placedPositions.push({ x: randomX, y: randomY, z: randomZ });
    });
  });
}, 500);
}









  // Animation loop
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    if(explore){
      camera.position.lerp(targetPosition, 0.05);
    }
    renderer.render(scene, camera);
  }
  animate();





















  // Example
    // Example
      // Example
        // Example
          // Example
            // Example


  // Example boxes
// Parent level 0






const cA = createBox(null);  // Top-level box (Primordial Deities)
scene.add(cA);




 const Gaia = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA],[], 1);
 const Gaia2 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA], [Gaia], 1);
 const Gaia3 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2], 2);
 const Gaia4 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2],2);
 const Gaia5 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2, Gaia], [Gaia2], 3);
 const Gaia6 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
 const Gaia7 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
 const Gaia12 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA], [Gaia], 1);
 const Gaia13 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2], 2);
 const Gaia14 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2],2);
 const Gaia51 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2, Gaia], [Gaia2], 3);
 const Gaia16 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
 const Gaia17 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);








//  const Gaia = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA]);
//  const Khronos = createBox("Chronos", "The god of empirical time, sometimes equated with Aion. Not to be confused with the Titan Cronus (Kronos), the father of Zeus.", "Primordial Deity", [cA]);
// // const Erebus = createBox( "Erebus", "The god of darkness and shadow, as well as the void that existed between Earth and the Underworld.", "Primordial Deity", [cA]);
// const Eros = createBox( "Eros", "The god of love and attraction.", "Primordial Deity", [cA]);
// // const Hemera = createBox( "Hemera", "The personification of the day.", "Primordial Deity", [cA]);
// // const Nesoi = createBox( "The Nesoi", "The goddesses of islands.", "Primordial Deity", [cA]);
// // const Nyx = createBox( "Nyx", "The goddess and personification of the night.", "Primordial Deity", [cA]);
// // const Ourea = createBox( "The Ourea", "The gods of mountains.", "Primordial Deity", [cA]);
// // const Phanes = createBox( "Phanes", "The god of procreation in the Orphic tradition.", "Primordial Deity", [cA]);
// // const Pontus = createBox( "Pontus", "The god of the sea, father of the fish and other sea creatures.", "Primordial Deity", [cA]);
// // const Tartarus = createBox( "Tartarus", "The god of the deepest, darkest part of the underworld, the Tartarean pit (which is also referred to as Tartarus itself).", "Primordial Deity", [cA]);
// // const Thalassa = createBox( "Thalassa", "Personification of the sea and consort of Pontus.", "Primordial Deity", [cA]);






// const Achlys = createBox("Achlys", "Goddess of poisons and the personification of misery and sadness. Said to have existed before Chaos.", "Primordial Deity", [cA]);
// // const Aether = createBox("Aether", "God of light and the upper atmosphere.", "Primordial Deity", [cA]);
// // const Aion = createBox("Aion", "God of eternity, personifying unbounded time.", "Primordial Deity", [cA]);
// // const Ananke = createBox("Ananke", "Goddess of inevitability, compulsion, and necessity.", "Primordial Deity", [cA]);
// // const Chaos = createBox("Chaos", "The personification of nothingness from which all existence sprang.", "Primordial Deity", [cA]);

// const Uranus = createBox("Uranus", "Primordial god of the sky.", "Titan", [Gaia]);

// const Cronus = createBox("Cronus", "The leader of the Titans and the god of time. He overthrew his father Uranus and ruled during the Golden Age. Eventually overthrown by his son, Zeus.", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// const Rhea = createBox("Rhea", "Titaness, daughter of Uranus and Gaia, wife of Cronus, and mother of many Olympian gods including Zeus, Hera, and Poseidon.", "Titaness", [Uranus, Gaia], "Uranus, Gaia");
// const Oceanus = createBox("Oceanus", "Titan god of the ocean, the great river that encircles the world.", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// // const Hyperion = createBox("Hyperion", "Titan of light, father of Helios (the Sun), Selene (the Moon), and Eos (the Dawn).", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// // const Theia = createBox("Theia", "Titaness of sight and the shining sky, mother of Helios, Selene, and Eos.", "Titaness", [Uranus, Gaia], "Uranus, Gaia");
// const Iapetus = createBox("Iapetus", "Titan of mortality and craftsmanship, father of Prometheus, Epimetheus, and Atlas.", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// // const Mnemosyne = createBox("Mnemosyne", "Titaness of memory and mother of the nine Muses by Zeus.", "Titaness", [Uranus, Gaia], "Uranus, Gaia");
// // const Coeus = createBox("Coeus", "Titan of intelligence and the axis of heaven, father of Leto and Asteria.", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// // const Phoebe = createBox("Phoebe", "Titaness of prophecy and intellect, grandmother of Apollo and Artemis.", "Titaness", [Uranus, Gaia], "Uranus, Gaia");
// // const Crius = createBox("Crius", "Titan associated with the constellations and the south wind.", "Titan", [Uranus, Gaia], "Uranus, Gaia");
// // const Themis = createBox("Themis", "Titaness of divine law and order, mother of the Horae and the Moirai (Fates).", "Titaness", [Uranus, Gaia], "Uranus, Gaia");

// const Atlas = createBox("Atlas", "A Titan condemned to hold up the sky for eternity as punishment after the Titanomachy.", "Titan", [Iapetus], "Iapetus, Clymene");
// const Prometheus = createBox("Prometheus", "Titan who created humanity and gave them fire, punished by Zeus for his defiance.", "Titan", [Iapetus], "Iapetus, Clymene");
// const Epimetheus = createBox("Epimetheus", "Titan of afterthought, brother of Prometheus, known for creating animals.", "Titan", [Iapetus], "Iapetus, Clymene");

// // const Zeus = createBox("Zeus", "King of the gods, ruler of Mount Olympus, and god of the sky and thunder. Son of Cronus and Rhea.", "Deity", [Cronus, Rhea], "Cronus, Rhea");
// // const Hera = createBox("Hera", "Queen of the gods, goddess of women and marriage. Daughter of Cronus and Rhea, wife of Zeus.", "Deity", [Cronus, Rhea], "Cronus, Rhea");
// // const Aphrodite = createBox("Aphrodite", "Goddess of beauty, love, desire, and pleasure. Born from sea-foam and Uranus' severed genitals or daughter of Zeus and Dione.", "Deity", [Zeus], "Zeus, Dione");
// // const Apollo = createBox("Apollo", "God of music, arts, healing, prophecy, and archery. Son of Zeus and Leto, twin brother of Artemis.", "Deity", [Zeus], "Zeus, Leto");
// // const Ares = createBox("Ares", "God of war, bloodshed, and violence. Son of Zeus and Hera.", "Deity", [Zeus, Hera], "Zeus, Hera");
// // // const Artemis = createBox("Artemis", "Goddess of the hunt, wilderness, and the Moon. Daughter of Zeus and Leto, twin sister of Apollo.", "Deity", [Zeus], "Zeus, Leto");
// // // const Athena = createBox("Athena", "Goddess of wisdom, skill, and warfare. Born from Zeus' forehead.", "Deity", [Zeus], "Zeus");
// // // const Demeter = createBox("Demeter", "Goddess of grain, agriculture, and harvest. Daughter of Cronus and Rhea.", "Deity", [Cronus, Rhea], "Cronus, Rhea");
// // // const Dionysus = createBox("Dionysus", "God of wine, parties, madness, and the theater. Son of Zeus and Semele.", "Deity", [Zeus], "Zeus, Semele");
// // // const Hades = createBox("Hades", "God of the underworld and wealth. Son of Cronus and Rhea, brother of Zeus and Poseidon.", "Deity", [Cronus, Rhea], "Cronus, Rhea");
// // // const Hephaestus = createBox("Hephaestus", "God of fire, metalworking, and crafts. Son of Zeus and Hera.", "Deity", [Zeus, Hera], "Zeus, Hera");
// // // const Hermes = createBox("Hermes", "God of boundaries, travel, and communication. Son of Zeus and Maia.", "Deity", [Zeus], "Zeus, Maia");
// // // const Hestia = createBox("Hestia", "Goddess of the hearth and home. Daughter of Cronus and Rhea.", "Deity", [Cronus, Rhea], "Cronus, Rhea");
// // // const Persephone = createBox("Persephone", "Goddess of spring and Queen of the Underworld. Daughter of Demeter and Zeus.", "Deity", [Demeter, Zeus], "Demeter, Zeus");
// // const Poseidon = createBox("Poseidon", "God of the sea, rivers, and earthquakes. Son of Cronus and Rhea.", "Deity", [Cronus, Rhea], "Cronus, Rhea");

// // const Gigantes = createBox("Gigantes", "A race of giants born from the blood of Uranus after he was castrated by Cronus.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Alcyoneus = createBox("Alcyoneus", "A giant who fought Heracles in the Gigantomachy and was immortal in his homeland.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Porphyrion = createBox("Porphyrion", "The king of the giants, who challenged Zeus and attempted to violate Hera.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Enceladus = createBox("Enceladus", "A giant buried under Mount Etna by Athena, known for causing earthquakes.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Polybotes = createBox("Polybotes", "A giant pursued by Poseidon and buried under the island of Nisyros.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Hippolytus = createBox("Hippolytus", "A giant defeated by Hermes during the Gigantomachy.", "Giant", [Uranus, Gaia], "Uranus, Gaia");
// // const Eurytus = createBox("Eurytus", "A giant who fought against Dionysus and was killed during the Gigantomachy.", "Giant", [Uranus, Gaia], "Uranus, Gaia");




// // for (let i = 0; i < 20; i++) {
// //   createBox(zE, child0110, white);
// // }


structureExplorePos();

});
