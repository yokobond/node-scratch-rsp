# scratch-rsp

Node module to connect Scratch(v1.4) via Remote-Sensor-Protocol.

ref: [Remote Sensors Protocol - Scratch Wiki](http://wiki.scratch.mit.edu/wiki/Remote_Sensors_Protocol)

## Installation

Install with npm:

```sh
npm install scratch-rsp
```
Or by cloning this repository:
```sh
git clone https://github.com/yokobond/node-scratch-rsp.git
```

## Examples

Connect Scratch then send sensor-update and send/receive broadcast messages.

```javascript
var scratchRSP = require('scratch-rsp');
console.log('start');
var scratchSocket = scratchRSP.createConnection('localhost', function () {
    var sensorsMap = new Map([['note', 60], ['seconds', 0.1], ['shift "tone"', -1]]);
    scratchSocket.sensorUpdate(sensorsMap);
    scratchSocket.broadcast('play note');
});
scratchSocket.on('broadcast', function (subject) {
    console.log(subject);
});
scratchSocket.on('sensor-update', function (sensorsMap) {
    for (var key of sensorsMap.keys()) {
        console.log(key + " = " + sensorsMap.get(key));
    }
});
```

## API

### Connection
* [`createConnection`](#createConnection)

### Scratch-Socket
* [`sensorUpdate`](#sensorUpdate)
* [`broadcast`](#broadcast)
* [`Event: broadcast`](#broadcastEvent)
* [`Event: sensor-update`](#sensorUpdateEvent)

## Connection

<a name="createConnection"></a>
### createConnection(host, connectListener)

Connect host on scratch port and return a Scratch-Socket instance.

* `host` - Host address of Scratch to connect
* `connectListener` - Listener of 'connect' event

## Scratch-Socket

<a name="sensorUpdate"></a>
### sensorUpdate(sensorsMap, callback)

Send sensor-update message to the Scratch.
Returns true if the entire data was flushed successfully to the kernel buffer.
Returns false if all or part of the data was queued in user memory.
'drain' will be emitted when the buffer is again free.

* `sensorsMap` - Map of "sensor-name -> value" to be sent.
* `callback` - It will be executed when the data is finally written out.


<a name="broadcast"></a>
### broadcast(subject, callback)

Send broadcast message to the Scratch.
Returns true if the entire data was flushed successfully to the kernel buffer.
Returns false if all or part of the data was queued in user memory.
'drain' will be emitted when the buffer is again free.

* `subject` - Subject to be broadcasted.
* `callback` - It will be executed when the data is finally written out.

<a name="broadcastEvent"></a>
### Event: 'broadcast'
Emit with 'subject' parameter when received broadcast message from Scratch.
* `subject` - Subject String of the broadcast message.

<a name="sensorUpdateEvent"></a>
### Event: 'sensor-update'
Emit with a Map of sensor data when received sensor-update message from Scratch.
* `sensorsMap` - Map of "sensor-name -> value". The value is a String or Number.


## TODO
* Receive sensor-update from Scratch
