// Track phone orientation
var count;
var last_dir;
var last_tiltLR;

var startAction;//manage the status of starting action
var rotateStatus;//0 for not rotating, 1 for rotating CounterClockwise, -1 for rotating Clockwise
var rotateSpeed; //rotate constant speed float 0~1
var startDelayMsec; //start constant delay in millisecond
var thresholdNow;//threshold  now
var thresholdBigger;//threshold to start rotate
var thresholdSmaller;//threshold when rotating

var cummuDirOffset;//cumulative turning degree
var droneTargetAngle;//final angle drone should face
var rotatePhase;//the rotation phase of drone, 0 for initial phase, 1 for middle phase( exist when the initial direction from droneAngleNow to droneTargetAngle inverse with drone rotation direction ), 2 for finish phase
var rotateType;//true when the initial direction from droneAngleNow to droneTargetAngle is the same as drone rotation direction, false otherwise
var droneRotating;//if drone really rotating

//event to debug, auto change drone counterClockwiseDegree
/*function test(){
	socket.emit('test', { cmd: 'test' });
}*/

function initCardBoardSensor() {
	count=0;
	last_dir=0;
	last_tiltLR=0;

	startAction=null;
	rotateStatus=0;
	rotateSpeed=0.3;
	startDelayMsec=500;
	thresholdBigger=5;
	thresholdSmaller=5;
	thresholdNow=thresholdBigger;
	
	droneRotating=false;
  
	//event to really start rotation
	socket.on('angleAnsToStartRotate', function(data) {
		angleAnsToStartRotateCallback(data.angle);
	});
	
	//event that try to stop rotation
	socket.on('angleAnsToStopRotate', function(data) {
		angleAnsToStopRotateCallback(data.angle);
	});
	
	//event to debug, auto change drone counterClockwiseDegree
	//setInterval(test,1000);
  
	if (window.DeviceOrientationEvent) {
		document.getElementById("doEvent").innerHTML = "DeviceOrientation";
		// Listen for the deviceorientation event and handle the raw data
		window.addEventListener('deviceorientation', function(eventData) {
			count += 1;
			// gamma is the left-to-right tilt in degrees, where right is positive
			var tiltLR = eventData.gamma;
			  
			// beta is the front-to-back tilt in degrees, where front is positive
			var tiltFB = eventData.beta;
			  
			// alpha is the compass direction the device is facing in degrees
			var dir = eventData.alpha+eventData.beta;
			if(dir >= 360){
				dir -= 360;
			}else if(dir <0){
				dir += 360;
			}
			// call our orientation event handler
			deviceOrientationHandler(tiltLR, tiltFB, dir);
			if (count%10 == 0) {
				calculateAction(tiltLR, tiltFB, dir);
			 }
		}, false);
	} else {
		document.getElementById("doEvent").innerHTML = "Not supported on your device or browser.  Sorry."
	}
}

// Show device orientation numbers and image in HTML
function deviceOrientationHandler(tiltLR, tiltFB, dir) {
  document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
  document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
  document.getElementById("doDirection").innerHTML = Math.round(dir);
  
  // Apply the transform to the image
  var logo = document.getElementById("imgLogo");
  logo.style.webkitTransform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
  logo.style.MozTransform = "rotate("+ tiltLR +"deg)";
  logo.style.transform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
}

// Calculate head action by device orientation
function calculateAction(tiltLR, tiltFB, dir) {
  document.getElementById("doTime").innerHTML = count;
  // Exception degree
  if(Math.abs(last_tiltLR-tiltLR)<90){
	  var dirOffset=angleCalculator(Math.cos(last_dir*Math.PI/180.0),Math.sin(last_dir*Math.PI/180.0),Math.cos(dir*Math.PI/180.0),Math.sin(dir*Math.PI/180.0) );
	  document.getElementById("dirOffset").innerHTML = dirOffset;
	  // Turn left
	  if (dirOffset > thresholdNow) {
		document.getElementById("doAction").innerHTML = "<<<<<<";
		setRotate(1,dirOffset);
	  }
	  // Turn right
	  else if (dirOffset < -thresholdNow) {
		document.getElementById("doAction").innerHTML = ">>>>>>";
		setRotate(-1,dirOffset);
	  }
	  // No action
	  else {
		document.getElementById("doAction").innerHTML = "------";
	  }
  }
  // Store this direction for comparing
  last_dir = dir;
  // Store this tiltLR for comparing
  last_tiltLR=tiltLR;
}

//function to really start rotation
function angleAnsToStartRotateCallback(droneAngleNow){
	//calculate droneTargetAngle
	droneTargetAngle=droneAngleNow+cummuDirOffset;
	if(droneTargetAngle >= 360){
		droneTargetAngle -= (Math.floor(droneTargetAngle/360)*360);
	}else if(droneTargetAngle <0){
		droneTargetAngle += ((Math.ceil(droneTargetAngle/-360))*360);
	}
	//initialize rotatePhase
	rotatePhase=0;
	//decide rotateType according to rotateStatus/droneTargetAngle/droneAngleNow and really start rotation
	switch(rotateStatus){
		case 1:
			if(droneTargetAngle>=droneAngleNow){
				rotateType=true;
			}else{
				rotateType=false;
			}
			rotateCounterClockwise(rotateSpeed);
			break;
		case -1:
			if(droneTargetAngle<=droneAngleNow){
				rotateType=true;
			}else{
				rotateType=false;
			}
			rotateClockwise(rotateSpeed);
			break;
		default:
			return;
	}
	//debug info
	//socket.emit('message', { debug: droneAngleNow , varName:'droneAngleNow'});
	//socket.emit('message', { debug: cummuDirOffset , varName:'cummuDirOffset'});
	//socket.emit('message', { debug: droneTargetAngle , varName:'droneTargetAngle'});
	//socket.emit('message', { debug: rotateType , varName:'rotateType'});
}

//function that try to stop rotation
function angleAnsToStopRotateCallback(droneAngleNow){
	//change rotatePhase according to rotateStatus/droneTargetAngle/droneAngleNow/rotateType/rotatePhase
	switch(rotateStatus){
		case 1:
			if(rotateType){
				if(droneAngleNow>=droneTargetAngle){
					rotatePhase=2;
				}
			}else{
				if((rotatePhase===0)&&(droneAngleNow<=droneTargetAngle)){
					rotatePhase=1;
				}else if((rotatePhase===1)&&(droneAngleNow>=droneTargetAngle)){
					rotatePhase=2;
				}
			}
			break;
		case -1:
			if(rotateType){
				if(droneAngleNow<=droneTargetAngle){
					rotatePhase=2;
				}
			}else{
				if((rotatePhase===0)&&(droneAngleNow>=droneTargetAngle)){
					rotatePhase=1;
				}else if((rotatePhase===1)&&(droneAngleNow<=droneTargetAngle)){
					rotatePhase=2;
				}
			}
			break;
		default:
			return;
	}
	//if rotatePhase = finish phase, stop drone and initialize rotation flags
	if(rotatePhase===2){
		stopInAir();
		rotateStatus=0;
		droneRotating=false;
	}
}

//inner part for function startRotate()
function startRotateInner(){
	droneRotating=true;//drone really start rotation
	startAction=null;//update startAction to "no starting action"
	thresholdNow=thresholdBigger;//update threshold back to start rotate threshold
	socket.emit('angleAskToStartRotate', { cmd: 'angleAskToStartRotate' });//trigger angleAskToStartRotate event(ask server)
}

//function to let drone start rotate, use setTimeout() function to delay, or call startRotateInner() instantly if startMilliSecond==0
function startRotate(startMilliSecond){
	//clear previous starting action if it exists
	if(startAction!==null){
		clearTimeout(startAction);
	}
	if(startMilliSecond>0){
		startAction=setTimeout(startRotateInner,startMilliSecond);
	}else{
		startRotateInner();
	}
}

//set rotation by rotateDir, 1 for CounterClockwise, -1 for Clockwise, the last call on this will trigger startRotate() after startDelayMsec msec
function setRotate(rotateDir,dirOffset){
	if((drone_status===true)&&(droneRotating===false)){
		//rotation initialize
		if(rotateDir*rotateStatus===0){
			cummuDirOffset=0;//initialize cummuDirOffset
			rotateStatus=rotateDir;//update rotateStatus to rotateDir
			thresholdNow=thresholdSmaller;//update threshold to rotating threshold
		}
		//cumulative dirOffset
		cummuDirOffset+=dirOffset;
		//delay start rotation
		startRotate(startDelayMsec);
	}
}

//function to calculate angle between 2 vectors
function angleCalculator(fromX,fromY,toX,toY){
	var dot=0.00;
	var det=0.00;
	dot = fromX * toX + fromY * toY;
	det = fromX * toY - toX * fromY;
	return Math.atan2(det, dot)*180.0 / Math.PI; 
}
// Some other fun rotations to try...
//var rotation = "rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
//var rotation = "rotate("+ tiltLR +"deg) rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
