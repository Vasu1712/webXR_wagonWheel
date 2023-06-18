import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let container;
let camera, scene, renderer;
let controller;
let gltfLoader;
let controls;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
	
const loadGLTF = (path) => {
	return new Promise((resolve, reject) => {
	  const loader = new GLTFLoader();
	  loader.load(path, (gltf) => {
		resolve(gltf);
	  });
	});
};




let model_rendered=false;
gltfLoader = new GLTFLoader();




/*const CreateSphere = (x, y, z, color) => {
    const sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshBasicMaterial({ color: color })
    );
    sphereMesh.scale.set(0.1, 0.1, 0.1);
    sphereMesh.position.set(x, y, z);
    scene.add(sphereMesh);
  };

CreateSphere(0, -0.19, -0.5, "yellow"); //batsman position*/
// Logic for marking a boundary
// ===================== Logic for marking a boundary ======================
// if Batsman position (j,k) then
// x = radius*cos(t) + j
// y = radius*sin(t) + k

/*function loadModel() {

		if (reticle.visible) {
			gltfLoader.load(
				'static/Stadium_v2_1.glb', function (gltf) {
					const model = gltf.scene;
					model.position.copy(reticle.position);
					model.position.y-=0.2;
					model.position.z-=0.5;
					model.quaternion.copy(reticle.quaternion);
					model.scale.set(0.3, 0.3, 0.3);
					var box= new THREE.Box3();
					box.setFromObject(model);
				
					model.name="stadium";
					scene.add(model);
					
					model_rendered=true;
					drawWagonWheels(2,2,"red");
					// boundingBox(model); //Helper for callibrating Wagon Wheel
					
					controls.update();
					render();
	
					getPosition(model,reticle); //For getting model and reticle position
	
					},
						undefined,
						function (error) {
						console.error('Error loading model:', error);
					}
					);
					   }
		
		//return stadium;
	}
	*/

function drawWagonWheels(xVal, yVal, color) {
	// console.log("lneee.....");
	var numPoints = 100;
	//var start = new THREE.Vector3(51, 0, -45);
	// var start = new THREE.Vector3(0, -0.5, -0.5);
	var start = new THREE.Vector3(0, 0, 0);
	// var start = new THREE.Vector3(9, -0.19, -0.5); //yellow sphere coordinates
	// var middle = new THREE.Vector3(38, 0,-50);
	// var middle = new THREE.Vector3(38, 0, -55);
	// var end = new THREE.Vector3(yVal, 0, -xVal);
	let end = new THREE.Vector3(yVal, 0, -xVal);
  
	let points = [];
	for (let i = 0; i <= 50; i++) {
	  let p = new THREE.Vector3().lerpVectors(start, end, i / 50);
	  if (color == "0XEB6363") {
		p.y = p.y + 0.25 * Math.sin((Math.PI * i) / 50);
	  } else {
		p.y = p.y + 0.01 * Math.sin((Math.PI * i) / 50);
	  }
	  points.push(p);
	}
	let curve = new THREE.CatmullRomCurve3(points);
	// var curveQuad = new THREE.QuadraticBezierCurve3(start, middle, end);
  
	var tube = new THREE.TubeGeometry(curve, numPoints, 0.005, 100, false);
	var mesh = new THREE.Mesh(
	  tube,
	  new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
	  })
	);
  
	console.log("heree", mesh);
	mesh.scale.set(0.3, 0.3, 0.3);
	mesh.position.set(0, 0, 0);
	// mesh.position.set(-7, 5, -5);
	// mesh.rotation.x = Math.PI / 7;
	//mesh.name = "WagonWheels_" + name;
	mesh.material.color.setHex(color);

	// scene.add(mesh);
	const stadium = scene.getObjectByName("stadium");
	console.log(stadium);
	stadium.add(mesh);
	//_runStore.push(mesh); //1,2,3,4,6 buttons, used in displaylines
}



function boundingBox(model)
{
	//bounding box helper for the model
	const bbox = new THREE.Box3().setFromObject(model);

	// Calculating the dimensions
	const width = bbox.max.x - bbox.min.x;
	const height = bbox.max.y - bbox.min.y;
	const depth = bbox.max.z - bbox.min.z;

	// Printing the dimensions to the console
	console.log('Width:', width);
	console.log('Height:', height);
	console.log('Depth:', depth);
	console.log('Max X:', bbox.max.x);
	console.log('Max Y:', bbox.max.y);
	console.log('Max Z:', bbox.max.z);
	console.log('Min X:', bbox.min.x);
	console.log('Min Y:', bbox.min.y);
	console.log('Min Z:', bbox.min.z);
	// Create a bounding box helper to visualize the bounding box
	const bboxHelper = new THREE.Box3Helper(bbox, 0x0000ff); // Specify the color as the second parameter

	// Add the bounding box helper to the scene
	scene.add(bboxHelper);
	// Optionally, you can position the camera to view the entire scene
	const center = bbox.getCenter(new THREE.Vector3()); // Get the center of the bounding box
	const size = bbox.getSize(new THREE.Vector3()); // Get the size of the bounding box

	const maxDimension = Math.max(size.x, size.y, size.z); // Get the maximum dimension of the bounding box

	const fov = camera.fov * (Math.PI / 180); // Convert the camera's field of view to radians
	const cameraDistance = Math.abs(maxDimension / (2 * Math.tan(fov / 2))); // Calculate the distance based on the maximum dimension

	camera.position.copy(center); // Set the camera position to the center of the bounding box
	camera.position.z += cameraDistance; // Move the camera back by the calculated distance
	camera.lookAt(center); // Point the camera at the center of the bounding box
 
}

function getPosition(model,reticle)
{
	const modelPosition = model.position;
	console.log('model postion:', modelPosition);
	const reticlePosition = reticle.position;
	console.log('reticle postion:', reticlePosition);
}




function init() {

	container = document.createElement( 'div' );
				//document.getElementById("container").appendChild( container );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

	const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
	light.position.set( 0.5, 1, 0.25 );
	scene.add( light );

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	container.appendChild( renderer.domElement );

	controls=new OrbitControls(camera, renderer.domElement);
	controls.addEventListener('change',render);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set(0,0,-0.2);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

	reticle = new THREE.Mesh(
		new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
		new THREE.MeshBasicMaterial()
		);
		reticle.matrixAutoUpdate = false;
		reticle.visible = false;
		scene.add( reticle );		

	const onSelect = async()=>{
		if ( reticle.visible ) {
			
			const stadium= await loadGLTF('static/Stadium_v2_1.glb');
			const model = stadium.scene;
			model.position.copy(reticle.position);
			model.position.y-=0.2;
			model.position.z-=0.5;
			model.quaternion.copy(reticle.quaternion);
			model.scale.set(0.3, 0.3, 0.3);
			var box= new THREE.Box3();
			box.setFromObject(model);
		
			model.name="stadium";
			scene.add(model);
			drawWagonWheels(0.2,0.8,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.15,0.25,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.215,-0.15,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.25,0.3,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.1,0.46,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.4,-0.1,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(-0.5,0.15,"0xFEE88A"); //yellow(1/2's)
			drawWagonWheels(0.8,0.38,"0x8EB6F0"); // **blue(4's)
			drawWagonWheels(-0.6,-0.6,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.68,0.8,"0x9EADC3");//blue(4's)
			drawWagonWheels(-0.8,-0.18,"0x9EADC3");//blue(4's)
			drawWagonWheels(0.7,0.7,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.85,0.85,"0XEB6363"); //red(6's)
			drawWagonWheels(-0.48,0.48,"0x9EADC3");//blue(4's)
			drawWagonWheels(0.4,-0.68,"0x9EADC3");//blue(4's)
			//boundingBox(model);
			model_rendered=true;
//			reticle.visible=false;

		}
//		reticle.visible=false;

	}

    onSelect();
	controller = renderer.xr.getController( 0 );
	controller.addEventListener( 'select', onSelect );
	scene.add( controller );



		window.addEventListener( 'resize', onWindowResize );


}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.update();

}

function animate() {

	renderer.setAnimationLoop( render );
	requestAnimationFrame(animate);
	controls.update();

}

function render( timestamp, frame ) {

	if ( frame ) {

		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if ( hitTestSourceRequested === false ) {

			session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

			session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

			hitTestSource = source;

		} );

	} );

	session.addEventListener( 'end', function () {

		hitTestSourceRequested = false;
		hitTestSource = null;

	} );

	hitTestSourceRequested = true;

	}
	if ( hitTestSource ) {

		const hitTestResults = frame.getHitTestResults( hitTestSource );

					
		if ( hitTestResults.length ) {

			const hit = hitTestResults[ 0 ];

			reticle.visible = true;
			reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

		} else {

			reticle.visible = false;

		}
		if(model_rendered)
		{
			reticle.visible = false;
		}

	}

    }

	renderer.render( scene, camera );

}
init();
animate();
