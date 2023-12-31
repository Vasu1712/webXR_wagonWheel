import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

let container;
let camera, scene, renderer;
let controller;
let controls;
let reticle, parent,textMesh;
let hitTestSource = null;
let hitTestSourceRequested = false;

/*-----------------Loading Model-----------------------------------------*/	
const loadGLTF = (path) => {
	return new Promise((resolve, reject) => {
	  const loader = new GLTFLoader();
	  loader.load(path, (gltf) => {
		resolve(gltf);
	  });
	});
};

/*------------------------Fetching Data------------------------------------*/

let jsonMatchData, jsonPlayerStat;
var firstInningsData, secondInningsData;

// Function to fetch general data
function fetchMatchData() {
	const url = 'https://d1u2maujpzk42.cloudfront.net/icc-scores/ef884c07-5b63-4a42-ac72-3947471c43ec/player.json';
  
	return fetch(url)
	  .then(response => response.json())
	  .then(data => {
		jsonMatchData=data;
		//console.log(data);
		firstInningsData = data.first_innings_players;
        secondInningsData = data.second_innings_players;  
        console.log(firstInningsData)
        console.log(secondInningsData)

		const firstInningsPlayerNames = data.first_innings_players.map(player => player.player_name);
      	const secondInningsPlayerNames = data.second_innings_players.map(player => player.player_name);

		console.log("First Inning Player Names:", firstInningsPlayerNames);
      	console.log("Second Inning Player Names:", secondInningsPlayerNames);

		const firstInningsPlayerImages = data.first_innings_players.map(player => player.player_image);
      	const secondInningsPlayerImages = data.second_innings_players.map(player => player.player_image);
      
     	console.log("First Inning Player Names:", firstInningsPlayerImages);
      	console.log("Second Inning Player Names:", secondInningsPlayerImages);

		const firstInningsCountry = {
			name: data.first_innings,
			flag: data.first_innings_team_logo,
			short_code: data.first_innings_shortcode
		  };
		  
		const secondInningsCountry = {
			name: data.second_innings,
			flag: data.second_innings_team_logo,
			short_code: data.second_innings_shortcode
		  };

		console.log("First innings Country & Flag:",firstInningsCountry); 
		console.log("Second innings Country & Flag:", secondInningsCountry);
		
	  })
	  .catch(error => {
		console.error('Error fetching general data:', error);
	  });
  }
  
  // Function to fetch player-wise data
  function fetchPlayerData(playerId) {
	const url = `https://d1u2maujpzk42.cloudfront.net/icc-scores/ef884c07-5b63-4a42-ac72-3947471c43ec/${playerId}.json`;
	
	return fetch(url)
	  .then(response => response.json())
	  .then(data => {
		jsonPlayerStat=data;
		console.log(`Player ID: ${playerId}, Player Name:${data.name}'s Data`, data);
		const balls = data.balls_details;

    	balls.forEach(ball => {
		const runs = ball.runsBat;
		const pitchMapX = ball.bowlingAnalysis.pitchMap.x;
		const pitchMapY = ball.bowlingAnalysis.pitchMap.y;
		const balllandingPosition = { x: pitchMapX, y: pitchMapY };
		const arrivalX = ball.battingAnalysis.arrival.x;
		const arrivalY = ball.battingAnalysis.arrival.y;
		const landingPosition = { x: arrivalX, y: arrivalY };

		console.log("Runs:", runs);
		console.log("Ball Pitch Landing Position:", balllandingPosition);
		console.log("Ball Landing Position:", landingPosition);
		});

	  })
	  .catch(error => {
		console.error('Error fetching player data:', error);
	  });
  }
  

// Checking the functions
fetchMatchData(); // Fetch overall data
fetchPlayerData('999c8498-7b17-4a81-8ea5-9e366c535862'); // Fetch player-wise data for player with ID


/*-----------------Adding the Tap to Place Text-----------------------------*/

const loader = new FontLoader()
// promisify font loading
function loadFont(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
    })
}

async function placeText() {
    const font = await loadFont('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json')
    let text = 'Tap to Place'
    const geometry = new TextGeometry(text, {
        font: font,
        size: 0.02,
        height: 0.002,
        curveSegments: 12,
        bevelEnabled: true,
        bevelOffset: 0,
        bevelThickness: 0.005,
        bevelSize: 0.003,
        bevelSegments: 1
    })

    const material = [
        new THREE.MeshPhongMaterial({
        	color: 0xfff2cc,
        	flatShading: true
         }), // front
        new THREE.MeshPhongMaterial({
            color: 0xffe599
        }) // side
    ]

	const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.x = 0
    pointLight.position.y = 0
    pointLight.position.z = 0
    scene.add(pointLight)
    textMesh = new THREE.Mesh(geometry, material);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    geometry.boundingBox.getCenter(textMesh.position).multiplyScalar(-1);
    textMesh.position.x = -geometry.boundingBox.max.x / 2;
	
    parent = new THREE.Object3D();
    parent.add(textMesh);
	parent.position.y = -0.19;
	parent.position.x = 0;
	parent.position.z = -0.5;
	parent.name="tapToPlace";

}

let model_rendered=false;

/*--------------------------------Adding Wagon wheel------------------------------*/

function drawWagonWheels(xVal, yVal, color) {

	var numPoints = 100;

	var start = new THREE.Vector3(0, 0, 0);

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
  
	
	mesh.scale.set(0.3, 0.3, 0.3);
	mesh.position.set(0, 0, 0);
	mesh.castShadow = true;// shadow
	// mesh.position.set(-7, 5, -5);
	// mesh.rotation.x = Math.PI / 7;
	//mesh.name = "WagonWheels_" + name;
	mesh.material.color.setHex(color);

	const stadium = scene.getObjectByName("stadium");
	stadium.add(mesh); //tubes are made children to stadium here.
	//_runStore.push(mesh); //1,2,3,4,6 buttons, used in displaylines
	stadium.receiveShadow = true; //shadow
}

function wagonWheel(data) {
	_runStore.map((data) => {
	  let _G = init.instantTrackerGroup.getObjectByName(data.name);
	  _G.removeFromParent();
	});
	_runStore = [];
	data.balls_details.map((data) => {
	  console.log(data, "data");
	  let _N, color;
	  let _Wx = data.battingAnalysis.shots.wagonWheel.x;
	  let _Wy = data.battingAnalysis.shots.wagonWheel.y;
	  if (data.runsBat === 1) {
		_N = "Ones";
		color = "0xFFFFFF";
	  } else if (data.runsBat === 2) {
		_N = "Twos";
		color = "0xFFE557";
	  } else if (data.runsBat === 3) {
		_N = "Threes";
		color = "0xFFE557";
	  } else if (data.runsBat === 4) {
		_N = "Fours";
		color = "0x4D5BFF";
	  } else if (data.runsBat === 6) {
		_N = "Sixes";
		color = "0xFF1F1F";
	  }
  
	  // console.log(data.battingAnalysis, _Wx, _Wy);
  
	  drawWagonWheels(_Wx, _Wy, color, _N);
	});
  }

/*--------------------------------WW Display Lines------------------------------*/

  function displayLines(data) {
	if (data !== "all") {
	  let _P = "WagonWheels_" + data;
	  _runStore.map((data) => {
		data.name === _P ? (data.visible = true) : (data.visible = false);
	  });
	} else {
	  _runStore.map((data) => {
		data.visible = true;
	  });
	}
  }
  

/*--------------------------------Score Display UI------------------------------*/

function scoreDisplay(data, name, size, right, rightCan) {
	let text;
	if (name === "runball") {
	  text = data.runs + " RUNS" + " (" + data.balls + "balls)";
	} else if (name === "runs") {
	  text = ` 1's + 2's + 3's =${
		data.run_details["ones"] +
		data.run_details["twos"] +
		data.run_details["threes"]
	  }`;
	} else if (name === "fours") {
	  text = "4's-" + data.run_details["fours"];
	} else if (name === "sixes") {
	  text = "6's'-" + data.run_details["sixes"];
	} else if (name === "profile") {
	  text = data.name;
	}
	//create image
	let bitmap = createRetinaCanvas(rightCan, 65); //300 ,65
	let ctx = bitmap.getContext("2d", { antialias: false });
	ctx.font = "Bold " + size + "px Goldman sans"; //50 for six
	// ctx.beginPath();
	// ctx.rect(0, 0, 300, 65);
	// ctx.fillStyle = 'rgba(255,255,255,.3)'
  
	// To change the color on the rectangle, just manipulate the context
	// ctx.strokeStyle = "rgb(255, 255, 255)";
	// ctx.lineWidth = 3;
	// ctx.fillStyle = "rgba(255,255,255, 1)";
	// ctx.beginPath();
	// ctx.roundRect(0, 5, 290, 58, 10);
	// ctx.stroke();
	// ctx.fill();
	if (name === "profile") {
	  ctx.fillStyle = "#ACA08D";
	} else {
	  ctx.fillStyle = "white";
	}
	// ctx.fillStyle = "red";
	ctx.textAlign = "center";
	ctx.fill();
	ctx.fillText(text, right, 45); //150 ,40
	console.log(ctx, text);
	var texture = new THREE.Texture(bitmap);
	texture.needsUpdate = true;
	let _SM = init.instantTrackerGroup.getObjectByName("score_" + name);
	console.log(_SM, "sm here");
	_SM.material.map = texture;
	_SM.visible = true;
	console.log(_SM.material.map, ctx.fillText(text, right, 45));
  }

/*--------------------------------Display Run Mesh------------------------------*/

function displayRunMesh(data) {
	let _displayPlayerMesh = init.instantTrackerGroup.getObjectByName("playerImage");
  
	_displayPlayerMesh.material.map = texLoader.load(
	  data.player_image,
	  function (xhr) {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	  },
	  function (xhr) {
		console.log("An error happened");
	  }
	);
	_displayPlayerMesh.needsUpdate = true;
	_displayPlayerMesh.visible = true;
	console.log(_displayPlayerMesh);
  
	// Loading bg
	let bg = init.instantTrackerGroup.getObjectByName("playerBg");
	bg.visible = true;
	console.log(bg);
  
	scoreDisplay(data, "runball", 30, 150, 300);
	scoreDisplay(data, "runs", 35, 150, 300);
	scoreDisplay(data, "sixes", 45, 150, 300);
	scoreDisplay(data, "fours", 45, 150, 300);
	scoreDisplay(data, "profile", 50, 100, 300);
  }
  
function initializeButtons() {


    $(document).ready(function(){
        let _resData;
        $.ajax({
            url: "https://d1u2maujpzk42.cloudfront.net/matchdata/1198/players.json",
            type: 'GET',
            success: function(res) {
                _resData = res;
                countryDisplay(_resData);
                playerDisplay(_resData);
                runsDisplay(_resData.first_innings_score, _resData.first_innings_wicket, _resData.first_innings_over, _resData.first_innings_team_logo);
            }
        });

        var runData = [
            {"run":1,"color":"white","id":"one"},
            {"run":2,"color":"yellow","id":"two"},
            {"run":3,"color":"yellow","id":"three"},
            {"run":4,"color":"blue","id":"four"},
            {"run":6,"color":"red","id":"six"},
            {"run":'ALL',"color":"grey","id":"all"}
        ];
        scores(runData);

        $('.scoreList').click((e)=>{
            e.preventDefault();
            let _Data = e.target.id;
            wagonWheelDisplay(_Data);
        });

        // PLAYER DISPLAY
        $('.inningsOneCountry').click(()=>{
            $('.firstInningsPlayer').show();
            $('.secondInningsPlayer').hide();
            runsDisplay(_resData.first_innings_score, _resData.first_innings_wicket, _resData.first_innings_over, _resData.first_innings_team_logo);
        });

        $('.inningsTwoCountry').click(()=>{
            $('.firstInningsPlayer').hide();
            $('.secondInningsPlayer').show();
            runsDisplay(_resData.second_innings_score, _resData.second_innings_wicket, _resData.second_innings_over, _resData.second_innings_team_logo);
        });

        $('.inningsContainer').click((e)=>{
            playersRunDetails(e.target.id);
        });
    });

    const runsDisplay = (score, wicket, overs, teamLogo) => {
        document.getElementById('teamScore').innerHTML = score + ' / ' + wicket;
        document.getElementById('overs').innerHTML = overs + ' Ovr';
        document.getElementById('teamFlag').src = teamLogo;
    };

    const countryDisplay = (_resData) =>{
        document.getElementById('inningsOneCountry').innerHTML = _resData.first_innings_shortcode;
        document.getElementById('inningsTwoCountry').innerHTML = _resData.second_innings_shortcode;
    };

    const playerDisplay = (_resData) => {
        const _firstInnPlayer = _resData.first_innings_players;
        const _secondInnPlayer = _resData.second_innings_players;
        const playerFirstInn = document.getElementById('firstInningsPlayer');
        const playerSecondInn = document.getElementById('secondInningsPlayer');
        addPlayer(_firstInnPlayer, playerFirstInn);
        addPlayer(_secondInnPlayer, playerSecondInn);
    };

    const addPlayer = (data, divId) => {
        data.map((players)=>{
            let _img = document.createElement('img');
            _img.setAttribute('style','display: block;margin-left: auto;margin-right: auto;width:32px;border-radius: 50%;');
            _img.setAttribute('src', `${players.player_image}`);
            _img.setAttribute('id', `${players.playerid}`);
            divId.appendChild(_img);
        });
    };

    const playersRunDetails = (_playerId) => {
        $.ajax({
            url: `https://d1u2maujpzk42.cloudfront.net/matchdata/1198/${_playerId}.json`,
            type: 'GET',
            success: function(res) {
                const _resData = res;
                displayRunMesh(_resData);
                wagonWheel(_resData);
            }
        });
    };

    const scores = (runData) => {
        let cont = document.getElementById("footerContainer");
        let ul = document.createElement("ul");
        ul.setAttribute("class", "scoreList");

        runData.map((data) => {
            let li = document.createElement('li');
            li.innerHTML = data.run;
            li.setAttribute('style', `color:${data.color};`);
            li.setAttribute('id', `${data.id}`);

            // Default border style
            li.style.border = '2px solid transparent';

            // Add click event listener
            li.addEventListener('click', () => {
                // Removing golden border from all buttons
                runData.map((item) => {
                    const button = document.getElementById(`${item.id}`);
                    button.style.border = '2px solid transparent';
                });

                // Golden border to the clicked button
                li.style.border = '2px solid goldenrod';
            });

            ul.appendChild(li);
        });

        cont.appendChild(ul);
    };

    const wagonWheelDisplay = (data) => {
        console.log(data);
    };

    const teamsScore = () => {
        
    };

   
    countryDisplay(_resData);
    playerDisplay(_resData);
    runsDisplay(_resData.first_innings_score, _resData.first_innings_wicket, _resData.first_innings_over, _resData.first_innings_team_logo);
    scores(runData);
}

/*--------------------------------Bounding Box------------------------------*/

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



/*---------------------------------INIT FUNCTION-------------------------------*/


function init() {

	container = document.createElement( 'div' );
				//document.getElementById("container").appendChild( container );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

	// const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
	// light.position.set( 0.5, 1, 0.25 );
	// scene.add( light )

	//shadowLighting
	
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(0, 10, 0);
	light.castShadow = true;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.bias = -0.001;
	scene.add(light);


	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.shadowMap.enabled = true; //shadow
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //shadow
	container.appendChild( renderer.domElement );

	controls=new OrbitControls(camera, renderer.domElement);
	controls.addEventListener('change',render);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set(0,0,-0.2);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	let options = {
		requiredFeatures: ['hit-test','dom-overlay'],
	}
	//options.domOverlay = {root: document.getElementById('content-ar')};
	document.body.appendChild( ARButton.createButton( renderer, options ) );

	reticle = new THREE.Mesh(
		new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
		new THREE.MeshBasicMaterial()
		);
	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add( reticle );	
		
	placeText();
	//parent.visible=false;
	// console.log(textMesh.visible);
	// console.log(parent.visible);
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
			wagonWheel(data);
			drawWagonWheels();
			// drawWagonWheels(0.2,0.8,"0XEB6363"); //red(6's)
			// drawWagonWheels(-0.15,0.25,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(-0.215,-0.15,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(0.25,0.3,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(-0.1,0.46,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(0.4,-0.1,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(-0.5,0.15,"0xFEE88A"); //yellow(1/2's)
			// drawWagonWheels(0.8,0.38,"0x8EB6F0"); // **blue(4's)
			// drawWagonWheels(-0.6,-0.6,"0XEB6363"); //red(6's)
			// drawWagonWheels(-0.68,0.8,"0x9EADC3");//blue(4's)
			// drawWagonWheels(-0.8,-0.18,"0x9EADC3");//blue(4's)
			// drawWagonWheels(0.7,0.7,"0XEB6363"); //red(6's)
			// drawWagonWheels(-0.85,0.85,"0XEB6363"); //red(6's)
			// drawWagonWheels(-0.48,0.48,"0x9EADC3");//blue(4's)
			// drawWagonWheels(0.4,-0.68,"0x9EADC3");//blue(4's)
			//boundingBox(model);
			model_rendered=true;

		}


	}

	initializeButtons();
	
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
			scene.add(parent); //Tap to place text added when model visible
			

		} else {

			reticle.visible = false;

		}
		if(model_rendered)
		{
			reticle.visible = false;
			scene.remove(parent); //Tap to place text removed when model rendered

		}


	}

    }

	renderer.render( scene, camera );

}
init();
animate();
