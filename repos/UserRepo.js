const mongoose = require('mongoose');
const User = mongoose.model('User');

class UserRepository {
    constructor({subscriptionRepository}){
        this.subscriptionRepo = subscriptionRepository;
    }

    async createUser (postData)  {
        let user = new User(postData);
        let result = await user.save();
        return result;
    }

    async getUserByMsisdn (msisdn) {
        let result = await User.findOne({msisdn: msisdn});
        return result;
    }

    async getUserBySubscriptionId (subscription_id)  {
        let subscription = await this.subscriptionRepo.getSubscription(subscription_id);
        if(subscription){
            let user = this.getUserById(subscription.user_id);
            return user;
        }
        return undefined;
    }

    async getUserById  (id)  {
        let result = await User.findOne({_id: id});
        return result;
    }

    async blacklistMany(ids)  {
        let data = await User.updateMany({"_id": {$in:ids }},{$set:{is_black_listed: true}});
        return data;
    }

    async updateUsersByQuery(ids, query)  {
        let data = await User.updateMany({"_id": {$in:ids}},{$set: query});
        return data;
    }

    async getTotalUserBaseTillDate (from, to) {
        const result = await User.find(
        {
            $or:[{"subscription_status" : "billed"}, {"subscription_status" : "graced"}, {"subscription_status" : "trial"}], 
            operator:"telenor", 
            subscribed_package_id: {$ne: "none"},
            $and:[{added_dtm:{$gte:new Date(from)}}, {added_dtm:{$lte:new Date(to)}}]
        }, 
            {msisdn:1});
        return result;
    }

    async getActiveUsers (from, to)  {
        const result = await User.find({operator:"telenor", $and:[{added_dtm:{$gte:new Date(from)}}, {added_dtm:{$lte:new Date(to)}}]}, {msisdn:1});
        return result;
    }
}

module.exports = UserRepository;





























