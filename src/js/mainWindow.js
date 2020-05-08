const electron = require('electron');
const publicIp = require('public-ip');
const {ipcRenderer} = electron;
import Map from './map.js'
var map = new Map()

const form = document.querySelector('#urlForm');
form.addEventListener('submit', submitForm);

const msg = document.querySelector('#message');
const finalMsg = document.querySelector('#finalMessage');

var Lmap = map.createMap(35,0,13);

function submitForm(e){
    e.preventDefault();
    const url = document.querySelector('#url').value;
    ipcRenderer.send('url', url);
    breakLine();
    breakLine();
    msg.innerHTML += 'Tracing route to ' + url;
    breakLine();
    msg.innerHTML += 'Printing out identifiable IP addresses:'
    breakLine();
}

//Catch when output is logged
ipcRenderer.on('ip', function(e,ip){
    msg.innerHTML += ip;
    breakLine();
//msg.innerHTML += ipList.length + ' IPv4 Addresses of identifiable hops found.'
});

//Catch when location data is logged
ipcRenderer.on('geoLocData', function(e,geoLocData){
    //console.log(geoLocData.latitude, geoLocData.longitude);
    map.drawOnMap(Lmap,geoLocData);
});

ipcRenderer.on('fail', function(e,failMessage){
    finalMsg.innerHTML = failMessage;
})

ipcRenderer.on('success', function(e,successMessage){
    finalMsg.innerHTML = successMessage;
})

function breakLine(){
    msg.innerHTML += '<br>'
}