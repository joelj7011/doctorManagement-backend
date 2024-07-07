const { Mongoose, Schema, default: mongoose } = require('mongoose');
const { string } = require('three/examples/jsm/nodes/Nodes.js');


const indentification = new mongoose.Schema({
    type: mongoose.Types.ObjectId,
    role: {
        type: string,
        role: ['User', 'Doctor'],
    }
});
const NotificationSchema = new Mongoose.Schema({
    sender: {
        type: indentification,
        required: true
    },
    reciver: {
        type: indentification,
        required: true
    },
    message: {
        type: String
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;