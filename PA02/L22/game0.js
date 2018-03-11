
/*
Game 0
This is a ThreeJS program which implements a simple game
The user moves a cube around the board trying to knock balls into a cone.
This file has been modified for PA02.
-Nadia Kubatin
-Victor Kubatin
-Eli Kengmana
-Zeline Tricia Bartolome
-Kelly Duan
-Aerionna Stephenson
*/


	// First we declare the variables that hold the objects we need
	// in the animation code
	var scene, renderer;
	var camera, avatarCam, edgeCam;  // we have two cameras in the main scene

	// here are some mesh objects ...
	var cone;
	var npc;

	// an attempt at loading suzanne
	// might be erased later
	var avatar, suzanne, loader;

	// game scenes
	var endScene, endCamera, endText;
	var endScene2, endCamera2, endText2;

	// game elements
	var controls =
	     {fwd:false, bwd:false, left:false, right:false,
				speed:10, fly:false, reset:false,
		    camera:camera}
	var gameState =
	     {score:0, health:10, scene:'main', camera:'none', collide:false }





	// Here is the main game control
  init(); //
	initControls();
	animate();  // start the animation loop!





	/**
		To initialize the scene, we initialize each of its components
	*/
	function init(){
			initPhysijs();
			scene = initScene();
			createEndScene();
			createEndScene2();
			initRenderer();
			createMainScene();
	}



	/*
		We don't do much here, but we could do more!
	*/
	function initScene(){
    var scene = new Physijs.Scene();
		return scene;
	}



	/*
		Loads physics for the game
	*/
  function initPhysijs(){
    Physijs.scripts.worker = '../js/physijs_worker.js';
    Physijs.scripts.ammo = '../js/ammo.js';
  }



	/*
		The renderer needs a size and the actual canvas we draw on
		needs to be added to the body of the webpage. We also specify
		that the renderer will be computing soft shadows
	*/
	function initRenderer(){
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight-50 );
		document.body.appendChild( renderer.domElement );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}



	/*
		Creates the you win screen for when you win the game
	*/
	function createEndScene(){
		endScene = initScene();
		endText = createSkyBox('youwon.png',10);
		endScene.add(endText);

		// lights
		var light1 = createPointLight();
		light1.position.set(0,200,20);
		endScene.add(light1);

		// camera
		endCamera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
		endCamera.position.set(0,50,1);
		endCamera.lookAt(0,0,0);
	}



	/*
		Creates the game over screen when the NPC kills you
	*/
	function createEndScene2(){
		endScene2 = initScene();
		endText2 = createSkyBox('gameover.png',10);
		endScene2.add(endText2);

		// lights
		var light2 = createPointLight();
		light2.position.set(0,200,20);
		endScene2.add(light2);

		// camera
		endCamera2 = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
		endCamera2.position.set(0,50,1);
		endCamera2.lookAt(0,0,0);
	}



	/*
		This is the main game
	*/
	function createMainScene(){
      // setup lighting
			var light1 = createPointLight();
			light1.position.set(0,200,20);
			scene.add(light1);
			var light0 = new THREE.AmbientLight( 0xffffff,0.25);
			scene.add(light0);

			// create main camera
			camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
			camera.position.set(0,50,0);
			camera.lookAt(0,0,0);

			// create the ground and the skybox
			var ground = createGround('grass.png');
			scene.add(ground);
			var skybox = createSkyBox('sky.jpg',1);
			scene.add(skybox);
			var barrier = createBarrier();
			scene.add(barrier);

			// create the avatar
			createAvatar2(); // attempt at loading suzanne
			avatarCam = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
			avatar = createAvatar();
			avatar.translateY(20);
			avatarCam.translateY(-4);
			avatarCam.translateZ(3);
			scene.add(avatar);
			gameState.camera = avatarCam;

			// second camera
      edgeCam = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 0.1, 1000 );
      edgeCam.position.set(20,20,10);

			// add game objects
			addBalls();

			cone = createConeMesh(4,6);
			cone.position.set(10,3,7);
			scene.add(cone);

			// add the NPC
			npc = createBoxMesh2(0x0000ff,1,2,4);
			npc.position.set(30,5,-30);
      npc.addEventListener('collision',function(other_object){
        if (other_object==avatar){
          gameState.health = gameState.health-1;
					if (gameState.health==0) {
						gameState.scene='gameover';
						soundEffect('Losers.mp3');
					} else {
						soundEffect('Doh.mp3');
					}
					gameState.collide = true;
        }
      })
			scene.add(npc);
			//console.dir(npc);
			//playGameMusic();
	}



	/*
		Produces a random number to set a random location
	*/
	function randN(n){
		return Math.random()*n;
	}



	/*
		Creates balls to be added to the scene
	*/
	function addBalls(){
		// produce an amount of balls
		var numBalls = 20;
		for(i=0;i<numBalls;i++){
			var ball = createBall();
			ball.position.set(randN(20)+15,30,randN(20)+15);
			scene.add(ball);

			// set up events
			ball.addEventListener( 'collision',
				function( other_object, relative_velocity, relative_rotation, contact_normal ) {
					if (other_object==cone){ // changed avatar to cone
						console.log("ball "+i+" hit the cone");
						soundEffect('good.wav');
						gameState.score += 1;  // add one to the score
						if (gameState.score==numBalls) {
							gameState.scene='youwon';
						}
						// make the ball drop below the scene ..
						// threejs doesn't let us remove it from the schene...
						this.position.y = this.position.y - 100;
						this.__dirtyPosition = true;
					}
          else if (other_object == cone){
            gameState.health ++;
          }
				}
			)
		}
	}



	/*
		Creates the mesh for the balls that will be generated
	*/
	function createBall(){
		var geometry = new THREE.SphereGeometry( 1, 16, 16);
		var material = new THREE.MeshLambertMaterial( { color: 0xffff00} );
		var pmaterial = new Physijs.createMaterial(material,0.9,0.95);
    var mesh = new Physijs.BoxMesh( geometry, pmaterial );
		mesh.setDamping(0.1,0.1);
		mesh.castShadow = true;
		return mesh;
	}



	/*
		Creates a point light
	*/
	function createPointLight(){
		var light;
		light = new THREE.PointLight( 0xffffff);
		light.castShadow = true;

		//Set up shadow properties for the light
		light.shadow.mapSize.width = 2048;  // default
		light.shadow.mapSize.height = 2048; // default
		light.shadow.camera.near = 0.5;       // default
		light.shadow.camera.far = 500      // default
		return light;
	}



	/*
		Creates a box mesh that can be used
	*/
	function createBoxMesh(color){
		var geometry = new THREE.BoxGeometry( 1, 1, 1);
		var material = new THREE.MeshLambertMaterial( { color: color} );
		mesh = new Physijs.BoxMesh( geometry, material );
    //mesh = new Physijs.BoxMesh( geometry, material,0 );
		mesh.castShadow = true;
		return mesh;
	}


	/*
		A second box mesh creater with more parameters
	*/
	function createBoxMesh2(color,w,h,d){
		var geometry = new THREE.BoxGeometry( w, h, d);
		var material = new THREE.MeshLambertMaterial( { color: color} );
		mesh = new Physijs.BoxMesh( geometry, material );
		//mesh = new Physijs.BoxMesh( geometry, material,0 );
		mesh.castShadow = true;
		return mesh;
	}



	/*
		Creates the mesh for the ground
	*/
	function createGround(image){
		// creating a textured plane which receives shadows
		var geometry = new THREE.PlaneGeometry( 180, 180, 128 );
		var texture = new THREE.TextureLoader().load( '../images/'+image );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 15, 15 );
		var material = new THREE.MeshLambertMaterial( {
												color: 0xffffff,
												map: texture ,
												side:THREE.DoubleSide
											} );
		var pmaterial = new Physijs.createMaterial(material,0.9,0.05);
		var mesh = new Physijs.BoxMesh( geometry, pmaterial, 0 );
		mesh.receiveShadow = true;
		mesh.rotateX(Math.PI/2);// rotate the mesh 90 degrees to make it horizontal
		return mesh
	}



	/*
		Creates the mesh for the sky
	*/
	function createSkyBox(image,k){
		// creating a textured plane which receives shadows
		var geometry = new THREE.SphereGeometry( 80, 80, 80 );
		var texture = new THREE.TextureLoader().load( '../images/'+image );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( k, k );
		var material = new THREE.MeshLambertMaterial( {
												color: 0xffffff,
												map: texture ,
												side:THREE.DoubleSide
											} );
		var mesh = new THREE.Mesh( geometry, material, 0 );
		mesh.receiveShadow = false;
		return mesh
	}



	/*
		Creates a boundry to prevent objects from leaving the game area
		and falling off the edge.
		-Nadia Kubatin
	*/
	function createBarrier(){
		var geometry2 = new THREE.CylinderGeometry(81, 79, 20, 80, 80, true);
		var material2 = new THREE.MeshPhongMaterial( {
                          color: 0xcce6ff,
                          transparent: true,
                          opacity: 0,
                          shininess: 100,
                          reflectivity: .5,
                          side:THREE.DoubleSide
                        } );
		var pmaterial = new Physijs.createMaterial(material2,0.9,0.5);
		var mesh2 = new Physijs.ConcaveMesh( geometry2, pmaterial, 0 );
		mesh2.receiveShadow = false;
		return mesh2;
	}



	/*
		Creates an avatar for the game
	*/
	function createAvatar(){
		var geometry = new THREE.BoxGeometry( 5, 5, 6);
		var material = new THREE.MeshLambertMaterial( { color: 0xffff00} );
		var pmaterial = new Physijs.createMaterial(material,0.9,0.5);
		var mesh = new Physijs.BoxMesh( geometry, pmaterial );
		mesh.setDamping(0.1,0.1);
		mesh.castShadow = true;

		// create a camera on the avatar
		avatarCam.position.set(0,4,0);
		avatarCam.lookAt(0,4,10);
		mesh.add(avatarCam);
		return mesh;
	}



	/*
		The attempt at loading Suzanne.
		Load was a success but I do not know how to make it the avatar
		- Nadia
	*/
	function createAvatar2(){
		loader = new THREE.JSONLoader();
		suzanne = loader.load("../models/suzanne.json",
		function (geometry, materials){
			var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
			var pmaterial = new Physijs.createMaterial(material,0.9,0.5);
			suzanne = new Physijs.BoxMesh( geometry, pmaterial );
			suzanne.setDamping(0.1,0.1);
			console.log(JSON.stringify(suzanne.scale));
			var s = 0.5;
						suzanne.scale.y=s;
						suzanne.scale.x=s;
						suzanne.scale.z=s;
						suzanne.position.z = -5;
						suzanne.position.y = 3;
						suzanne.position.x = -5;
			suzanne.castShadow = true;
			scene.add(suzanne);
			//avatarCam.position.set(0,4,0);
			//avatarCam.lookAt(0,4,10);
			//suzanne.add(avatarCam);
		}, function(xhr){
						console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );},
			function(err){console.log("error in loading: "+err);}
		);
		//return object = loader.parse("../models/suzanne.json");
		//loader.load("../models/suzanne.json", suzanne);
	}



	/*
		Creates the mesh for the cone where the balls need to hit
	*/
	function createConeMesh(r,h){
		var geometry = new THREE.ConeGeometry( r, h, 32);
		var texture = new THREE.TextureLoader().load( '../images/tile.jpg' );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 1, 1 );
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff,  map: texture ,side:THREE.DoubleSide} );
		var pmaterial = new Physijs.createMaterial(material,0.9,0.5);
		var mesh = new Physijs.ConeMesh( geometry, pmaterial, 0 );
		mesh.castShadow = true;
		return mesh;
	}



	/*
		Plays game music on loop
	*/
	function playGameMusic(){
		// create an AudioListener and add it to the camera
		var listener = new THREE.AudioListener();
		camera.add( listener );

		// create a global audio source
		var sound = new THREE.Audio( listener );

		// load a sound and set it as the Audio object's buffer
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( '/sounds/loop.mp3', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( 0.05 );
			sound.play();
		});
	}



	/*
		Creates a sound effect for when the ball hits the cone
	*/
	function soundEffect(file){
		// create an AudioListener and add it to the camera
		var listener = new THREE.AudioListener();
		camera.add( listener );

		// create a global audio source
		var sound = new THREE.Audio( listener );

		// load a sound and set it as the Audio object's buffer
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( '../sounds/'+file, function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop( false );
			sound.setVolume( 0.5 );
			sound.play();
		});
	}



	function dohSound(file){             // sound whenever you lose health
		// create an AudioListener and add it to the camera
		var listener = new THREE.AudioListener();
		camera.add( listener );

		var doh = new THREE.Audio(listener);

		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( '../sounds/'+file, function( buffer ) {
			doh.setBuffer( buffer );
			doh.setLoop( false );
			doh.setVolume( 0.5 );
			doh.play();
		});
	}



	function loserSound(file){             // sound when you lose

		var loooser = new THREE.AudioListener();
		camera.add( loooser );

		var loser = new THREE.Audio( loooser );
		// global audio source
		var loserLoader = new THREE.AudioLoader();
		loserLoader.load(  '../sounds/'+file, function( buffer ){
			loser.setBuffer( buffer );
			loser.setLoop( false );
			loser.setVolume( 0.50 );
			loser.play();
		});
	}




	var clock;

	/*
		Creates the controls for the avatar.
		Here is where we create the eventListeners to respond to operations.
	*/
	function initControls(){
		  //create a clock for the time-based animation ...
			clock = new THREE.Clock();
			clock.start();

			window.addEventListener( 'keydown', keydown);
			window.addEventListener( 'keyup',   keyup );
  }



	/*
		Events for when a key is hit
	*/
	function keydown(event){
		console.log("Keydown: '"+event.key+"'");
		//console.dir(event);
		// first we handle the "play again" key in the "youwon" scene
		if (gameState.scene == 'youwon' && event.key=='r') {
			gameState.scene = 'main';
			gameState.score = 0;
			gameState.health = 10;
			addBalls();
			return;
		}

		// This is in case of Game Over
		if (gameState.scene == 'gameover' && event.key=='r') {
			gameState.scene = 'main';
			gameState.score = 0;
			gameState.health = 10;
			addBalls();
			return;
		}

		// this is the regular scene
		switch (event.key){
			// change the way the avatar is moving
			case "w": controls.fwd = true;  break;
			case "s": controls.bwd = true; break;
			case "a": controls.left = true; break;
			case "d": controls.right = true; break;
			case "r": controls.up = true; break;
			case "f": controls.down = true; break;
			case "m": controls.speed = 30; break;
      case " ": controls.fly = true;
          console.log("space!!");
          break;
      case "h": controls.reset = true; break;

			// switch cameras
			case "1": gameState.camera = camera; break;
			case "2": gameState.camera = avatarCam; break;
      case "3": gameState.camera = edgeCam; break;

			// move the camera around, relative to the avatar
			case "ArrowLeft": avatarCam.translateY(1);break;
			case "ArrowRight": avatarCam.translateY(-1);break;
			case "ArrowUp": avatarCam.translateZ(-1);break;
			case "ArrowDown": avatarCam.translateZ(1);break;
			case "q": avatarCam.rotateY(.19625);break;
			case "e": avatarCam.rotateY(-.19625);break;
		}
	}



	/*
		Events for when a key is released
	*/
	function keyup(event){
		//console.dir(event);
		switch (event.key){
			case "w": controls.fwd   = false;  break;
			case "s": controls.bwd   = false; break;
			case "a": controls.left  = false; break;
			case "d": controls.right = false; break;
			case "r": controls.up    = false; break;
			case "f": controls.down  = false; break;
			case "m": controls.speed = 10; break;
      case " ": controls.fly = false; break;
      case "h": controls.reset = false; break;
		}
	}



	/*
		Events for the NPC and update
	*/
	function updateNPC(){
		npc.lookAt(avatar.position);

		// moves the NPC to the avatar if it comes close
		if(avatar.position.distanceTo(npc.position)<20){
			npc.setLinearVelocity(npc.getWorldDirection().multiplyScalar(5));
			// events in case of contact with the NPC
			if(gameState.collide == true){
				npc.__dirtyPosition = true;
				npc.position.set(randN(50),5,randN(50)); // no neg values yet
				gameState.collide = false;
				var velocity = avatar.getLinearVelocity();
				velocity.x=velocity.z=0;
				avatar.setLinearVelocity(velocity);
			}
		}
	}



	/*
		Updates and events for the avatar
	*/
  function updateAvatar(){
		"change the avatar's linear or angular velocity based on controls state (set by WSAD key presses)"

		var forward = avatar.getWorldDirection();

		if (controls.fwd){
			avatar.setLinearVelocity(forward.multiplyScalar(controls.speed));
		} else if (controls.bwd){
			avatar.setLinearVelocity(forward.multiplyScalar(-controls.speed));
		} else {
			var velocity = avatar.getLinearVelocity();
			velocity.x=velocity.z=0;
			avatar.setLinearVelocity(velocity); //stop the xz motion
		}

    if (controls.fly){
      avatar.setLinearVelocity(new THREE.Vector3(0,controls.speed,0));
    }

		if (controls.left){
			avatar.setAngularVelocity(new THREE.Vector3(0,controls.speed*0.1,0));
		} else if (controls.right){
			avatar.setAngularVelocity(new THREE.Vector3(0,-controls.speed*0.1,0));
		}

    if (controls.reset){
      avatar.__dirtyPosition = true;
      avatar.position.set(40,10,40);
    }
	}



	/*
		Animates and updates the game state
	*/
	function animate() {

		requestAnimationFrame( animate );

		switch(gameState.scene) {

			case "youwon":
				//endText.rotateY(0.005);
				renderer.render( endScene, endCamera );
				break;

			case "gameover":
				//endText2.rotateY(0.005);
				renderer.render( endScene2, endCamera2 );
				break;

			case "main":
				updateAvatar();
				updateNPC();
        edgeCam.lookAt(avatar.position);
	    	scene.simulate();
				if (gameState.camera!= 'none'){
					renderer.render( scene, gameState.camera );
				}
				break;

			default:
			  console.log("don't know the scene "+gameState.scene);
		}



		//draw heads up display ..
	  var info = document.getElementById("info");
		info.innerHTML='<div style="font-size:24pt">Score: '
    + gameState.score
    + " health="+gameState.health
    + '</div>';

	}
