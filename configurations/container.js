const awilix = require('awilix');
const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
});

// Repositories
const SubscriptionRepository = require('../repos/SubscriptionRepo');
const BillingHistoryRepository = require('../repos/BillingHistoryRepo');
const UserRepository = require('../repos/UserRepo');

container.register({
    // Here we are telling Awilix how to resolve a
    // userController: by instantiating a class.

    // Repositories
    subscriptionRepository: awilix.asClass(SubscriptionRepository).singleton(),
    billingHistoryRepository: awilix.asClass(BillingHistoryRepository).singleton(),
    userRepository: awilix.asClass(UserRepository).singleton(),
});

module.exports = container;  