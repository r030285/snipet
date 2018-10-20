var amqp = require('amqplib/callback_api');
console.log("connecting");
amqp.connect('amqp://127.0.0.1', function(err, conn) {
	console.log("foi");
	if(err){
		console.log(err);
		process.exit(-1);
	}

	conn.createChannel(function(err, ch) {
		console.log("channel ",err);
		ch.deleteQueue('q_retry');
		ch.deleteExchange('ex_retry');
		ch.deleteQueue('q_request');
		ch.deleteExchange('ex_request');


		ch.assertExchange("ex_retry", 'direct');
		ch.assertQueue('q_retry', {messageTtl: 2000, deadLetterExchange:"ex_request", deadLetterRoutingKey:"key.ex_request"}, 
					(err, q_retry)=>{
			if(err){
				console.log("Assert Queue Error: ", err);
			}
			ch.bindQueue(q_retry.queue,"ex_retry","key.ex_retry",{} , (err, ok)=>{
				console.log("bind retry ok");
			});
		});
		
		ch.assertExchange("ex_request", 'direct');
		ch.assertQueue("q_request", {deadLetterExchange:"ex_retry", deadLetterRoutingKey:"key.ex_retry"}, (err, q_request)=>{
			ch.bindQueue(q_request.queue,"ex_request","key.ex_request",{}, (err, ok)=>{
				console.log("bind request ok");
			});

			ch.prefetch(1);
			ch.consume(q_request.queue, (msg) =>{	
				
				if(msg.properties.headers['x-death'] && 
					msg.properties.headers['x-death'][0].count>3){
					console.log("send ack");
					ch.ack(msg);
				}else{
					console.log("send reject");
					ch.reject(msg, false);
				}
			});
		});
	});
});

let send = (message) => {
	console.log("send");
	amqp.connect('amqp://127.0.0.1', function(err, conn) {
		if (err) {
			console.log(err);
		}
		
		conn.createChannel(function (err, ch) {
			console.log("send to queue");	
			ch.sendToQueue('q_request', Buffer.alloc(message.length, message));	
		});
	});
}

//Send the message
const {Writable} = require("stream");
process.stdin.pipe(new Writable({
	write(chunk, encoding, cb){
		send(chunk.toString());
		cb();
	}
}));
