// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var moment      = require('moment');  
// var bcrypt      = require('bcrypt'); 

var jwt    = require('jwt-simple'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));
var apiRoutes = express.Router(); 

// =======================
// routes ================
// =======================
// basic route
// route to show a random message (GET http://localhost:8080/api/)




apiRoutes.post('/authenticate', function(req, res) {

  User.findOne({name: req.body.username}, function(err, user) {

  	if(err) {


    // user not found 
 
    console.log('Error occured reading database');
    return res.sendStatus(401);

    }

  	if(!user){
     

      return res.status(401).send({ 
        success: false, 
        message: 'Authentication failed. User not found.' 
    });
      
   }

    
    else if (user) {

         if(user.password != req.body.password){
          res.json({ success: false, message: 'Authentication failed. Password incorrect.' });
          return res.sendStatus(401);

       }
         else{
           var expires = moment().add(7, 'days').valueOf();

         	var token = jwt.encode({
  iss: user.id,
  exp: expires
}, app.get('superSecret'));

 // return the information including token as JSON
        res.json({
          success: true,
          user: user.toJSON(),
          token: token,
          expires: expires
        });


         }
       
    }
   
  });
}); 


apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});




apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
 var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
 // var token = req.body.token || req.query.token || req.headers['x-access-token'];

if (token) {
  try {
    var decoded = jwt.decode(token, app.get('superSecret'));
    if (decoded.exp <= Date.now()) {
  res.end('Access token has expired', 400);
}
    req.decoded = decoded;
    User.findOne({ _id: decoded.iss }, function(err, user) {
  req.user = user;
});
    // handle token here
next();

  } catch (err) {
    return res.json({ success: false, message: 'Failed to authenticate token.' });  
    
  }
} else {
   return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
  next();
}







  // decode token
  // if (token) {

  //   // verifies secret and checks exp
  //   jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
  //     if (err) {
  //       return res.json({ success: false, message: 'Failed to authenticate token.' });    
  //     } else {
  //       // if everything is good, save to request for use in other routes
  //       req.decoded = decoded;    
  //       next();
  //     }
  //   });

  // } else {

  //   // if there is no token
  //   // return an error
  //   return res.status(403).send({ 
  //       success: false, 
  //       message: 'No token provided.' 
  //   });
    
  // }




});







apiRoutes.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    name: 'Lina', 
    password: 'password',
    admin: true 
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});






apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
}); 













app.use('/api', apiRoutes);


// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Listening at http://localhost:' + port);