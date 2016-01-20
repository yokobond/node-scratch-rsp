/**
 * Connector to Scratch via Remote-Sensor-Protocol.
 * 
 * @module scratch-rsp
 * @author Koji Yokokawa
 * @version 0.0.1 
 */
var net = require('net');

var scratchpPort = 42001;

/**
 * Connect host on scratch port and return a Socket instance. 
 * 
 * @param {String} host Host address of Scratch to connect
 * @param {function} connectListener listener of connected event
 * @returns {net.Socket} socket for Scratch
 */
exports.createConnection = function (host, connectListener) {
    var scratchSocket;
    scratchSocket = net.createConnection(scratchpPort, host, connectListener);
    asScratchSocket(scratchSocket);
    return scratchSocket;
};

var asScratchSocket = function (socket) {

	/**
	 * Send sensor-update message to the Scratch. 
	 * Returns true if the entire data was flushed successfully to the kernel buffer. 
	 * Returns false if all or part of the data was queued in user memory. 
	 * 'drain' will be emitted when the buffer is again free.
	 * 
	 * @param {Map} sensorsMap Map of "sensor-name -> value" to be sent.
	 * @param {function} callback It will be executed when the data is finally written out. 
	 * @returns {Boolean} Returns true when the data was flushed successfully, or false. 
	 */
    socket.sensorUpdate = function (sensorsMap, callback) {
        var message = 'sensor-update';
        for (var key of sensorsMap.keys()) {
            message += ' ';
            message += '\"';
            message += key.replace(/"/g, '""');
            message += '\" ';
            message += sensorsMap.get(key).toString();
        }
        return this.writeScratchMessage(message, callback);
    };

	/**
	 * Send broadcast message to the Scratch. 
	 * Returns true if the entire data was flushed successfully to the kernel buffer. 
	 * Returns false if all or part of the data was queued in user memory. 
	 * 'drain' will be emitted when the buffer is again free.
	 * 
	 * @param {String} subject Subject to be broadcasted.
	 * @param {function} callback It will be executed when the data is finally written out. 
	 * @returns {Boolean} Returns true when the data was flushed successfully, or false. 
	 */
    socket.broadcast = function (subject, callback) {
        var message = 'broadcast "';
        message += subject.replace(/"/g, '""');
        message += '"';
        return this.writeScratchMessage(message, callback);
    };

	/**
	 * Write Scratch-Remote-Sensor message to the socket. 
	 * Returns true if the entire data was flushed successfully to the kernel buffer. 
	 * Returns false if all or part of the data was queued in user memory. 
	 * 'drain' will be emitted when the buffer is again free.
	 * 
	 * @param {String} message Message to be sent.
	 * @param {function} callback It will be executed when the data is finally written out.
	 * @returns {Boolean} Returns true when the data was flushed successfully, or false. 
	 */
    socket.writeScratchMessage = function (message, callback) {
        var buff = new Buffer(message.length + 4);
        buff.writeUInt32BE(message.length);
        buff.write(message, 4, 'utf8');
        return this.write(buff, 'utf8', callback);
    };

    socket.on('data', function (dataBuffer) {
        var messageSize = dataBuffer.readUInt32BE(0);
        var message = dataBuffer.toString('utf8', 4, 4 + messageSize);
        if (message.lastIndexOf('broadcast', 0) === 0) {
            var subject = message.substring(9, message.length);
            subject = subject.trim();
            subject = subject.replace(/"(?!")/g, '');
            subject = subject.replace(/""/g, '"');
            socket.emit('broadcast', subject);
        }
        if (message.lastIndexOf('sensor-update', 0) === 0) {
            var sensorsMap = new Map();
            var sensorsMessage = message.substring(13, message.length);
            var dataArray = sensorsMessage.match(/((("([^"]|"{2})+"(?!"))\s+([^"]\S*|("([^"]|"{2})*"(?!"))\s*)){1})/g);
            for (var data of dataArray) {
                var sensorName = data.match(/"([^"]|"{2})+"(?!")(?=\s)/)[0];
                var sensorValue = data.substring(sensorName.length + 1).trim();
                sensorValue = sensorValue.trim();
                if (/^"/.test(sensorValue)) {
                    // value is a String
                    sensorValue = sensorValue.replace(/"(?!")/g, '');
                    sensorValue = sensorValue.replace(/""/g, '"');
                } else {
                    // value is a Number
                    sensorValue = Number(sensorValue);
                }
                sensorName = sensorName.replace(/"(?!")/g, '');
                sensorName = sensorName.replace(/""/g, '"').trim();
                sensorsMap.set(sensorName, sensorValue);
            }
            socket.emit('sensor-update', sensorsMap);
        }
    });
    return socket;
}

