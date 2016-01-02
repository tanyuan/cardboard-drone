//true == flying ; false == landing
var drone_status=false;
var socket;
var frameCountVideo;//frame counts to copy video
var checkIntervalVideo;//interval of frame to copy video

function initDroneCtrl(){
	//frameCountVideo and checkIntervalVideo init
	frameCountVideo=0;
	checkIntervalVideo=2;
	
	//socket init
	socket=io.connect();
	
	//drone status callback (show status by UI) 
	socket.on('flying', function(data) {
		$('#powerLeft').attr('src', 'flying.ico');
		$('#powerRight').attr('src', 'flying.ico');
		drone_status=true;
	});
	
	socket.on('landing', function(data) {
		$('#powerLeft').attr('src', 'landing.ico');
		$('#powerRight').attr('src', 'landing.ico');
		drone_status=false;
	});
	
	//dronestream init
	new NodecopterStream(document.getElementById('droneStreamLeft'));
	
	initTapEventFlagArray(1);
	initCanvasPos("Left");
	initCanvasPos("Right");
	//init Hammer on #our_hammer(layer2)
	initHammer('our_hammerLeft');
	initHammer('our_hammerRight');
	animate();
	
	$('#checkTakeoff').easyModal({
		overlayClose:false
	});
	
	$('#checkLand').easyModal({
		overlayClose:false
	});
	
	$('#message').easyModal({
		overlayClose:false
	});
}

//send drone cmd to server via socket.io. add new control function like this.
function takeoff() {
	socket.emit('takeoff', { cmd: 'takeoff' });
}

function land() {
	socket.emit('land', { cmd: 'land' });
}

function stopInAir() {
	socket.emit('moveStop', {cmd: 'moveStop'});
}

function moveUp(spd){
	if((spd<0)||(spd>1)){
		spd=0.6;
	}
	socket.emit('moveUp', {cmd: 'moveUp', speed: spd});
}

function moveDown(spd){
	if((spd<0)||(spd>1)){
		spd=0.6;
	}
	socket.emit('moveDown', {cmd: 'moveDown', speed: spd});
}

function moveLeft(spd){
	if((spd<0)||(spd>1)){
		spd=0.3;
	}
	socket.emit('moveLeft', {cmd: 'moveLeft', speed: spd});
}

function moveRight(spd){
	if((spd<0)||(spd>1)){
		spd=0.3;
	}
	socket.emit('moveRight', {cmd: 'moveRight', speed: spd});
}

function moveFront(spd){
	if((spd<0)||(spd>1)){
		spd=0.6;
	}
	socket.emit('moveFront', {cmd: 'moveFront', speed: spd});
}

function moveBack(spd){
	if((spd<0)||(spd>1)){
		spd=0.6;
	}
	socket.emit('moveBack', {cmd: 'moveBack', speed: spd});
}

function rotateClockwise(spd){
	if((spd<0)||(spd>1)){
		spd=0.3;
	}
	socket.emit('rotateClockwise', {cmd: 'rotateClockwise', speed: spd});
}

function rotateCounterClockwise(spd){
	if((spd<0)||(spd>1)){
		spd=0.3;
	}
	socket.emit('rotateCounterClockwise', {cmd: 'rotateCounterClockwise', speed: spd});
}

function message(msg){
	socket.emit('message', {debug: msg});
}
//

//arrange multi layer canvas position (left side or right side)
function initCanvasPos(side){
	//get the position of #dummy(layer0)
	var offset = $('#dummy'+side).offset();
	//move #droneStream(layer1) onto #dummy(layer0)
	var orig=$('#droneStream'+side).attr('style');
	orig=orig+'position: absolute; left:'+offset.left+'px; top:'+offset.top+'px;z-index:1;';
	$('#droneStream'+side).attr('style',orig);
	
	//move #our_hammer(layer2) onto #droneStream(layer1)
	orig=$('#our_hammer'+side).attr('style');
	orig=orig+'position: absolute; left:'+offset.left+'px; top:'+offset.top+'px;z-index:5;touch-action: pan-x pan-y;';
	$('#our_hammer'+side).attr('style',orig);
	
	orig=$('#power'+side).attr('style');
	orig=orig+'position: absolute; left:'+565+'px; top:'+9+'px;';
	$('#power'+side).attr('style',orig);
	
	if(side==='Right'){
		offsetRight=offset;
	}else{
		offsetLeft=offset;
	}
}

//called every frame
function animate(){
	checkAngle();
	render();
	requestAnimationFrame( animate );
}

//check if stop drone if it is really rotating (ask server)
function checkAngle(){
	if(droneRotating===true){
		frameCountDrone+=1;
		if(frameCountDrone===10000){
			frameCountDrone=0;
		}
		if(frameCountDrone%checkIntervalDrone === 0){
			socket.emit('angleAskToStopRotate', { cmd: 'angleAskToStopRotate' });
		}
	}
}

//copy left canvas to right canvas
function render(){
	frameCountVideo+=1;
	if(frameCountVideo===10000){
		frameCountVideo=0;
	}
	if(frameCountVideo%checkIntervalVideo === 0){
		var canvasLeft = $('#droneStreamLeft > canvas')[0];
		var canvasRight = $('#droneStreamRight > canvas')[0];
		
		var ctxRight = canvasRight.getContext('2d');
		//call its drawImage() function passing it the source canvas directly
		ctxRight.drawImage(canvasLeft, 0, 0);
	}
}