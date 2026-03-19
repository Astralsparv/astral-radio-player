favouriteStations=localStorage.getItem("favouriteStations")
if (favouriteStations){
    favouriteStations=JSON.parse(favouriteStations);
}else{
    favouriteStations=[];
}

function del(array,value){
    index=stationIndexOf(array,value);
    if (index!=-1) array.splice(index,1);
    return array;
}

function stationIndexOf(array,value){
    query=value.stationuuid;
    for (let i=0; i<array.length; i++){
        if (array[i].stationuuid==query){
            return i;
        }
    }
    return -1;
}

function stationIncludes(array,value){
    return (stationIndexOf(array,value)!=-1);
}

function favouriteStation(station){
    nowFavourited=true;
    if (stationIncludes(favouriteStations,station)){
        favouriteStations=del(favouriteStations,station);
        nowFavourited=false;
    }else{
        favouriteStations.push(station);
    }
    console.log(favouriteStations);
    localStorage.setItem("favouriteStations",JSON.stringify(favouriteStations));
    return nowFavourited;
}