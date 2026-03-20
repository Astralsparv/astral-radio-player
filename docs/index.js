function countryFlag(country){
  const code=country.toUpperCase();
  const flag =Array.from(code).map(letter => String.fromCodePoint(letter.charCodeAt(0) + 127397)).join('');
  
  return flag;
}

const player=document.getElementById("player");
const faviconEl = document.getElementById("player-favicon");
const countryEl = document.getElementById("player-country");
const titleEl = document.getElementById("player-title");
const toggleBtn = document.getElementById("player-toggle");

let grouped={};

function playStation(url, name, favicon, country, countrycode){
    player.src=url;
    player.play();
    
    favicon=favicon || "default_icon.png";
    faviconEl.src=favicon;
    titleEl.textContent=name;
    countryEl.innerHTML=`<span class="flag">${countryFlag(countrycode)}</span> ${country}`;

    toggleBtn.textContent="⏸️";

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: name,
            artwork: [
                { src: favicon, sizes: "96x96", type: "image/png" },
                { src: favicon, sizes: "128x128", type: "image/png" },
                { src: favicon, sizes: "192x192", type: "image/png" },
                { src: favicon, sizes: "256x256", type: "image/png" },
                { src: favicon, sizes: "384x384", type: "image/png" },
                { src: favicon, sizes: "512x512", type: "image/png" }
            ],
            artist: "Astral Radio Player"
        });
    }
}

function loadCountries(){
    document.getElementById("countries").innerHTML = "Loading...";

    fetch("https://de1.api.radio-browser.info/json/countries?order=name")
    .then(res => res.json())
    .then(data => {
        grouped = {};

        data.forEach(country => {
            if (!country.name || !country.iso_3166_1) return;

            if (!grouped[country.iso_3166_1]) {
                grouped[country.iso_3166_1] = [];
                grouped[country.iso_3166_1].name=country.name;
                grouped[country.iso_3166_1].stationCount=country.stationcount;
                grouped[country.iso_3166_1].stations=[];
            }
        });

        showCountries();
        handleQueryString();
    });
}

function showCountries(){
    document.getElementById('stations').classList.add('hide');
    const container=document.getElementById("countries");
    container.classList.remove('hide');
    container.innerHTML="";

    const card=document.createElement("div");
    card.className="country";

    card.innerHTML=`<span class="favourite fa fa-star checked favourited"></span> Favourited Stations (${favouriteStations.length})`;

    card.onclick=()=>showStations("favourite");

    container.appendChild(card);

    Object.keys(grouped).sort().forEach(country => {
        const card=document.createElement("div");
        card.className="country";

        card.innerHTML=`<span class="flag">${countryFlag(country)}</span> ${grouped[country].name} (${grouped[country].stationCount})`;

        card.onclick=()=>showStations(country);

        container.appendChild(card);
    });
}

// country is iso
function showStations(country,options){
    if (options==null){ options={favourites: false} };
    if (options.order==null){ options.order='name' };
    const url=new URL(window.location.href);
    url.searchParams.set('stations', country);
    if (options.reverseorder){ url.searchParams.set('rev',1); }
    if (options.favourites){ url.searchParams.set('favourites',1); }
    if (options.query){ url.searchParams.set('query',options.query); }
    window.history.pushState(null, '', url.toString());

    document.getElementById('countries').classList.add('hide');
    const container=document.getElementById("stations");
    container.classList.remove('hide');
    container.innerHTML="";

    const back = document.createElement("button");
    back.className = "back";
    back.textContent="Back"

    back.onclick = () => {
        showCountries();
        const url=new URL(window.location.href);
        url.searchParams.delete('stations');
        url.searchParams.delete('favourites');
        url.searchParams.delete('query');
        window.history.pushState(null, '', url.toString());
    };

    container.appendChild(back);

    if (country=="favourite"){
        favouriteStations.forEach(station => {
            if (!station.url_resolved) return;
            const card = document.createElement("div");
            card.className = "station";

            const play = document.createElement('div');
            play.classList='play';
            play.innerHTML = `
            <img class="station-icon" src="${station.favicon || 'default_icon.png'}" onerror="this.src='default_icon.png'">
            <div>
            <div class="station-name">${station.name}</div>
            <div class="station-meta"><span class="flag">${countryFlag(station.countrycode)}</span> ${station.country} • ${station.bitrate} kbps</div>
            </div>
            `;
            play.onclick=function(){
                playStation(station.url_resolved,station.name,station.favicon,station.country,station.countrycode);
            }
            card.appendChild(play);

            const favourite=document.createElement('span');

            if (stationIncludes(favouriteStations,station)){
                favourite.classList='favourite fa fa-star checked favourited';
            }else{
                favourite.classList='favourite fa fa-star checked';
            }

            favourite.onclick=()=>{
                if (favouriteStation(station)){
                    favourite.classList.add('favourited');
                }else{
                    favourite.classList.remove('favourited');
                }
                showStations("favourite");
            }

            card.appendChild(favourite);

            container.appendChild(card);
        })
    }else{
        grouped[country].stations=[];
        let url=`https://de1.api.radio-browser.info/json/stations/search?countrycode=${country}`;
        if (options.query){ url=`${url}&name=${encodeURIComponent(options.query)}`; }
        url=`${url}&order=${encodeURIComponent(options.order)}`;
        if (options.reverseorder){ url=`${url}&reverse=true;` }
        fetch(url)
        .then(res => res.json())
        .then(data => {
            data.forEach(station => {
                if (!station.url_resolved) return;
                const favourited=stationIncludes(favouriteStations,station);
                if ((!options.favourites) || (options.favourites && favourited)){
                    const card = document.createElement("div");
                    card.className = "station";

                    const play = document.createElement('div');
                    play.classList='play';
                    play.innerHTML = `
                    <img class="station-icon" src="${station.favicon || 'default_icon.png'}" onerror="this.src='default_icon.png'">
                    <div>
                    <div class="station-name">${station.name}</div>
                    <div class="station-meta"><span class="flag">${countryFlag(country)}</span> ${station.country} • ${station.bitrate} kbps</div>
                    </div>
                    `;
                    play.onclick=function(){
                        playStation(station.url_resolved,station.name,station.favicon,station.country,country);
                    }
                    card.appendChild(play);

                    const favourite=document.createElement('span');

                    if (favourited){
                        favourite.classList='favourite fa fa-star checked favourited';
                    }else{
                        favourite.classList='favourite fa fa-star checked';
                    }

                    favourite.onclick=()=>{
                        if (favouriteStation(station)){
                            favourite.classList.add('favourited');
                        }else{
                            favourite.classList.remove('favourited');
                        }
                    }

                    card.appendChild(favourite);

                    container.appendChild(card);
                }
                grouped[country].stations.push({
                    name: station.name,
                    bitrate: station.bitrate,
                    favicon: station.favicon || "default_icon.png",
                    url_resolved: station.url_resolved
                })
            })
        })
        grouped[country].stationcount=grouped[country].stations.length;
    }
}

// query strings
/*
stations=countryexactcode|"favourite" -- show favourite stations, not country
favourites=boolean -- show only favourites
rev=anything -- reverse order
query=string -- search a radio by name
order=string -- order based on what the radio station has available for ordering, e.g: name, bitrate
*/

let queryHandled=false;
function handleQueryString(){
    if (queryHandled) return;
    queryHandled=true;
    const params = new URLSearchParams(window.location.search);
    const country = params.get('stations');
    let options={favourites: false};
    let fav=params.get('favourites');
    if (fav){
        options.favourites=1;
    }
    let query=params.get('query');
    if (query){
        options.query=query;
    }
    let order=params.get('order');
    if (order){
        options.order=order;
    }
    let reverseorder=params.get('rev');
    if (reverseorder){
        options.reverseorder=1;
    }
    if (country){
        showStations(country,options);
    }
}

loadCountries();

toggleBtn.onclick = () => {
    if (player.paused) {
        player.play();
        toggleBtn.textContent = "⏸️";
    } else {
        player.pause();
        toggleBtn.textContent = "▶️";
    }
};