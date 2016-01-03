// Track phone orientation
var count;
var last_dir;
var last_tiltLR;

var rotateStatus;//0 for not rotating, 1 for rotating CounterClockwise, -1 for rotating Clockwise
var rotateSpeed; //rotate constant speed float 0~1
var initDir;//takeoff initial direction
var threshold;//threshold to rotate

function initCardBoardSensor() {
	count=0;
	last_dir=0;
	last_tiltLR=0;
	
	rotateStatus=0;
	rotateSpeed=0.2;
	threshold=20;
  
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
				document.getElementById("doTime").innerHTML = count;
				// Store this direction for comparing
				last_dir = dir;
				// Store this tiltLR for comparing
				last_tiltLR=tiltLR;
				if(drone_status===true){
					calculateAction(tiltLR, tiltFB, dir);
				}
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
  if(Math.abs(last_tiltLR-tiltLR)<90){
	  var dirOffset=angleCalculator(Math.cos(initDir*Math.PI/180.0),Math.sin(initDir*Math.PI/180.0),Math.cos(dir*Math.PI/180.0),Math.sin(dir*Math.PI/180.0) );
	  document.getElementById("dirOffset").innerHTML = dirOffset;
	  // Turn left
	  if (dirOffset > threshold) {
		document.getElementById("doAction").innerHTML = "<<<<<<";
		rotate(1);
	  }
	  // Turn right
	  else if (dirOffset < -threshold) {
		document.getElementById("doAction").innerHTML = ">>>>>>";
		rotate(-1);
	  }
	  // No action
	  else {
		document.getElementById("doAction").innerHTML = "------";
		if(rotateStatus!==0){
			stopInAir();//cmd drone to stop
			rotateStatus=0;//update rotateStatus to not rotating
		}
	  }
  }
}

//rotate by rotateDir, 1 for CounterClockwise, -1 for Clockwise, the last call on this will stop drone after startDelayMsec msec
function rotate(rotateDir){
	if(rotateStatus===0){
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
