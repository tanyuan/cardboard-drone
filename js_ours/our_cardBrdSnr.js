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
var cummuDirOffsetDrone;//cumulative turning degree drone really turned
var last_droneAngle;//last frame droneAngleNow 
var droneRotating;//if drone really rotating
var frameCountDrone;//frame counts after drone really start rotation
var checkIntervalDrone;//interval of frame to check drone angle offset

//event to debug, auto change drone counterClockwiseDegree
/*var testDir;
function test(){
	socket.emit('test', { cmd: 'test' , dir: testDir});
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
	checkIntervalDrone=10;
  
	//event to really start rotation
	socket.on('angleAnsToStartRotate', function(data) {
		angleAnsToStartRotateCallback(data.angle);
	});
	
	//event that try to stop rotation
	socket.on('angleAnsToStopRotate', function(data) {
		angleAnsToStopRotateCallback(data.angle);
	});
	
	//event to debug, auto change drone counterClockwiseDegree
	/*testDir=0;
	setInterval(test,1000);*/
  
	if (window.DeviceOrientationEvent) {
		document.getElementById("doEvent").innerHTML = "DeviceOrientation";
		// Listen for the deviceorientation event and handle the raw data
		window.addEventListener('deviceorientation', function(eventData) {
			count += 1;
			if(count===10000){
				count=0;
			}
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
	//initialize cummuDirOffsetDrone and last_droneAngle and frameCountDrone
	cummuDirOffsetDrone=0;
	frameCountDrone=0;
	last_droneAngle=droneAngleNow;
	//change rotateStatus direction according to final cummuDirOffset
	if(cummuDirOffset>0){
		rotateStatus=1;
	}else if(cummuDirOffset<0){
		rotateStatus=-1;
	}else if(cummuDirOffset===0){
		rotateStatus=0;
	}
	//debug info
	/*socket.emit('message', { debug: last_droneAngle , varName:'last_droneAngle'});
	socket.emit('message', { debug: cummuDirOffset , varName:'cummuDirOffset'});
	testDir=rotateStatus;*/
	//really start drone rotation
	switch(rotateStatus){
		case 1:
			rotateCounterClockwise(rotateSpeed);
			break;
		case -1:
			rotateClockwise(rotateSpeed);
			break;
		default:
			return;
	}
	droneRotating=true;//drone really start rotation
}

//function that try to stop rotation
function angleAnsToStopRotateCallback(droneAngleNow){
	var stopFlag=false;
	//calculate drone angle offset and cumulative DirOffsetDrone
	cummuDirOffsetDrone+=angleCalculator(Math.cos(last_droneAngle*Math.PI/180.0),Math.sin(last_droneAngle*Math.PI/180.0),Math.cos(droneAngleNow*Math.PI/180.0),Math.sin(droneAngleNow*Math.PI/180.0) );
	//judge if stop drone
	switch(rotateStatus){
		case 1:
			if(cummuDirOffsetDrone>=cummuDirOffset){
				stopFlag=true;
			}
			break;
		case -1:
			if(cummuDirOffsetDrone<=cummuDirOffset){
				stopFlag=true;
			}
			break;
		default:
			stopFlag=true;
	}
	//stop drone
	if(stopFlag===true){
		stopInAir();
		rotateStatus=0;
		droneRotating=false;
		//for debug
		//testDir=rotateStatus;
	}
	last_droneAngle=droneAngleNow;
	//debug info
	//socket.emit('message', { debug: cummuDirOffsetDrone , varName:'cummuDirOffsetDrone'});
}

//inner part for function startRotate()
function startRotateInner(){
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
