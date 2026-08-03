var loc,countries;
/* some generic global utilities */


/* location app */
 function locationApp()
 {
  this.regions=[];
  this.sites=[];
  this.siteIndex={};
  this.locations=[];
  this.countries=[];
  this.locationData={"longitude":0,"latitude":0,"country":app.getCookie("country")};
  if(!this.locationData.country){this.locationData.country="";};
  this.format="Long\/Lat";
  this.intchronRoot="https:\/\/intchron.org\/";
 };
 
locationApp.prototype.d2dms=function(num,m,p)
{
 var v,sec,min,deg;
 v=Math.round(Math.abs(num*3600));
 sec=v % 60;
 v=(v-sec)/60;
 min=v % 60;
 v=(v-min)/60;
 deg=v % 360;
 v="";
 if(deg){v+=deg+" ";};
 if(min){v+=min+"' ";};
 if(sec){v+=sec+'" ';};
 if(!v){return v;};
 if(num<0)
 {
  if(m){v+=m;};
 }
 else
 {
  if(p){v+=p;};
 };
 return v;
};

locationApp.prototype.showLong=function(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=this.d2dms(l,"W","E");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};

locationApp.prototype.showLat=function(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=this.d2dms(l,"S","N");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};

locationApp.prototype.checkLength=function(spec,n)
{
 if(spec.object.length>n)
 {
  app.alert(spec.prompt+": truncated "+n+" characters");
  spec.object=spec.object.slice(0,n);
 };
};



 locationApp.prototype.getL=function(o)
 {
  var t;
  t=o.deg+(o.min+o.sec/60)/60;
  if(o.neg){return -t;};
  return t;
 };
 locationApp.prototype.genSpec=function(fmt)
 {
  var spec,s,ss;
  spec=new itemSpec("data","Locator","Object");
  spec.noheader=true;
  spec.transparent=true;
  spec.edit=true;
  s=spec.appendChild("site","Site","Text",true);
   s.hint="name of overall site";
   s.options=this.sites;
   s.checker="loc.checkLength(this,80)";
   s.changer="loc.setSite(this)";
  s=spec.appendChild("region","Region","Text",false);
   s.hint="optional region of country - eg Scotland for UK";
   s.checker="loc.checkLength(this,30)";
  s=spec.appendChild("country","Country","Text",true);
   s.hint="country of origin";
   s.options=this.countries;
   s.changer="loc.findSites(this)";
  s=spec.appendChild("location","Location","Text",true);
   s.readonly=true;
  s=spec.appendChild("latitude","Lat","Number");
   s.special="loc.showLat(this)";
   s.changer="loc.convert()";
   s.width=17;
  s=spec.appendChild("longitude","Long","Number");
   s.special="loc.showLong(this)";
   s.changer="loc.convert()";
   s.width=17;
  s=spec.appendChild("gridref","Grid ref.","Object");
   ss=s.appendChild("grid","","Text");
   ss.readonly=true;
   ss=s.appendChild("ref","Ref","Text");
   ss.width=15;
   s.inline=true;
   s.noheader=true;
   s.hidden=(fmt!="NGR");
  s=spec.appendChild("latObj","Latitude","Object");
   ss=s.appendChild("deg","Deg","Number");
   ss=s.appendChild("min","Min","Number");
   ss=s.appendChild("sec","Sec","Number");
   ss=s.appendChild("neg","","Number");
   ss.options=new Array("N","S");
   s.inline=true;
   s.noheader=true;
   s.hidden=(fmt!="DMS");
  s=spec.appendChild("longObj","Longitude","Object");
   ss=s.appendChild("deg","Deg","Number");
   ss=s.appendChild("min","Min","Number");
   ss=s.appendChild("sec","Sec","Number");
   ss=s.appendChild("neg","","Number");
   ss.options=new Array("E","W");
   s.inline=true;
   s.noheader=true;
   s.hidden=(fmt!="DMS");
  s=spec.appendChild("utmEast","Eastings","Text");
   s.hidden=(fmt!="UTM");
  s=spec.appendChild("utmNorth","Northings","Text");
   s.hidden=(fmt!="UTM");
  s=spec.appendChild("zone","Zone","Object");
   ss=s.appendChild("num","Zone","Number");
   ss=s.appendChild("let","","Number");
   ss.options=new Array("?","C","D","E","F","G","H","J","K",
   "L","M","N","P","Q","R","S","T","U","V","W","X");
   ss.width=10;
   s.inline=true;
   s.noheader=true;
   s.hidden=(fmt!="UTM");
  s=spec.appendChild("iaru","Locator","Text");
   s.hidden=(fmt!="IARU");
  s=spec.appendChild("newLocation","Convert","Button");
   s.readonly=true;
   s.action="loc.convert()";
   s.hidden=(fmt=="Long\/Lat");
  return spec;
 };
 locationApp.prototype.convert=function(typ)
 {
  this.readLocation(this.format);
 };
    
 locationApp.prototype.parseLocation=function()
 {
  var geo,utmobj;
  var lD=this.locationData;
  lD.gridref=new Object();
  lD.gridref.grid="NGR";
  if(geo=ngr_ll(lD.location))
  {
   lD.gridref.ref=
     lD.location.replace("NGR","").replace("IG","").replace(/ /g,"");
   lD.latObj=dmsObject(geo.latitude,1,0);
   lD.longObj=dmsObject(geo.longitude,1,0);
   lD.latitude=geo.latitude;
   lD.longitude=geo.longitude;
  }
  else
  {
   lD.gridref.ref="";
   if(!lD.latitude && !lD.longitude)
   {
    if(geo=loc_ll(lD.location))
    {
     lD.latObj=dmsObject(geo.latitude,1,0);
     lD.longObj=dmsObject(geo.longitude,1,0);
     lD.latitude=geo.latitude;
     lD.longitude=geo.longitude;
    }
    else
    {
     geo={};
     geo.latitude=0;
     geo.longitude=0;
     lD.latObj=dmsObject(geo.latitude,1,0);
     lD.longObj=dmsObject(geo.longitude,1,0);
    };
   }
   else
   {
    geo={};
    geo.latitude=lD.latitude;
    geo.longitude=lD.longitude;
    lD.latObj=dmsObject(geo.latitude,1,0);
    lD.longObj=dmsObject(geo.longitude,1,0);
   };
  };
  lD.iaru=ll_iaru(geo);
  utmobj=ll_utm(geo);
  lD.utmNorth=utmobj.northing;
  lD.utmEast=utmobj.easting;
  lD.zone=new Object();
  lD.zone.num=utmobj.zonenum;
  lD.zone.let=utmobj.zl;
 };
 locationApp.prototype.readLocation=function(fmt)
 {
  var o,g;
  var lD=this.locationData;
  this.spec.emptyContainer();
  try{
  switch(fmt)
  {
  case "NGR": // grid
   if(g=ngr_ll(lD.gridref.grid+" "
    +lD.gridref.ref.replace("NGR","").replace("IG","").replace(/ /g,"")))
   {
    lD.location=lD.gridref.grid+" "
    +lD.gridref.ref.replace("NGR","").replace("IG","").replace(/ /g,"");
   };
   break;
  case "DMS": // latlong
   lD.latitude=this.getL(lD.latObj);
   lD.longitude=this.getL(lD.longObj);
   lD.location=ll_loc(lD);
   break;
  case "Long\/Lat": // latlong
   lD.location=ll_loc(lD);
   break;
  case "UTM": // utm
   o=new Object();
   o.northing=lD.utmNorth;
   o.easting=lD.utmEast;
   o.zonenum=lD.zone.num;
   o.zl=lD.zone.let;
   g=utm_ll(o);
   lD.latitude=g.latitude;
   lD.longitude=g.longitude;
   lD.location=ll_loc(lD);
   break;
  case "IARU": // iaru
   g=iaru_ll(lD.iaru);
   lD.latitude=g.latitude;
   lD.longitude=g.longitude;
   lD.location=ll_loc(lD);   
   break;
  };
  this.parseLocation();}catch(e){app.alert(e);};
  this.spec.fillContainer();
 };
locationApp.prototype.checkArgs=function()
 {
  var args;
  var lD=this.locationData,o;
  if(app.parent && app.parent.locationSpec && (o=app.parent.locationSpec.object))
  {
   lD.country=o.country;
   lD.region=o.region;
   lD.site=o.site;
   lD.latitude=o.latitude;
   lD.longitude=o.longitude;
   lD.location=o.location;
   if(!lD.location){lD.location=ll_loc(lD);};
   this.locationSpec=app.parent.locationSpec;
   window.setInterval(function(){if(!app.parent.locationSpec){this.close(false);};}.bind(this),1000);
   return;
  };
  args=app.getArgs();
  if(args.country)
  {
   lD.country=args.country;
  };
  if(args.region)
  {
   lD.region=args.region;
  };
  if(args.site)
  {
   lD.site=args.site;
  };
  if(args.location)
  {
   lD.location=args.location;
   this.parseLocation();
  };
  if(!lD.location){lD.location=ll_loc(lD);};
 };
 locationApp.prototype.update=function(force)
 {
  var ll,lD=this.locationData,o;
  if(app.parent && (app.parent.locationSpec==this.locationSpec))
  {
   this.locationSpec.emptyContainer();
   ll=this.locationSpec.object;
   if(lD.country!="[Marine]")
   {
    ll.country=lD.country;
   }
   else
   {
    ll.country="";
   };
   ll.region=lD.region;
   ll.site=lD.site;
   ll.location=lD.location;
   ll.longitude=lD.longitude;
   ll.latitude=lD.latitude;
   ll.changed=true;
   this.locationSpec.changed=true;
   this.locationSpec.fillContainer();
   this.locationSpec.doChange();
   return;
  };
  if(!window.opener){return;};
  if(!lD.country)
  {
   if(!lD.region)
   {
    alert("You need to give a country or a region");
    return;
   };
   if(!confirm("Are you sure that the country is unknown")){return;};
  };
  if(!lD.site)
  {
   alert("You need to give a site");
   return;
  };
  if(!lD.location)
  {
   if(!confirm("Are you sure that the location is unknown")){return;};
  };
  ll=window.opener.locationSpec.object;
  ll.country=lD.country;
  ll.region=lD.region;
  ll.site=lD.site;
  ll.location=lD.location;
  ll.longitude=lD.longitude;
  ll.latitude=lD.latitude;
  ll.changed=true;
  window.opener.locationSpec.changed=true;
 };
 locationApp.prototype.unknown=function()
 {
  app.confirm("Are you sure the location is unkown?").then(function(){
   this.spec.emptyContainer();
   this.locationData.location="Unknown";
   this.locationData.latitude=0;
   this.locationData.longitude=0;
   this.spec.fillContainer();
  }.bind(this)).catch(function(e){});
 };
 locationApp.prototype.close=function(ok)
 {
  if(ok)
  {
   this.spec.refillContainer();
   if(!this.spec.checkRequired())
   {
    return;
   };
   this.update();
  };
  if(app.parent && window.frameElement)
  {
   window.frameElement.close(ok);
  }
  else
  {
   window.close();
  };
 };
 
locationApp.prototype.findCountries=function()
{
 this.countries=window.countries;
 this.countries.unshift("[Marine]");
};

locationApp.prototype.findSites=function(spec)
{
 var lD=this.locationData;
 this.spec.emptyContainer();
/* lD.site="";
 lD.location="";
 lD.region="";
 lD.latitude=0;
 lD.longitude=0;
 lD.location="";*/
 app.setCookie("country",lD.country);
 this.checkToolMenu();
 this.spec.fillContainer();
 return;
 // code for getting possible sites...
 getFromServer(this.intchronRoot+"record/"+spec.object+".json",function(txt){
  var o,c=[],i,p,last=false;
  try
  {
   this.locations=[];
   this.sites=[];
   this.siteIndex={};
   o=JSON.parse(txt);
   for(i=0;i<o.records.length;i++)
   {
    if(o.records[i].longitude && o.records[i].latitude)
    {
     if(!last || (last.site!=o.records[i].site))
     {
      last=o.records[i];
      this.locations.push(last);
      this.sites.push(last.site);
      this.siteIndex[last.site]=last;
     };
    };
   };
   this.reload();
  }
  catch(e)
  {
   app.alert(e);
  };
 }.bind(this),function(e){app.alert(e)}.bind(this));
};

locationApp.prototype.setSite=function(spec)
{
 if(this.siteIndex[spec.object])
 {
  this.spec.emptyContainer();
  this.locationData.longitude=this.siteIndex[spec.object].longitude;
  this.locationData.latitude=this.siteIndex[spec.object].latitude;
  this.spec.fillContainer();
  this.readLocation("Long\/Lat");
 };
};

locationApp.prototype.checkToolMenu=function()
{
 var e,i;
 for(i=0;e=document.getElementById("format__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "NGR":
   if(this.locationData.country=='UK'){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};

locationApp.prototype.reload=function(fmt)
{
  var l=document.getElementById("locationArea");
  if(this.spec){this.spec.emptyContainer();};
  this.parseLocation();
  if(fmt){this.format=fmt;};
  while(l.firstChild){l.removeChild(l.firstChild);};
  this.spec=this.genSpec(this.format);
  l.appendChild(this.spec.createDisplay(this.locationData));
  this.checkToolMenu();
};

locationApp.prototype.initialise=function()
{
 this.checkArgs();
 this.findCountries();
 this.reload();
};

(function () {
 loc=new locationApp();
})();
