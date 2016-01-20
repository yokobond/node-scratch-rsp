var chai = require('chai');
var sinon = require('sinon');
var NodeScratch = require('../index');
var net = require('net');

describe('Send Message', function () {

	before(function (done) {
		done();
	});

	it('createConnection', function (done) {
		var scratchSocket;
		var host = 'localhost';
		var scratchPort = 42001;
		var scratchMock;
		scratchMock = net.createServer(function (socket) { });
		scratchMock.listen(scratchPort, host);
		var connectListner = function () {
			scratchSocket.destroy();
			scratchMock.close(function (err) {
				done(err);
			});
		}
		// give a time to avoid 'error connect ECONNREFUSED'
		setTimeout(function () {
			scratchSocket = NodeScratch.createConnection(host, connectListner);
		}, 1);
	});

	it('sensor-update', function (done) {
		var host = 'localhost';
		var scratchPort = 42001;
		var scratchMock;
		scratchMock = net.createServer(function (socket) {
			expect(socket).instanceof(net.Socket);
			socket.on('data', function (buffer) {
				assert.equal(buffer.readUInt32BE(0), messageSize);
				assert.equal(buffer.toString('utf8', 4, messageSize), scratchMessage);
			})
		});
		scratchMock.listen(scratchPort, host);
		var sensorMap = new Map([['note', 60], ['seconds', 0.1], ['shift "tone"', -1]]);
		var scratchMessage = 'sensor-update "note" 60 "seconds" 0.1 "shift ""tone""" -1';
		var messageSize = scratchMessage.length;
		var connectedSpy = sinon.spy();
		var connectListner = function () {
			connectedSpy();
		};
		// give a time to avoid 'error connect ECONNREFUSED'
		setTimeout(function () {
			var scratchSocket = NodeScratch.createConnection(host, connectListner);
			var sentCallback = function () {
				assert.equal(connectedSpy.called, true);
				scratchSocket.destroy();
				scratchMock.close(function (err) {
					done(err);
				});
			};
			var flushed = scratchSocket.sensorUpdate(sensorMap, sentCallback);
			assert.equal(flushed, true);
		}, 1);
	});

	it('broadcast', function (done) {
		var host = 'localhost';
		var scratchPort = 42001;
		var scratchMock;
		scratchMock = net.createServer(function (socket) {
			expect(socket).instanceof(net.Socket);
			socket.on('data', function (buffer) {
				assert.equal(buffer.readUInt32BE(0), messageSize);
				assert.equal(buffer.toString('utf8', 4, messageSize), scratchMessage);
			})
		});
		scratchMock.listen(scratchPort, host);
		var broadcastSubject = 'play "note"';
		var scratchMessage = 'broadcast "play ""note"""';
		var messageSize = scratchMessage.length;
		var connectedSpy = sinon.spy();
		var connectListner = function () {
			connectedSpy();
		};
		// give a time to avoid 'error connect ECONNREFUSED'
		setTimeout(function () {
			var scratchSocket = NodeScratch.createConnection(host, connectListner);
			var sentCallback = function () {
				assert.equal(connectedSpy.called, true);
				scratchSocket.destroy();
				scratchMock.close(function (err) {
					done(err);
				});
			};
			assert.equal(scratchSocket.broadcast(broadcastSubject, sentCallback), true);
		}, 1);
	});

	it('broadcast receive', function (done) {
		var host = 'localhost';
		var scratchPort = 42001;
		var scratchMock;
		var broadcastSubject = 'play "note"';
		var scratchMessage = 'broadcast "play ""note"""';
		scratchMock = net.createServer(function (socket) {
			expect(socket).instanceof(net.Socket);
			var sentCallback = function () { };
			var buff = new Buffer(scratchMessage.length + 4);
			buff.writeUInt32BE(scratchMessage.length);
			buff.write(scratchMessage, 4, 'utf8');
			assert.equal(socket.write(buff, 'utf8', sentCallback), true);
		});
		scratchMock.listen(scratchPort, host);
		// give a time to avoid 'error connect ECONNREFUSED'
		setTimeout(function () {
			var connectListner = function () { };
			var scratchSocket = NodeScratch.createConnection(host, connectListner);
			var broadcastListener = function (subject) {
				assert.equal(subject, broadcastSubject);
				scratchSocket.destroy();
				scratchMock.close(function (err) {
					done(err);
				});
			};
			scratchSocket.on('broadcast', broadcastListener);
		}, 1);
	});

	it('sensor-update receive', function (done) {
		var host = 'localhost';
		var scratchPort = 42001;
		var scratchMock;
		var sensorsMap = new Map([['note', 60], ['seconds', 0.1], ['shift "tone"', -1], ['nuance', 'mf "< >"'], ['bpm', 120],['pan', 0]]);
        var scratchMessage = 'sensor-update "note" 60 "seconds" 0.1 "shift ""tone""" -1 "nuance" "mf ""< >""" "bpm" 120 "pan" 0 ';
		scratchMock = net.createServer(function (socket) {
			assert.instanceOf(socket, net.Socket);
			var sentCallback = function () { };
			var buff = new Buffer(scratchMessage.length + 4);
			buff.writeUInt32BE(scratchMessage.length);
			buff.write(scratchMessage, 4, 'utf8');
			assert.equal(socket.write(buff, 'utf8', sentCallback), true);
		});
		scratchMock.listen(scratchPort, host);
		// give a time to avoid 'error connect ECONNREFUSED'
		setTimeout(function () {
			var connectListner = function () { };
			var scratchSocket = NodeScratch.createConnection(host, connectListner);
			var sensorUpdateListener = function (receivedMap) {
                assert.equal(receivedMap.size, sensorsMap.size, 'Received sensorsMap size is not correct');
                for (var key of sensorsMap.keys()) {
                    assert.isDefined(receivedMap.get(key));
                    assert.equal(receivedMap.get(key), sensorsMap.get(key));
                }
                // clean up the socket
				scratchSocket.destroy();
				scratchMock.close(function (err) {
					done(err);
				});
			};
			scratchSocket.on('sensor-update', sensorUpdateListener);
		}, 1);
	});
})