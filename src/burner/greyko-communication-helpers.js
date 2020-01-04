const { sum } = require( 'lodash' );
const { COMMAND_HEADER } = require( "./constants" );
const debug = require( 'debug' )( 'pamno:serial-comm-helpers' );

const calculateCommandChecksum = ( command ) => ( sum( command ) & 0xFF ) ^ 0xFF;

const generateCommand = ( command, data = [] ) => {
	let cmd = new Buffer.from( [
		data.length + 2, // Payload Length bytes = payload.length + 1xCommand + 1xChecksum
		command,
		...data, // payload
	] );

	cmd = new Buffer.from( [...cmd, calculateCommandChecksum( cmd )] ); // Calculate checksum and add it to the end of the data

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
		debug( 'Got wrong response length: Expected: %d, Actual: %d', ( COMMAND_HEADER.length + 1 + response[ COMMAND_HEADER.length ] ), response.length )
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
		debug( 'Response checksum difference: ' );
		debug( 'Response: %O', response );
		debug( 'Data buffer: %O', dataBuff );
		debug( 'Sum: %d, LSB: %d', sum( dataBuff.slice( 0, - 1 ) ), sum( dataBuff.slice( 0, - 1 ) ) & 0xFF );
		debug( 'Expected checksum: %d', dataBuff[ dataBuff.length - 1 ] );
		debug( 'Expected sum: %d', dataBuff[ dataBuff.length - 1 ] ^ 0xFF );
		debug( 'Actual checksum: %d', checksum );
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
