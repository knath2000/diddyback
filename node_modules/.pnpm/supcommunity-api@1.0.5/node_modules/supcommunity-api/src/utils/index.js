export const checkStatus = async (res) => {
    const { status } = res;

    console.log(status);
    
    if (status !== 200 && status !== 304){
        const error = new Error("Invalid status code");
        error.status = status;
        error.body = await res.text();

        throw error;
    };
};

export const formatProxy = (proxy) => {
    const splitProxy = proxy.split(':');

    if (splitProxy.length == 2) return `http://${splitProxy[0]}:${splitProxy[1]}`;
    else return `http://${splitProxy[2]}:${splitProxy[3]}@${splitProxy[0]}:${splitProxy[1]}`;
};

export const capitalizeString = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}