export default class Map {

    Map(){
        this.points = []
        this.polyline = null
    }

    createMap(lat, long, zoom){
        this.points = []
        this.polyline = null
        var Lmap = L.map('map').setView([lat,long], zoom);
        const tileURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        L.tileLayer(tileURL, {}).addTo(Lmap);
        return Lmap;
    }

    drawOnMap(Lmap, geoLocData){
        const latlng = [geoLocData.latitude, geoLocData.longitude]
        const city = geoLocData.city
        this.addMarker(Lmap,latlng,city);
        this.addPolyline(Lmap,latlng);
    }  

    addMarker(Lmap,latlng,city){
        const marker = L.marker(latlng).addTo(Lmap)
        marker.bindTooltip(city)
        marker.on('mouseover', function (e) {
            this.openTooltip();
        });
        marker.on('mouseout', function (e) {
            this.closeTooltip();
        });
    }

    addPolyline(Lmap,latlng){
        this.points.push(latlng);
        if (this.points.length > 2)
            this.points.shift()
        if(this.polyline == null)
            this.polyline = L.polyline(this.points, {color: 'red'}).addTo(Lmap)
        else
            this.polyline.addLatLng([latlng[0],latlng[1]]);
        Lmap.fitBounds(this.polyline.getBounds());
    }
};