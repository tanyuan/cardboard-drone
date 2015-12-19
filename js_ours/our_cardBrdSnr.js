// Track phone orientation
var count;
var last_dir;
var last_tiltLR;

var stopAction;//manage the status of stopping action
var rotateStatus;//0 for not rotating, 1 for rotating CounterClockwise, -1 for rotating Clockwise
var rotateSpeed; //rotate constant speed float 0~1
var stopDelayMsec; //stop constant delay in millisecond
var thresholdNow;//threshold  now
var thresholdBigger;//threshold to start rotate
var thresholdSmaller;//threshold when rotating

function initCardBoardSensor() {
  count=0;
  last_dir=0;
  last_tiltLR=0;

  stopAction=null;
  rotateStatus=0;
  rotateSpeed=0.3;
  stopDelayMsec=500;
  thresholdBigger=30;
  thresholdSmaller=10;
  thresholdNow=thresholdBigger;
  
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
      var dir = eventData.alpha
      
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
  // Turn left: from 360 to +0
  if(Math.abs(last_tiltLR-tiltLR)<90){
	  if (dir - last_dir < (-360+thresholdNow)) {
		document.getElementById("doAction").innerHTML = "<<<<<<+";
		rotate(1);
	  }
	  // Turn right: from +0 to 360
	  else if (dir - last_dir > (360-thresholdNow)) {
		document.getElementById("doAction").innerHTML = ">>>>>>+";
		rotate(-1);
	  }
	  // Turn left
	  else if (dir - last_dir > thresholdNow) {
		document.getElementById("doAction").innerHTML = "<<<<<<";
		rotate(1);
	  }
	  // Turn right
	  else if (dir - last_dir < -thresholdNow) {
		document.getElementById("doAction").innerHTML = ">>>>>>";
		rotate(-1);
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

//inner part for function stopRotate()
function stopRotateInner(){
	stopInAir();//cmd drone to stop
	stopAction=null;//update stopAction to "no stopping action"
	rotateStatus=0;//update rotateStatus to not rotating
	thresholdNow=thresholdBigger;//update threshold back to start rotate threshold
}

//function to let drone stop, use setTimeout() function to delay, or stop drone instantly if stopMilliSecond==0
function stopRotate(stopMilliSecond){
	//clear previous stopping action if it exists
	if(stopAction!==null){
		clearTimeout(stopAction);
	}
	if(stopMilliSecond>0){
		stopAction=setTimeout(stopRotateInner,stopMilliSecond);
	}else{
		stopRotateInner();
	}
}

//rotate by rotateDir, 1 for CounterClockwise, -1 for Clockwise, the last call on this will stop drone after 1000 msec
function rotate(rotateDir){
	if(drone_status===true){
		//if rotating inverse direction then stop first
		/*if(rotateDir*rotateStatus===-1){
			stopRotate(0);
		}*/
		//rotate cmd, only when drone not turning
		if(rotateDir*rotateStatus===0){
			switch(rotateDir){
				case 1:
					rotateCounterClockwise(rotateSpeed);
					break;
				case -1:
					rotateClockwise(rotateSpeed);
					break;
				default:
					return;
			}
			rotateStatus=rotateDir;//update rotateStatus to rotateDir
			thresholdNow=thresholdSmaller;//update threshold to rotating threshold
		}
		//delay stop drone
		stopRotate(stopDelayMsec);
	}
}

// Some other fun rotations to try...
//var rotation = "rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
//var rotation = "rotate("+ tiltLR +"deg) rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
