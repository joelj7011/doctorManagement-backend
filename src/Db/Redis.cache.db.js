const redis = require('redis');
const { client } = require('../../Constants');
const { PiChartLineThin } = require('react-icons/pi');
const { getLineNumber } = require('../Utils/ErrorAtLine');

exports.connect_to_redis = async (res) => {
    try {
        client.on('error', (err) => {
            console.error('redis client erro', err);
            if (err.code = 'ECONNREFUSED') {
                return res.status(400).json({ error: ` redis server is not live error at ${__filename}, at line ${getLineNumber()}` })
            }
        });
        await client.connect().then(() => console.log(`connected to redis server at :${client.options.socket.host}:${client.options.socket.port}`));
    } catch (error) {
        console.error(`Redis connection error: ${error.message}`);
        return res.status(400).json({ error: ` internal redis server error  at: ${__filename}, at line ${getLineNumber()}` })
    }
};
