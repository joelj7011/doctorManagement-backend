const redis = require('redis');
const { client } = require('../../Constants');
const { PiChartLineThin } = require('react-icons/pi');

exports.connect_to_redis = async () => {
    try {
        client.on('error', (err) => {
            console.error('redis client erro', err);
        });
        await client.connect().then(() => console.log(`connected to redis server at :${client.options.socket.host}:${client.options.socket.port}`));
    } catch (error) {
        console.error(`Redis connection error: ${error.message}`);
        throw error;
    }
}
