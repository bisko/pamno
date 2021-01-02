const { queue } = require( 'async' );
const SerialPort = require( 'serialport' );
const InterByteTimeout = require( '@serialport/parser-inter-byte-timeout' );
const debug = require( 'debug' )( 'pamno:serial-comm' );

const InfluxStorage = require( '../stats/influx-storage' );
const { generateCommand, getResponseData } = require( "./greyko-communication-helpers" );
const { CMDS } = require( './constants' );

class GreykoCommunication {
	constructor() {
		this.currentTask = null; // Contains the current task that's being executed.

		this.currentStatus = null;
		this.currentStatusInterval = null;

		this.commandQueue = new queue( ( task, next ) => {
			debug( 'Running task: %O', task );
			this.currentTask = { ...task, finishTask: next };
			this.serialPort.write( new Buffer.from( task.command ) );
		}, 1 );

		this.influxStorage = new InfluxStorage();
	}

	setupPort = async ( port = '' ) => {
		return new Promise( ( resolve, reject ) => {
			// TODO auto detect port
			if ( !port ) {
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
				debug( 'Serial port opened' );
				this.currentStatusInterval = setInterval( this.updateStatus, 5000 );
				this.updateStatus();
				resolve( this.serialPort );
			} );

			this.serialPort.on( 'error', ( err ) => {
				debug( 'Serial port error occurred %o', err );
			} );

			this.serialPort.on( 'close', ( err ) => {
				clearInterval( this.currentStatusInterval );
				this.setupPort( port ); // Reopen the port
			} );

			this.serialPort.open();
		} );
	};

	sendCommand = async ( command, data ) => {
		return new Promise( ( resolve, reject ) => {
			const preparedCmd = generateCommand( command, data );
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

		// Add a 0.5 second delay before running next task as burner controller can't cope
		setTimeout( currentTask.finishTask, 500 );

		try {
			const responseData = getResponseData( response );
			currentTask.resolve( responseData );
		} catch ( e ) {
			currentTask.reject( e );
		}
	};


	/**
	 * Commands
	 */
	updateStatus = async () => {
		try {
			this.currentStatus = await this.getStatus();
			await this.resetFeedTime();

			// Save the information in Influx in a separate thread, to avoid the data fetching.
			setTimeout( () => {
				this.pushStatusToInflux( this.currentStatus );
			}, 0 );

		} catch ( err ) {
			this.currentStatus = err;
		}
	};


	pushStatusToInflux = async ( statusObject ) => {
		try {
			const writeResult = await this.influxStorage.queryWrite( 'pamno_stats', [{
				tags: {
					burner: 'montana',
					mode: statusObject.mode,
					currentStatus: statusObject.currentStatus,
					powerMode: statusObject.powerMode,
				},
				fields: {
					mode: statusObject.mode,
					priority: statusObject.priority,
					currentStatus: statusObject.currentStatus,
					tempMax: statusObject.tSet,
					tempCurrent: statusObject.tBoiler,
					flame: statusObject.flame,
					fan: statusObject.fan,
					powerMode: statusObject.powerMode,
					feederTime: statusObject.feederTime,
				}
			}] );
			console.log( 'written', writeResult );
		} catch ( e ) {
			console.log( 'err write', e );
		}
	};

	getStatus = async () => {
		try {
			debug( 'Updating status' );
			const status = await this.sendCommand( CMDS.GET_INFO, [] );
			debug( 'Status received' );
			return {
				hardwareVersion: parseInt( status[ 0 ].toString( 16 ), 10 ),
				softwareVersion: parseInt( status[ 1 ].toString( 16 ), 10 ),
				hour: parseInt( status[ 2 ].toString( 16 ), 10 ),
				minute: parseInt( status[ 3 ].toString( 16 ), 10 ),
				seconds: parseInt( status[ 4 ].toString( 16 ), 10 ),
				day: parseInt( status[ 5 ].toString( 16 ), 10 ),
				month: parseInt( status[ 6 ].toString( 16 ), 10 ),
				year: parseInt( status[ 7 ].toString( 16 ), 10 ),

				mode: ['Standby', 'Auto', 'Timer'][ status[ 8 ] ],
				modeRaw: status[ 8 ],
				priority: ['CH Priority', 'DHW Priority', 'Parallel pumps', 'Summer mode'][ status[ 9 ] ],
				priorityRaw: status[ 9 ],
				currentStatus: [
					'IDLE', 'Fan Cleaning', 'CLEANER', 'Wait', 'Loading',
					'Heating', 'Ignition 1', 'Ignition 2', 'Unfolding', 'Burning', 'Extinction'
				][ status[ 10 ] ],
				currentStatusRaw: status[ 10 ],
				unkn1: status[ 11 ],
				unkn2: status[ 12 ],
				error: [
					// 0 bits, different bits mean different things
					status[ 13 ] & 1 ? 'Ignition fail' : null,
					status[ 13 ] & 32 ? 'Pallet jam' : null,
				].filter( el => el ),
				unkn3: status[ 14 ],
				unkn4: status[ 15 ],
				tSet: status[ 16 ],
				tBoiler: status[ 17 ],
				tDHW: status[ 18 ],
				unkn5: status[ 19 ],
				flame: status[ 20 ],
				unkn6: status[ 21 ], // Bitfield, TODO
				unkn7: status[ 22 ],
				fan: status[ 23 ],
				powerMode: ['Idle', 'Suspend', 'P1', 'P2', 'P3'][ status[ 24 ] ],
				powerModeRaw: status[ 24 ],
				thermostat: status[ 25 ], // Bitfield, TODO
				unkn8: status[ 26 ],
				feederTime: status[ 27 ], // Seconds
			}

		} catch ( err ) {
			debug( 'Unable to get status update %o', err );
			return {};
		}
	};

	changeMode = async ( mode, priorityMode ) => {
		debug( 'Changing mode to: %d , %d', mode, priorityMode )
		try {
			return await this.sendCommand( CMDS.SET_BURNER_MODE, [mode, priorityMode] )
		} catch ( err ) {
			debug( 'Error changing mode: %o', err );
			return null;
		}

	};

	resetFeedTime = async () => {
		debug( 'Resetting feed status' );
		try {
			return await this.sendCommand( CMDS.RESET_PELLET_COUNTER, [] )
		} catch ( err ) {
			debug( 'Unable to reet pellet feed status: %o', err );
			return null;
		}
	};
}

module.exports = new GreykoCommunication();
