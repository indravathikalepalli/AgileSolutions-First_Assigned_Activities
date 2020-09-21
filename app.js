const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const MongoClient = require('mongodb').MongoClient;
const service = require('feathers-mongodb');

// A messages service that allows to create new
// and return all existing messages
class MessageService {
  constructor() {
    this.messages = [];
  }

  async find () {
    // Just return all our messages
    return this.messages;
  }

  async create (data) {
    // The new message is the data merged with a unique identifier
    // using the messages length since it changes whenever we add one
    const message = {
      id: this.messages.length,
      text: data.text
    }

    // Add new message to the list
    this.messages.push(message);

    return message;
  }
}

// Create an Express compatible Feathers application instance.
const app = express(feathers());
// Turn on JSON parser for REST services
app.use(express.json());
// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({extended: true}));

app.use(express.static(__dirname));
// Enable REST services
app.configure(express.rest());
// Enable Socket.io
app.configure(socketio());

// Connect to the db, create and register a Feathers service.
app.use('/messages'  ,service(new MessageService(),{
  paginate: {
    default: 2,
    max: 4
  }
}));

// A basic error handler, just like Express
app.use(express.errorHandler());

// Connect to your MongoDB instance(s)
MongoClient.connect('mongodb://localhost:27017/feathers-mongodbs',{ useNewUrlParser: true, useUnifiedTopology: true })
  .then(function(client){
    // Set the model now that we are connected
    app.service('messages').Model = client.db('feathers-mongodbs').collection('messages');

    // Now that we are connected, create a dummy Message
    app.service('messages').hooks({
      before: {
        create: [async context => {
          context.data.createdAt = new Date();
    
          return context;
        }],
        update: [async context => {
          context.data.text=context.data.text + context.data.createdAt;
          return context;
        }]
      }
  });
}).catch(error => console.error(error));


// Start the server.
const port = 3030;

app.listen(port, () => {
  console.log(`Feathers server listening on port ${port}`);
});
