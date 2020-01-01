
const { queue } = require( 'async' );
const SerialPort = require( 'serialport' );
const InterByteTimeout = require( '@serialport/parser-inter-byte-timeout' );
const { generateCommand } = require( "./greyko-communication-helpers" );
const { getResponseData } = require( "./greyko-communication-helpers" );

class GreykoCommunication {
	constructor( port = null ) {
		// TODO auto detect port
		this.serialPort = port;
		this.currentTask = null; // Contains the current task that's being executed.

		this.commandQueue = new queue( ( task, next ) => {
			console.log( 'Running task', task );
			this.currentTask = { ...task, finishTask: next };
			this.serialPort.write( new Buffer.from( task.command ) );
		}, 1 );
	}

	setupPort = async ( port = '' ) => {
		return new Promise( ( resolve, reject ) => {
			if ( !port && this.serialPort ) {
				port = this.serialPort;
			} else {
				reject( 'Port not specified!' );
			}
			this.serialPort = new SerialPort( port, {
				baudRate: 9600,
				autoOpen: false,
			}, ( err ) => {
				reject( 'Unable to open port: ' + err );
			} );

			// Add Parser to process data after a timeout of 10 seconds. This simplifies the logic below
			const parser = this.serialPort.pipe( new InterByteTimeout( { interval: 100 } ) );
			parser.on( 'data', this.processResponse );

			this.serialPort.on( 'open', ( data ) => {
				resolve( this.serialPort );
			} );

			this.serialPort.open();
		} );
	};



	sendCommand = async ( command, data ) => {
		return new Promise( ( resolve, reject ) => {
			const preparedCmd = generateCommand( command, data );
			console.log( 'Will send', preparedCmd );
			this.commandQueue.push( {
				command: preparedCmd,
				resolve,
				reject
			} );
		} );
	};

	processResponse = ( response ) => {
		// Unlock the process, then resolve things
		if ( !this.currentTask ) {
			throw 'No current task set while receiving response' + response.toString();
		}

		const currentTask = this.currentTask;
		this.currentTask = null;

		// Add a 1 second delay before running next task as burner controller can't cope
		setTimeout( currentTask.finishTask, 1000 );

		try {
			const responseData = getResponseData( response );
			currentTask.resolve( responseData );
		} catch ( e ) {
			currentTask.reject( e );
		}
	};
}

module.exports = GreykoCommunication;
