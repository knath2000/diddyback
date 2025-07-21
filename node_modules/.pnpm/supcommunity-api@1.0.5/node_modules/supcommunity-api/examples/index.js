const SupcommunityScraper = require('../dist/api').default;

const SupcommunityController = new SupcommunityScraper();

SupcommunityController.fetchLatestWeek()
.then(href => SupcommunityController.fetchDroplistItems(href))
.then(console.log)
.catch(err => console.log(err.message));