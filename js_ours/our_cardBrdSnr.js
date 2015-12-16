// Track phone orientation
var count;
var last_dir;

function initCardBoardSensor() {
  count=0;
  last_dir=0;
  isStopping=false;
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
  if (dir - last_dir < -350) {
    document.getElementById("doAction").innerHTML = "<<<<<<+";
	rotateCounterClockwise(0.3);
  }
  // Turn right: from +0 to 360
  else if (dir - last_dir > 350) {
    document.getElementById("doAction").innerHTML = ">>>>>>+";
	rotateClockwise(0.3);
  }
  // Turn left
  else if (dir - last_dir > 3) {
    document.getElementById("doAction").innerHTML = "<<<<<<";
	rotateCounterClockwise(0.3);
  }
  // Turn right
  else if (dir - last_dir < -3) {
    document.getElementById("doAction").innerHTML = ">>>>>>";
	rotateClockwise(0.3);
  }
  // No action
  else {
    document.getElementById("doAction").innerHTML = "------";
	stopInAir();
  }
  // Store this direction for comparing
  last_dir = dir;
}

// Some other fun rotations to try...
//var rotation = "rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
//var rotation = "rotate("+ tiltLR +"deg) rotate3d(0,1,0, "+ (tiltLR*-1)+"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
