module.exports = {
	googleClientID: '806365652219-kbrft4gpno8kmkuobb1g26k8qrd25ogp.apps.googleusercontent.com',
	googleClientSecret: '8PhFPEXn_TRKdXcP2p8lMA9E',
	mongoURI: 'mongodb+srv://admin:A0DstbneGuqadaBl@cluster0-et0t9.mongodb.net/test?retryWrites=true&w=majority',
	cookieKey: 'asdi9dsaji8282828jwk',
};

module.exports = {
	googleClientID: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
	mongoURI: process.env.MONGO_URI,
	cookieKey: process.env.COOKIE_KEY,
};
