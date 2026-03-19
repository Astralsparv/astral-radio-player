const player=document.getElementById("player");
const faviconEl = document.getElementById("player-favicon");
const countryEl = document.getElementById("player-country");
const titleEl = document.getElementById("player-title");
const toggleBtn = document.getElementById("player-toggle");

function playStation(url, name, favicon, country) {
    player.src=url;
    player.play();
    
    favicon=favicon || "default_icon.png";
    faviconEl.src=favicon;
    titleEl.textContent=name;
    countryEl.textContent=country;

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

function loadCountries() {
    document.getElementById("countries").innerHTML = "Loading...";

    fetch("https://de1.api.radio-browser.info/json/countries")
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
    });
}

function showCountries() {
    document.getElementById('stations').classList.add('hide');
    const container=document.getElementById("countries");
    container.classList.remove('hide');
    container.innerHTML="";

    Object.keys(grouped).sort().forEach(country => {
        const card=document.createElement("div");
        card.className="country";

        card.textContent=`${grouped[country].name} (${grouped[country].stationCount})`;

        card.onclick=()=>showStations(country);

        container.appendChild(card);
    });
}

// country is iso
function showStations(country) {
    document.getElementById('countries').classList.add('hide');
    const container=document.getElementById("stations");
    container.classList.remove('hide');
    container.innerHTML="";

    const back = document.createElement("button");
    back.className = "back";
    back.textContent="Back"

    back.onclick = () => {
        showCountries();
    };

    container.appendChild(back);

    grouped[country].stations=[];
    fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${country}`)
    .then(res => res.json())
    .then(data => {
        data.forEach(station => {
            if (!station.url_resolved) return;
            const card = document.createElement("div");
            card.className = "station";

            card.innerHTML = `
            <img class="station-icon" src="${station.favicon || 'default_icon.png'}" onerror="this.src='default_icon.png'">
            <div>
            <div class="station-name">${station.name}</div>
            <div class="station-meta">${station.country} • ${station.bitrate} kbps</div>
            </div>
            `;

            card.onclick = () => {
            playStation(station.url_resolved, station.name, station.favicon, station.country);
            };

            container.appendChild(card);
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