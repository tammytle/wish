window.onload = function() {
	
var container = document.getElementById( 'container' ),containerWidth, containerHeight, renderer, scene, camera, spheres, geom, range = 50, mouseVector, model, thisObject, controls, wishes, raycaster, projector, skyboxMesh;
    
    var mouse = new THREE.Vector2(), INTERSECTED;
    var renderer = new THREE.WebGLRenderer( {antialias:true} );
    var holdWishes = [];
        
        // create the audio context
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
    var context = new AudioContext();
    
	containerWidth = container.clientWidth;
	containerHeight = container.clientHeight;

    // setting the renderer
	renderer.setSize( containerWidth, containerHeight );
	container.appendChild( renderer.domElement );

	scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x002853, 6000, 10000 );

    // setting up the camera
    camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 100000 );
    camera.position.z = 1000;

    // skybox 
    var imagePrefix = "images/water-";
	var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	var imageSuffix = ".jpg";
	var skyGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );	
	
	var urls = [];
	for (var i = 0; i < 6; i++)
		urls.push( imagePrefix + directions[i] + imageSuffix );
	
	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	scene.add( skyBox );
    
    //bubble texture
	this.refractSphereCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
	scene.add( refractSphereCamera );
	var fShader = THREE.FresnelShader;
	
	var fresnelUniforms = 
	{
		"mRefractionRatio": { type: "f", value: 1.02 },
		"mFresnelBias": 	{ type: "f", value: 0.1 },
		"mFresnelPower": 	{ type: "f", value: 2.0 },
		"mFresnelScale": 	{ type: "f", value: 1.0 },
		"tCube": 			{ type: "t", value: refractSphereCamera.renderTarget } //  textureCube }
	};
	
	// bubbles being added to the scene
	geom = new THREE.SphereGeometry( 100, 32, 16 );
    this.sphere = new THREE.Mesh( geom, customMaterial );

	spheres = new THREE.Object3D();
	scene.add( spheres );

    wishes = getWishes();    
    
    // generating bubbles based off of how many wishes there are
	for(var i = 0; i < wishes.length; i++ ) {	
        var customMaterial = new THREE.ShaderMaterial( 
	{
	    uniforms: 		fresnelUniforms,
		vertexShader:   fShader.vertexShader,
		fragmentShader: fShader.fragmentShader
	}   );
	
    sphere = new THREE.Mesh( geom, customMaterial );
    sphere.position.set( range * (0.5 - Math.random()), range * (0.5 - Math.random()), range * (1 - Math.random()) );
    sphere.rotation.set( Math.random(), Math.random(), Math.random() ).multiplyScalar( 1 * Math.PI );
    sphere.wish = wishes[i];
    spheres.add( sphere );
        sphere.cursorOver = false;
    holdWishes.push(sphere);
    }

    projector = new THREE.Projector();
	mouseVector = new THREE.Vector3();
    window.addEventListener( 'mousemove', onMouseMove, false );
    
    raycaster = new THREE.Raycaster();

	// selecting objects
    function onMouseMove( e ) {
          
        mouseVector.x = 2 * (e.clientX / containerWidth) - 1;
        mouseVector.y = 1 - 2 * ( e.clientY / containerHeight );
                
        var raycaster = projector.pickingRay( mouseVector.clone(), camera ),
            intersects = raycaster.intersectObjects( spheres.children );                 
        spheres.children.forEach(function( sphere ) {
            sphere.cursorOver = false;
        });
                
        for( var i = 0; i < intersects.length; i++ ) {
            var intersection = intersects[ i ],
                obj = intersection.object;
            
            obj.cursorOver = true;
        }
    }
    
	// user interaction
    window.addEventListener( 'mousedown', onMouseDown, true );
	window.addEventListener( 'resize', onWindowResize, false );

    // focus on text input field in wish modal
    $('.add-wish').on('click', function(e){
       $(this).focus();
        $(this).select();
    });
    
    // controls allowing users to zoom in and out with their mouse/trackpad
	controls = new THREE.TrackballControls( camera );
	controls.zoomSpeed = 0.02;
 
    animate();
    render();

    // on mouse down, pick object
	function onMouseDown( e ) {
		
		mouseVector.x = 2 * (e.clientX / containerWidth) - 1;
		mouseVector.y = 1 - 2 * ( e.clientY / containerHeight );

		var raycaster = projector.pickingRay( mouseVector.clone(), camera ),
			intersects = raycaster.intersectObjects( spheres.children );
          
        for( var i = 0; i < intersects.length; i++ ) {
            var intersection = intersects[ i ],
                obj = intersection.object;
            
            if($('.modal.in').length == 0){
                $('#myModal .show-wish').text(intersects[0].object.wish);
                $('#myModal').modal('show');
            }
		}	
	}
    
    // saving wish and generating new cube when user hits "Make a wish" button in modal
    $('.add-wish-button').on('click', function(){
       var wishText = $('.add-wish').val(),
           white, mat, sphere; 
        
        var customMaterial = new THREE.ShaderMaterial( 
	{
	    uniforms: 		fresnelUniforms,
		vertexShader:   fShader.vertexShader,
		fragmentShader: fShader.fragmentShader
	}   );
        
        if(!wishText){
            return;
        }
        
        sphere = new THREE.Mesh( geom, customMaterial );
		sphere.position.set( range * (0.5 - Math.random()), range * (0.5 - Math.random()), range * (1 - Math.random()) );
		sphere.rotation.set( Math.random(), Math.random(), Math.random() ).multiplyScalar( 1 * Math.PI );
        sphere.wish = wishText;
		spheres.add( sphere );
        holdWishes.push(sphere);
        saveWishes(wishText);
        $('.modal').modal('hide');
    });

    // sketch expand when window is resized
	function onWindowResize( e ) {
		containerWidth = container.clientWidth;
		containerHeight = container.clientHeight;
		renderer.setSize( containerWidth, containerHeight );
		camera.aspect = containerWidth / containerHeight;
		camera.updateProjectionMatrix();
	}

	function animate() {
		requestAnimationFrame( animate );
		controls.update();
        render();
	}

function render() {
	sphere.visible = false;
	refractSphereCamera.updateCubeMap( renderer, scene );
	sphere.visible = true;
    
				var timer = 0.0001 * Date.now();    
    //console.log(holdWishes.length);
    for ( var i = 0, il = holdWishes.length; i < il; i ++ ) {
					var clock = holdWishes[ i ];
        //console.log('Move sphere: ' + i + ' to X.Y:' + 5000 * Math.cos( timer + i ) + 5000 * Math.sin( timer + i * 1.1 ));
                    if(!clock.cursorOver) {
                        clock.position.x = 700 * Math.cos( timer + i );
					   clock.position.y = 800 * Math.sin( timer + i * 1.1 );
                        clock.position.z = 600 * Math.sin( timer + i );
                    }
				}

	renderer.render( scene, camera );
}
    
    // check if wishes are in local storage
    function getWishes(){
        var wishes = localStorage.getItem('wishes');
        
        if(wishes == null){
            wishes = Array();
            wishes.push("unicorns were real");
            wishes.push("my boyfriend would propose");
            wishes.push("that I'll pass math class");
            wishes.push("that I'll win the lottery");
            wishes.push("I could play guitar");
            wishes.push("I could eat dairy");
            wishes.push("someone understood me");
            wishes.push("I could rule the world");
            wishes.push("I had a banana");
            wishes.push("I had all the channels for cable");
            wishes.push("for world peace");
            wishes.push("I knew what to get my mom for Christmas");
            wishes.push("I didn't live with my roommate");
            wishes.push("I could go to Europe");
            wishes.push("I could see my grandpa one last time");
            wishes.push("I was a pro hockey player");
            wishes.push("I could knit");
            wishes.push("I was a movie star");
            wishes.push("my mom would stop drinking so much");
            wishes.push("I could go to space");
            wishes.push("I could meet Joel Zimmerman");
            wishes.push("I was 19");
            wishes.push("I lived in Amsterdam");
            wishes.push("I lived where the air didn't hurt my face");
            wishes.push("I could only eat pizza");
            wishes.push("my dad would retire");
            wishes.push("my sister would dump her boyfriend");
            wishes.push("my best friend would call me");
            wishes.push("I could code");
            wishes.push("I was a doctor");
            wishes.push("I knew how to speak every language");
            wishes.push("that everyone would be internally pleased with what is happening in their lives");
            wishes.push("I was done school");
            wishes.push("my cat loved me");
            wishes.push("I could get a minion for my birthday");
            wishes.push("pigs could fly");
            wishes.push("my hard drive didn't wipe itself last week");
            wishes.push("I could paint");
            wishes.push("I could play piano");
            wishes.push("I could have the new iPhone");
            wishes.push("that Apple would burn to the ground");
            wishes.push("that Android users weren't so nerdy");
            
            localStorage.setItem('wishes', JSON.stringify(wishes));
        } else {
            wishes = JSON.parse(wishes);
        }
        
        return wishes;
    }
    
    // saving wishes to local storage
    function saveWishes(newWish){
        var wishes = localStorage.getItem('wishes');
            wishes = JSON.parse(wishes);
            wishes.push(newWish);
        localStorage.setItem('wishes', JSON.stringify(wishes));
    }
    
    // load the sound
    loadSound("song.mp3");

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        var source = context.createBufferSource();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function() {

            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
            source.buffer = buffer;

            source.connect(context.destination);
            source.loop = true;
            source.start(0);
            });
        }
        
        request.send();
    }
    
}


				

