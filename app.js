var http = require('http');
var fs = require('fs');
var url = require('url');
var pathUtil = require('path');
var qs = require('querystring');

var drone_Stream = require("dronestream");
var ardrone = require('ar-drone');
var arDroneConstants = require("ar-drone/lib/constants");
var client = ardrone.createClient({ip: '127.0.0.1'});//use when debugging
//var client = ardrone.createClient();//use when connecting drone

//config drone navdata
function navdata_option_mask(c) {
  return 1 << c;
}

var navdata_options = (
    navdata_option_mask(arDroneConstants.options.DEMO)
  | navdata_option_mask(arDroneConstants.options.VISION_DETECT)
  | navdata_option_mask(arDroneConstants.options.MAGNETO)
  | navdata_option_mask(arDroneConstants.options.WIFI)
);

client.config('general:navdata_demo', true);
client.config('general:navdata_options', navdata_options);
client.config('video:video_channel', 0);
client.config('detect:detect_type', 12);

//record drone direction
var clockwiseDegree=0;
client.on('navdata', function(data){
	if(data.demo){
		clockwiseDegree=data.demo.clockwiseDegrees;
	}
});

//drone flying or not
var drone_status=false;
  
//can use to get screen shot
var pngStream = client.getPngStream();
var lastPng;
pngStream
  .on('error', console.log)
  .on('data', function(pngBuffer) {
    lastPng = pngBuffer;
});

//node.js server
var server = http.createServer(function(req, res){

	var urlData = url.parse(req.url,true);
	var path=urlData.pathname;
  
	switch (path){
		case '/':
			res.writeHead(200, {'Content-Type': 'text/html'});
			fs.createReadStream(__dirname + '/index.html').pipe(res);
			break;
		default:
			fs.exists(__dirname+path, function (exists) {
				if(exists){
					var ext=pathUtil.extname(path);
						switch (ext){
							case '.html':
								res.writeHead(200, {'Content-Type': 'text/html'});
								break;
							case '.png':
								res.writeHead(200, {'Content-Type': 'image/png'});
								break;
							case '.jpg':
								res.writeHead(200, {'Content-Type': 'image/jpeg'});
								break;
							case '.jpeg':
								res.writeHead(200, {'Content-Type': 'image/jpeg'});
								break;
							case '.js':
								res.writeHead(200, {'Content-Type': 'text/javascript'});
								break;
							default:
								break;
						}
						fs.createReadStream(__dirname + path).pipe(res);
				}else{
					res.writeHead(404);
					res.write('404 File Not Found!');
					res.end();
				}
			});
			break;
	}
});

//start servers
drone_Stream.listen(server,{tcpVideoStream:client.getVideoStream()});
server.listen(8001);

var io = require('socket.io').listen(server);

//accept drone cmd via socket.io, control drone by client.<function name>(); 
io.sockets.on('connection', function(socket) {

	console.log('socketIOconnect');
	
	if(drone_status){
		socket.emit('flying', { status: 'flying' });
	}else{
		socket.emit('landing', { status: 'landing' });
	}
	
	socket.on('takeoff', function (data) {
		console.log(data);
		client.takeoff();
		drone_status=true;
		socket.emit('flying', { status: 'flying' });
		socket.broadcast.emit('flying', { status: 'flying' });
	});
	
	socket.on('land', function (data) {
		console.log(data);
		client.stop();
		client.land();
		drone_status=false;
		socket.emit('landing', { status: 'landing' });
		socket.broadcast.emit('landing', { status: 'landing' });
	});
	
	socket.on('moveStop', function (data) {
		console.log(data);
		client.stop();
	});

	socket.on('moveUp', function (data) {
		console.log(data);
		client.up(data.speed);
	});

	socket.on('moveDown', function (data) {
		console.log(data);
		client.down(data.speed);
	});

	socket.on('moveLeft', function (data) {
		console.log(data);
		client.left(data.speed);
	});

	socket.on('moveRight', function (data) {
		console.log(data);
		client.right(data.speed);
	});

	socket.on('moveFront', function (data) {
		console.log(data);
		client.front(data.speed);
	});

	socket.on('moveBack', function (data) {
		console.log(data);
		client.back(data.speed);
	});

	socket.on('rotateClockwise', function (data) {
		console.log(data);
		client.clockwise(data.speed);
	});

	socket.on('rotateCounterClockwise', function (data) {
		console.log(data);
		client.counterClockwise(data.speed);
	});	
	
	socket.on('message', function (data) {
		console.log(data.debug);
	});
});

//force drone to land now
var keypress = require('keypress');
keypress(process.stdin);
process.stdin.on('keypress', function(ch, key) {
    if (key && key.ctrl && key.name == 'c') {
        process.exit(0);
    }else if(key && key.ctrl && key.name == 'q') {
        console.log('force landing the drone.');
		client.stop();
		client.land();
		drone_status=false;
    }
});
process.stdin.setRawMode(true);
process.stdin.resume();

process.on('uncaughtException', function (err) {
  console.log(err);
});

console.log('Ctrl+q to force landing the drone.');


