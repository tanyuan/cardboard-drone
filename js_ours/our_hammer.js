var tapEventFlagArray = [];//tapFlag to avoid two same event too close
var offsetLeft;//left canvas topLeft position
var offsetRight;//right canvas topLeft position

//init tapFlag
function initTapEventFlagArray(idx){
	for(i=0;i<idx;i++){
		tapEventFlagArray.push(false);
	}
}

//init hammer events
function initHammer(target) {
	var canvas = document.getElementById(target);

	var mc = new Hammer.Manager(canvas);
	
	mc.add(new Hammer.Tap());

	mc.on("tap", handleTap);
}

//tap button event callback
function handleTap(ev) {	
	var windowSCleft=$(window).scrollLeft();
	var windowSCtop=$(window).scrollTop();
	var touchX=ev.center.x+windowSCleft;
	var touchY=ev.center.y+windowSCtop;
	var xL=touchX-offsetLeft.left;
	var yL=touchY-offsetLeft.top;
	var xR=touchX-offsetRight.left;
	var yR=touchY-offsetRight.top;
	
	if(((xL>565)&&(xL<615)&&(yL>9)&&(yL<59))||((xR>565)&&(xR<615)&&(yR>9)&&(yR<59))){
		if(!tapEventFlagArray[0]){
			tapEventFlagArray[0]=true;
			if(drone_status){
				$('#checkLand').trigger('openModal');
			}else{
				$('#checkTakeoff').trigger('openModal');
			}
			setTimeout("tapEventFlagArray[0]=false;",500); 
		}
	}
}

