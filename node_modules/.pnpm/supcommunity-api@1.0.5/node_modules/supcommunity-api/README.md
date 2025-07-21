# supcommunity-api

![version](https://img.shields.io/npm/v/supcommunity-api  "Version")

![npm](https://img.shields.io/npm/dt/supcommunity.svg  "Total Downloads")

  

A lightweight module allowing you to scrape the [Supcommunity](https://www.supremecommunity.com) website with NodeJS.

  

------


## Installation

```

npm install supcommunity-api

```

Or with yarn,

```

yarn add supcommunity-api

```

  

------

  

## Notes

supcommunity-api is an es6 based library, so if you use the es5 `require` to import the module, you will need to use `.default`.

```js

const  SupcommunityScraper = require('supcommunity-api').default;

//Continue usage as normal

```

  

supcommunity-api is a promise based library, which means you can use `.catch`, `.then`, and `await`

------

## Updates 
###  1.0.2

Supcommunity has updated their formatting of items. This update adapts to the new structure of their website. 

- API usage unchanged, but description has been removed

------

## Usage

The `SupcommunityScraper` constructor takes in 1 option - a `proxy`. Please format this using the normal proxy format `ip:port:user:password`.

```js

import  SupcommunityScraper  from  'supcommunity-api';

  

const  SupcommunityController = new  SupcommunityScraper({

proxy:  'your-proxy-here'

});

```

  

### Fetch latest week

The `fetchLatestWeek` method will return the latest droplist URL.

  

For example:

```js

import  SupcommunityScraper  from  'supcommunity-api';

  

const  SupcommunityController = new  SupcommunityScraper();

  

SupcommunityController.fetchLatestWeek()
.then(href  =>  console.log(href)) -> "https://www.supremecommunity.com/season/spring-summer2021/droplists/"
.catch(err  =>  console.error(err.message));

```

  

### Fetch droplist items

The `fetchDroplistItems` method will return all the items from a drop URL in an array.

This takes in the `href` parameter, the droplist URL to retrieve from.

  

For example:

```js

import  SupcommunityScraper  from  'supcommunity-api';

  

const  SupcommunityController = new  SupcommunityScraper();

  

(async () => {

const  latestWeek = await  SupcommunityController.fetchLatestWeek();

const  droplistItems = await  SupcommunityController.fetchDroplistItems(latestWeek);

  

console.log(droplistItems);

})();
```

### Data returned ()
```js
[
  {
    name: String,
    image: String,
    category: String,
    price: String,
    positiveVotes: Number,
    negativeVotes: Number,
    votePercentage: Number
  }
]
```