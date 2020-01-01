const { CMDS } = require( './constants' );

module.exports = {
	getStatus: async ( commChannel ) => {
		const status = await commChannel.sendCommand( CMDS.GET_INFO, [] );

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
			priority: ['CH Priority', 'DHW Priority', 'Parallel pumps', 'Summer mode'][ status[ 9 ] ],
			currentStatus: [
				'IDLE', 'Fan Cleaning', 'CLEANER', 'Wait', 'Loading',
				'Heating', 'Ignition 1', 'Ignition 2', 'Unfolding', 'Burning', 'Extinction'
			][ status[ 10 ] ],
			unkn1: status[ 11 ],
			unkn2: status[ 12 ],
			error: [
				// 0 bits, different bits mean different things
				status[ 13 ] & 1 ? 'Ignition fail' : null,
				status[ 13 ] & 32 ? 'Pallet jam' : null,
			],
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
			thermostat: status[ 25 ], // Bitfield, TODO
			unkn8: status[ 26 ],
			feederTime: status[ 27 ], // Seconds
		}
	},

	changeMode: async ( commChannel, mode, priorityMode ) => {
		return await commChannel.sendCommand( CMDS.SET_BURNER_MODE, [mode, priorityMode] );
	},
};
