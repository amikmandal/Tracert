async function getGeoLocData(ip){
    const fetch = require("node-fetch")

    const ACCESS_KEY = '001abf6bf4e9cdfb870012aa573a2e80';
    const baseURL = 'http://api.ipstack.com/'

    const geoLocData = {city: '', latitude: '', longitude: ''}

    const hitURL = baseURL + ip + '?access_key=' + ACCESS_KEY + '&fields=city,latitude,longitude'
    //console.log(hitURL);
    const res = await fetch(hitURL).catch(handleFetchError)
    const data = await res.json()

    if(data.city==null || data.latitude == null || data.longitude == null)
        return null;
    geoLocData.city = await data.city;
    geoLocData.latitude = await data.latitude;
    geoLocData.longitude = await data.longitude;

    return geoLocData;
}

function handleFetchError(err){
    console.log(err)
    let res = new Response(
        JSON.stringify()
    )
    return res
}

module.exports = getGeoLocData