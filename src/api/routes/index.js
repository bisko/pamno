const express = require( 'express' );
const router = express.Router();

const commChannel = require( '../../burner/greyko-communication' );
const { BURNER_MODES } = require( "../../burner/constants" );

/* GET home page. */
router.get( '/', function( req, res, next ) {
	res.render( 'index', {
		title: 'Памно!',
		status: commChannel.currentStatus,
		burnerModes: BURNER_MODES,
		modeIcon: {
			Standby: '😴',
			Auto: '🚂',
			Timer: '⏰'
		}[commChannel.currentStatus.mode],
		statusImage: {
			powerOn: 'https://66.media.tumblr.com/35722e133ae8acc1ecc4248516c2c9a8/tumblr_p9t2ip1JZc1wzvt9qo4_500.gifv',
		}['powerOn'],
	} );

	next();
} );

module.exports = router;
