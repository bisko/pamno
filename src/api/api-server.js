const createError = require( 'http-errors' );
const express = require( 'express' );
const path = require( 'path' );
const cookieParser = require( 'cookie-parser' );
const logger = require( 'morgan' );

const indexRouter = require( './routes' );
const usersRouter = require( './routes/users' );
const changeModeRouter = require('./routes/changemode');

const apiServer = express();

const baseDir = [__dirname, '..', '..'];

// view engine setup
apiServer.set( 'views', path.join( ...baseDir, 'views' ) );
apiServer.set( 'view engine', 'ejs' );

apiServer.use( logger( 'dev' ) );
apiServer.use( express.json() );
apiServer.use( express.urlencoded( { extended: false } ) );
apiServer.use( cookieParser() );
apiServer.use( express.static( path.join( ...baseDir, 'public' ) ) );

apiServer.use( '/', indexRouter );
apiServer.use( '/users', usersRouter );
apiServer.use( '/changeMode', changeModeRouter );

// catch 404 and forward to error handler
apiServer.use( function( req, res, next ) {
	next( createError( 404 ) );
} );

// error handler
apiServer.use( function( err, req, res, next ) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get( 'env' ) === 'development' ? err : {};

	// render the error page
	res.status( err.status || 500 );
	res.render( 'error' );
} );

module.exports = apiServer;
