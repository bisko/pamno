const influx = require( 'influx' );
const config = require( 'config' );
const { isArray, isObject } = require( 'lodash' );

class InfluxStorage {

	constructor() {
		this.influxInstances = [];
		this.setupInflux();
	}

	setupInflux = () => {
		const influxConfig = config.get( 'INFLUX' );
		if ( !isArray( influxConfig ) && isObject( ( influxConfig ) ) ) {
			this.addInstance( influxConfig ).then().catch(console.log);
		} else {
			influxConfig.forEach( ( config ) => this.addInstance( config ) );
		}

		// TODO ensure DB creation/existence
		// TODO additional initialization if needed
	};

	addInstance = async ( config ) => {
		this.influxInstances.push( new influx.InfluxDB( {
			host: config.host,
			port: config.port,
			username: config.username,
			password: config.password,
			database: config.db,
		} ) );
	};

	queryWrite = async ( measurement, measurementObject ) => {
		this.influxInstances.forEach( ( instance ) => {
			instance.writeMeasurement( measurement, measurementObject )
				.then( ( res ) => console.log( 'res', res ) )
				.catch( ( err ) => console.log( 'ERR', err ) );
		} );
	};
}

module.exports = InfluxStorage;
