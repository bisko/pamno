const { sum } = require( 'lodash' );
const { COMMAND_HEADER } = require( "./constants" );

const calculateCommandChecksum = ( command ) => ( sum( command ) & 0xFF ) ^ 0xFF;

const generateCommand = ( command, data = [] ) => {
	let cmd = new Buffer.from( [
		data.length + 2, // Payload Length bytes = payload.length + 1xCommand + 1xChecksum
		command,
		...data, // payload
	] );
	console.log( cmd );
	cmd = new Buffer.from( [...cmd, calculateCommandChecksum( cmd )] ); // Calculate checksum and add it to the end of the data
	console.log( cmd );
	/**
	 * Increase the value of each byte with it's position in the command, starting after the command length position
	 * I.e. `5A 5A 04 03 01 00 F7` becomes  `5A 5A 04 03 02 02 FA`
	 */
	for ( let i = 1; i < cmd.length; i ++ ) {
		cmd[ i ] = cmd[ i ] + ( i - 1 );
	}

	return new Buffer.from( [...COMMAND_HEADER, ...cmd] );
};

const getResponseData = ( response ) => {
	if ( response.length !== COMMAND_HEADER.length + 1 + response[ COMMAND_HEADER.length ] ) {
		console.log( response );
		throw  'Wrong response length. Actual: ' + response.length + ' / Expected: ' + ( COMMAND_HEADER.length + 1 + response[ COMMAND_HEADER.length ] )
	}

	// Remove the Command header from the response
	const dataBuff = new Buffer.from( response.slice( COMMAND_HEADER.length ) );

	// Decrement all the values that are received after the packet length with their respective position
	// Values shouldn't overflow and should be set to 0 if they fall below that.
	for ( let i = 1; i < dataBuff.length; i ++ ) {
		dataBuff[ i ] = dataBuff[ i ] - ( i - 1 );
	}

	const checksum = calculateCommandChecksum( dataBuff.slice( 0, - 1 ) );

	if ( dataBuff[ dataBuff.length - 1 ] !== checksum ) {
		console.log( response );
		console.log( dataBuff );
		console.log( dataBuff.slice( 0, - 1 ) );
		console.log( 'Sum', sum( dataBuff.slice( 0, - 1 ) ), sum( dataBuff.slice( 0, - 1 ) ) & 0xFF );
		console.log( 'Expected checksum', dataBuff[ dataBuff.length - 1 ] );
		console.log( 'Expected sum', dataBuff[ dataBuff.length - 1 ] ^ 0xFF );
		console.log( 'Actual checksum', checksum );
		throw 'Invalid response checksum';
	}

	return dataBuff.slice( 1, - 1 ); // Trim out the command length and checksum bytes
};

// Calculates the checksum of the packet
module.exports = {
	calculateCommandChecksum,
	generateCommand,
	getResponseData
};
