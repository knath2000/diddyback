import cheerio from 'cheerio';

import SharedContext from '../context';
import { checkStatus, capitalizeString } from '../utils';

class SupcommunityScraper {
    constructor(options={}){
        const { proxy } = options;

        this._context = new SharedContext({
            proxy,
            headers: {
                'Host': 'www.supremecommunity.com',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36',
                'sec-fetch-user': '?1',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'navigate',
                'referer': 'https://www.supremecommunity.com/',
                'accept-language': 'en-US,en;q=0.9'
            }
        });
    }

    async fetchLatestWeek(){
        const { fetch } = this._context;
        const res = await fetch('https://www.supremecommunity.com/season/latest/droplists/', {
            ...this._context,
            redirect: 'follow'
        });

        await checkStatus(res);

        const parsedURL = res.url.split('/droplists')[0];
        const year = parsedURL.slice(parsedURL.length - 4, parsedURL.length);
        const currentDate = new Date();

        const body = await res.text();
        const $ = cheerio.load(body);

        let latestWeekPath = '',
        closestDateDifference = Infinity;
        
        $('div.week-list').children('div.week-item').each(function() {
            const dropDateString = $(this).find(".week-item-subtitle").text();
            console.log({ dropDateString });
            
            if (dropDateString == '' || dropDateString == undefined) return;

            let dayIdentifier;

            if (dropDateString.includes('th')) dayIdentifier = 'th';
            else if (dropDateString.includes('nd')) dayIdentifier = 'nd';
            else if (dropDateString.includes('st')) dayIdentifier = 'st';
            else {
                const err = new Error("Could not parse drop date");
                err.status = '404';

                throw err;
            };

            const day = dropDateString.split(dayIdentifier)[0],
            month = dropDateString.split(dayIdentifier + ' ')[1].split(' ')[0];

            const dropDate = new Date(year + "-" + month + "-" + day);

            if (dropDate > currentDate && dropDate - currentDate < closestDateDifference){
                closestDateDifference = dropDate - currentDate;
                latestWeekPath = $(this).find('a.week-item__title').attr('href');
            }
        });

        if (latestWeekPath == undefined || latestWeekPath == ""){
            console.log("No new latest week");

            const error = new Error("No latest week found!");
            error.status = 404;
            error.body = "";

            throw error;
        };

        const latestWeek = new URL(latestWeekPath, "https://www.supremecommunity.com");
        const { href } = latestWeek;

        return href;
    }

    async fetchDroplistItems(url){
        const { fetch } = this._context;
        const res = await fetch(url, {
            ...this._context
        });

        await checkStatus(res);

        const body = await res.text();

        const $ = cheerio.load(body);
        const droplistArray = [];

        $('.catalog-item').each((i, element) => {
            const category = capitalizeString($(element).attr("data-category"));

            if (category === 'Ads') return;

            const name = $(element).find('.catalog-item__title').text().trim();
            const imagePath = $(element).find('.catalog-item__thumb > img').attr("data-src");
            const price = $(element).find('.catalog-label-price').text().trim();
            const imageURL = new URL(imagePath, url).href;
            const positiveVotes = Number($(element).find('.progress-bar-success.droplist-vote-bar').text());
            const negativeVotes = Number($(element).find('.progress-bar-danger.droplist-vote-bar').text());
            const votePercentage = Math.round(100 * (positiveVotes / (positiveVotes + negativeVotes)));

            droplistArray.push({
                name,
                image: imageURL,
                price,
                category,
                positiveVotes,
                negativeVotes,
                votePercentage
            });
        });

        return droplistArray;
    }
}

export default SupcommunityScraper;
