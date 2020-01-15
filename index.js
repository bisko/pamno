const app = require( './src/api/api-server' );
const debug = require( 'debug' )( 'greyko:server' );
const http = require( 'http' );
const config = require( 'config' );

const commChannel = require( './src/burner/greyko-communication' );

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort( process.env.PORT || '3001' );
app.set( 'port', port );

/**
 * Create HTTP server.
 */

const server = http.createServer( app );

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort( val ) {
	const port = parseInt( val, 10 );

	if ( isNaN( port ) ) {
		// named pipe
		return val;
	}

	if ( port >= 0 ) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError( error ) {
	if ( error.syscall !== 'listen' ) {
		throw error;
	}

	const bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch ( error.code ) {
		case 'EACCES':
			console.error( bind + ' requires elevated privileges' );
			process.exit( 1 );
			break;
		case 'EADDRINUSE':
			console.error( bind + ' is already in use' );
			process.exit( 1 );
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug( 'Listening on ' + bind );
}


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen( port );
server.on( 'error', onError );
server.on( 'listening', onListening );
console.log( 'Starting connection' );
//const { CMDS, BURNER_MODES, PRIORITY_MODES } = require( './src/burner/constants' );
commChannel.setupPort( config.get( 'SERIAL_PORT.port' ) ).then( () => {
	console.log( 'Connected to port' );
	//changeMode( commChannel, BURNER_MODES.TIMER, PRIORITY_MODES.CH_PRIORITY );
} ).catch( console.error );

//
//
// const { CMDS, BURNER_MODES, PRIORITY_MODES } = require( './src/burner/constants' );
//
// const GreykoCommunication = require( "./src/burner/greyko-communication.js" );
// const { getStatus, changeMode } = require( "./src/burner/greyko-commands" );
// const CommChannel = new GreykoCommunication( 'COM10' );

// changeMode( CommChannel, BURNER_MODES.STANDBY, PRIORITY_MODES.CH_PRIORITY ).then( ( resp ) => {
// 	console.log( 'Change resp', resp );
// 	getStatus().then( (status) => {
// 		console.log( status );
// 		// changeMode( BURNER_MODES.TIMER, PRIORITY_MODES.CH_PRIORITY ).then( ( resp ) => {
// 		// 	console.log( 'Change resp', resp );
// 		// 	getStatus().then( console.log );
// 		// } ).catch( console.error );
// 	} );
// } ).catch( console.error );


//
// const message = "\x5A\x5A\x02\x01\xF0";
// const buff = new Buffer.from( '5A5A0201FD', 'hex' );
// console.log( buff );
// port.write( buff, function( err ) {
// 		if ( err ) {
// 			return console.log( 'Error on write: ', err.message )
// 		}
// 		console.log( 'message written' )
// 		// setTimeout(() => {
// 		//     const message = '\x5A\x5A\x02\x0A\xF4';
// 		//     console.log(message);
// 		//     port.write(message, function (err) {
// 		//         if (err) {
// 		//             return console.log('Error on write: ', err.message)
// 		//         }
// 		//         console.log('message written')
// 		//     })
// 		// }, 1000);
//
//
// 	}
// )
//
