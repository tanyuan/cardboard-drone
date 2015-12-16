//callback when fullscreenchange
function initFullScreen(){
	document.addEventListener("fullscreenchange", function () {
		initCanvasPos("Left");
		initCanvasPos("Right");
	}, false);

	document.addEventListener("mozfullscreenchange", function () {
		initCanvasPos("Left");
		initCanvasPos("Right");
	}, false);

	document.addEventListener("webkitfullscreenchange", function () {
		initCanvasPos("Left");
		initCanvasPos("Right");
	}, false);

	document.addEventListener("msfullscreenchange", function () {
		initCanvasPos("Left");
		initCanvasPos("Right");
	}, false);
}

//go fullscreen
function fullscreen(){
	var el = document.getElementById("canvasContainer");

	if(el.webkitRequestFullScreen){
		el.webkitRequestFullScreen();
	}else if(el.mozRequestFullScreen){
		el.mozRequestFullScreen();
	}else if(el.msRequestFullScreen){
		el.msRequestFullScreen();
	}else if(el.requestFullScreen){
		el.requestFullScreen();
	}else if(el.requestFullscreen){
		el.requestFullscreen();
	}       
}

//cancel fullscreen
function cancelFullscreen(){
	var el = document;

	if(el.webkitCancelFullScreen){
		el.webkitCancelFullScreen();
	}else if(el.mozCancelFullScreen){
		el.mozCancelFullScreen();
	}else if(el.msCancelFullScreen){
		el.msCancelFullScreen();
	}else if(el.cancelFullScreen){
		el.cancelFullScreen();
	}else if(el.exitFullscreen){
		el.exitFullscreen();
	}     
}