const mongoose = require('mongoose');
const Subscriber = mongoose.model('Subscriber');

class SubscriberRepository {
    async getSubscriber(id)  {
        let result = await Subscriber.findOne({_id: id});
        return result;
    }
    async getSubscriberByUserId (user_id) {
        let result = await Subscriber.findOne({user_id: user_id});
        return result;
    }
}

module.exports = SubscriberRepository;