var actionHeroWebSocket = function(connectCallback){
  var self = this;
  var e = new io.EventEmitter();
  for(var i in e){ self[i] = e[i]; }
  if(connectCallback != null){ self.connectCallback = connectCallback;}   
  self.messageCount = 1;
  self.responseTimeout = 30000;
  self.responseHandlers = {};
  self.startingTimeStamps = {};
  self.responseTimesouts = {};
  self.details = {};
  
  self.ws = io.connect('/');

  self.ws.on('error', function(response){
    self.emit('error', "web socket error", response);
  });

  self.ws.on('say', function(response){
    self.emit('say', response);
  });

  self.ws.on('welcome', function(response){
    self.registerCallback('detailsView', {}, function(err, response, delta){
      self.details = response.details;
      self.emit("connected", self.details);
      if(typeof self.connectCallback == 'function'){
        connectCallback(self.details);
      }
    });
  });

  self.ws.on('response', function(response){
    if(typeof self.responseHandlers[response.messageCount] == 'function'){
      var delta = new Date().getTime() - self.startingTimeStamps[response.messageCount];
      self.responseHandlers[response.messageCount](response.error, response, delta);
      delete self.responseTimesouts[response.messageCount];
      delete self.startingTimeStamps[response.messageCount];
      delete self.responseHandlers[response.messageCount];
    }
  });   
}

actionHeroWebSocket.prototype.registerCallback = function(event, params, next){
  var self = this;
  if (params == null){ params = {}; }
  if(typeof next == 'function'){
    self.responseHandlers[self.messageCount] = next;
    self.startingTimeStamps[self.messageCount] = new Date().getTime();
    self.responseTimesouts[self.messageCount] = setTimeout(function(){
      self.emit('timeout', event, params, next);
    }, self.responseTimeout, event, params, next);
  }
  self.messageCount++;
  self.ws.emit(event, params);
}

actionHeroWebSocket.prototype.action = function(action, params, next){
  if (params == null){ params = {}; }
  params['action'] = action;
  this.registerCallback('action', params, next);
}

actionHeroWebSocket.prototype.say = function(message, next){
  this.registerCallback('say', {message: message}, next);
}

actionHeroWebSocket.prototype.roomView = function(next){
  this.registerCallback('roomView', {}, next);
}

actionHeroWebSocket.prototype.roomChange = function(room, next){
  this.registerCallback('roomChange', {room: room}, next);
}

actionHeroWebSocket.prototype.listenToRoom = function(room, next){
  this.registerCallback('listenToRoom', {room: room}, next);
}

actionHeroWebSocket.prototype.silenceRoom = function(room, next){
  this.registerCallback('silenceRoom', {room: room}, next);
}

actionHeroWebSocket.prototype.quit = function(){
  this.ws.emit("quit");
}