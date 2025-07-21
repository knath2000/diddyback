import fetch from 'node-fetch';

import { formatProxy } from './utils';

const ProxyAgent = require('https-proxy-agent');

class SharedContext {
    constructor({ proxy, headers }){
        this.fetch = fetch;
        this.agent = proxy === undefined ? undefined : new ProxyAgent(formatProxy(proxy));
        this.headers = headers;
    }

    setProxy(proxy){
        this.proxy = proxy;
    }
}

export default SharedContext;