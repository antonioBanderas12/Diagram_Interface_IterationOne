import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from "gsap";
import * as functions from './functions.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Group, TextureLoader } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';


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

   //const controls = new OrbitControls(camera, renderer.domElement);

  // Lighting
  // const dLFront = new THREE.DirectionalLight(0xffffff, 1);
  // dLFront.position.set(0, 0, 10);
  // scene.add(dLFront);

  // const dLLeft = new THREE.DirectionalLight(0xffffff, 1);
  // dLLeft.position.set(10, 0, 0);
  // scene.add(dLLeft);


  // const light = new THREE.AmbientLight( 0x404040 );
  // scene.add(light);

  // const dLFront = new THREE.DirectionalLight(0xffffff, 1);
  // dLFront.position.set(0, 10, 10);
  // scene.add(dLFront);

  // const dLFront = new THREE.DirectionalLight(0xffffff, 1);
  // dLFront.position.set(0, 10, 10);
  // scene.add(dLFront);



  const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Higher intensity for brighter illumination
  scene.add(ambientLight);
  
  // Optionally, add hemisphere light for subtle shading
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // Sky and ground light
  scene.add(hemisphereLight);



  //Variables

  const boxSize = 5;
  let targetPosition = new THREE.Vector3();
  let currentLookAt = new THREE.Vector3(0, 0, 0);  // Camera focus point
  const boxes = [];
  let hoveredCube = null;
  let structure = 0;
  let relations = 1;
  let explore = true;
  let statusList = [[]];
  let boundings = [];
  let clickedCube = null;

  // Add this at the beginning to initialize the HTML container
  // const clickedCubeInfoContainer = document.createElement('div');
  // clickedCubeInfoContainer.id = 'clicked-cube-info';
  // clickedCubeInfoContainer.style.cssText = `
  //   position: fixed;
  //   top: 10px;
  //   right: 10px;
  //   background: rgba(0, 0, 0, 0.7);
  //   color: white;
  //   padding: 10px;
  //   font-family: Arial, sans-serif;
  //   font-size: 14px;
  //   z-index: 1000;
  // `;
  // clickedCubeInfoContainer.innerText = 'None'; // Initial text
  // document.body.appendChild(clickedCubeInfoContainer);


  const clickedCubeInfoContainer = document.getElementById('clicked-cube-info');




    let mode = structure;
    let currentGroup = null;
    const reverseButton = document.getElementById('reverseButton');

    const white = 0xFFFFFF; 
    const red = 0xFF0000;
    const blue = 0x0000FF;
    const green = 0x00FF00;
    const black = 0x000000;


  

// bigCube
  const bigCubeSize = 150; // Size of the big cube
  const bigCubeGeometry = new THREE.BoxGeometry(bigCubeSize, bigCubeSize, bigCubeSize);
  const bigCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
  const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
  scene.add(bigCube);  





//createBoxes
function createBox(name, description, status, group = null) {

let colour = white;

  // let colour = generateRandomColor();
  // while (statusList.some(entry => entry[1] === colour)) {
  //   colour = generateRandomColor(); // Keep generating until a unique color is found
  // }
  // if (!statusList.some(entry => entry[0] === status)) {
  //   statusList.push([status, colour]);
  // }



   const geometry = new THREE.BoxGeometry(boxSize, boxSize, 5);
   const material = new THREE.MeshStandardMaterial({ color: colour, transparent: true,opacity: 1, wireframe: true });
   const cube = new THREE.Mesh(geometry, material);



  cube.userData.group = group;
  cube.userData.children = [];
  cube.userData.parents = [];
  cube.userData.name = name;
  cube.userData.description = description;
  cube.userData.status = status;
  cube.userData.relations=[]
  cube.userData.level = 0;
  cube.userData.outline = null;
  cube.userData.boundBox = null;
  cube.userData.colour = colour;
  // scene.add(cube);
  boxes.push(cube);
  return cube;
}









// enhanceBox
function enhanceBox(name, parentReferences = [], relations = [[]]) {
  let cube = boxes.find(box => box === name);

  const loader = new FontLoader();

  loader.load('src/courierPrime.json', function (font) {
    // Create text geometry
    const textGeometry = new TextGeometry(cube.userData.name, {
      font: font,
      size: boxSize / 2,
      height: 0.2,
      curveSegments: 12,
    });

    cube.geometry.dispose();
    cube.geometry = textGeometry;
    cube.material.transparent = false;
    cube.material.wireframe = false; 
    cube.geometry.center();

    // Create bounding box
    // const boundingGeometry = new THREE.BoxGeometry(boxSize * 1.5, boxSize * 1.5, boxSize * 1.5); // Expand the size as needed
    // const boundingMaterial = new THREE.MeshBasicMaterial({
    //   transparent: true,
    //   wireframe: true,
    //   opacity: 0,
    // }); // Fully transparent
    // const boundBox = new THREE.Mesh(boundingGeometry, boundingMaterial);
    
    const textBoundingBox = new THREE.Box3().setFromObject(cube); // Calculate bounding box for the text
    const size = new THREE.Vector3();
    textBoundingBox.getSize(size); // Get dimensions of the bounding box


    const boundingGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const boundingMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      wireframe: true,
      opacity: 0,
    }); // Fully transparent by default
    const boundBox = new THREE.Mesh(boundingGeometry, boundingMaterial);

    boundBox.position.copy(cube.position); // Match position with the cube
    boundBox.userData = { isBoundingBox: true, parentCube: cube }; // Attach reference to the original cube
  
    scene.add(boundBox);
    boundings.push(boundBox);
    
    cube.userData.boundBox = boundBox;

  });




    cube.userData.parents = parentReferences;

    let zLevel = 0;
    if (parentReferences === null) {
      zLevel = 0;

    } else if (parentReferences.length > 0) {
      const parent = parentReferences[0]
      if(parent === null){
        zLevel = 0; // Place 25 units behind the parent
      }
    else{
      zLevel = parent.userData.level - 25; // Place 25 units behind the parent
    }
    }

    cube.userData.level = zLevel;

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


    if (Array.isArray(relations)) {
      relations.forEach(relation => {
          if (!Array.isArray(relation) || relation.length !== 2) {
              return;
          }
          const [entity, description] = relation;
          if (!entity || !description) {
              return;
          }
          cube.userData.relations.push([entity, description]);
          entity.userData.relations.push([cube, description]);
      });
  }

    scene.add(cube);

    return cube;
    
}






  // Click detection and navigation
  const raycaster = new THREE.Raycaster();
  raycaster.params.Mesh.threshold = 1.5; // Adjust threshold (default is 0)
  const mouse = new THREE.Vector2();

  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove, false);
  function onClick(event) {
    if(mode === structure && explore){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    //const visibleBoxes = boxes.filter(box => box.visible);
    //const intersects = raycaster.intersectObjects(visibleBoxes);


    const intersects = raycaster.intersectObjects(boundings);

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;
  
      if (clickedObject.userData.isBoundingBox) {
        clickedObject = clickedObject.userData.parentCube;
      }


    if(clickedObject.visible){

      updateCurrentGroup(clickedObject.userData.group)
      clickedCube = clickedObject;
      clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;


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
   }else{
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    //const visibleBoxes = boxes.filter(box => box.visible);
    //const intersects = raycaster.intersectObjects(visibleBoxes);


    const intersects = raycaster.intersectObjects(boundings);

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;
  
      if (clickedObject.userData.isBoundingBox) {
        clickedObject = clickedObject.userData.parentCube;
      }


    if(clickedObject.visible){
      updateCurrentGroup(clickedObject.userData.group)
      clickedCube = clickedObject;
      clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;

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
    let structureBoxes = hiddenBoxes.filter(box => box.userData.group !== "extraElement");
    structureBoxes.forEach(cube => easeInBoxes(cube));

  });


// relations button
document.getElementById('relations').addEventListener('click', () => {
  relationsPos();
  explore = false;
  mode = relations;
  reverseButton.style.display = 'none';
  boxes.forEach(box => easeInBoxes(box));
  boxes.filter(box => box.userData.relations.length < 1 && box.userData.group !== "extraElement").forEach(box => box.visible = false);
  manNavigation();
  changeMode()
  });





// explore structure
  document.getElementById('explore').addEventListener('click', () => {
    
    if(mode === structure){
      structureExplorePos();
    setTimeout(() => {
      explorationView()
      boxes.forEach(box => box.visible = false);
      boxes.filter(box => box.userData.group === currentGroup && box.userData.group !== "extraElement").forEach(box => box.visible = true);
    }, 1000);

    setTimeout(() => {
      
    explore = true;
    reverseButton.style.display = 'block';

    // boxes.filter(box => box.userData.group === !currentGroup).forEach(box => easeOutBoxes(box));

  }, 1500);
} else if (mode === relations){
  relationsExplorePos();
  explorationView()


  explore = true;
}

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
    //const intersects = raycaster.intersectObjects(boxes);

  const intersects = raycaster.intersectObjects(boundings);

  if (intersects.length > 0) {
    let cube = intersects[0].object;

    if (cube.userData.isBoundingBox) {
      cube = cube.userData.parentCube;
    }
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
       cube.material.color.set(black);
      }
      
      const textContainer = document.getElementById('description-container');
      if (textContainer) {
        textContainer.innerText = cube.userData.description; // Set the text content
        textContainer.style.display = 'block'; // Ensure it's visible
      }
   }

   if (mode === structure && !explore) {
     createOutline(cube);
     cube.material.color.set(black);
     cube.userData.children?.forEach(child => {
      if(child !== null){
       createOutline(child)
       child.material.color.set(black);
       createLine(cube, child);
      }
   });
     cube.userData.parents?.forEach(parent => {
       if(parent !== null){
        createOutline(parent)
        parent.material.color.set(black);
         createLine(cube, parent);
       }
   });
   }


   if(mode === relations && !explore) {
     createOutline(cube);
     cube.material.color.set(black);
    cube.userData.relations?.forEach(([entity, description]) => {
      if (entity) {
        createOutline(entity);
        entity.material.color.set(black);
        createLine(cube, entity);
      }
    });
  }
  if(mode === relations && explore){
    createOutline(cube);
    cube.material.color.set(black);
    cube.userData.relations?.forEach(([entity, description]) => {
      if (entity) {
      createOutline(entity);
      entity.material.color.set(black);
      if(entity.visible && cube.visible){
        createLine(cube, entity);
      }
    }


    // Display the description as an HTML element
      const textContainer = document.getElementById('description-container');
      // if (textContainer) {
      //   textContainer.innerText = description; // Set the text content
      //   textContainer.style.display = 'block'; // Ensure it's visible
      // }


      if (textContainer) {
        textContainer.innerHTML = ''; // Clear existing content
        cube.userData.relations?.forEach(([entity, description]) => {
          if(entity.visible){
          createOutline(entity);
          if (entity.visible && cube.visible) {
            createLine(cube, entity);
          }
    
          // Append each description as a separate line
          const descriptionElement = document.createElement('div');
          descriptionElement.innerText = description;
          textContainer.appendChild(descriptionElement);
        }
        });
    
        textContainer.style.display = 'block'; // Ensure it's visible
      }

    })

  
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


function generateRandomColor() {
  // Generate a random hex color
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}



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
  if(mode === structure){
  const group = boxes.filter(child => child.userData.group === currentGroup);
  if (group.length === 0) return;
  


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





} else if (mode === relations) {
setTimeout(() => {
  let relat = boxes.filter(child => child.visible === true);
  if (relat.length === 0) return;

  const boundingBox = new THREE.Box3();
  relat.forEach(cube => boundingBox.expandByObject(cube));
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();
  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  let targetPos = new THREE.Vector3(center.x - distance, center.y, center.z);

  //Smoothly transition the camera position
  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    ease: "power2.inOut", // Smooth easing function
  });
}, 1000)
}

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

// function createOutline(cube, color = 0xF7E0C0) {
//   if (cube && !cube.userData.outline) {

//     const box = new THREE.Box3().setFromObject(cube);

//     // Get the dimensions of the bounding box
//     const size = new THREE.Vector3();
//     const center = new THREE.Vector3();
//     box.getSize(size);
//     box.getCenter(center);

//     // Create a BoxGeometry with the bounding box dimensions
//     const outlineGeometry = new THREE.BoxGeometry(size.x * 1.2, size.y * 1.2, size.z * 1.2);

//     const outlineMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, wireframe: true });
//    // const outlineGeometry = new THREE.BoxGeometry(boxSize * 1.2, boxSize * 1.2, boxSize * 1.2); // Slightly larger box
//     const outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
//     outlineCube.position.copy(cube.position);
//     scene.add(outlineCube);
//     cube.userData.outline = outlineCube;
//   }
// }




// function createOutline(cube, color = 0xF7E0C0) {
//   if (cube && !cube.userData.outline) {

//     const box = new THREE.Box3().setFromObject(cube);

//     // Get the dimensions of the bounding box
//     const size = new THREE.Vector3();
//     const center = new THREE.Vector3();
//     box.getSize(size);
//     box.getCenter(center);

//     // Create a rounded BoxGeometry
//     const roundedRadius = Math.min(size.x, size.y, size.z) * 1.5; // Adjust radius for rounding
//     const outlineGeometry = new THREE.BoxGeometry(size.x * 1.2, size.y * 1.2, size.z * 1.2, 10, 10, 10); // Add segments for smooth corners
//     const outlineMaterial = new THREE.MeshBasicMaterial({
//       color,
//       side: THREE.BackSide,
//       transparent: true,
//       opacity: 0.5, // Make it slightly transparent
//     });

//     // Create the outline mesh
//     const outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
//     outlineCube.position.copy(cube.position);
//     scene.add(outlineCube);

//     // Save the outline for later removal
//     cube.userData.outline = outlineCube;

//     // Add glow or extra effect if desired
//     // const glowMaterial = new THREE.MeshBasicMaterial({
//     //   color,
//     //   transparent: true,
//     //   opacity: 0.2,
//     // });
//     // const glowGeometry = new THREE.BoxGeometry(size.x * 1.4, size.y * 1.4, size.z * 1.4);
//     // const glowCube = new THREE.Mesh(glowGeometry, glowMaterial);
//     // glowCube.position.copy(cube.position);
//     // scene.add(glowCube);
//     // cube.userData.glow = glowCube;
//   }
// }



// function createOutline(cube, color = 0xF7E0C0) {
//   if (cube && !cube.userData.outline) {
//     const box = new THREE.Box3().setFromObject(cube);

//     // Get the dimensions of the bounding box
//     const size = new THREE.Vector3();
//     const center = new THREE.Vector3();
//     box.getSize(size);
//     box.getCenter(center);

//     // Create Rounded BoxGeometry
//     const roundedRadius = 50//Math.min(size.x, size.y, size.z) * 200; // Radius for rounded edges
//     const outlineGeometry = new RoundedBoxGeometry(
//       size.x * 1.2,
//       size.y * 1.2,
//       size.z * 1.2,
//       roundedRadius,
//       8 // Number of segments for smooth rounding
//     );

//     const outlineMaterial = new THREE.MeshBasicMaterial({
//       color,
//       side: THREE.BackSide,
//       transparent: true,
//       opacity: 0.5,
//     });

//     const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
//     outlineMesh.position.copy(cube.position);
//     scene.add(outlineMesh);

//     // Save the outline for later removal
//     cube.userData.outline = outlineMesh;
//   }
// }


function createOutline(cube, color = 0xF7E0C0) {
  if (cube && !cube.userData.outline) {
    const box =  new THREE.Box3().setFromObject(cube);

    let factor = 0
    // Get the dimensions of the bounding box
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    if(mode === structure){
      factor = size.x
    }else if(mode === relations){
      factor = size.z
    }
    const outlineGeometry = new THREE.CircleGeometry(factor / 1.8);

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: false,
      opacity: 1,
    });

    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.copy(cube.position);
    scene.add(outlineMesh);

    // Save the outline for later removal
    cube.userData.outline = outlineMesh;

    if (mode === structure){
      outlineMesh.rotation.set(0, 0, 0);
    }
    else if(mode === relations){
      outlineMesh.rotation.set(0, - (Math.PI / 2), 0);
    }
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
    cube.material.color.set(cube.userData.colour);
    removeLines(cube);

    cube.userData.children?.forEach(child => {
      if(child){
        removeOutline(child)
        child.material.color.set(cube.userData.colour);
        removeLines(child);
      }
  });
    cube.userData.parents?.forEach(parent => {
      if(parent){
        removeOutline(parent)
        parent.material.color.set(cube.userData.colour);
        removeLines(parent);
      }
  });

  cube.userData.relations?.forEach(([entity, description]) => {
    if (entity) {
      removeOutline(entity);
      entity.material.color.set(cube.userData.colour);
      removeLines(entity);
    }
  });

  //text container
    const textContainer = document.getElementById('description-container');
    if (textContainer) {
      textContainer.style.display = 'none';
      textContainer.innerText = ''; // Clear the content
    }
  
  }
}



// positions

// structure
function structurePos() {
  setTimeout(() => {


//rotation
    boxes.forEach(cube => {
      cube.rotation.set(0, 0, 0);
      cube.userData.boundBox.rotation.set(0, 0, 0);
    });
  

//levelSpacing
    const levelSpacing = 25; // Distance between levels (y-axis)
    const groupSpacing = 50; // Distance between groups within a level (x-axis)
    const boxSpacing = 7;    // Distance between boxes within a cluster (x-axis)

    // Set z-position to the front face of the big cube
    const zFrontFace = bigCubeSize / 2;

    const levels = {};


    let structureBoxes = boxes.filter(box => box.userData.group !== "extraElement");
  
    let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement");
    notStructureBoxes.forEach(cube => {cube.visible = false;});


    structureBoxes.forEach(cube => {
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

        // cube.userData.boundBox.set(x,y,z)
        
          // Animate the cube's position
          gsap.to(cube.position, {
            duration: 1,
            x: x,
            y: y,
            z: z,
            ease: "power2.inOut",
            onUpdate: () => {
              // Update bounding box after the position is updated

              boxes.forEach(box => {
                box.userData.boundBox.position.copy(box.position);
              })   
            }
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

//rotation
boxes.forEach(cube => {
  cube.rotation.set(0, 0, 0);
  cube.userData.boundBox.rotation.set(0, 0, 0);

});


  const levels = {};


  let structureBoxes = boxes.filter(box => box.userData.group !== "extraElement");
  
  let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement");
  notStructureBoxes.forEach(cube => {cube.visible = false;});



  structureBoxes.forEach(cube => {
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
          onUpdate: () => { 
              boxes.forEach(box => {
                box.userData.boundBox.position.copy(box.position);
              })   
           }
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
  
  // roteteCubes
  boxes.forEach(cube => {
    cube.rotation.set(0, - (Math.PI / 2), 0);
    cube.userData.boundBox.rotation.set(0, - (Math.PI / 2), 0);

  });


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
        ease: "power2.inOut", 
        onUpdate: () => {
          boxes.forEach(box => {
            box.userData.boundBox.position.copy(box.position);
          })   
        }  // Smooth easing function
      });

      // Save the new position to avoid overlaps
      placedPositions.push({ x: randomX, y: randomY, z: randomZ });
    });
  });
}, 500);
}






function relationsExplorePos() {
  // rotation reset
  boxes.forEach(cube => {
    cube.rotation.set(0, - (Math.PI / 2), 0);
    cube.userData.boundBox.rotation.set(0, - (Math.PI / 2), 0);
  });
 
    //const groupCenterObject = boxes.find(cube => cube.userData.group === currentGroup);

    const groupCenterObject = clickedCube;



    if (!groupCenterObject) return;
    groupCenterObject.position.set(0, 0, 0);  // Center position
    const relatedObjects = [];

    groupCenterObject.userData.relations.forEach(([relatedCube]) => {
      if (relatedCube !== groupCenterObject && !relatedObjects.includes(relatedCube)) {
        relatedObjects.push(relatedCube);
      }
    })

    const radius = 50;  // The radius of the circle around the center
    const angleIncrement = (2 * Math.PI) / relatedObjects.length;

    relatedObjects.forEach((relatedCube, index) => {
      const angle = angleIncrement * index;
      const x = 0;
      const z = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      gsap.to(relatedCube.position, {
        duration: 1,
        x: x,
        y: y,
        z: z,
        ease: "power2.inOut",
        onUpdate: () => {
          boxes.forEach(box => {
           box.userData.boundBox.position.copy(box.position);
          })   
        } 
      });
    });

    boxes.forEach(cube => {cube.visible = false});
    groupCenterObject.visible = true;
    relatedObjects.forEach(cube => cube.visible = true);
}









  // Animation loop
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    if(mode === structure && explore){ //mode === structure &&
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






// const cA = createBox(null);  // Top-level box (Primordial Deities)
// scene.add(cA);




const cA = createBox(
  "cA",
  "",
  "0",
  ""
);

const chaos = createBox(
  "Chaos",
  "The primeval void from which everything in existence sprang. Represents the initial state of emptiness before creation.",
  "1",
  "1"
);

const gaia = createBox(
  "Gaia",
  "Personification of the Earth and the mother of all life. She gave birth to the Titans, giants, and other primordial beings.",
  "2",
  "Uranus, Pontus"
);



const nyx = createBox(
  "Nyx",
  "",
  "3",
  "extraElement",
);

const uranus = createBox(
  "uranus",
  "",
  "3",
  "extraElement",
);

const tartarus = createBox(
  "tartarus",
  "",
  "3",
  "extraElement",
);



enhanceBox(cA, [null],[[]]);

enhanceBox(chaos, [cA], [
  [nyx, "Generated Nyx, the goddess of night, who embodies the darkness of the void."]
])

enhanceBox(gaia, [chaos], [
    [uranus, "Worked with Uranus to create the first generations of Titans and orchestrated his downfall when he imprisoned their children."]
     ,[nyx, "Generated Nyx, the goddess of night, who embodies the darkness of the void."]
])

enhanceBox(nyx, [null],[[]]);

enhanceBox(uranus, [null],[[]]);

enhanceBox(tartarus, [null],[[]]);









// const chaos = createBox(
//   "Chaos",
//   "The primeval void from which everything in existence sprang. Represents the initial state of emptiness before creation.",
//   "Immortal",
//   [cA],
//   [
//     [gaia, "Brought forth Gaia, who personifies the Earth and gives structure to the cosmos."],
//     [nyx, "Generated Nyx, the goddess of night, who embodies the darkness of the void."]
//   ],
//   "The source of all creation in Greek mythology.",
//   ""
// );

// const gaia = createBox(
//   "Gaia",
//   "Personification of the Earth and the mother of all life. She gave birth to the Titans, giants, and other primordial beings.",
//   "Immortal",
//   [chaos],
//   [
//     [uranus, "Worked with Uranus to create the first generations of Titans and orchestrated his downfall when he imprisoned their children."],
//     [tartarus, "Conspired with Tartarus to imprison the giants and other rebellious beings."]
//   ],
//   "Mother of the Titans and many other primordial deities.",
//   "Uranus, Pontus"
// );

// const uranus = createBox(
//   "Uranus",
//   "Personification of the sky and the heavens. Known for fathering the Titans with Gaia.",
//   "Immortal",
//   [gaia],
//   [
//     [cronus, "Was overthrown and castrated by his son Cronus, fulfilling a prophecy foretold by Gaia."]
//   ],
//   "Locked his children away, leading to his downfall.",
//   "Oceanus, Coeus, Crius, Hyperion, Iapetus, Theia, Rhea, Themis, Mnemosyne, Phoebe, Tethys, Cronus"
// );

// const cronus = createBox(
//   "Cronus",
//   "The youngest of the Titans who overthrew his father Uranus. Known as the god of time and the harvest.",
//   "Immortal",
//   [uranus, gaia],
//   [
//     [zeus, "Was defeated by Zeus in the Titanomachy, the great war between the Titans and the Olympian gods."],
//     [rhea, "Tricked by Rhea into swallowing a stone instead of Zeus, which led to his eventual downfall."]
//   ],
//   "Swallowed his children to prevent them from overthrowing him.",
//   "Oceanus, Coeus, Crius, Hyperion, Iapetus, Theia, Rhea, Themis, Mnemosyne, Phoebe, Tethys"
// );

// const rhea = createBox(
//   "Rhea",
//   "Titaness of fertility, motherhood, and generation. Known as the mother of the Olympian gods.",
//   "Immortal",
//   [uranus, gaia],
//   [
//     [zeus, "Saved Zeus from being swallowed by Cronus by hiding him on Crete and later helped him overthrow Cronus."]
//   ],
//   "Protected her children from Cronus by hiding Zeus.",
//   "Oceanus, Coeus, Crius, Hyperion, Iapetus, Theia, Themis, Mnemosyne, Phoebe, Tethys, Cronus"
// );

// const nyx = createBox(
//   "Nyx",
//   "Primordial goddess of the night. Known for her power and mysterious nature.",
//   "Immortal",
//   [chaos],
//   [
//     [erebus, "Together with Erebus, she gave birth to many deities representing cosmic forces, such as Hypnos and Thanatos."],
//     [zeus, "Even Zeus, the king of the gods, feared her immense power and mystery."]
//   ],
//   "A powerful goddess who even Zeus feared.",
//   ""
// );

// const erebus = createBox(
//   "Erebus",
//   "Primordial deity representing darkness and shadow. One of the first entities to emerge from Chaos.",
//   "Immortal",
//   [chaos],
//   [
//     [nyx, "Partnered with Nyx to produce deities of sleep, death, and other abstract forces."]
//   ],
//   "Embodies the deep darkness of the underworld.",
//   ""
// );

// const tartarus = createBox(
//   "Tartarus",
//   "Primordial deity and the deep abyss used as a dungeon for the Titans and a place of punishment.",
//   "Immortal",
//   [chaos],
//   [
//     [zeus, "Provided a prison for Zeus to imprison the defeated Titans after the Titanomachy."]
//   ],
//   "Both a deity and a place of imprisonment beneath the underworld.",
//   ""
// );

// const pontus = createBox(
//   "Pontus",
//   "Primordial god of the sea. Represents the seas before Poseidon.",
//   "Immortal",
//   [gaia],
//   [
//     [nereus, "Fathered Nereus, the wise 'Old Man of the Sea,' known for his truthfulness and prophetic abilities."]
//   ],
//   "Father of sea deities and creatures.",
//   ""
// );

// const zeus = createBox(
//   "Zeus", 
//   "King of the gods, ruler of Mount Olympus, and god of the sky, weather, law, and order. Known for his thunderbolt and numerous affairs with mortals and goddesses.", 
//   "Immortal", 
//   [cronus, rhea], 
//   [
//     [hera, "Married to Hera, but their relationship was marked by conflict due to his many affairs."],
//     [cronus, "Led the Olympians in the Titanomachy to overthrow Cronus and the Titans."],
//     [tartarus, "Imprisoned the Titans in Tartarus after his victory."]
//   ], 
//   "Father of many gods and heroes through various relationships.", 
//   "Hestia, Demeter, Poseidon, Hades, Hera"
// );


// const hera = createBox(
//   "Hera", 
//   "Queen of the gods and goddess of marriage, women, childbirth, and family. Known for her jealousy and protection of married women.", 
//   "Immortal", 
//   [cronus, rhea], 
//   [
//     [zeus, "Wife of Zeus, frequently punishes his lovers and their offspring out of jealousy."],
//     [heracles, "Tormented Heracles throughout his life because he was a son of Zeus and a mortal woman."],
//     [paris, "Instigated the Trojan War by seeking revenge on Paris for not naming her the fairest goddess."]
//   ], 
//   "Known for her fierce loyalty and vengeance against Zeus's lovers and offspring.", 
//   "Zeus, Poseidon, Hades, Demeter, Hestia"
// );

// const poseidon = createBox(
//   "Poseidon", 
//   "God of the sea, earthquakes, storms, and horses. Known for his volatile temperament and rivalry with other gods.", 
//   "Immortal", 
//   [cronus, rhea], 
//   [
//     [athena, "Competed with Athena for the patronage of Athens, losing when she offered the olive tree."],
//     [odysseus, "Punished Odysseus by making his journey home arduous after the hero blinded his son, the Cyclops Polyphemus."],
//     [apollo, "Worked with Apollo to build the walls of Troy, later seeking revenge when they were not paid for their labor."]
//   ], 
//   "Often depicted with a trident and associated with sea creatures.", 
//   "Zeus, Hades, Hera, Demeter, Hestia"
// );

// const hades = createBox(
//   "Hades", 
//   "God of the underworld and the dead. Rules over the souls of the departed and guards the treasures of the earth.", 
//   "Immortal", 
//   [cronus, rhea], 
//   [
//     [persephone, "Abducted Persephone to be his queen, leading to the creation of the seasons."],
//     [heracles, "Allowed Heracles to borrow his watchdog Cerberus as part of the hero's Twelve Labors."],
//     [orpheus, "Made a rare concession by allowing Orpheus to try to rescue his wife Eurydice from the underworld."]
//   ], 
//   "Rarely leaves the underworld, known for his stern and just nature.", 
//   "Zeus, Poseidon, Hera, Demeter, Hestia"
// );

// const athena = createBox(
//   "Athena", 
//   "Goddess of wisdom, war, strategy, and crafts. Known for her intelligence, fairness, and role as a protector of cities.", 
//   "Immortal", 
//   [zeus], 
//   [
//     [poseidon, "Defeated Poseidon in a contest to become the patron of Athens by offering the olive tree."],
//     [odysseus, "Guided and protected Odysseus during his long journey home from the Trojan War."],
//     [arachne, "Turned the mortal Arachne into a spider for her hubris in a weaving contest."]
//   ], 
//   "Sprang fully formed and armored from Zeus's head.", 
//   ""
// );

// const aphrodite = createBox(
//   "Aphrodite", 
//   "Goddess of love, beauty, pleasure, and desire. Born from the sea foam and known for her irresistible charm.", 
//   "Immortal", 
//   [cA], 
//   [
//     [ares, "Had a long-standing affair with Ares, the god of war, despite being married to Hephaestus."],
//     [paris, "Influenced Paris to choose her as the fairest goddess by promising him Helen, leading to the Trojan War."],
//     [pygmalion, "Brought the statue crafted by Pygmalion to life as the woman Galatea."]
//   ], 
//   "Her beauty caused conflicts among gods and mortals alike.", 
//   ""
// );

// const heracles = createBox(
//   "Heracles", 
//   "Demigod hero known for his extraordinary strength and courage. Famous for completing the Twelve Labors.", 
//   "Demigod", 
//   [zeus, alcmene], 
//   [
//     [hera, "Suffered relentless persecution from Hera, who sought to destroy him."],
//     [cerberus, "Captured Cerberus, the three-headed guard dog of the underworld, as one of his Twelve Labors."],
//     [eurystheus, "Served King Eurystheus, who assigned him the Twelve Labors as penance."]
//   ], 
//   "A symbol of perseverance and redemption through heroic feats.", 
//   ""
// );

// const achilles = createBox(
//   "Achilles", 
//   "Greek hero of the Trojan War, renowned for his strength, bravery, and near invincibility, except for his heel.", 
//   "Mortal", 
//   [peleus, thetis], 
//   [
//     [patroclus, "Fought alongside his close companion Patroclus, whose death spurred his rage."],
//     [hector, "Killed Hector in revenge for Patroclus's death and desecrated his body."],
//     [agamemnon, "Quarreled with Agamemnon over the prize Briseis, leading to his temporary withdrawal from battle."]
//   ], 
//   "Central figure of the Iliad, driven by rage and honor.", 
//   ""
// );

// const odysseus = createBox(
//   "Odysseus", 
//   "King of Ithaca, famed for his cunning intellect and resourcefulness. Hero of the Odyssey and the Trojan War.", 
//   "Mortal", 
//   [laertes, anticleia], 
//   [
//     [poseidon, "Angered Poseidon by blinding his son Polyphemus, causing a long and arduous journey home."],
//     [athena, "Protected and guided by Athena, who admired his cleverness."],
//     [circe, "Spent a year with the enchantress Circe, who initially turned his men into swine."]
//   ], 
//   "Endured a decade-long journey to return home after the Trojan War.", 
//   ""
// );

// const nereus = createBox(
//   "Nereus",
//   "Primordial sea god known as the 'Old Man of the Sea.' Renowned for his truthfulness and gift of prophecy.",
//   "Immortal",
//   [pontus, gaia],
//   [
//     [heracles, "Assisted Heracles by revealing the location of the golden apples during the hero's quest."],
//     [thetis, "Father of Thetis, a sea nymph and mother of Achilles."]
//   ],
//   "Shape-shifting sea god who aids heroes with his wisdom and knowledge.",
//   ""
// );





















//  const Gaia = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA],[], 1);
//  const Gaia2 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA], [Gaia], 1);
//  const Gaia3 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2], 2);
//  const Gaia4 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2],2);
//  const Gaia5 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2, Gaia], [Gaia2], 3);
//  const Gaia6 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
//  const Gaia7 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
//  const Gaia12 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [cA], [Gaia], 1);
//  const Gaia13 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2], 2);
//  const Gaia14 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2], [Gaia2],2);
//  const Gaia51 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia2, Gaia], [Gaia2], 3);
//  const Gaia16 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);
//  const Gaia17 = createBox("Gaia", "Primordial goddess of the Earth.", "Primordial Deity", [Gaia], [Gaia2],4);


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

setTimeout(() => {
  
  structureExplorePos();

}, 1000)

});
