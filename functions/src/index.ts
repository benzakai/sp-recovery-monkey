import * as functions from "firebase-functions";

const admin = require('firebase-admin');
admin.initializeApp();

exports.insertFromPubsub = functions.pubsub.topic('AbandonedChekout').onPublish((message, context) => {
    console.log('The function was triggered at ', context.timestamp);

    // const messageBody = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    // console.log('full message:', messageBody);

    let AbandonedChekoutData = '';
    try {
        AbandonedChekoutData = message.json.AbandonedChekout;               // if the message is in JSON format, we can use message.json
        console.log('Abandoned Chekout Data', AbandonedChekoutData);
    } catch (e) {
        functions.logger.error('PubSub message not in JSON format. error:', e);
    }

    let id = '';
    let token = '';
  

    try {
        id = message.attributes.id;
        token = message.attributes.token;
        console.log('id', id);
        console.log('token', token);
    } catch (e) {
        functions.logger.error('PubSub message attributes error:', e);
    }

    var AbandonedChekoutInfo = {
        'AbandonedChekout': AbandonedChekoutData,
        'id': id,
        'token': token,
    };
    
    return admin.firestore().collection('AbandonedChekout').add(AbandonedChekoutInfo);
});