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
  // let currentParent = [];
  let currentGroup = 0;
  let viewZero = new THREE.Vector3(0, 0, 0)
  let rotateZero = new THREE.Euler()

  





  function createBox(zLevel, parentReferences = [], color, group = 0) {
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, 5);
    const material = new THREE.MeshStandardMaterial({ color, transparent: true,opacity: 1, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);

    cube.userData.level = zLevel;
    cube.userData.group = group;
    cube.userData.children = [];
    cube.userData.parents = parentReferences;

  
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
  
  

  // function updateInitPositions() {
  //   const levelSpacing = 25;
  //   const groupSpacing = 15;
  //   const boxSpacing = 7;
  
  //   const levels = {};
  //   boxes.forEach(cube => {
  //     const level = cube.userData.level;
  //     if (!levels[level]) levels[level] = [];
  //     levels[level].push(cube);
  //   });
  
  //   let offsetX = 0;
  //   Object.keys(levels).forEach((zLevel, levelIndex) => {
  //     const cubesAtLevel = levels[zLevel];
  //     cubesAtLevel.forEach((cube, i) => {
  //       // Positioning logic
  //       const x = (i % 5) * boxSpacing;
  //       const y = Math.floor(i / 5) * boxSpacing;
  //       const z = -levelIndex * levelSpacing;

  //       const clusters = {};
  //       cubesAtLevel.forEach(cube => {
  //           const cluster = cube.userData.group;
  //           if (!clusters[cluster]) clusters[cluster] = [];
  //           clusters[cluster].push(cube);
  //       });

  //       let clusterOffsetX = 0; // Track horizontal position for each cluster within the parent group
  //       Object.keys(clusters).forEach((clusterKey, clusterIndex) => {
  //           const cubesInCluster = clusters[clusterKey];

  //           // Arrange cubes in rows and columns within the cluster
  //           const cols = Math.ceil(Math.sqrt(cubesInCluster.length));
  //           cubesInCluster.forEach((cube, i) => {
  //               const col = i % cols;
  //               const row = Math.floor(i / cols);

  //               // Calculate positions
  //               const x = offsetX + clusterOffsetX + col * boxSpacing;
  //               const y = row * boxSpacing;
  //               const z = -levelIndex * levelSpacing;  // Place at correct z-level
                
  //               // Set the position of the cube
  //               cube.position.set(x, y, z);
  //           });
  //         });
  //       });
  //     });
  //   }





  function updateInitPositions() {
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
  
      // Calculate total width of all clusters at this level
      const totalWidth = Object.keys(clusters).length * groupSpacing;
  
      // Calculate starting offset to center clusters at x = 0
      const levelOffsetX = -totalWidth / 2;
  
      Object.keys(clusters).forEach((clusterKey, clusterIndex) => {
        const cubesInCluster = clusters[clusterKey];
  
        // Calculate cluster offset based on level offset and cluster index
        const clusterOffsetX = levelOffsetX + clusterIndex * groupSpacing;
  
        // Arrange cubes in rows and columns within the cluster
        // const cols = Math.ceil(Math.sqrt(cubesInCluster.length));
        // cubesInCluster.forEach((cube, i) => {
        //   const col = i % cols;
        //   const row = Math.floor(i / cols);



  
          // Calculate positions
          // const x = clusterOffsetX + col * boxSpacing;
          // const y = row * boxSpacing;
          // const z = -levelIndex * levelSpacing; // Place at the correct z-level


     // Arrange cubes in a straight line along the x-axis
        cubesInCluster.forEach((cube, i) => {
          const x = clusterOffsetX + i * boxSpacing;
          const y = 0; // No vertical offset
          const z = -levelIndex * levelSpacing; // Place at the correct z-level


  
          // Set the position of the cube
          cube.position.set(x, y, z);
        });
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














document.getElementById('reverseButton').addEventListener('click', () => {
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

  // boxes.forEach(box => {
  //   box.visible = false;
  // });
  
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
    const distance = 50//size;

    const targetPosition = new THREE.Vector3(center.x, center.y + distance, center.z);
    // const lookAtTarget = new THREE.Vector3().copy(camera.position); // Start from current position

    const lookAtTarget = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 25); // Start from current position



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
        if (gsap.getProperty(camera.position, 'y') > targetPosition.x) {  // * 0.4
          camera.lookAt(lookAtTarget);
        }
      }
    });


    let hiddenBoxes = boxes.filter(box => !box.visible);
    hiddenBoxes.forEach(cube => easeInBoxes(cube));

// setTimeout(() => {
//   boxes.forEach(cube => cube.visible = true);
// }, 1000)



let isDragging = false;
let prevMousePosition = { x: 0, y: 0 };

// Add event listeners for zooming and dragging
const canvas = document.querySelector('canvas'); // Replace with your renderer's canvas element

canvas.addEventListener('wheel', (event) => {
  if (view === 1) {
    // Adjust camera's y-position for zoom
    camera.position.y += event.deltaY * 0.1; // Scale zoom sensitivity as needed
  }
});

canvas.addEventListener('mousedown', (event) => {
  if (view === 1) {
    isDragging = true;
    prevMousePosition.x = event.clientX;
    prevMousePosition.y = event.clientY;
  }
});

canvas.addEventListener('mousemove', (event) => {
  if (view === 1 && isDragging) {
    const deltaX = (event.clientX - prevMousePosition.x) * 0.1; // Adjust drag sensitivity
    const deltaY = (event.clientY - prevMousePosition.y) * 0.1;

    // Modify camera's x and z positions based on drag
    camera.position.x -= deltaX;
    camera.position.z -= deltaY;

    // Update previous mouse position
    prevMousePosition.x = event.clientX;
    prevMousePosition.y = event.clientY;
  }
});

canvas.addEventListener('mouseup', () => {
  if (view === 1) isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
  if (view === 1) isDragging = false;
});



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

    boxes.forEach(box => box.visible = false);
    boxes.filter(box => box.userData.group === currentGroup).forEach(box => box.visible = true);



    // let hideBoxes = boxes.filter(box => box.userData.group !== currentGroup);
    // console.log("Hide Boxes: ", hideBoxes);
    // hideBoxes.forEach(cube => easeOutBoxes(cube));

    // setTimeout(() => {
    //   hideBoxes.forEach(box => box.visible = false);
    // }, 700)




  }
});



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

function onHover(cube) {
  if (cube && cube.visible) {
    if(view === 0){
      if (cube.userData.children.length > 0){
        createOutline(cube);
      }
    }

    if (view === 1) {
      createOutline(cube);
      cube.userData.children?.forEach(child => {
        createOutline(child)
        createLine(cube, child);
    });
      cube.userData.parents?.forEach(parent => {
        createOutline(parent)
        createLine(cube, parent);
    });

      // Highlight siblings in the same group
      // const cluster = cube.userData.group;
      // const siblings = boxes.filter(box => box.userData.group === cluster);
      // siblings.forEach(sibling => {
      //   createOutline(sibling),
      //   sibling.userData.children?.forEach(child => createOutline(child)),
      //   sibling.userData.parents?.forEach(parent => createOutline(parent))
      // }
      //);
    }
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
    // const cluster = cube.userData.group;
    // const siblings = boxes.filter(box => box.userData.group === cluster);
    // siblings.forEach(sibling => {
    //   removeOutline(sibling),
    //   sibling.userData.children?.forEach(child => removeOutline(child)),
    //   sibling.userData.parents?.forEach(parent => removeOutline(parent))
    // }
    // );
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
      // Remove highlights from the previously hovered cube
      removeHover(hoveredCube);

      // Apply highlights to the currently hovered cube
      onHover(cube);
      hoveredCube = cube;
    }
  } else {
    // Remove hover effects if no cube is intersected
    removeHover(hoveredCube);
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

const cA = createBox(zA, null, white);  // Top-level box
scene.add(cA);

const cBa = createBox(zB, [cA], white,1);   // Single parent in an array
const cBb = createBox(zB, [cA], white,1);

const child3 = createBox(zC, [cBa], white, 2);  // Children with parent cBa
const child4 = createBox(zC, [cBa], white, 2);
const child5 = createBox(zC, [cBa], white, 2);
const child6 = createBox(zC, [cBb, cBa], white, 3);

const child13 = createBox(zC, [cBa, cBb], white,4);
const child14 = createBox(zC, [cBa, cBb], white,4);
//  const child15 = createBox(zC, [cBa, cBb], red,5);
// const child16 = createBox(zC, [cBa, cBb], red,5);


//  const child7 = createBox(zC, [cBb], white,6);
// const child8 = createBox(zC, [cBb], white,6);
// const child9 = createBox(zC, [cBb], white,6);
// const child10 = createBox(zC, [cBb], white,6);

// const child17 = createBox(zC, [cBb], white,7);
// const child18 = createBox(zC, [cBb], white,8);
// const child19 = createBox(zC, [cBb], white,8);
// const child110 = createBox(zC, [cBb], white,9);





const child03 = createBox(zD, [child3], white, 10);
const child04 = createBox(zD, [child3], white, 10);
const child05 = createBox(zD, [child3,child13], white,11);
const child06 = createBox(zD, [child3,child13], white,11);


const child013 = createBox(zD, [child13,child3], white,11);
const child014 = createBox(zD, [child13,child3], white,11);
const child015 = createBox(zD, [child13,child3], white,11);
// const child016 = createBox(zD, [child13], red,10);


// const child07 = createBox(zD, child7, white);
// const child08 = createBox(zD, child7, white);
// const child09 = createBox(zD, child7, white);
// const child010 = createBox(zD, child7, white);

// const child017 = createBox(zD, child17, white);
// const child018 = createBox(zD, child17, white);
// const child019 = createBox(zD, child17, white);
// const child0110 = createBox(zD, child17, white);



// for (let i = 0; i < 20; i++) {
//   createBox(zE, child0110, white);
// }


updateInitPositions();

});
