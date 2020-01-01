const { CMDS, BURNER_MODES, PRIORITY_MODES } = require( './constants' );

const GreykoCommunication = require( "./greyko-communication.js" );
const { getResponseData } = require( "./greyko-communication-helpers" );
const { getStatus } = require( "./greyko-commands" );
const { changeMode } = require( "./greyko-commands" );
const CommChannel = new GreykoCommunication( 'COM10' );


CommChannel.setupPort().then( () => {
	setInterval(() =>{
		getStatus(CommChannel).then( ( status ) => {
			console.log( status );
		} ).catch( console.log );
	}, 5000);

} ).catch( console.error );
//CommChannel.sendCommand( CMDS.SET_BURNER_MODE, [BURNER_MODES.TIMER, PRIORITY_MODES.CH_PRIORITY] );

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
