import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from "gsap";
//import * as functions from './functions.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Group, TextureLoader } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';


document.addEventListener('DOMContentLoaded', function() {

  //setup
  const scene = new THREE.Scene();


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




    let mode = structure;
    let currentGroup = null;

    //buttons
    const reverseButton = document.getElementById('reverseButton');
    const exploreButton = document.getElementById('explore');
    const structureButton = document.getElementById("structure");
    const relationsButton = document.getElementById("relations");
    const clickedCubeInfoContainer = document.getElementById('clicked-cube-info');


    const white = 0xFFFFFF; 
    const red = 0xFF0000;
    const blue = 0x0000FF;
    const green = 0x00FF00;
    const black = 0x000000;


  

// bigCube
  const bigCubeSize = 150; // Size of the big cube
  const bigCubeGeometry = new THREE.BoxGeometry(bigCubeSize, bigCubeSize, bigCubeSize);
  const bigCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, transparent: true, opacity: 0 });
  const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
  scene.add(bigCube);  





//createBoxes
function createBox(name, description, status) {

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


  //cube.userData.group = group;

  cube.userData.group = null;


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
function enhanceBox(name, parentes = [], relations = [[]]) {
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
    
    const textBoundingBox = new THREE.Box3().setFromObject(cube); // Calculate bounding box for the text
    const size = new THREE.Vector3();
    textBoundingBox.getSize(size); // Get dimensions of the bounding box


    const boundingGeometry = new THREE.BoxGeometry(size.x *1.5, size.y *1.5, size.z *1.5);
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


  // if(parentReferences.length < 1){
  //   cube.userData.parents = [cA];
  // }else{
  //   cube.userData.parents = parentReferences;
  // }


  let parentReferences = [];

  parentes.forEach(parent => {
    if (parent) {
      parentReferences.push(parent);
    }
  })
    

    cube.userData.parents = parentReferences;

    //group
    const parentReferencesString = parentReferences.map(parent => parent?.userData?.name || 'extraElement').join(', ');
    cube.userData.group = parentReferencesString;




    //z-levels
    //let zLevel = 0;
    // if (parentReferences === null) {
    //   zLevel = 0;

    // } else if (parentReferences.length > 0) {
    //   const parent = parentReferences[0]
    //   if(parent === null){
    //     zLevel = 0;
    //   }
    // else{
    //   zLevel = parent.userData.level - 25; // Place 25 units behind the parent
    // }
    // }

    // cube.userData.level = zLevel;



// Calculate z-level for the current cube
let zLevel = 0;

if (parentReferences && parentReferences.length > 0) {
    // Find the maximum level among all parents
    const maxParentLevel = Math.max(
        ...parentReferences.map(parent => (parent?.userData?.level ?? 0))
    );
    // Set the child's level to one step lower than the highest parent
    zLevel = maxParentLevel + 25;
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
      exploreButton.innerText = `Explore ${clickedObject.userData.name || 'Unnamed Cube'}`;
      //clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;


      const children = clickedObject.userData.children;

      let groupBoxes =[];
      children.forEach(box => {
          if (!groupBoxes.includes(box.userData.group)) {
            groupBoxes.push(box.userData.group);
          }
        });

      if(children.length === 0) return;

      if (groupBoxes.length  === 1) {
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
      exploreButton.innerText = `Explore ${clickedObject.userData.name || 'Unnamed Cube'}`;
      //clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;

    }
   }
  }
}














  


//changeMode

// structure button
document.getElementById('structure').addEventListener('click', () => {
    explore = false;
    mode = structure;

    structurePos();
    reverseButton.style.display = 'none';

    //exploreButton.style.display = 'block';
    const rect = structureButton.getBoundingClientRect();
    exploreButton.style.top = `${rect.bottom + 10}px`; // 10px gap below the active button
    exploreButton.style.left = `${rect.left + rect.width / 2 }px`; //- exploreButton.offsetWidth / 2



    manNavigation();
    changeMode()

    let hiddenBoxes = boxes.filter(box => !box.visible);
    let structureBoxes = hiddenBoxes.filter(box => (box.userData.children.length > 0 || box.userData.parents.length > 0))
    structureBoxes.forEach(cube => easeInBoxes(cube));

    let notstructureBoxes = boxes.filter(box => (box.userData.children.length < 1 && box.userData.parents.length < 1))
    notstructureBoxes.forEach(cube =>  easeOutBoxes(cube));
    //easeOutBoxes(cube)


//hellohello

  });


// relations button
document.getElementById('relations').addEventListener('click', () => {
  relationsPos();
  explore = false;
  mode = relations;
  reverseButton.style.display = 'none';

  const rect = relationsButton.getBoundingClientRect();
  exploreButton.style.top = `${rect.bottom + 10}px`; // 10px gap below the active button
  exploreButton.style.left = `${rect.left + rect.width / 2 }px`; //- exploreButton.offsetWidth / 2


  boxes.forEach(box => easeInBoxes(box));
  boxes.filter(box => box.userData.relations.length < 1 ).forEach(box => box.visible = false); //&& box.userData.group !== "extraElement"
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

        let strucExploreBoxes = boxes.filter(box => box.userData.group === currentGroup && (box.userData.children.length > 0 || box.userData.parents.length > 0));

        strucExploreBoxes.forEach(box => box.visible = true); //(box.userData.group !== "extraElement"))
      
      
      
      
      
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
      if(parent !== null){
      if (!parentGroups.includes(parent.userData.group)) {
        parentGroups.push(parent.userData.group);
      }
    } else return;
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
    groupButton.textContent = `Parents: ${group}`;  // Display the group number or name
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
        textContainer.innerText = cube.userData.name + ': ' + cube.userData.description; // Set the text content
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
          descriptionElement.innerText = entity.userData.name + ': ' + description;
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
//const axesHelper = new THREE.AxesHelper( 500 ); scene.add( axesHelper );
//addGridHelper(scene);



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
  let targetPos = new THREE.Vector3(center.x - distance, center.y-10, center.z);

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
    groupButton.textContent = `Parents: ${group}`;  // Display the group number or name
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
    const groupSpacing = 60; // Distance between groups within a level (x-axis)
    const boxSpacing = 20;    // Distance between boxes within a cluster (x-axis)

    // Set z-position to the front face of the big cube
    const zFrontFace = bigCubeSize / 2;

    const levels = {};


    let structureBoxes = boxes.filter(box => (box.userData.children.length > 0 || box.userData.parents.length > 0))//(box => box.userData.group !== "extraElement");
  
    let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement" && box.userData.children.length < 1);
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
  const boxSpacing = 15;    // Distance between boxes within a cluster

//rotation
boxes.forEach(cube => {
  cube.rotation.set(0, 0, 0);
  cube.userData.boundBox.rotation.set(0, 0, 0);

});


  const levels = {};


  // let structureBoxes = boxes.filter(box => box.userData.group !== "extraElement");
  
  // let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement");

  let structureBoxes = boxes.filter(box => box.userData.children.length > 0 || box.userData.parents.length > 0)//(box => box.userData.group !== "extraElement");
  
  let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement" && box.userData.children.length < 1);

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
  const cloudSpread = 40;     // Spread of cubes within each group
  const minDistance = 20;     // Minimum distance between cubes to avoid overlap
  const maxAttempts = 50;     // Max retries to find a non-overlapping position   // Assuming the big cube has a size of 100 units

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

    boxes.filter(cube => cube.userData.name === "cA").forEach(cube => {cube.visible = false});

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



//ca
const cA = createBox(
  "cA",
  "",
  "0"
);









const chaos = createBox(
  "Chaos",
  "The primeval void from which everything in existence sprang. Represents the initial state of emptiness before creation.",
  "Immortal"
);

const gaia = createBox(
  "Gaia",
  "Personification of the Earth and the mother of all life. She gave birth to the Titans, giants, and other primordial beings.",
  "Immortal"
);

const uranus = createBox(
  "Uranus",
  "Personification of the sky and the heavens. Known for fathering the Titans with Gaia.",
  "Immortal"
);

const cronus = createBox(
  "Cronus",
  "The youngest of the Titans who overthrew his father Uranus. Known as the god of time and the harvest.",
  "Immortal"
);

const rhea = createBox(
  "Rhea",
  "Titaness of fertility, motherhood, and generation. Known as the mother of the Olympian gods.",
  "Immortal"
);

const nyx = createBox(
  "Nyx",
  "Primordial goddess of the night. Known for her power and mysterious nature.",
  "Immortal"
);

const erebus = createBox(
  "Erebus",
  "Primordial deity representing darkness and shadow. One of the first entities to emerge from Chaos.",
  "Immortal"
);

const tartarus = createBox(
  "Tartarus",
  "Primordial deity and the deep abyss used as a dungeon for the Titans and a place of punishment.",
  "Immortal"
);

const pontus = createBox(
  "Pontus",
  "Primordial god of the sea. Represents the seas before Poseidon.",
  "Immortal"
);

const zeus = createBox(
  "Zeus", 
  "King of the gods, ruler of Mount Olympus, and god of the sky, weather, law, and order. Known for his thunderbolt and numerous affairs with mortals and goddesses.", 
  "Immortal"
);

const hera = createBox(
  "Hera", 
  "Queen of the gods and goddess of marriage, women, childbirth, and family. Known for her jealousy and protection of married women.", 
  "Immortal"
);

const poseidon = createBox(
  "Poseidon", 
  "God of the sea, earthquakes, storms, and horses. Known for his volatile temperament and rivalry with other gods.", 
  "Immortal"
);

const hades = createBox(
  "Hades", 
  "God of the underworld and the dead. Rules over the souls of the departed and guards the treasures of the earth.", 
  "Immortal"
);

const athena = createBox(
  "Athena", 
  "Goddess of wisdom, war, strategy, and crafts. Known for her intelligence, fairness, and role as a protector of cities.", 
  "Immortal"
);

const aphrodite = createBox(
  "Aphrodite", 
  "Goddess of love, beauty, pleasure, and desire. Born from the sea foam and known for her irresistible charm.", 
  "Immortal"
);

const heracles = createBox(
  "Heracles", 
  "Demigod hero known for his extraordinary strength and courage. Famous for completing the Twelve Labors.", 
  "Demigod"
);

// const achilles = createBox(
//   "Achilles", 
//   "Greek hero of the Trojan War, renowned for his strength, bravery, and near invincibility, except for his heel.", 
//   "Mortal"
// );

const odysseus = createBox(
  "Odysseus", 
  "King of Ithaca, famed for his cunning intellect and resourcefulness. Hero of the Odyssey and the Trojan War.", 
  "Mortal"
);

const nereus = createBox(
  "Nereus",
  "Primordial sea god known as the 'Old Man of the Sea.' Renowned for his truthfulness and gift of prophecy.",
  "Immortal"
);

const circe = createBox(
  "Circe",
  "Enchantress and sorceress, known for her ability to transform men into animals. Encountered by Odysseus during his travels.",
  "Mortal"
);

const apollo = createBox(
  "Apollo",
  "God of the sun, music, poetry, prophecy, and healing. Known for his beauty and wisdom.",
  "Immortal"
);

const ares = createBox(
  "Ares",
  "God of war and violence. Known for his bloodlust and quick temper.",
  "Immortal"
);


// helpers



// const alcmene = createBox(
//   "alcmene",
//   "",
//   "helperElement"
// );

// const peleus = createBox(
//   "peleus",
//   "",
//   "helperElement"
// );

// const thetis = createBox(
//   "thetis",
//   "",
//   "helperElement"
// );

// const laertes = createBox(
//   "laertes",
//   "",
//   "helperElement"
// );

// const anticleia = createBox(
//   "anticleia",
//   "",
//   "helperElement"
// );

// const helios = createBox(
//   "helios",
//   "",
//   "helperElement"
// );

// const leto = createBox(
//   "leto",
//   "",
//   "helperElement"
// );






const hector = createBox(
  "hector",
  "",
  "helperElement"
);


const eurystheus = createBox(
  "eurystheus",
  "",
  "helperElement"
);

const patroclus = createBox(
  "patroclus",
  "",
  "helperElement"
);

const agamemnon = createBox(
  "agamemnon",
  "",
  "helperElement"
);
const cerberus = createBox(
  "cerberus",
  "",
  "helperElement"
);

const pygmalion = createBox(
  "pygmalion",
  "",
  "helperElement"
);

const arachne = createBox(
  "arachne",
  "",
  "helperElement"
);

const orpheus = createBox(
  "orpheus",
  "",
  "helperElement"
);

const persephone = createBox(
  "persephone",
  "",
  "helperElement"
);

const paris = createBox(
  "paris",
  "",
  "helperElement"
);

const daphne = createBox(
  "daphne",
  "",
  "helperElement"
);

const asclepius = createBox(
  "asclepius",
  "",
  "helperElement"
);



enhanceBox(cA, [null],[[]])


enhanceBox(chaos, [cA], [
  [gaia, "Brought forth Gaia, who personifies the Earth and gives structure to the cosmos."],
  [nyx, "Generated Nyx, the goddess of night, who embodies the darkness of the void."]
]);

enhanceBox(gaia, [chaos], [
  [uranus, "Worked with Uranus to create the first generations of Titans and orchestrated his downfall when he imprisoned their children."],
  [tartarus, "Conspired with Tartarus to imprison the giants and other rebellious beings."]
]);

enhanceBox(uranus, [gaia], [
  [cronus, "Was overthrown and castrated by his son Cronus, fulfilling a prophecy foretold by Gaia."]
]);

enhanceBox(cronus, [uranus, gaia], [
  [zeus, "Was defeated by Zeus in the Titanomachy, the great war between the Titans and the Olympian gods."],
  [rhea, "Tricked by Rhea into swallowing a stone instead of Zeus, which led to his eventual downfall."]
]);

enhanceBox(rhea, [uranus, gaia], [
  [zeus, "Saved Zeus from being swallowed by Cronus by hiding him on Crete and later helped him overthrow Cronus."]
]);

enhanceBox(nyx, [chaos], [
  [erebus, "Together with Erebus, she gave birth to many deities representing cosmic forces, such as Hypnos and Thanatos."],
  [zeus, "Even Zeus, the king of the gods, feared her immense power and mystery."]
]);

enhanceBox(erebus, [chaos], [
  [nyx, "Partnered with Nyx to produce deities of sleep, death, and other abstract forces."]
]);

enhanceBox(tartarus, [chaos], [
  [zeus, "Provided a prison for Zeus to imprison the defeated Titans after the Titanomachy."]
]);

enhanceBox(pontus, [gaia], [
  [nereus, "Fathered Nereus, the wise 'Old Man of the Sea,' known for his truthfulness and prophetic abilities."]
]);

enhanceBox(zeus, [cronus, rhea], [
  [hera, "Married to Hera, but their relationship was marked by conflict due to his many affairs."],
  [cronus, "Led the Olympians in the Titanomachy to overthrow Cronus and the Titans."],
  [tartarus, "Imprisoned the Titans in Tartarus after his victory."]
]);

enhanceBox(hera, [cronus, rhea], [
  [zeus, "Wife of Zeus, frequently punishes his lovers and their offspring out of jealousy."],
  [heracles, "Tormented Heracles throughout his life because he was a son of Zeus and a mortal woman."],
  [paris, "Instigated the Trojan War by seeking revenge on Paris for not naming her the fairest goddess."]
]);

enhanceBox(poseidon, [cronus, rhea], [
  [athena, "Competed with Athena for the patronage of Athens, losing when she offered the olive tree."],
  [odysseus, "Punished Odysseus by making his journey home arduous after the hero blinded his son, the Cyclops Polyphemus."],
  [apollo, "Worked with Apollo to build the walls of Troy, later seeking revenge when they were not paid for their labor."]
]);

enhanceBox(hades, [cronus, rhea], [
  [persephone, "Abducted Persephone to be his queen, leading to the creation of the seasons."],
  [heracles, "Allowed Heracles to borrow his watchdog Cerberus as part of the hero's Twelve Labors."],
  [orpheus, "Made a rare concession by allowing Orpheus to try to rescue his wife Eurydice from the underworld."]
]);

enhanceBox(athena, [zeus], [
  [poseidon, "Defeated Poseidon in a contest to become the patron of Athens by offering the olive tree."],
  [odysseus, "Guided and protected Odysseus during his long journey home from the Trojan War."],
  [arachne, "Turned the mortal Arachne into a spider for her hubris in a weaving contest."]
]);

enhanceBox(aphrodite, [zeus], [
  [ares, "Had a long-standing affair with Ares, the god of war, despite being married to Hephaestus."],
  [paris, "Influenced Paris to choose her as the fairest goddess by promising him Helen, leading to the Trojan War."],
  [pygmalion, "Brought the statue crafted by Pygmalion to life as the woman Galatea."]
]);

enhanceBox(heracles, [zeus], [
  [hera, "Suffered relentless persecution from Hera, who sought to destroy him."],
  [cerberus, "Captured Cerberus, the three-headed guard dog of the underworld, as one of his Twelve Labors."],
  [eurystheus, "Served King Eurystheus, who assigned him the Twelve Labors as penance."]
]);

// enhanceBox(achilles, [nereus], [
//   [patroclus, "Fought alongside his close companion Patroclus, whose death spurred his rage."],
//   [hector, "Killed Hector in revenge for Patroclus's death and desecrated his body."],
//   [agamemnon, "Quarreled with Agamemnon over the prize Briseis, leading to his temporary withdrawal from battle."]
// ]);

enhanceBox(odysseus, [zeus], [
  [poseidon, "Angered Poseidon by blinding his son Polyphemus, causing a long and arduous journey home."],
  [athena, "Protected and guided by Athena, who admired his cleverness."],
  [circe, "Spent a year with the enchantress Circe, who initially turned his men into swine."]
]);

enhanceBox(nereus, [pontus, gaia], [
  [heracles, "Assisted Heracles by revealing the location of the golden apples of the Hesperides."]
]);

enhanceBox(circe, [zeus], [
  [odysseus, "Turned Odysseus's men into swine, though later helped them on their journey."]
]);

enhanceBox(apollo, [zeus], [
  [daphne, "Chased after the nymph Daphne, who transformed into a laurel tree to escape him."],
  [asclepius, "Fathered Asclepius, the god of medicine, who could even raise the dead."]
]);
enhanceBox(ares, [zeus, hera], [
  [aphrodite, "Had an affair with Aphrodite, despite her marriage to Hephaestus."]
]);


// helpers
// enhanceBox(alcmene, [null],[[]]);
// enhanceBox(peleus, [null],[[]]);
// enhanceBox(thetis, [null],[[]]);
// enhanceBox(laertes, [null],[[]]);
// enhanceBox(anticleia, [null],[[]]);
// enhanceBox(helios, [null],[[]]);
// enhanceBox(leto, [null],[[]]);

enhanceBox(paris, [null],[[]]);
enhanceBox(persephone, [null],[[]]);
enhanceBox(orpheus, [null],[[]]);
enhanceBox(arachne, [null],[[]]);
enhanceBox(pygmalion, [null],[[]]);
enhanceBox(cerberus, [null],[[]]);
enhanceBox(eurystheus, [null],[[]]);
enhanceBox(patroclus, [null],[[]]);
enhanceBox(hector, [null],[[]]);
enhanceBox(agamemnon, [null],[[]]);
enhanceBox(daphne, [null],[[]]);
enhanceBox(asclepius, [null],[[]]);

//console.log(paris)
//let notstructureBoxes = boxes.filter(box => (box.userData.children.length < 0 && box.userData.parents.length < 0))



// enhanceBox(paris, [chaos],[[]]);
// enhanceBox(persephone, [chaos],[[]]);
// enhanceBox(orpheus, [chaos],[[]]);
// enhanceBox(arachne, [chaos],[[]]);
// enhanceBox(pygmalion, [chaos],[[]]);
// enhanceBox(cerberus, [chaos],[[]]);
// enhanceBox(eurystheus, [chaos],[[]]);
// enhanceBox(patroclus, [chaos],[[]]);
// enhanceBox(hector, [chaos],[[]]);
// enhanceBox(agamemnon, [chaos],[[]]);
// enhanceBox(daphne, [chaos],[[]]);
// enhanceBox(asclepius, [chaos],[[]]);



// // for (let i = 0; i < 20; i++) {
// //   createBox(zE, child0110, white);
// // }

setTimeout(() => {
  
  structureExplorePos();

}, 1000)

});
