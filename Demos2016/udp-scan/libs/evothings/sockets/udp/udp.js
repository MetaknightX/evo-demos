/*
Library that performs UDP broadcast/scanning.
For documentation of chrome.sockets.udp see this page:
https://developer.chrome.com/apps/sockets_udp

Author: Mikael Kindborg
*/

;(function(evothings)
{

evothings.sockets = evothings.sockets || {}
evothings.sockets.udp = {}

evothings.sockets.udp.ERROR_UDP_SOCKET_CREATE = 1
evothings.sockets.udp.ERROR_UDP_SOCKET_BIND = 2
evothings.sockets.udp.ERROR_UDP_SOCKET_RECEIVE = 3
evothings.sockets.udp.ERROR_UDP_SOCKET_SEND = 4

// Helper function.
evothings.sockets.stringToBuffer = function(string)
{
	var buffer = new ArrayBuffer(string.length)
	var bufferView = new Uint8Array(buffer);
	for (var i = 0; i < string.length; ++i)
	{
		bufferView[i] = string.charCodeAt(i)
	}
	return buffer
}

// Helper function.
evothings.sockets.bufferToString = function(buffer)
{
	return String.fromCharCode.apply(null, new Uint8Array(buf));

	/*
	// Alternative implementation.
	var string = ''
	var view = new Uint8Array(buffer)
	for (var i = 0; i < buffer.byteLength; ++i)
	{
		string += String.fromCharCode(view[i])
	}
	return string
	*/
}

evothings.sockets.udp.create = function(
	createdCallback,
	receivedCallback,
	errorCallback)
{
	// Socket instance object, retured in the callbacks.
	var mSocket = {}

	// Instance methods.
	mSocket.broadcast = broadcastImpl
	mSocket.send = sendImpl
	mSocket.close = closeImpl

	// Create UDP socket.
	function create()
	{
		try
		{
			chrome.sockets.udp.create(
				{},
				function(createInfo)
				{
					mSocket.socketId = createInfo.socketId
					bind(mSocket.socketId)
				})
		}
		catch (error)
		{
			errorCallback(
				mSocket,
				evothings.sockets.udp.ERROR_UDP_SOCKET_CREATE,
				'Failed to create UDP socket: ' + error)
		}
	}

	// Bind UDP socket.
	function bind(socketId)
	{
		chrome.sockets.udp.bind(
			socketId,
			null,
			0,
			function(result)
			{
				// Result 0 means success, negative is error.
				if (result < 0)
				{
					// Socket create error.
					errorCallback(
						mSocket,
						evothings.sockets.udp.ERROR_UDP_SOCKET_CREATE,
						'Failed to bind UDP socket: ' + result)
				}
				else
				{
					// Set receive listener.
					chrome.sockets.udp.onReceive.addListener(receive)

					// Socket create success.
					createdCallback(mSocket)
				}
			})
	}

	// Handle incoming UPD packet.
	function receive(receiveInfo)
	{
		if (receiveInfo.socketId !== mSocket.socketId)
		{
			// Not for us.
    		return
    	}

		try
		{
			receivedCallback(mSocket, receiveInfo)
		}
		catch (error)
		{
			errorCallback(
				mSocket,
				evothings.sockets.udp.ERROR_UDP_SOCKET_RECEIVE,
				'Receive error: ' + error)
		}
	}

	// Create socket.
	create()
}

// Broadcast packet.
function broadcastImpl(
	socket,
	port,
	dataBuffer,
	successCallback,
	errorCallback)
{
	evothings.sockets.udp.send(
		socket,
		'255.255.255.255',
		port,
		dataBuffer,
		successCallback,
		errorCallback)
}

// Send packet.
function sendImpl(
	socket,
	address,
	port,
	dataBuffer,
	successCallback,
	errorCallback)
{
	chrome.sockets.udp.send(
		socket.socketId,
		dataBuffer,
		address,
		port,
		function(sendInfo)
		{
			if (sendInfo.resultCode < 0)
			{
				errorCallback(
					socket,
					evothings.sockets.udp.ERROR_UDP_SOCKET_SEND,
					'Send error: ' + sendInfo.resultCode)
			}
			else
			{
				successCallback(
					socket,
					sendInfo)
			}
		})
}

// Close UDP socket.
function closeImpl(
	socket,
	callback)
{
	chrome.sockets.udp.close(
		socket.socketId,
		function()
		{
			callback && callback(socket)
		})
}

})(window.evothings || {})
