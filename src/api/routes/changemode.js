const express = require( 'express' );
const asyncHandler = require( 'express-async-handler' );
const config = require( 'config' );

const { BURNER_MODES, PRIORITY_MODES } = require( '../../burner/constants' );
const commChannel = require( '../../burner/greyko-communication' );

const router = express.Router();

/* GET users listing. */
router.get( '/:id', asyncHandler( async ( req, res, next ) => {

	// TODO Extract to env variables or secrets
	/**
	 * Validate/auth of endpoint
	 * @type {{password: string, login: string}}
	 */
	const auth = { login: config.get( 'HTTP_AUTH.username' ), password: config.get( 'HTTP_AUTH.password' ) };

	const b64auth = ( req.headers.authorization || '' ).split( ' ' )[ 1 ] || '';
	const [login, password] = new Buffer( b64auth, 'base64' ).toString().split( ':' );

	if ( !login || !password || login !== auth.login || password !== auth.password ) {
		res.set( 'WWW-Authenticate', 'Basic realm="401"' ); // change this
		res.status( 401 ).send( 'Authentication required.' ); // custom message
		return next();
	}

	const burnerMode = req.params.id;

	if ( isNaN( parseFloat( burnerMode ) ) || !isFinite( parseFloat( burnerMode ) ) ) {
		res.send( 'Invalid mode' );
	} else {
		const mode = parseInt( burnerMode, 10 );
		if ( Object.values( BURNER_MODES ).indexOf( mode ) !== - 1 ) {
			try {
				await commChannel.changeMode( mode, PRIORITY_MODES.CH_PRIORITY );
				await commChannel.updateStatus();
				res.redirect( '/' );
			} catch ( err ) {
				res.send( 'Failed to set mode: ' + err );
				console.error( err );
			}
		} else {
			res.send( 'Invalid mode' );
		}
	}
} ) );

module.exports = router;
