 var regions=new Array();
 var sites=new Array();
 var locations=new Array();
// var country,region;
 var locationData=new Object;
 var newLabel="[New]";
 var searchLabel="[Search]";
 var spec;
 function checkInList(item,list)
 {
  var i,found=false;
  while(list[0]=="")
  {
   list.splice(0,1);
  };
  if(!item){return;};
  for(i=0;i<list.length;i++)
  {
   if(list[i]==item){found=true;};
  };
  if(!found)
  {
   list.push(item);
   list.sort();
  };
 };
 function makeNew(name,typ)
 {
  switch(name)
  {
  case 'region':
   locationData.region=prompt("Region","");
   break;
  case 'site':
   if(locationData.region || locationData.country)
   {
    locationData.site=prompt("Site","");
   }
   else
   {
    alert("Select country and/or region first");
   };
   break;
  case 'location':
   if(!locationData.site)
   {
    alert("Select site first");
    break;
   };
   readLocation(locationData.newLoc.typ);
   break;
  };
  checkLocation();
 };
 function getL(o)
 {
  var t;
  t=o.deg+(o.min+o.sec/60)/60;
  if(o.neg){return -t;};
  return t;
 };
 function parseLocation()
 {
  var geo,utmobj;
  if(!locationData.newLoc)
  {
   locationData.newLoc=new Object();
  };
  locationData.newLoc.gridref=new Object();
  locationData.newLoc.gridref.grid="NGR";
  if(geo=ngr_ll(locationData.location))
  {
   locationData.newLoc.gridref.ref=
     locationData.location.replace("NGR","").replace("IG","").replace(/ /g,"");
   locationData.newLoc.latObj=dmsObject(geo.latitude,1,0);
   locationData.newLoc.longObj=dmsObject(geo.longitude,1,0);
   locationData.latitude=geo.latitude;
   locationData.longitude=geo.longitude;
  }
  else
  {
   locationData.newLoc.gridref.ref="";
   if(geo=loc_ll(locationData.location))
   {
    locationData.newLoc.latObj=dmsObject(geo.latitude,1,0);
    locationData.newLoc.longObj=dmsObject(geo.longitude,1,0);
    locationData.latitude=geo.latitude;
    locationData.longitude=geo.longitude;
   };
  };
  locationData.newLoc.iaru=ll_iaru(geo);
  utmobj=ll_utm(geo);
  locationData.newLoc.utmNorth=utmobj.northing;
  locationData.newLoc.utmEast=utmobj.easting;
  locationData.newLoc.zone=new Object();
  locationData.newLoc.zone.num=utmobj.zonenum;
  locationData.newLoc.zone.let=utmobj.zl;
 };
 function readLocation(typ)
 {
  var o,g;
  switch(typ)
  {
  case 0: // grid
   if(geo=ngr_ll(locationData.newLoc.gridref.grid+" "
    +locationData.newLoc.gridref.ref.replace("NGR","").replace("IG","").replace(/ /g,"")))
   {
    locationData.location=locationData.newLoc.gridref.grid+" "
    +locationData.newLoc.gridref.ref.replace("NGR","").replace("IG","").replace(/ /g,"");
    parseLocation();
   };
   break;
  case 1: // latlong
   locationData.latitude=getL(locationData.newLoc.latObj);
   locationData.longitude=getL(locationData.newLoc.longObj);
   locationData.location=ll_loc(locationData);
   break;
  case 2: // utm
   o=new Object();
   o.northing=locationData.newLoc.utmNorth;
   o.easting=locationData.newLoc.utmEast;
   o.zonenum=locationData.newLoc.zone.num;
   o.zl=locationData.newLoc.zone.let;
   g=utm_ll(o);
   locationData.latitude=g.latitude;
   locationData.longitude=g.longitude;
   locationData.location=ll_loc(locationData);
   break;
  case 3: // iaru
   g=iaru_ll(locationData.newLoc.iaru);
   locationData.latitude=g.latitude;
   locationData.longitude=g.longitude;
   locationData.location=ll_loc(locationData);   
   break;
  };
 };
 function reloadLocator()
 {
  spec.emptyContainer();
  parseLocation();
  loadLocator(true);
 };
 function loadLocator(nw)
 {
  var s,ss,sss,newEntry,mn;
  mn=document.getElementById("main");
  if(mn.lastChild){mn.removeChild(mn.lastChild);};
  newEntry=false;
  spec=new itemSpec("data","Locator","Object");
  spec.noheader=true;
  spec.edit=true;
  if(!regions.length){regions.push("");};
  if(!sites.length){sites.push("");};
  if(!locations.length){locations.push("");};
  s=spec.appendChild("country","Country","Text",true);
   s.hint="country of origin";
   s.options=countries;
   s.changer="checkLocation(this)";
  s=spec.appendChild("region","Region","Text",false);
   s.hint="optional region of country - eg Scotland for UK";
   if(locationData.region==newLabel)
   {
    locationData.region="";
    newEntry=true;
   }
   else
   {
    s.options=regions;
   };
   s.changer="checkLocation(this)";
  s=spec.appendChild("site","Site","Text",true);
   s.hint="name of overall site";
   s.readonly=newEntry;
   if(locationData.site==newLabel)
   {
    newEntry=true;
    locationData.site="";
   }
   else
   {
    if(sites.length>1)
    {
     s.options=sites;
    }
    else
    {
     if(!location.site){newEntry=true;};
    };
   };
   s.changer="checkLocation(this)";
  s=spec.appendChild("location","Location","Text",true);
   s.options=locations;
   s.readonly=newEntry||(s.options.length<2);
   s.changer="checkLocation(this)";
  s=spec.appendChild("latitude","Latitude","Number");
   s.special="showLat(this)";
   s.readonly=true;
  s=spec.appendChild("longitude","Longitude","Number");
   s.special="showLong(this)";
   s.readonly=true;
  s=spec.appendChild("newLoc","New location","Object");
   if(locationData.location){s.expand=false;};
   if(newEntry || !locationData.site){s.hidden=true;};
   if(nw){s.expand=true;};
  ss=s.appendChild("typ","Type","Number");
   ss.options=new Array("NGR Grid","Lat/Long (wgs84)","UTM","IARU");
   ss.changer="reloadLocator()";
  ss=s.appendChild("gridref","Grid ref.","Object");
   sss=ss.appendChild("grid","","Text");
   sss.readonly=true;
   sss=ss.appendChild("ref","Ref","Text");
   sss.width=15;
   ss.inline=true;
   ss.noheader=true;
   ss.hidden=locationData.newLoc.typ!="0";
  ss=s.appendChild("latObj","Latitude","Object");
   sss=ss.appendChild("deg","Deg","Number");
   sss=ss.appendChild("min","Min","Number");
   sss=ss.appendChild("sec","Sec","Number");
   sss=ss.appendChild("neg","","Number");
   sss.options=new Array("N","S");
   ss.inline=true;
   ss.noheader=true;
   ss.hidden=locationData.newLoc.typ!=1;
  ss=s.appendChild("longObj","Longitude","Object");
   sss=ss.appendChild("deg","Deg","Number");
   sss=ss.appendChild("min","Min","Number");
   sss=ss.appendChild("sec","Sec","Number");
   sss=ss.appendChild("neg","","Number");
   sss.options=new Array("E","W");
   ss.inline=true;
   ss.noheader=true;
   ss.hidden=locationData.newLoc.typ!=1;
  ss=s.appendChild("utmEast","Eastings","Text");
   ss.hidden=locationData.newLoc.typ!=2;
  ss=s.appendChild("utmNorth","Northings","Text");
   ss.hidden=locationData.newLoc.typ!=2;
  ss=s.appendChild("zone","Zone","Object");
   sss=ss.appendChild("num","Zone","Number");
   sss=ss.appendChild("let","","Number");
   sss.options=new Array("?","C","D","E","F","G","H","J","K",
   "L","M","N","P","Q","R","S","T","U","V","W","X");
   sss.width=10;
   ss.inline=true;
   ss.noheader=true;
   ss.hidden=locationData.newLoc.typ!=2;
  ss=s.appendChild("iaru","Locator","Text");
   ss.hidden=locationData.newLoc.typ!=3;
  ss=s.appendChild("newLocation","Set location","Button");
   ss.readonly=true;
   ss.action="makeNew('location')";
  if(locationData.location)
  {
   s=spec.appendChild("checkOnMap","Check on map","Button");
    s.readonly=true;
    s.action="checkOnMap()";
  };
  document.getElementById("main").appendChild(spec.createDisplay(locationData));
 };
 function initLocator()
 {
  if(!args.country)
  {
   args.country=getCookie("country");
   args.region=getCookie("region");
   if(args.region=="undefined")
   {
    args.region="";
   };
   locationData.country=args.country;
   locationData.region=args.region;
   if(args.country)
   {
    checkLocation();
    return;
   };
  };
  locationData.country=args.country;
  if(args.region)
  {
   locationData.region=args.region;
   checkInList(locationData.region,regions);
  }
  else
  {
   checkInList(false,regions);
  };
  if(args.site)
  {
   locationData.site=args.site;
   checkInList(locationData.site,sites);
  }
  else
  {
   checkInList(false,sites);
  };
  countries.splice(0,0,"[marine]");
  countries.splice(0,0,"");
  if(args.region)
  {
   regions=new Array(searchLabel,args.region);
  }
  else
  {
   regions.splice(0,0,newLabel);
   regions.splice(0,0,"");
  };
  if(args.site)
  {
   sites=new Array(searchLabel,args.site);
  }
  else
  {
   if(sites.length)
   {
    sites.splice(0,0,newLabel);
    sites.splice(0,0,"");
   };
  };
  locationData.newLoc=new Object();
  locationData.newLoc.typ=1;
  if(args.location || locations.length)
  {
   if(locations.length)
   {
    locationData.location=locations[0];
   };
   if(args.location)
   {
    locationData.location=args.location;
   };
   parseLocation();
   checkInList(locationData.location,locations);
  };
  loadLocator(false);
 };
 function checkLocation(s)
 {
  var url="db_locator.php?";
  if(s)
  {
   switch(s.name)
   {
   case 'country':
    locationData.region="";
    locationData.site="";
   case 'site':
    locationData.location="";
   case 'location':
   };
  };
  if(locationData.country)
  {
   setCookie("country",locationData.country);
   url+="country="+locationData.country+"&";
  };
  if(locationData.region && (locationData.region!=searchLabel))
  {
   setCookie("region",locationData.region);
   url+="region="+locationData.region+"&";
  }
  else
  {
   setCookie("region","");
  };
  if(locationData.site && (locationData.site!=searchLabel))
  {
   url+="site="+locationData.site+"&";
  };
  if(locationData.location)
  {
   url+="location="+locationData.location;
  };
  if(spec && spec.container)
  {
   spec.makeEdit(false);
  };
  document.location.replace(url);
 };
 function checkOnMap()
 {
  var kml;
  kml=makeKML(locationData);
  if(kml)
  {
   openMapper();
  };
 };
 function update()
 {
  var l,ll;
  if(!window.opener){return;};
  if(!locationData.country)
  {
   if(!locationData.region)
   {
    alert("You need to give a country or a region");
    return;
   };
   if(!confirm("Are you sure that the country is unknown")){return;};
  };
  if(!locationData.site)
  {
   alert("You need to give a site");
   return;
  };
  if(!locationData.location)
  {
   if(!confirm("Are you sure that the location is unknown")){return;};
  };
  spec.emptyContainer();
  l=spec.object;
  ll=window.opener.locationSpec.object;
  ll.country=l.country;
  ll.region=l.region;
  ll.site=l.site;
  ll.location=l.location;
  ll.longitude=l.longitude;
  ll.latitude=l.latitude;
  ll.changed=true;
  window.opener.locationSpec.changed=true;
  window.close();
 };
