var integ;
var WGS84={"f":1/298.257223563,"R":6378137};

function integrateApp()
{
 // taken from the IntChron Schema
 var i,p;
 this.parameters=data.parameters;
 this.seriesHeaders=data.seriesHeaders;
 this.seriesParameters=data.seriesParameters;
 
 //add database specific parameters - not in the schema
 this.parameters=this.parameters.concat([{"parameter":"access_admin","label":"Admin","type":"Boolean","units":"","description":"","options":[]},
  {"parameter":"access_remove","label":"Remove","type":"Boolean","units":"","description":"","options":[]},
  {"parameter":"access_write","label":"Write","type":"Boolean","units":"","description":"","options":[]},
  {"parameter":"intcal_reservoir_sigma","label":"±1σ","type":"Number","units":"","description":"","options":[]},
  {"parameter":"header","label":"Header","type":"Boolean","units":"","description":"","options":[]},
  {"parameter":"headerLine","label":"Parameters","type":"Text","units":"","description":"","options":[]},
  {"parameter":"username","label":"Username","type":"Text","units":"","description":"","options":[]}]);
 
 this.bibElements=["ref","firstauthor","year","reftype","author","title","journal","volume","number","pagefrom","pageto","series","publisher","address","booktitle","chapter","edition","organization","school","institution","url","doi","isbn","citation","reference"];
 
 // items in the header not included in the main parameters for the record
 
 this.recordDetails=['color','z_type','z_basis','z_units',
  't_source','suppress_t','suppress_z','record_comment'];
 
 this.project={records:[],project_series_list:[],options:this.defaultOptions(),bibliography:[],parameters:[]};

 // set up special information not in schema
 var i,parms,p;
 parms=['t','t_sigma','t_median','x','x_range','y','y_range','z','z_range'];
 for(i in parms){this.findParameter(parms[i]).single=true;};
 parms=['calage_range','r_date_sigma_mult'];
 for(i in parms){this.findParameter(parms[i]).default_value="1";};
 parms=['calage_sigmaI','calage_sigmaD','calage_sigmaC','intcal_reservoir','intcal_reservoir_sigma','r_date_sigma_extra','r_date_sigma_batch'];
 for(i in parms){this.findParameter(parms[i]).default_value="0";this.findParameter(parms[i]).dp=0;};
 this.findParameter('ring_width').dp=2;
 
 parms=['r_date','delta_r','reservoir'];
 for(i in parms){this.findParameter(parms[i]).dp=0;};

 parms=['d13C','d15N','d18O','elevation','distance'];
 for(i in parms){this.findParameter(parms[i]).dp=2;};
 this.site_type_colors={"Archaeological":"rgb(160,0,0)","Atmospheric":"rgb(120,180,255)","Dendrochronological":"rgb(144,74,36)","Ice":"rgb(0,166,175)","Marine":"rgb(8,74,195)","Terrestrial":"rgb(16,134,0)","Speleothem":"rgb(102,102,102)","Volcano":"rgb(196,114,0)"};
 this.site_type_symbols={"Archaeological":"∴","Atmospheric":"⊰","Dendrochronological":"⊚","Ice":"❄︎","Marine":"≈","Terrestrial":"⏚","Speleothem":"∩","Volcano":"⩑", };

 p=this.findParameter('site_type');
 p.option_colors=[];
 for(i in p.options)
 {
  if(this.site_type_colors[p.options[i]]){p.option_colors[i]=this.site_type_colors[p.options[i]];}else{p.option_colors[i]="rgb(0,0,0)";};
 };
 this.timeRefs=this.findParameter('t_source').options;
 this.findParameter('ring_width').dp=2;
 
 // link all timescales
 this.findParameter('source_record').options=this.timeRefs;
 this.findParameter('dest_record').options=this.timeRefs;


 this.record={};
 this.exchange={options:{header:true}};
 this.series={};
 this.projectSeries={};
 this.oxcalSource=this.projectSeries;
 this.timescales=[];
 this.recordsSpec=this.genRecordsSpec();
 this.seriesListSpec=this.genSeriesListSpec();
 this.projectOptionsSpec=this.genProjectOptionsSpec();
 this.projectParametersSpec=this.genProjectParametersSpec();
 this.recordSpec=this.genRecordSpec();
 this.exchangeSpec=this.genExchangeSpec();
 this.filenames={"Project":"","Record":""};
 this.seriesSpec=this.genSeriesSpec(this.series);
 this.projectSeriesSpec=this.genProjectSeriesSpec(this.projectSeries);
 this.globalParameterIndex={};
 this.fq=new app.queue("integ.finishProjectData()");
 this.pq=new app.queue();
 this.fileModeIndex=-1;
 this.bibIndex={};
 this.refList=[];
 this.CALBP_DATUM=1950.5;
 this.CALIB_MARGIN=800;
 this.B2K_DATUM=1999.99792604;
 this.extrapolation_error=0.2;
 this.intchronRoot=window.location.href;
 if(this.intchronRoot.indexOf('\/tools\/')!=-1)
 {
  this.intchronRoot=this.intchronRoot.slice(0,this.intchronRoot.indexOf('\/tools\/'))+'\/';
 }
 else
 {
  this.intchronRoot="https:\/\/intchron.org\/";
 };
 this.intchronIndex={"host":"","ref":"","record":"","series":""};
 for(let i in this.intchronIndex){this.intchronIndex[i]=this.intchronRoot+i;};
 this.intchronBase={"records":[{"Source":"Hosts","file":this.intchronIndex['host']+".json"},
  {"Source":"Publications","file":this.intchronIndex['ref']+".json"},
  {"Source":"Records","file":this.intchronIndex['record']+".json"},
  {"Source":"Series","file":this.intchronIndex['series']+".json"}]};
 this.intchronTree=[];
 this.intchronContent=this.intchronBase;
 this.oxcalURL="../oxcal/OxCal.html?view=status&source=";
 this.oxcalTemp="/integ_temp";
 this.refEditSpec=false;
 this.displayRefs=false;
 this.DoiURL="https://doi.org/";
 this.intcalPO={"t_from":null,"t_to":null,"plot":0,"curves":0,"chosen":false};
 this.intcalTypeCol={"Compare":"rgb(128,128,128)","Extra":"rgb(128,128,128)",
  "Marine":"rgb(0,30,255)","Int":"rgb(0,255,30)","NewInt":"rgb(0,255,30)",
  "SH":"rgb(0,180,180)","NewSH":"rgb(0,180,180)","SH1-2":"rgb(0,105,210)",
  "SH3":"rgb(0,180,180)","NH3":"rgb(0,255,30)","NH2":"rgb(105,210,0)",
  "NH1":"rgb(210,105,0)"};
 this.plotID=0;
 this.icon="intimate.png";
 this.serversShown={};
 this.serversShown[this.icon]=true;
 this.serverIcons={"IntCal":"IntCal.jpg","MRDB":"MRDB.png"};
 this.applicationOpt={"icon":"INTIMATE_icon.png","name":app.header.title,"message":
  "An INTIMATE group initiative\nversion: "+app.header.version+"."+header.version,"updated":new Date(header.issued)};
};

integrateApp.prototype.defaultOptions=function()
{
 var o={t_units:app.getCookie(app.header.id+"_t_units"),t_from:null,t_to:null,t_autorange:true,z_units:'m',ondemand:false,include_data:false,vert:false,reversex:false,reversey:false};
 if(!o.t_units){o.t_units="calBP";};
 return o;
};

integrateApp.prototype.findObjInArray=function(a,p,v)
{
 var i;
 for(i=0;i<a.length;i++)
 {
  if(a[i][p]==v){return a[i];};
 };
 return false;
};

integrateApp.prototype.objectToArray=function(o,recur)
{
 var k,l,i;
 integ.ageLim(o);
 // if already in this form possibly legacy, covert back and forth to catch dt
 if(Array.isArray(o))
 {
  if(recur)
  {
   return o;
  }
  else
  {
   return integ.objectToArray(integ.arrayToObject(o),true);
  };
 };
 var a=[];
 for(k in o)
 {
  switch(k)
  {
  case 'dt': l='t_sigma';break;
  case 'species': l='taxon';break;
  case 'volc_site': l='volcano';break;
  case 'updated':
   l=k;
   if(Array.isArray(o[k]))
   {
    for(i=0;i<o[k].length;i++)
    {
     switch(typeof(o[k][i]))
     {
     case "number":case "string":
      o[k][i]=new Date(o[k][i]);
      break;
     };
    };
   };
   break;
  default: l=k;break;
  };
  if(!Array.isArray(o[k]))
  {
   i=0;
   if(i>=a.length){a[i]={};};
   a[i][l]=o[k];
   continue;
  };
  for(i=0;i<o[k].length;i++)
  {
   if(i>=a.length){a[i]={};};
   a[i][l]=o[k][i];
  };
 };
 return a;
};

integrateApp.prototype.arrayToObject=function(a)
{
 var k,i,needed=false; // needed catches simple arrays
 if(!Array.isArray(a)){return a;};
 var o={};
 for(i=0;i<a.length;i++)
 {
  if(typeof(a[i])!='object'){continue;};
  needed=true;
  for(k in a[i])
  {
   if(!o[k]){o[k]=[];};
   if(typeof(a[i][k])==='number')
   {
    o[k][i]=Number(a[i][k].toPrecision(10));
   }
   else
   {
    o[k][i]=a[i][k];
   };
  };
 };
 if(!needed){return a;};
 return o;
};

integrateApp.prototype.recursiveDataFlip=function(a,f)
{
 var k;
 if(typeof(a)!='object'){return;};
 for(k in a)
 {
  if(k=='data')
  {
   a['data']=f(a['data']);
  }
  else
  {
   this.recursiveDataFlip(a[k],f);
  };
 };
 return a;
};

integrateApp.prototype.findParameter=function(parameter)
{
 var o=this.findObjInArray(this.project.parameters,"parameter",parameter);
 if(o){return o;};
 var o=this.findObjInArray(this.parameters,"parameter",parameter);
 if(o){return o;};
 if(parameter.indexOf("_sigma")!=-1)
 {
  if(o=this.findParameter(parameter.replace("_sigma","")))
  {
   return {"type":o.type,"parameter":parameter,"dp":o.dp,"label":this.labelIndex["error"],"options":false};
  };
 };
 return {"parameter":parameter,"label":this.parameterLabel(parameter),"type":"Number"};
};

integrateApp.prototype.parentChanger=function(s)
{
 if(s.changer){s.doChange();};
};

integrateApp.prototype.findCountries=function()
{
  var o,c=[],i,p;
  o=window.countries;
  for(i=0;i<o.length;i++)
  {
   c.push(o[i].country);
  };
  p=this.findParameter('country');
  p.options=c;
  app.countries=c;
};


integrateApp.prototype.fixed=function(spec,dp)
{
 var e;
 spec.specialTeX=app.toFixed(spec.object,dp);
 e=document.createTextNode(spec.specialTeX);
 if(spec.specialTeX=='-'){spec.container.style.textAlign='center';};
 spec.container.appendChild(e);
};

integrateApp.prototype.openModel=function(obj,ext)
{
 switch(obj.model_type)
 {
 case "OxCal":
  if(obj.file && this.drivePath(obj.file))
  {
   window.open(this.oxcalURL+this.drivePath(obj.file).replace(".oxcal",ext));
  }
  else
  {
   app.alert("OxCal model not saved yet");
  };
  break;
 case "Dendro":
  break;
 };
};

integrateApp.prototype.showFile=function(spec)
{
 var str,e,ar,i,d,p_obj;
 p_obj=spec.parent.object;
 if(p_obj.file_data){p_obj=p_obj.file_data;};
 str=spec.object.replace('.json','');
 if(!str)
 {
  if(p_obj.project_series_type=='Model')
  {
   str=p_obj.series;
  }
  else
  {
   return;
  };
 };
 str=str.replace(integ.intchronRoot,'IntChron:/');
 ar=str.split('\/');
 if(ar.length>1)
 {
  str=ar[0]+"\/...\/"+decodeURIComponent(ar[ar.length-1]);
 };
 d=document.createElement('div');
 if((p_obj.project_series_type=='Model')||(p_obj.series_type=='Model'))
 {
  if(p_obj.done)
  {
   e=document.createElement('div');
   e.className='appProgressBar';
   e.style.width=p_obj.done+"%";
   e.style.height='100%';
   d.appendChild(e);
   d.onclick=function(){integ.openModel(p_obj,".js");};
  }
  else
  {
   d.onclick=function(){integ.openModel(p_obj,".oxcal");};
  };
 };
 e=document.createTextNode(str);
 if(spec.parent.object.file_data && !spec.parent.object.changed){d.className='fileLoaded';}
 else{d.className='fileUnloaded';};
 d.appendChild(e);
 spec.container.appendChild(d);
};
integrateApp.prototype.showFileSize=function(spec)
{
   var s=spec.object,sz="";
   if(s<1024)
   {
    sz=s+" bytes";
   }
   else
   {
    if(s<1048576)
    {
     sz=Math.round(s/1024)+" KB";
    }
    else
    {
     sz=Math.round(s/1048576)+" MB";
    };
   };
   spec.container.appendChild(document.createTextNode(sz)); 
};

integrateApp.prototype.openFile=function(fn)
{
 var ext="";
 if(fn.indexOf('.')!=-1){ext=fn.split(".").pop().toLowerCase();};
 if(!this.drivePath(fn)){app.alert("File cannot be opened");return;};
 switch(ext)
 {
 case "oxcal":
   window.open("../oxcal/OxCal.html?Mode=Input&source="+encodeURIComponent(this.drivePath(fn)),"");
   break;
 case "js":
   window.open("../oxcal/OxCal.html?source="+encodeURIComponent(this.drivePath(fn)),"");
   break;
 case "work":
   window.open("../oxcal/OxCal.html?source="+encodeURIComponent(this.drivePath(fn.replace(".work",'.js'))),"");
   break;
 case "png":
 case "jpg":
 case "jpeg":
   app.image(fn.split("/").pop(),this.urlPath(fn),"600px","400px");
   break;
 case "pdf":
 default:
   app.iFrame(fn.split("/").pop(),this.urlPath(fn),"600px","400px");
   break;
 };
};

integrateApp.prototype.showFileInList=function(spec)
{
 var fn=spec.object,dir=spec.parent.object.dir,ext="";
 if((typeof(dir)!="undefined")&&(dir))
 {
  spec.container.appendChild(itemSpec.prototype.folder());
  spec.container.appendChild(document.createTextNode(fn));
  spec.container.ondblclick=function(e){
   e.stopPropagation();
   if(this.drivePath(spec.parent.parent.parent.object.path+"/"+fn))
   {
    app.dirView(this.drivePath(spec.parent.parent.parent.object.path+"/"+fn));
   };
   return false;}.bind(this);
  return;
 };
 if(fn.indexOf('.')!=-1){ext=fn.split(".").pop().toLowerCase();};
 switch(ext)
 {
 case "oxcal":
  spec.container.appendChild(itemSpec.prototype.file("model"));
  break;
 case "js":
  spec.container.appendChild(itemSpec.prototype.file("plot"));
  break;
 case "work":
  spec.container.appendChild(itemSpec.prototype.file("working"));
  break;
 case "log":
  spec.container.appendChild(itemSpec.prototype.file("log"));
  break;
 default:
  spec.container.appendChild(itemSpec.prototype.file("text"));
  break;
 };
 spec.container.appendChild(document.createTextNode(fn));
 spec.container.className='objLink';
 try
 {
  if(spec.parent.parent.parent.object.series_type=="Dendro_Cores")
  {
   spec.container.onclick=function(e){
    e.stopPropagation();
    dendro.viewCore(this.record,spec.parent.object,spec.parent.parent.parent.object.path+"/"+fn);
    return false;
   }.bind(this);
   return;
  };
 }catch(e){};
 spec.container.onclick=function(e){
   e.stopPropagation();
   this.openFile(spec.parent.parent.parent.object.path+"/"+fn);
   return false;}.bind(this);
};

integrateApp.prototype.showSeries=function(spec)
{
 var str=spec.object;
 if(str.length > 50)
 {
  str=str.slice(0,25)+"..."+str.slice(str.length-21);
 };
 if(!spec.edit)
 {
  spec.container.className='objLink';
  spec.container.onclick=function(){integ.linkSeries(spec);};
 };
 spec.appendComplexText(spec.container,str);
};

integrateApp.prototype.showType=function(spec)
{
 var str=spec.object,parms,parms_ar,i;
 switch(spec.object)
 {
 case "Dendro_Master":
  if(spec.parent.object.t_from||spec.parent.object.t_to)
  {
   str+=" ["+integ.showTString(spec.parent.object.t_from)+"-"+integ.showTString(spec.parent.object.t_to)+"]"
  };
  break;
 case "Dendro_Sample":
  if(spec.parent.object.dated)
  {
   str+=" ["+integ.showTString(spec.parent.object.t_from)+"-"+integ.showTString(spec.parent.object.t_to)+"]"
  }
  else
  {
   str+=" [n="+spec.parent.object.ring_count+"]"
  };
  break;
 case "Tephra_Sample_Majors":
 case "Tephra_Sample_Trace":
  if(spec.parent.object.volc_region || spec.parent.object.volcano || spec.parent.object.eruption)
  {
   str+=" [";
   if(spec.parent.object.volc_region){str+=spec.parent.object.volc_region;}else{str+="-";};
   if(spec.parent.object.volcano){str+="/"+ spec.parent.object.volcano;};
   if(spec.parent.object.eruption){str+="/"+  spec.parent.object.eruption;};
   str+="]"
  };
  break;
 case "Files":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
 case "Maps":
  spec.container.appendChild(itemSpec.prototype.folder());
  spec.appendComplexText(spec.container," "+spec.object);
  return;
 default:
  if(spec.parent.object.series_sample)
  {
   str+=" ["+spec.parent.object.series_sample+"]"
  }
  else
  {
   if(spec.parent.object.parameter_list)
   {
    parms=spec.parent.object.parameter_list.split(/\s*,\s*/);
    parms_ar=[];
    for(i in parms)
    {
     if(parms[i].indexOf("~")==0){continue;};
     parms_ar.push(parms[i]);
    };
    parms=parms_ar.join(",");
    if(parms.length+str.length > 60)
    {
     parms=parms.slice(0,47-str.length)+"...";
    };
    str+=" ["+parms+"]"
   };
  };
  break;
 };
 spec.appendComplexText(spec.container,str);
};

integrateApp.prototype.showSiteType=function(spec)
{
 var e,str=spec.object;
 if(this.site_type_colors[str]){spec.container.style.color=this.site_type_colors[str];};
 if(this.site_type_symbols[str]){str=this.site_type_symbols[str];};
 e=document.createTextNode(str);
 spec.container.style.textAlign="center";
 spec.container.appendChild(e);
};

integrateApp.prototype.d2dms=function(num,m,p)
{
 var v,sec,min,deg;
 v=Math.round(Math.abs(num*3600));
 sec=v % 60;
 v=(v-sec)/60;
 min=v % 60;
 v=(v-min)/60;
 deg=v % 360;
 v="";
 if(deg){v+=deg+"° ";};
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

integrateApp.prototype.showLong=function(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=this.d2dms(l,"W","E");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};

integrateApp.prototype.showLat=function(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=this.d2dms(l,"S","N");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};


integrateApp.prototype.locator=function(spec)
{
 app.locationSpec=spec.parent;
 app.iFrame("Location","../db/db_locator.html","350px","400px");
};

integrateApp.prototype.safeName=function(name)
{
 return name.replace(/[\s\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\.\;\=\%\"\<\>\\\^\`\{\|\}\r\n]/g,"_").replace(/[_]+/g,"_");
};

integrateApp.prototype.uniqueName=function(name)
{
 var nm,i;
 nm=this.safeName(name);
 for(i=0;i<this.project.records.length;i++)
 {
  if(this.project.records[i].record==nm){return false;};
 };
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(this.project.project_series_list[i].series==nm){return false;};
 };
 if(this.record)
 {
  for(i=0;i<this.record.series_list.length;i++)
  {
   if(this.record.series_list[i].series==nm){return false;};
  };
 };
 return nm;
};

integrateApp.prototype.autoUniqueName=function(name)
{
 var i=1,nm=name;
 while(!this.uniqueName(nm))
 {
  i++;
  nm=name+"-"+i;
 };
 return nm;
};

integrateApp.prototype.promptForName=function(typ)
{
 return new Promise(function(resolve,reject){
  app.prompt("New "+typ+" name").then(function(name){
   if(nm=this.uniqueName(name)){resolve(nm);}else{reject("Duplicate name: "+name);};
  }.bind(this)).catch(function(e){reject(e)});
  this.fileResolve=resolve;
 }.bind(this));
};

integrateApp.prototype.checkDuplicates=function(context,replace)
{
 return new Promise(async function(resolve,reject){
  var i,j,k,o,ans=false;
  if(replace){ans=2;};
  var c={"Record":{"a":this.project.records,"n":"record","s":this.recordsSpec},
         "Series":{"a":this.record.series_list,"n":"series","s":this.recordSpec},
         "ProjectSeries":{"a":this.project.project_series_list,"n":"series","s":this.seriesListSpec}};
  for(i=1;i<c[context].a.length;i++)
  {
   for(j=0;j<i;j++)
   {
    if(c[context].a[j][c[context].n]==c[context].a[i][c[context].n])
    {
     try
     {
      if(ans||await app.confirm("Duplicate "+context+"\n"+c[context].a[j][c[context].n]))
      {
       if(!ans){ans=await app.menu("Duplicate "+context+"|Keep|Replace|Update||Keep all|Replace all|Update all")};
       c[context].s.emptyContainer();
       switch(ans)
       {
       case 1: case 5:
        switch(context)
        {
        case "Record":
         this.viewRecord(c[context].a[j]);
         break;
        case "ProjectSeries":
         this.viewProjectSeries(c[context].a[j]);
         break;
        case "Series":
         this.viewSeries(c[context].a[j]);
         break;
        };
        c[context].a.splice(i,1);j=i;i--;
        break;
       case 2: case 6:
        switch(context)
        {
        case "Record":
         this.viewRecord(c[context].a[i]);
         break;
        case "ProjectSeries":
         this.viewProjectSeries(c[context].a[i]);
         break;
        case "Series":
         this.viewSeries(c[context].a[i]);
         break;
        };
        c[context].a[i].created=c[context].a[j].created;
        if(c[context].a[j].file){c[context].a[i].file=c[context].a[j].file;};
        c[context].a[i].changed=true;
        c[context].a.splice(j,1);j--;i--;
        break;
       case 3: case 7:
        switch(context)
        {
        case "Record":
         this.viewRecord(c[context].a[j]);
         this.recordSpec.emptyContainer();
         for(o in c[context].a[i].file_data.header)
         {
          if(c[context].a[i].file_data.header[o])
          {c[context].a[j].file_data.header[o]=c[context].a[i].file_data.header[o]};
         };
         for(k=0;k<c[context].a[i].file_data.refs.length;k++)
         {
          this.addRefToList(c[context].a[j].file_data.refs,c[context].a[i].file_data.refs[k])
         };
         for(k=0;k<c[context].a[i].file_data.refs.length;k++)
         {
          this.addRefToList(c[context].a[j].file_data.refs,c[context].a[i].file_data.refs[k])
         };
         for(k=0;k<c[context].a[i].file_data.series_list.length;k++)
         {
          c[context].a[i].file_data.series_list[k].created=true;
          c[context].a[j].file_data.series_list.push(c[context].a[i].file_data.series_list[k]);
         };
         this.recordSpec.fillContainer();
         c[context].s.fillContainer();
         this.onRecordChange(true);
         await this.checkDuplicates("Series");
         c[context].s.emptyContainer();
         break;
        case "ProjectSeries":
         this.viewProjectSeries(c[context].a[j]);
         this.projectSeriesSpec.emptyContainer();
         for(o in c[context].a[j].file_data)
         {
          if(c[context].a[j].file_data[o])
          {c[context].a[i].file_data[o]=c[context].a[j].file_data[o]};
         };
         this.projectSeriesSpec.fillContainer();
         c[context].s.fillContainer();
         this.onProjectSeriesChange();
         c[context].s.emptyContainer();
         break;
        case "Series":
         this.viewSeries(c[context].a[j]);
         this.seriesSpec.emptyContainer();
         for(o in c[context].a[j])
         {
          if(c[context].a[j][o])
          {c[context].a[i][o]=c[context].a[j][o]};
         };
         this.seriesSpec.fillContainer();
         c[context].s.fillContainer();
         this.onSeriesChange();
         c[context].s.emptyContainer();
         break;
        };
        c[context].a.splice(i,1);j=i;i--;
        break;
       };
       c[context].s.fillContainer();
       if(ans<5){ans=false;};
      };
     }
     catch(e)
     {
      c[context].s.emptyContainer();
      switch(context)
      {
      case "Record":
       this.viewRecord(c[context].a[j]);
       break;
      case "ProjectSeries":
       this.viewProjectSeries(c[context].a[j]);
       break;
      case "Series":
       this.viewSeries(c[context].a[j]);
       break;
      };
      c[context].a.splice(i,1);j=i;i--;
      c[context].s.fillContainer();
     };
    };
   };
  };
  resolve(true);
 }.bind(this));
};

integrateApp.prototype.arrayLabel=function(parent,parameter)
{
 switch(parent)
 {
 case "tephra_majors":
  return tephra.parameterLabel(parameter);
 };
 return parameter;
};

integrateApp.prototype.genSpec=function(s,parameter,label)
{
 var ss,i,ty,lu;
 var p=this.findParameter(parameter);
 if(!p){app.alert(parameter+" not found",{"id":"GenSpec"});};
 if(p.options && p.options.length && (p["type"]=="Array"))
 {
  for(i=0;i<p.options.length;i++)
  {
   ss=s.appendChild(p.options[i],this.arrayLabel(parameter,p.options[i]),"Number");
  };
  return ss;
 };
 if(!label){label=p.label;};
 if(!s.set){s.set={}};
 if(s.set[parameter]){return new itemSpec("dummy","","Text");};// don't add something twice
 s.set[parameter]=true;
 ss=s.appendChild(parameter,label,p["type"]);
 ss.changer=this.parentChanger.bind(this,s);
 switch(parameter)
 {
 case "project_series_type":
 case "series_type":
  if(this.project.options && this.project.options.series)
  {
   ty=[];
   for(i=0;i<this.project.options.series.length;i++)
   {
    if(parameter=="project_series_type")
    {
     if(this.project.options.series[i].project)
     {
      ty.push(this.project.options.series[i].series_type);
     };
    }
    else
    {
     if(this.project.options.series[i].record)
     {
      if(!this.project.options.series[i].site_type||
       (this.project.options.series[i].site_type==this.record.header.site_type))
      {
       ty.push(this.project.options.series[i].series_type);
      };
     };
    };
   };
   ss.options=this.mergeLists(p["options"],ty);
   break;
  };
 default:
  if(p["options"])
  {
   ss.options=p["options"];
  };
  break; 
 }
 if((typeof(p["dp"])=='number')&&(!isNaN(p["dp"]))&&(p["type"]=="Number"))
 {
  ss.special="integ.fixed(this,"+p["dp"]+")";
 };
 if(p["popup"] && (s.type=='Array'))
 {
  ss.popup=true;
 };
 if(p["hidden"]){ss.hidden=true;};
 if(p["notes"]){ss.hint=p["notes"];};
 switch(parameter)
 {
 case "t_from":
 case "t_to":
 case "t":
  if(this.ring_data)
  {
   if(parameter=="t"){ss.label=ss.prompt="Group ring";};
   break;
  }
  else
  {
   ss.label=this.dateLabel();
  };
 case "date_datum":
  ss.special="integ.showT(this)";
  ss.editor={"read":this.readDate.bind(this),"write":this.writeDate.bind(this)};
  break;
 case "t_sigma":
  ss.special="integ.showDT(this)";
  break;
 case "longitude":
  ss.special="integ.showLong(this)";
  ss.editor="integ.locator(this)";
  break;
 case "latitude":
  ss.special="integ.showLat(this)";
  ss.editor="integ.locator(this)";
  break;
 case "width":
 case "height":
  ss.prompt+=this.lUnitsDisp();
  break;
 case "x":
 case "y":
  if(this.lUnits())
  {
   ss.prompt=parameter+this.lUnitsDisp();
  };
  break;
 case "z":
  s.has_z=true;
  if(this.ring_z)
  {
   ss.readonly=true;
   ss.prompt="Ring";
   break;
  };
  ss.prompt=this.depthLabel(this.record,this.zUnits());
  switch(this.zUnits())
  {
  case 'layers':ss.prompt="Layer";break;
  case 'rings':ss.prompt="Ring";break;
  };
  ss.special="integ.showZ(this)";
  ss.zunits=this.zUnits();
  ss.editor={"read":this.readZ.bind(this),"write":this.writeZ.bind(this)};
  break;
 case "z_range":
  if(!s.has_z)
  {
   ss.prompt="Thickness";
   ss.prompt+=this.zUnitsDisp();
   ss.special="integ.showZ(this)";
   ss.zunits=this.zUnits();
   ss.editor={"read":this.readZ.bind(this),"write":this.writeZ.bind(this)};
   break;
  };
  switch(this.project.options.z_style)
  {
  case "z_from-z_to":
  case "z±dz":
   ss.hidden=true;
   break;
  default:
   ss.prompt+=this.zUnitsDisp();
   ss.special="integ.showZ(this)";
   ss.zunits=this.zUnits();
   ss.editor={"read":this.readZ.bind(this),"write":this.writeZ.bind(this)};
   ss.hidden=false;
   break;
  };
  break;
 case "data":
  ss.special=this.showData.bind(this);
  ss.editor={"read":this.readData.bind(this),"write":this.writeData.bind(this)};
  break;
 case "refs":
  this.genSpec(ss,"ref");
  ss.appender=function(ss)
  {
   this.editRef(ss);
  }.bind(this);
  break;
 case "ref":
  ss.special="integ.showRef(this)";
  ss.editor="integ.editRef(this)";
  ss.onSort="citation";
  break;
 case "file":
  ss.special="integ.showFile(this)";
  break;
 case "project_series_type":
 case "series_type":
  ss.special="integ.showType(this)";
  break;
 case "site_type":
  ss.special="integ.showSiteType(this)";
  break;
 case "series":
  ss.special="integ.showSeries(this)";
  ss.action="integ.linkSeries(this)";
  ss.readonly=true;
  break;
 case "record":
  ss.action="integ.linkRecord(this.object)";
  ss.readonly=true;
  break;
 case "site":
  ss.editor="integ.locator(this)";
  break;
 case "country":
  ss.editor="integ.locator(this)";
  ss.action=async function(spc){
   this.searchResults=await this.doSearch("Records",{"parameter_list":"","where":"country='"+spc.object+"'","order":"record","distinct":true,"search_title":"Country: "+spc.object});
   this.showSearchResults();
  }.bind(this);
  break;
 case "path":
 case "ring_count":
  ss.readonly=true;
  break;
 case "filename":
  ss.readonly=true;
  ss.special="integ.showFileInList(this)";
  break;
 case "filesize":
  ss.readonly=true;
  ss.special="integ.showFileSize(this)";
  break;
 case "updated":
  ss.readonly=true;
  break;
 case "dir":
  ss.hidden=true;
  break;
 case "sample":
  ss.action="integ.viewSample(this)";
  break;
 case "batch":
  ss.action=async function(spc){
   this.searchResults=await this.doSearch("Data",{"parameter_list":"record,site,series","where":"batch='"+spc.object+"'","order":"record,series","distinct":true,"search_title":"Batch: "+spc.object});
   this.showSearchResults();
  }.bind(this);
  break;
 case "sapwood":
  ss.special="dendro.showSapwood(this)";
  break;
 case "noaa_ncei_study":
  ss.action=function(spc){window.open(noaa.NoaaStudyURL+spc.object);}.bind(this);
  break;
 case "intcal_set":
  ss.action=async function(spc){
   this.searchResults=await this.doSearch("Series",{"parameter_list":"intcal_division,record,site,latitude,longitude,series","where":"intcal_set=='"+spc.object+"'","order":"intcal_division","search_title":"IntCal set: "+spc.object});
   this.showSearchResults();
  }.bind(this);
  break;
 case "eruption":
  ss.action=async function(spc){
   this.searchResults=await tephra.search("eruption",spc.object);
   this.showSearchResults();
  }.bind(this);
  ss.changer=function(spc){
   var v=tephra.eruption_volcano(spc.object);
   if(!v){return;};
   spc.parent.emptyContainer();
   if(typeof(spc.parent.object.volcano)!="undefined")
   {
    spc.parent.object.volcano=v;
   };
   spc.parent.fillContainer();
  }.bind(this);
  if(!tephra.eruption_options){tephra.findEruptions();};
  if(tephra.eruption_options){ss.options=tephra.eruption_options;ss.options.unshift("");};
  break;
 case "volcano":
  ss.action=async function(spc){
   this.searchResults=await tephra.search("volcano",spc.object);
   this.showSearchResults();
  }.bind(this);
  ss.changer=function(spc){
   var i,e=tephra.volcano_eruptions(spc.object);
   spc.parent.emptyContainer();
   for(i=0;i<spc.parent.children.length;i++)
   {
    if(spc.parent.children[i].name=="eruption")
    {
     spc.parent.children[i].options=e;
     spc.parent.children[i].options.unshift("");
    };
   };
   spc.parent.fillContainer();
  }.bind(this);
  if(!tephra.eruption_options){tephra.findEruptions();};
  if(tephra.volcano_options){ss.options=tephra.volcano_options;ss.options.unshift("");};
  break;
 case "region":
  ss.editor="integ.locator(this)";
  ss.action=async function(spc){
   if(spc.parent.object.site_type!="Volcano")
   {
    this.searchResults=await this.doSearch("Records",{"parameter_list":"","where":"region='"+spc.object+"'","order":"record","distinct":true,"search_title":"Region: "+spc.object});
    this.showSearchResults();
   }
   else
   {
    this.searchResults=await tephra.search("volc_region",spc.object);
    this.showSearchResults();
   };
  }.bind(this);
  break;
 case "volc_region":
  ss.action=async function(spc){
   this.searchResults=await tephra.search("volc_region",spc.object);
   this.showSearchResults();
  }.bind(this);
  if(!tephra.eruption_options){tephra.findEruptions();};
  if(tephra.volc_region_options){ss.options=tephra.volc_region_options;};
  break;
 default:
  if((parameter.indexOf("t_")==0)&&(p["type"]=="Number")&&!this.ring_data)
  {
   if((parameter.indexOf("_sigma")!=-1)||(parameter.indexOf("_range")!=-1))
   {
    ss.special="integ.showDT(this)";
   }
   else
   {
    ss.special="integ.showT(this)";
    ss.editor={"read":this.readDate.bind(this),"write":this.writeDate.bind(this)}; 
   };
   break;
  };
  break;
 };
 if(p['default_value'])
 {
  ss.defaultValue=p['default_value'];
 };
 if(p.single)
 {
  ss.changer=function(spec)
  {
   spec.parent.object["__updated"]=Date.now();
   this.parentChanger(s);
  }.bind(this);
 };
 if(p.search)
 {
  ss.action=async function(spc){
   var order=p.search_parameters.split(/\s*,\s*/).slice(0,3).join(",");
   var val=spc.object;
   var parms=p.search_parameters;
   if(!parms){parms="*";};
   if(typeof(val)=="string"){val='"'+val+'"';}else{val=""+val;};
   this.searchResults=await this.doSearch(p.search,{"parameter_list":parms,
     "where":p.parameter+"=="+val,
     "order":order,"distinct":true,
     "search_title":p.label+": "+spc.object});
   this.showSearchResults();
  }.bind(this);
 };
 if(this.ring_z)
 {
  switch(parameter)
  {
  case "t_from":
  case "t_to":
  case "t_to_orig":
   ss.editor=dendro.editHeader.bind(dendro,ss);
   break;
  case "t_source":
   ss.editor=dendro.editHeader.bind(dendro,ss);
   ss.hidden="ifFalse";
   break;
  };
 };
 return ss;
};

integrateApp.prototype.addRecord=function()
{
 var nm;
 this.promptForName("record").then(function(nm){
  app.fileNew('Record',JSON.stringify({"json_application":app.header.id+".Record","header":{"record":nm}}));
  app.toolTitle('Record','');
  app.showTool('Record');
 }.bind(this)).catch(function(e){app.alert(e);});
};

integrateApp.prototype.genRecordsSpec=function()
{
 var spec,ss,i,parms;
 spec=new itemSpec("records","Records","Array");
 spec.database=true;
 spec.transparent=true;
 spec.exchanger="integ.importData('Records')";
 ss=this.genSpec(spec,"file");
 ss.readonly=true;
 ss=spec.appendChild("View","","Action");
 ss.readonly=true;
 ss.action="integ.viewRecord(this.parent.object)";
 ss=this.genSpec(spec,"record");
 ss.readonly=true;
 ss=this.genSpec(spec,"site");
 ss.readonly=true;
 if(this.project && this.project.options && this.project.options.record_parameters)
 {
  parms=this.mergeLists(this.project.options.record_parameters,["site_type"]);
  for(i=0;i<parms.length;i++)
  {
   ss=this.genSpec(spec,parms[i]); 
   ss.readonly=true;
  };
 }
 else
 {
  ss=this.genSpec(spec,"site_type");
  ss.readonly=true;
 };
 ss=this.genSpec(spec,"country");
 ss.hidden=true;
 ss=this.genSpec(spec,"latitude");
 ss.hidden=true;
 ss=this.genSpec(spec,"longitude");
 ss.hidden=true;
 ss=this.genSpec(spec,"elevation");
 ss.hidden=true;
 ss.popup=true;
 ss=this.genSpec(spec,"color"); 
 ss.readonly=true;
 spec.appender=function(spec)
 {
  this.addRecord();
 }.bind(this);
 return spec;
};

integrateApp.prototype.addProjectSeries=function()
{
 this.promptForName("series").then(function(nm){
  app.fileNew('Series',JSON.stringify({"json_application":app.header.id+".Series","series":nm}));
  app.showTool('ProjectSeries');
 }.bind(this)).catch(function(e){app.alert(e);});
};


integrateApp.prototype.genSeriesListSpec=function()
{
 var spec,ss;
 // relationships
 spec=new itemSpec("project_series_list","Series","Array");
 spec.database=true;
 spec.transparent=true;
 spec.exchanger="integ.importData('ProjectSeriesList')";
 spec.className="objBlank";
 ss=this.genSpec(spec,"file");
 ss.readonly=true;
 ss=spec.appendChild("View","","Action");
 ss.readonly=true;
 ss.action="integ.viewProjectSeries(this.parent.object)";
 ss=this.genSpec(spec,"series");
 ss.readonly=true;
 ss=this.genSpec(spec,"project_series_type");
 ss.readonly=true;
 ss=this.genSpec(spec,"t_from");
 ss.hidden=true;
 ss=this.genSpec(spec,"t_to");
 ss.hidden=true;
 spec.appender=function(spec)
 {
  this.addProjectSeries();
 }.bind(this);
 return spec;
};

integrateApp.prototype.genProjectOptionsSpec=function()
{
 var spec,ss,sss;
 spec=new itemSpec("options","Project name & options","Object");
 spec.noheader=true;
 spec.transparent=true;
 spec.edit=true;
 ss=this.genSpec(spec,"name");
 ss.readonly=true;
 ss=spec.appendChild("message","Message","TextArea");
 ss.width=30;
 ss=spec.appendChild("icon","Icon","Text");
 ss=spec.appendChild("updated","Updated","Date");
 ss.readonly=true;
 ss=this.genSpec(spec,"t_units");
 ss.changer="integ.reloadAll()";
 ss=this.genSpec(spec,"t_schulman");
 ss.changer="integ.reloadAll()";
 ss=this.genSpec(spec,"t_from");
 ss.changer="integ.project.t_autorange=false";
 ss=this.genSpec(spec,"t_to");
 ss.changer="integ.project.t_autorange=false";
 ss=this.genSpec(spec,"t_autorange");
 ss=this.genSpec(spec,"z_units");
 ss.changer="integ.reloadAll()";
 ss=this.genSpec(spec,"z_style");
 ss.changer="integ.reloadAll()";
 ss=spec.appendChild("reversex","Reverse x axis","Boolean");
 ss=spec.appendChild("reversey","Reverse y axis","Boolean");
 ss=this.genSpec(spec,"ondemand");
 ss.changer="integ.readProjectData()";
 ss=spec.appendChild("include_data","Include data","Boolean");
 ss=spec.appendChild("record_parameters","Record parameters","Text");
 ss.changer="integ.reloadAll()";
 ss.hidden="ifFalse";
 ss=spec.appendChild("series","Series options","Array")
 ss.changer="integ.reloadAll()";
 sss=ss.appendChild("series_type","Series type","Text");
 sss=ss.appendChild("record","Record","Boolean");
 sss=this.genSpec(ss,"site_type");
 sss=ss.appendChild("project","Project","Boolean");
 sss=this.genSpec(ss,"header_list");
 sss.popup=true;
 sss=this.genSpec(ss,"parameter_list");
 sss.popup=true;
 return spec;
};

integrateApp.prototype.genProjectParametersSpec=function()
{
 var spec,sss;
 spec=new itemSpec("parameters","Parameters","Array");
 spec.noheader=true;
 spec.transparent=true;
 spec.database=true;
 spec.changer=this.indexParameters();
 sss=spec.appendChild("parameter","Parameter","Text");
 sss=spec.appendChild("units","Units","Text");
 sss=spec.appendChild("record","Record","Text");
 sss=spec.appendChild("label","Label","Text");
 sss=spec.appendChild("type","Type","Text");
 sss.options=['Number','Boolean','Text'];
 sss=spec.appendChild("dp","DP","Number");
 sss=spec.appendChild("invert","Invert","Boolean");
 sss=spec.appendChild("popup","Popup","Boolean");
 sss.hint="Shown in popup section of tables";
 sss.popup=true;
 sss=spec.appendChild("hidden","Hidden","Boolean");
 sss.hint="Hidden in tables";
 sss.popup=true;
 sss=spec.appendChild("single","Single-valued","Boolean");
 sss.hint="Single value for a distinct sample";
 sss.popup=true;
 sss=spec.appendChild("default_value","Default","Text");
 sss.hint="Default value";
 sss.popup=true;
 sss=spec.appendChild("options","Options","Array");
 sss.appendChild("option","Option","Text");
 sss.popup=true;
 sss=spec.appendChild("option_colors","Option colors","Array");
 sss.appendChild("color","Color","Color");
 sss.popup=true;
 sss=spec.appendChild("search","Search on","Text");
 sss.options=["","Data","Records","Samples","Series"];
 sss.popup=true;
 sss=spec.appendChild("search_parameters","Search parameters","Text");
 sss.popup=true;
 sss=spec.appendChild("notes","Notes","TextArea");
 sss.popup=true;
 return spec;
};

integrateApp.prototype.recolorRecords=function(single,ind)
{
 var i,no=0,count,parms,opt=[false,'order','specific','elevation','latitude','longitude','site_type'],p,men="Color by|Order|Specific color";
 if(single)
 {
  this.project.records[ind].color=plotLink.prototype.hsvaToRgba(360*Math.random(),100,100,1);
  if(this.project.records[ind].file_data)
  {
   this.project.records[ind].file_data.header.color=this.project.records[ind].color;
  };
  return;
 };
 if(this.project && this.project.options && this.project.options.record_parameters)
 {
  parms=this.project.options.record_parameters.split(/\s*,\s*/);
  for(i=0;i<parms.length;i++)
  {
   if(parms[i].indexOf("~")==0){continue;};
   if(parms[i].indexOf("_sigma")!=-1){continue;};
   p=this.findParameter(parms[i]);
   if((p.option_colors && p.option_colors.length)||(p.type=="Number"))
   {
    opt.push(p.parameter);
   };
  };
 };
 if(this.projectTools().MRDB)
 {
  this.addUnique(opt,['reservoir','delta_r'],true);
 };
 for(i=3;i<opt.length;i++)
 {
  p=this.findParameter(opt[i]);
  men+="|"+p.label;
 };
 app.menu(men,{"id":"Records"})
 .then(function(rpl){
  if(!rpl){return;};
  var i,no=0,count,p=false,min,max,v,va=[],col,index={},h,r;
  if(rpl>2){p=this.findParameter(opt[rpl]);};
  if(p && (p.type=="Number"))
  {
   for(i=0;i<this.project.records.length;i++)
   {
    r=this.project.records[i];
    switch(p.parameter)
    {
    case "reservoir":
    case "delta_r":
     try
     {
      v=this.marineAverage(this.project.records[i].file_data,p.parameter,"record")[p.parameter];
     }
     catch(e){v=null;};
     break;
    default:
     v=r[p.parameter];
     break;
    };
    va[i]=v;
    if(i==0){min=v;max=v;continue;};
    if(v<min){min=v;};if(v>max){max=v;};
   };
  };
  if(p.parameter=="site_type"){index=this.site_type_colors;};
  if(!p) // order or specific
  {
   if(rpl==2)
   {
    col="rgb(128,128,128)";
    for(i=0;i<this.project.records.length;i++)
    {
     if(!this.project.records[i].selected){continue;};
     if(this.project.records[i].color){col=this.project.records[i].color;break;};
    };
    app.prompt("Color",col,'Color')
    .then(function(rpl){
     var i;
     this.recordsSpec.emptyContainer(); 
     for(i=0;i<this.project.records.length;i++)
     {
      if(!this.project.records[i].selected){continue;};
      this.project.records[i].color=rpl;
     };
     this.recordsSpec.fillContainer();
    }.bind(this))
    .catch(function(e){app.alert(e);});
    return;
   };
   // otherwise do on order
   min=0;max=this.project.records.length-1;
  };
  if(p && (p.type!="Number") && p.option_colors)
  {
   for(i=0;i<p.options.length;i++)
   {
    if(p.option_colors[i])
    {
     index[p.options[i].toLowerCase()]=p.option_colors[i];
    };
   };
  };
  this.recordsSpec.emptyContainer(); 
  for(i=0;i<this.project.records.length;i++)
  {
   if(!this.project.records[i].selected){continue;};
   r=this.project.records[i];
   col=false,v=false,h;
   if(p)
   {
    if(p.type=="Number")
    {
     v=va[i]; // use memory of this value
    }
    else
    {
     v=r[p.parameter];
     if(typeof(v)=="string")
     {
      col=index[v.toLowerCase()];
     };
     if(!col){col="rgba(0,0,0,1)";};
    };
   }
   else
   {
    v=i;
   };
   if(!col)
   {
    if(v===false||(min==max))
    {
     h=360*Math.random();
    }
    else
    {
     h=240*(1-(v-min)/(max-min));
    };
    col=plotLink.prototype.hsvaToRgba(h,100,100,1);
   };
   if(col!=this.project.records[i].color)
   {
    this.project.records[i].color=col;
//    if(p){this.project.records[i].changed=true;};
   };
   if(this.project.records[i].file_data)
   {
    this.project.records[i].file_data.header.color=this.project.records[i].color;
   };
  };
  this.recordsSpec.fillContainer();
 }.bind(this)).catch(function(e){app.alert(e);});
 
};

integrateApp.prototype.setIntchronContent=function(v)
{
 app.clearTool('IntChron');
 this.intchronContent=v;
 this.intchronSpec=this.genIntChronSpec();
 document.getElementById("intchronArea").appendChild(this.intchronSpec.createDisplay(this.intchronContent)); 
 app.showTool('IntChron');
};
integrateApp.prototype.goIntchron=function(file)
{
 var f; 
 if(!file){this.intchronTree=[];this.setIntchronContent(this.intchronBase);return;};
 if(file.indexOf('//')==-1)
 {
  if(file=='<')
  {
   if(this.intchronTree.length>1)
   {
    this.intchronTree.pop();
    f=this.intchronTree.pop();
    this.goIntchron(f);
   }
   else
   {
    this.goIntchron();
   };
  }
  else
  {
   this.intchronTree=[];
   this.goIntchron(this.intchronIndex[file]+".json");
  };
  return;
 };
 this.intchronTree.push(file);
 app.fileOpenRemote('IntChron',file);
};
integrateApp.prototype.useIntchron=function(data,type)
{
 var i,r=false,s=false;
 function checkBib(d,series)
 {
  var j,b=this.intchronContent.bibliography;
  if(b && (!d.file_data.refs || d.file_data.refs.length==0))
  {
   d.file_data.refs=[];
   for(j=0;j<b.length;j++)
   {
    if(b[j].doi){d.file_data.refs.push("doi:"+b[j].doi);}
    else{d.file_data.refs.push("ref:"+b[j].ref);};
   };
  };
  if(series && b && b.length && !d.series)
  {
   d.series=b[0].citation;
   d.file_data.series=d.series;
  };
 };
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 if(data && type)
 {
  data=JSON.parse(JSON.stringify(data));
  data.created=true;
  data.selected=true;
  switch(type)
  {
  case "series":
   data=this.recursiveDataFlip(data,this.objectToArray);
   checkBib.bind(this)(data,true);
   this.project.project_series_list.push(data);
   s=true;
   break;
  case "record":
   data=this.recursiveDataFlip(data,this.objectToArray);
   checkBib.bind(this)(data,false);
   data.color=plotLink.prototype.hsvaToRgba(360*Math.random(),100,100,1);
   if(data.file_data)
   {
    data.file_data.header.color=data.color;
   };
   this.project.records.push(data);
   r=true;
   break;
  };
 }
 else
 {
  if(this.intchronContent.project_series_list)
  {
   for(i=0;i<this.intchronContent.project_series_list.length;i++)
   {
    if(this.intchronContent.project_series_list[i].selected)
    {
     this.intchronContent.project_series_list[i].created=true;
     this.project.project_series_list.push(this.intchronContent.project_series_list[i]);
     s=true;
    };
   };
  };
  if(this.intchronContent.records)
  {
   for(i=0;i<this.intchronContent.records.length;i++)
   {
    if(this.intchronContent.records[i].selected)
    {
     this.intchronContent.records[i].created=true;
     this.project.records.push(this.intchronContent.records[i]);
     r=true;
    };
   };
  };
 };
 this.seriesListSpec.fillContainer();
 this.recordsSpec.fillContainer();
 if(s){app.showTool("SeriesList");};
 if(r){app.showTool("Records");};
 if(this.intchronContent.bibliography)
 {
  this.addBibliography(this.intchronContent.bibliography);
  this.findAllRefs();
 };
 this.readProjectData();
};
integrateApp.prototype.genIntChronSpec=function()
{
 if(!this.intchronContent){return;};
 var spec,s,ss,sss;
 spec=new itemSpec("data","IntChron data","Object");
 spec.readonly=true;
 spec.noheader=true;
 spec.transparent=true;
 if(this.intchronContent.bibliography && this.intchronContent.bibliography.length)
 {
  s=spec.appendChild("bibliography","Publications","Array");
  ss=s.appendChild("citation","Citation","Action");
  ss.action=function(s){this.goIntchron(this.intchronIndex['ref']+'/'+s.parent.object.ref+'.json');}.bind(this);
//  ss.action="integ.goIntchron(integ.intchronIndex['ref']+'/'+this.parent.object.ref+'.json')";
  ss=s.appendChild("reference","Reference","Text");
  ss.popup=true;
 };
 if(this.intchronContent.project_series_list && this.intchronContent.project_series_list.length)
 {
  s=spec.appendChild("project_series_list","Series","Array");
  if(typeof(this.intchronContent.project_series_list[0].series)!='undefined')
  {
   s.database=true;
   ss=s.appendChild("series","Series","Action");
   ss.action=function(s){this.useIntchron(s.parent.object,'series');}.bind(this);
//   ss.action="integ.useIntchron(this.parent.object,'series')";
   ss=s.appendChild("series_type","Series","Text");
   ss=s.appendChild("file","File","Text");
   ss.hidden=true;
  }
  else
  {
   if(typeof(this.intchronContent.project_series_list[0].project_series_type)!='undefined')
   {
    s.database=true;
    ss=s.appendChild("project_series_type","Series","Action");
    ss.action=function(s){this.useIntchron(s.parent.object,'series');}.bind(this);
//    ss.action="integ.useIntchron(this.parent.object,'series')";
    ss=s.appendChild("file","File","Text");
    ss.hidden=true;
   }
   else
   {
   };
  };
 };
 if(this.intchronContent.records && this.intchronContent.records.length)
 {
  s=spec.appendChild("records","Records","Array");
  if(typeof(this.intchronContent.records[0].record)!='undefined')
  {
   s.database=true;
   ss=s.appendChild("record","Record","Action");
   ss.action="integ.useIntchron(this.parent.object,'record')";
  }
  else
  {
   s.database=false;
   if(typeof(this.intchronContent.records[0].country)!='undefined')
   {
    ss=s.appendChild("country","Country","Action");
   };
   if(typeof(this.intchronContent.records[0].Source)!='undefined')
   {
    ss=s.appendChild("Source","Source","Action");
   };
   if(typeof(this.intchronContent.records[0].Host)!='undefined')
   {
    ss=s.appendChild("Host","Host","Action");
   };
   ss.action="integ.goIntchron(this.parent.object.file)";
  };
  ss=s.appendChild("file","File","Text");
  ss.hidden=true;
 };
 return spec;
};

integrateApp.prototype.onRecordChange=function(header,color,rec)
{
 var rh=false,i;
 if(!rec ||(rec.constructor==itemSpec)){rec=this.record;};
 for(i=0;i<this.project.records.length;i++)
 {
  if(!this.project.records[i].file_data){continue;};
  if(this.project.records[i].file_data==rec){rh=this.project.records[i];break;};
 };
 if(rh)
 {
  if(!rh.changed || header)
  {
   this.recordsSpec.emptyContainer();
   if(!color)
   {
    rh.changed=true;
   };
   this.setRecordContent(rh,rec);
   this.recordsSpec.fillContainer();
  };
 }
 else
 {
  this.recordsSpec.emptyContainer();
  this.recordSpec.emptyContainer();
  if(!this.record.header.record){this.record.header.record="Untitled";};
  rh={"created":true,"file_data":this.record,"selected":true};
  this.setRecordContent(rh,this.record);
  this.project.records.push(rh);
  this.recolorRecords(true,this.project.records.length-1);
  this.recordSpec.fillContainer();
  this.recordsSpec.fillContainer();
  app.showTool("Records");
  app.showTool("Record");
  this.checkDuplicates('Record');
 };
 return rh;
};

integrateApp.prototype.findRecord=function(record)
{
 var i;
 if(!record){return false;};
 for(i in this.project.records)
 {
  if(this.project.records[i]['record']==record)
  {
   return this.project.records[i];
  };
 };
 return false;
};

integrateApp.prototype.findProjectSeries=function(series)
{
 var i;
 if(!series){return false;};
 for(i in this.project.project_series_list)
 {
  if(this.project.project_series_list[i]['series']==series)
  {
   return this.project.project_series_list[i];
  };
 };
 return false;
};

integrateApp.prototype.findSeries=function(series,inRecord)
{
 var i;
 if(!inRecord){inRecord=this.record;};
 if(!series){return false;};
 for(i in inRecord.series_list)
 {
  if(inRecord.series_list[i]['series']==series)
  {
   return inRecord.series_list[i];
  };
 };
 return false;
};


integrateApp.prototype.genRecordSpec=function()
{
 var spec,s,ss,sss,parms;
 spec=new itemSpec("record_data","Record/Site","Object");
 spec.inline=true;
 spec.tabbed=true;
 spec.transparent=true;
 // header
 s=spec.appendChild("header","Information","Object");
 s.changer=this.onRecordChange.bind(this,true,false);
 ss=this.genSpec(s,"record");
 ss.readonly=false;
 ss.editor=function(spc){
   app.prompt("Record name",spc.object).then(function(rpl){
    var ps,os,ns,of,nf,op,np;
    os=this.record.header.record;ns=this.safeName(rpl);
    if(!this.uniqueName(ns)){throw("Duplicate name");};
    if(!(this.record.header.record==spc.object)){throw("Record changed");};
    if(!(ps=this.findRecord(spc.object))){throw("Record not found");};
    if(of=ps.file) // no files involved
    {nf=of.replace(os,ns);}else{of=nf='';};
    this.recordSpec.emptyContainer();
    this.record.header.record=ns;
    this.recordSpec.fillContainer();
    this.onRecordChange(true);
    if(of!=nf)
    {
     op="~/record/"+os;
     np="~/record/"+ns;
     app.mv(this.fullPath(of),this.fullPath(nf),async function(txt){
      var ofp=this.drivePath(op),nfp=this.drivePath(np);
      if(ofp && nfp)
      {
       app.mv(ofp,nfp,function(msg){app.alert(msg);},function(){/*app.alert("No dir to move");*/}); // moving directory if present
      };
      this.recordSpec.emptyContainer();
      this.recordsSpec.emptyContainer();
      this.seriesSpec.emptyContainer();
      ps.file=nf;
      for(i=0;i<this.record.series_list.length;i++)
      {
       if(this.record.series_list[i].file)
       {
        this.record.series_list[i].file=this.record.series_list[i].file.replace(op,np);
       };
       if(this.record.series_list[i].path)
       {
        this.record.series_list[i].path=this.record.series_list[i].path.replace(op,np);
       };
      };
      this.seriesSpec.fillContainer();
      this.recordsSpec.fillContainer();
      this.recordSpec.fillContainer();
      this.onRecordChange(true);
      this.filenames['Record']=ps.file;
      await app.fileSave('Record');
      await app.fileSave('Project');
     }.bind(this),function(rpl){app.alert(rpl);});
    };
   }.bind(this)).catch(function(e){app.alert(e)});
  }.bind(this);
 ss=this.genSpec(s,"site");
 ss=this.genSpec(s,"region");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"country");
 ss=this.genSpec(s,"latitude");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"longitude");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"elevation");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"environment");
 ss.hidden="ifFalse";
 if(this.project && this.project.options && this.project.options.record_parameters)
 {
  parms=this.project.options.record_parameters.split(/\s*,\s*/);
  for(i=0;i<parms.length;i++)
  {
   if(parms[i].indexOf("~")==0){continue;};
   ss=this.genSpec(s,parms[i]); 
  };
 };
 ss=this.genSpec(s,"z_type");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"z_basis");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"z_units");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"t_source");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"suppress_t");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"suppress_z");
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"color");
 ss.changer=this.onRecordChange.bind(this,true,true);
 ss.hidden="ifFalse";
 ss=this.genSpec(s,"site_type");
 ss=this.genSpec(s,"record_comment");
 ss.hidden="ifFalse";
 // data series
 s=spec.appendChild("series_list","Data series","Array");
 s.transparent=true;
 s.database=true;
 s.exchanger="integ.importData('SeriesList')";
 s.changer=this.onRecordChange.bind(this,false,false);
 s.appender=function(s)
 {
  this.promptForName("series").then(function(nm){
   app.fileNew('Series',JSON.stringify({"json_application":"INTCHRON.Series","series":nm}));
   this.viewSeries({"series":nm});
  }.bind(this)).catch(function(e){app.alert(e);});
 }.bind(this);
 ss=s.appendChild("View","","Action");
 ss.readonly=true;
 ss.action="integ.viewSeries(this.parent.object)";
 ss=this.genSpec(s,"series");
 ss.readonly=true;
 ss=this.genSpec(s,"series_type");
 ss.readonly=true;
 s=spec.appendChild("refs","References","Array");
 s.transparent=true;
 s.appender=function(s)
 {
  this.editRef(s);
 }.bind(this);
 this.recordRefsSpec=s;
 s.changer=this.onRecordChange.bind(this,true,false);
 this.genSpec(s,"ref");
 return spec;
};

integrateApp.prototype.showData=function(spec)
{
 var div,tab,tr,td,i,j,dta=spec.object;
 if(!Array.isArray(dta)){return;};
 if(!dta.length){return;};
 div=document.createElement('div');
 div.style.maxHeight="200px";
 div.style.overflow="scroll";
 tab=document.createElement('table');
 tr=document.createElement('tr');
 for(j in dta[0])
 {
  td=document.createElement('th');
  td.style.position="sticky";
  td.style.top="0px";
  td.style.backgroundColor="#FFFFCC";
  td.appendChild(document.createTextNode(j));
  tr.appendChild(td);
 };
 tab.appendChild(tr);
 for(i=0;i<dta.length;i++)
 {
  tr=document.createElement('tr');
  for(j in dta[0])
  {
   td=document.createElement('td');
   td.appendChild(document.createTextNode(dta[i][j]));
   tr.appendChild(td);
  };
  tab.appendChild(tr);
 };
 div.appendChild(tab);
 spec.container.appendChild(div);
};

integrateApp.prototype.readData=function(str)
{
 var i,j,lines,parms,obj,rtn,vals;
 if(!str){return null;};
 switch(str.slice(0,1))
 {
 case "[":case "{":
  return JSON.parse(str);
 };
 lines=str.split("\n");
 if(lines.length<2){return [];};
 parms=lines[0].split("\t");
 rtn=[];
 for(i=1;i<lines.length;i++)
 {
  obj={};
  vals=lines[i].split('\t');
  for(j=0;(j<vals.length) && (j<parms.length);j++)
  {
   if(vals[j]=="null"){obj[parms[j]]=null;continue;};
   if(isNaN(vals[j])){obj[parms[j]]=vals[j];continue;};
   obj[parms[j]]=Number(vals[j]);
  };
  rtn.push(obj)
 };
 return rtn;
};

integrateApp.prototype.writeData=function(dta)
{
 var i,j,str="";
 if(!Array.isArray(dta)){return JSON.stringify(str);};
 if(!Array.isArray(dta)){return "";};
 for(j in dta[0])
 {
  str+=j+"\t";
 };
 str=str.slice(0,-1)+"\n";
 for(i=0;i<dta.length;i++)
 {
  for(j in dta[0])
  {
   str+=dta[i][j]+"\t";
  };
  str=str.slice(0,-1)+"\n";
 };
 str=str.slice(0,-1);
 return str;
};


integrateApp.prototype.addToCsv=function(csv,str,typ)
{
 if(str===null){str="null";};
 if(typeof(str)=="undefined"){str="null";};
 if(!str.split){str=str.toString();};
 if(!str.split){return csv;};
 var i,a=str.split("\t");
 for(i=0;i<a.length;i++)
 {
  switch(typ)
  {
  case "Boolean":
   csv+=a[i];
   break;
   break;
  case "Number":
   if(isNaN(a[i]))
   {
    switch(a[i].toLowerCase)
    {
    case "null":
    case "undefined":
     break;
    default:
     csv+='"'+a[i].replace(/"/g,'""')+'"';
     break;
    };
    break;
   }
   else
   {
    csv+=a[i];
    break;
   };
  case "Text":
   csv+='"'+a[i].replace(/"/g,'""')+'"';
   break;
  default:
   if(isNaN(a[i]))
   {
    csv+='"'+a[i].replace(/"/g,'""')+'"';
   }
   else
   {
    csv+=a[i];
   };
   break;
  };
  if(i!=a.length-1){csv+=",";};
 };
 return csv;
};


integrateApp.prototype.writeExchange=function()
{
 var parms,parminf=[],i,j,v,ar,src;
 parms=this.exchange.headerLine.split("\t");
 for(i=0;i<parms.length;i++)
 {
  parminf[i]=this.findParameter(parms[i]);
 };
 if(this.exchange.source==this.project.records)
 {
  ar=this.exchange.source;
 }
 else
 {
  ar=this.exchange.source.data;
 };
 for(j=0;j<ar.length;j++)
 {
  if(this.exchange.source==this.project.records)
  {
   if(!ar[j].selected){continue;};
   src=ar[j].file_data;
   if(!src){continue;};
   src=src.header;
   if(!src){continue;};
  }
  else
  {
   src=ar[j];
  };
  for(i=0;i<parminf.length;i++)
  {
   if(typeof(src)=='object')
   {
    try
    {
     v=src[parminf[i].parameter];
    }
    catch(e)
    {
     app.alert(e);
     app.alert(src);
    };
   }
   else
   {
    v=src;
   };
   switch(parminf[i].type)
   {
   case "Number":
    if(isNaN(v)||(typeof(v)!='number')){v="";break;};
    v=Number(Number(v).toPrecision(10));
    switch(parminf[i].parameter)
    {
    case "z":
     v=this.zString(src.z,src.z_range,this.exchange.options.z_units,this.exchange.options.z_style,false);
     break;
    case "z_range":
     v=this.zString(src.z_range,0,this.exchange.options.z_units,this.exchange.options.z_style,false);
     break;
    case "t":
    case "t_from":
    case "t_to":
    case "t_to_orig":
     if((v==Math.floor(v)) && this.exchange.options.t_schulman)
     {
      switch(this.exchange.options.t_units)
      {
      case "AD":case "CE":
      case "BCE":case "BC":
      case "calBP":
       v-=0.5;
       break;
      };
     };
     switch(this.exchange.options.t_units)
     {
     case "CE":case "AD":
      v=v-0.5;
      break;
     case "BCE":case "BC":
      v=1.5-v;
      break;
     case "calBP":
      v=this.CALBP_DATUM-v;
      break;
     case "b2k":
      v=this.B2K_DATUM-v;
      break;
     };
     break;
    default:
     break;
    };
    break;
   case "Text":
   case "TextArea":
    if(typeof(v)=="string"){v=v.replace(/(\r\n|\r|\n)/g,"\\n").replace(/[\t]/g,"\\t");};
    break;
   case "Boolean":
    if(v){v="TRUE";}else{v="FALSE";};
    break;
   };
   if(typeof(v)=="undefined"){v=null;};
   this.exchange.data+=v;
   this.exchange.csv=this.addToCsv(this.exchange.csv,v,parminf[i].type);
   if(i==parms.length-1)
   {
    this.exchange.data+="\n";
    this.exchange.csv+="\n";
   }
   else
   {
    this.exchange.csv+=",";
    this.exchange.data+="\t";
   };
  };
 };
};

integrateApp.prototype.downloadExchange=function(format)
{
 var fn=this.exchange.series+"."+format;
 var dt;
 switch(format)
 {
 case "csv":dt=this.exchange.csv;break;
 case "txt":dt=this.exchange.data;break;
 };
 app.fileDownload(fn,dt);
};


integrateApp.prototype.refreshExchange=function(changed)
{
 var a,dl,pl;
 function isValidParam(str)
 {
  var isOk=true;
  try
  {
   if(str.indexOf("~")==0){str=str.replace("~","");};
   Function('"use strict";var '+str+'=true;')();
  }
  catch(e)
  {
   app.log("warning",str+" is not a valid parameter name");
   isOk=false;
  };
  return isOk;
 };
 function checkProxies(parameters)
 {
  var i;
  for(i=0;i<parameters.length;i++)
  {
   if(!isValidParam(parameters[i]))
   {
    parameters.splice(i,1);i--;
   };
  };
  a=integ.mergeLists(a,parameters);
 };
 function checkForArrays()
 {
  var i,j,p,b=[];
  if(!a){return;};
  for(i=0;i<a.length;i++)
  {
   if((p=integ.findParameter(a[i]))&&(p.type=="Array")&&(p.options))
   {
    for(j=0;j<p.options.length;j++)
    {
     b.push(p.options[j]);
    };
   }
   else
   {
    b.push(a[i]);
   };
  };
  a=b;
 };
 a=this.itemList(this.exchange.options.series_type,this.exchange.head,this.exchange.source==this.projectSeries);
 switch(this.exchange.mode)
 {
 case "RecordsSeriesList":
  if(this.exchange.head)
  {
   a=this.mergeLists(["record","series","series_type","header_list","parameter_list"],a);
  }
  else
  {
   a=this.mergeLists(["record","series"],a);
  };
  break;
 case "SeriesList":
  if(this.exchange.head)
  {
   a=this.mergeLists(["series","series_type","header_list","parameter_list"],a);
  }
  else
  {
   a=this.mergeLists(["series"],a);
  };
  break;
 case "ProjectSeriesList":
  if(this.exchange.head)
  {
   a=this.mergeLists(["series","project_series_type","header_list","parameter_list"],a);
  }
  else
  {
   a=this.mergeLists(["series"],a);
  };
  break;
 };
// a=this.findObjInArray(this.seriesParameters,"type",this.exchange.options.series_type);
 checkForArrays();
 this.exchangeSpec.emptyContainer();
 switch(changed)
 {
 case "series_type":
 case "parameter_list":
 case "z_style":
  if(this.exchange.parameter_list)
  {
   if(Array.isArray(this.exchange.parameter_list))
   {
    checkProxies(this.exchange.parameter_list);
    this.exchange.parameter_list=this.exchange.parameter_list.join(",");
   }
   else
   {
    checkProxies(this.exchange.parameter_list.split(/\s*,\s*/));
   };
  };
  if(a && a.length)
  {
   this.exchange.headerLine=a.join("\t");
  };
  if(this.exchange.source.data && this.exchange.source.data.length==0 && (this.exchange.options.series_type!="AgeDepth"))
  {
   this.exchange.headerLine=this.exchange.headerLine.replace("t\tt_sigma\t","");
  };
  switch(this.exchange.options.z_style)
  {
  case "z_from-z_to":
  case "z±dz":
   this.exchange.headerLine=this.exchange.headerLine.replace("\tz_range","");
   break;
  };
  break;
 case "header":
 case "z_units":
 case "t_units":
 case "t_schulman":
  break;
 case "headerLine":
  if(!this.exchange.options.header)
  {
   checkProxies(this.exchange.headerLine.split("\t"));
  };
  break;
 case "data":
  if(this.exchange.options.header)
  {
   checkProxies(this.exchange.data.split("\n")[0].split("\t"));
   this.exchange.headerLine=this.exchange.data.split("\n")[0];
  };
  break;
 };
 if(changed!="data")
 {
  this.exchange.data="";
  this.exchange.csv="";
  if(this.exchange.options.header)
  {
   this.exchange.data=this.exchange.headerLine+"\n";
   this.exchange.csv=this.addToCsv(this.exchange.csv,this.exchange.headerLine,"Text");
   this.exchange.csv+="\n";
  };
  if(!this.exchange.importing)
  {
   this.writeExchange();
  };
 };
 this.exchangeSpec.fillContainer();
};

integrateApp.prototype.checkImportRef=function(r)
{
 var v=r.split(":");
 if(v.length>1)
 {
  switch(v[0])
  {
  case "doi":
  case "ref":
   return true;
  };
 };
 app.log("warning","Reference is neither doi nor ref: "+r);
 return false;
};

integrateApp.prototype.importExchange=function(option)
{
 var parms,parminf=[],i,j,k,v,d,dd,o,r,dest_parms;
 if((this.exchange.source==this.projectSeries)||(this.exchange.source==this.series))
 {
  if(!option)
  {
   if(this.exchange.source.data.length==0)
   {
    this.importExchange("Replace");
   }
   else
   {
    app.menu("Import|Append|Replace",{"id":"exchange"})
    .then(function(opt){
     switch(opt)
     {
     case 1: this.importExchange("Append");break;
     case 2:
      if(this.exchange.data.split("\n").length<this.exchange.source.data.length)
      {
       app.confirm("Are you sure you want to delete data?",{"id":"exchange"})
       .then(function(opt){
        if(opt){this.importExchange("Replace");};
       }.bind(this)).catch(function(e){});
      }
      else
      {
       this.importExchange("Replace");
      };
      break;
     };
    }.bind(this)).catch(function(e){});
   };
   return;
  };
 };
 if(this.exchange.importing)
 {
  this.viewSeries({created:true,selected:true});
  this.recordSpec.emptyContainer();
  this.record.series_list.push(this.series);
  this.recordSpec.fillContainer();
  this.onRecordChange();
 };
 this.exchangeSpec.emptyContainer();
 parms=this.exchange.headerLine.split("\t");
 for(i=0;i<parms.length;i++)
 {
  parminf[i]=this.findParameter(parms[i]);
 };
 d=this.exchange.data.split("\n");
 if(this.exchange.source==this.searchResults)
 {
  this.searchSpec.emptyContainer();
  this.searchResults.parameter_list=this.exchange.parameter_list.split(/\s*,\s*/);
  this.exchange.source.data.length=0;
 };
 if(this.exchange.source==this.series)
 {
  this.seriesSpec.emptyContainer();
  this.series.series_type=this.exchange.options.series_type;
  if(!this.exchange.series){this.exchange.series=this.exchange.options.series_type;}
  this.series.series=this.exchange.series;
  this.series.parameter_list=this.exchange.parameter_list;
  if(option=="Replace")
  {
   this.exchange.source.data.length=0;
  };
 };
 if(this.exchange.source==this.projectSeries)
 {
  this.projectSeriesSpec.emptyContainer();
  this.projectSeries.project_series_type=this.exchange.options.series_type;
  if(!this.exchange.series){this.exchange.series=this.exchange.options.series_type;}
  this.projectSeries.series=this.exchange.series;
  this.projectSeries.parameter_list=this.exchange.parameter_list;
  if(option=="Replace")
  {
   this.exchange.source.data.length=0;
  };
 };
 if(this.exchange.source==this.project.records)
 {
  this.recordsSpec.emptyContainer();
  this.recordSpec.emptyContainer();
  this.seriesSpec.emptyContainer();
 };
 switch(this.exchange.mode)
 {
 case "RecordsSeriesList":
 case "SeriesList":
 case "ProjectSeriesList":
 case "Record_Refs":
 case "Series_Refs":
 case "ProjectSeries_Refs":
  this.exchange.source.data.length=0;
  break;
 };
 for(j=0;j<d.length;j++)
 {
  if(this.exchange.options.header && (j==0)){continue;};
  dd=d[j].split("\t");
  if(dd.length<2){if(parminf.length>1){continue;};};
  o={};
  for(i=0;(i<parminf.length)&&(i<dd.length);i++)
  {
   switch(parminf[i].parameter)
   {
   case "z":
    o["z"]=this.parseZ(dd[i],o,this.exchange.options.z_style,this.exchange.options.z_units);
    continue;
   case "z_range":
    o["z_range"]=this.parseZ(dd[i],false,this.exchange.options.z_style,this.exchange.options.z_units);
    continue;
   };
   v=dd[i];
   if(!parminf[i])
   {
    if((v=="")||(isNaN(v))){v=null;break;};
    v=Number(v);
    continue;
   };
   switch(parminf[i].type)
   {
   case "Number":
    if((v=="")||(isNaN(v))){v=null;break;};
    v=Number(v);
    switch(parminf[i].parameter)
    {
    case "ring_width":
     if(v>10){v=v/100;};
     break;
    case "t":
    case "t_from":
    case "t_to":
    case "t_to_orig":
     if((v==Math.floor(v)) && this.exchange.options.t_schulman)
     {
      switch(this.exchange.options.t_units)
      {
      case "AD":case "CE":
       v+=0.5;
       break;
      case "BCE":case "BC":
      case "calBP":
       v-=0.5;
       break;
      };
     };
     switch(this.exchange.options.t_units)
     {
     case "AD":case "CE":
      v=v+0.5;
      break;
     case "BCE":case "BC":
      v=1.5-v;
      break;
     case "calBP":
      v=this.CALBP_DATUM-v;
      break;
     case "b2k":
      v=this.B2K_DATUM-v;
      break;
     };
     break;
    default:
     break;
    };
    break;
   case "Text":
   case "TextArea":
    if(typeof(v)=="string"){v=v.replace(/\\n/g,"\n").replace(/\\t/g,"\t");};
    break;
   case "Boolean":
    if(v.toUpperCase().indexOf("T")==0){v=true;}else{v=false;};
    break;
   };
   switch(v)
   {
   case 'undefined':
   case 'null':
    v=null;
    break;
   };
   o[parminf[i].parameter]=v;
  };
  if(this.exchange.source==this.project.records)
  {
   if(!o.record){continue;};
   if(r=this.findRecord(o.record))
   {
    for(k in o)
    {
     if(r.file_data && r.file_data.header)
     {
      if(r.file_data.header[k]!=o[k]){r.changed=true;r.file_data.header[k]=o[k];r[k]=o[k]};
     }
     else
     {
      if(r[k]!=o[k]){app.debugMessage(k+" '"+r[k]+"' '"+o[k]+"' "+(r[k]!=o[k]));r.changed=true;r[k]=o[k];};
     };
    };
    if(r.changed && r.file_data)
    {
     this.setRecordContent(r,r.file_data);
    };
   }
   else
   {
    o.record=this.safeName(o.record);
    r={"record":o.record,"file_data":{"header":{},"series_list":[],"refs":[]},"created":true,"selected":true};
    for(k in o)
    {
     r[k]=o[k];
     r.file_data.header[k]=o[k];
    };
    this.project.records.push(r);
   };
  }
  else
  {
   if(parminf.length==1)
   {
    this.exchange.source.data.push(o[parminf[0].parameter]);
   }
   else
   {
    this.exchange.source.data.push(o);
   };
  };
 };
 this.exchange.importing=false;
 this.exchangeSpec.fillContainer();
 app.hideTool("Exchange");
 if(this.exchange.source==this.series)
 {
  if(this.series.series_type=="Dendro_Sample"){dendro.checkImport(this.exchange.source);};
  this.seriesSpec.fillContainer();
  this.viewSeries(this.exchange.source);
  this.onSeriesChange();
 };
 if(this.exchange.source==this.projectSeries)
 {
  if(this.series.series_type=="Dendro_Master"){dendro.checkImport(this.exchange.source);};
  this.projectSeriesSpec.fillContainer();
  app.showTool("ProjectSeries");
  this.onProjectSeriesChange();
 };
 if(this.exchange.source==this.project.records)
 {
  this.recordsSpec.fillContainer();
  this.recordSpec.fillContainer();
  this.seriesSpec.fillContainer();
  app.showTool("Records");
 };
 switch(this.exchange.mode)
 {
 case "Record_Refs":
  this.exchange.source.data.sort(this.compareBy.bind(this,["record"]));
  app.menu("Import record refs|Append|Replace",{"id":"exchange"}).then(function(rpl){
   var i,k,rec=false,ser=false,r=false,rd=false,s=false,d=this.exchange.source.data,o;
   this.recordsSpec.emptyContainer();
   this.recordSpec.emptyContainer();
   for(i=0;i<d.length;i++)
   {
    if(rec!=d[i].record)
    {
     ser=false;s=false;rd=false
     rec=d[i].record;
     r=this.findRecord(rec);
     if(!r)
     {
      app.log("warning","Cannot find record "+rec);
      continue;
     };
     if(r.file_data)
     {
      rd=r.file_data;
      if((rpl==2)&&(rd.refs.length>0))
      {
       r.changed=true;rd.refs=[];
       app.log("inform","Replaced references for record "+rec);
      };
     }
     else
     {
      app.log("warning","Cannot find data for record "+rec);
      rd=false;
     };
    };
    if(!rd){continue;};
    if(d[i].ref)
    {
     if(this.checkImportRef(d[i].ref))
     {
      if(this.addUnique(rd.refs,d[i].ref,true))
      {
       if(!r.changed){r.changed=true;app.log("inform","Added references for record "+rec);};
      };
     };
    };
   };
   this.recordsSpec.fillContainer();
   this.recordSpec.fillContainer();
  }.bind(this)).catch(function(e){app.alert(e);});
  break;
 case "Series_Refs":
  this.exchange.source.data.sort(this.compareBy.bind(this,["record","series"]));
  app.menu("Import series refs|Append|Replace",{"id":"exchange"}).then(function(rpl){
   var i,k,rec=false,ser=false,r=false,rd=false,s=false,d=this.exchange.source.data,o;
   this.recordsSpec.emptyContainer();
   this.recordSpec.emptyContainer();
   this.seriesSpec.emptyContainer();
   for(i=0;i<d.length;i++)
   {
    if(rec!=d[i].record)
    {
     ser=false;s=false;rd=false
     rec=d[i].record;
     r=this.findRecord(rec);
     if(!r)
     {
      app.log("warning","Cannot find record "+rec);
      continue;
     };
     if(r.file_data)
     {
      rd=r.file_data;
     }
     else
     {
      app.log("warning","Cannot find data for record "+rec);
      rd=false;
     };
    };
    if(!rd){continue;};
    if(ser!=d[i].series)
    {
     ser=d[i].series;
     s=this.findSeries(ser,rd);
     if(!s){s=this.findSeries(this.safeName(ser),rd);};
     if(!s)
     {
      app.log("warning","Cannot find series "+ser+" in record "+rec);
     }
     else
     {
      if((rpl==2)&&(s.refs.length>0))
      {
       r.changed=true;s.refs=[];s.changed=true;
       app.log("inform","Replaced references for series "+ser+" in record "+rec);
      };
     };
    };
    if(!s){continue;};
    if(d[i].ref)
    {
     if(this.checkImportRef(d[i].ref))
     {
      if(this.addUnique(s.refs,d[i].ref,true))
      {
       if(!r.changed){r.changed=true;s.changed=true;
       app.log("inform","Added references for series "+ser+" in record "+rec);};
      };
     };
    };
   };
   this.recordsSpec.fillContainer();
   this.recordSpec.fillContainer();
   this.seriesSpec.fillContainer();
  }.bind(this)).catch(function(e){app.alert(e);});
  break;
 case "ProjectSeries_Refs":
  this.exchange.source.data.sort(this.compareBy.bind(this,["series"]));
  app.menu("Import series refs|Append|Replace",{"id":"exchange"}).then(function(rpl){
   var i,k,rec=false,ser=false,r=false,rd=false,s=false,d=this.exchange.source.data,o;
   this.projectSeriesSpec.emptyContainer();
   this.seriesListSpec.emptyContainer();
   this.projectSeriesSpec.fillContainer();
   this.seriesListSpec.fillContainer();
  }.bind(this)).catch(function(e){app.alert(e);});
  break;
 case "RecordsSeriesList":
 case "SeriesList":
 case "ProjectSeriesList":
  if(this.exchange.mode=="RecordsSeriesList")
  {
   this.exchange.source.data.sort(this.compareBy.bind(this,["record","series"]));
  }
  else
  {
   this.exchange.source.data.sort(this.compareBy.bind(this,["series"]));
  };
  if(this.exchange.head)
  {
   app.confirm("Import series information",{"id":"exchange"}).then(function(){
    var i,k,rec=false,ser=false,r=false,rd=false,s=false,d=this.exchange.source.data,up;
    if(this.exchange.mode=="ProjectSeriesList")
    {
     this.projectSeriesSpec.emptyContainer();
     this.seriesListSpec.emptyContainer();
    }
    else
    {
     this.recordsSpec.emptyContainer();
     this.recordSpec.emptyContainer();
     this.seriesSpec.emptyContainer();
    };
    for(i=0;i<d.length;i++)
    {
     switch(this.exchange.mode)
     {
     case "RecordsSeriesList":
      if(rec!=d[i].record)
      {
       ser=false;s=false;rd=false
       rec=d[i].record;
       r=this.findRecord(rec);
       if(!r)
       {
        app.log("warning","Cannot find record "+rec);
        rec=false;
        continue;
       };
       if(r.file_data)
       {
        rd=r.file_data;
       }else
       {
        app.log("warning","Cannot find data for record "+rec);
        rd=false;
       };
      };
      break;
     case "SeriesList":
      rec=this.record.header.record;
      rd=this.record;r=this.findRecord(rec)
      break;
     case "ProjectSeriesList":
      rd=this.project;
      break;
     };
     if(!rd)
     {
      continue;
     };
     if(ser!=d[i].series)
     {
      ser=d[i].series;
      if(this.exchange.mode=="ProjectSeriesList")
      {
       r=this.findProjectSeries(ser);
       if(!r){r=this.findProjectSeries(this.safeName(ser));};
       if(!r)
       {
        s=duplItem(d[i]);
        s.series=this.safeName(s.series);
        s.project_series_type=this.exchange.source.series_type;
        s.selected=true;
        s.data=[];s.refs=[];
        r={"series":ser,"project_series_type":s.project_series_type,"file_data":s,"created":true,"selected":true};
        rd.project_series_list.push(r);
        app.log("inform","Project series "+s.series+" added");
        r.changed=true;
       }
       else
       {
        if(r.project_series_type!=this.exchange.source.series_type)
        {
         app.log("warning","Project series "+r.series+" is "+r.project_series_type+" not "+this.exchange.source.series_type);
         continue;
        };
        if(!(s=r.file_data))
        {
         app.log("warning","No file data for project series "+r.series);
         continue;
        };
        up=false;
        for(k in d[i])
        {
         if(s[k]!=d[i][k])
         {
          app.log("data",k+": "+JSON.stringify(s[k])+" > "+JSON.stringify(d[i][k]));
          s[k]=d[i][k];up=true;
         };
        };
        if(up)
        {
         app.log("inform","Updated project series "+s.series);
         r.changed=true;
        };
       };
      }
      else
      {
       s=this.findSeries(ser,rd);
       if(!s){s=this.findSeries(this.safeName(ser),rd);};
       if(!s)
       {
        s=duplItem(d[i]);
        delete s.record;
        s.series=this.safeName(s.series);
        s.series_type=this.exchange.source.series_type;
        s.selected=true;
        s.data=[];s.refs=[];
        rd.series_list.push(s);
        app.log("inform","Series "+s.series+" added to "+r.record);
        r.changed=true;
       }
       else
       {
        if(s.series_type!=this.exchange.source.series_type)
        {
         app.log("warning","Series "+s.series+" is "+s.series_type+" not "+this.exchange.source.series_type);
         continue;
        };
        up=false;
        for(k in d[i])
        {
         if(k!='record' && (s[k]!=d[i][k]))
         {
          app.log("data",k+": "+JSON.stringify(s[k])+" > "+JSON.stringify(d[i][k]));
          s[k]=d[i][k];up=true;
         };
        };
        if(up)
        {
         app.log("inform","Updated series "+s.series+" in "+r.record);
         r.changed=true;
        };
       };
      };
     };
    };
    if(this.exchange.mode=="ProjectSeriesList")
    {
     this.projectSeriesSpec.fillContainer();
     this.seriesListSpec.fillContainer();
    }
    else
    {
     this.recordsSpec.fillContainer();
     this.recordSpec.fillContainer();
     this.seriesSpec.fillContainer();
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }
  else
  {
   app.menu("Import series data|Append|Replace",{"id":"exchange"}).then(function(rpl){
    var i,k,rec=false,ser=false,r=false,rd=false,s=false,d=this.exchange.source.data,o;
    if(this.exchange.mode=="ProjectSeriesList")
    {
     this.projectSeriesSpec.emptyContainer();
     this.seriesListSpec.emptyContainer();
    }
    else
    {
     this.recordsSpec.emptyContainer();
     this.recordSpec.emptyContainer();
     this.seriesSpec.emptyContainer();
    };
    for(i=0;i<d.length;i++)
    {
     switch(this.exchange.mode)
     {
     case "RecordsSeriesList":
      if(rec!=d[i].record)
      {
       ser=false;s=false;rd=false
       rec=d[i].record;
       r=this.findRecord(rec);
       if(!r)
       {
        app.log("warning","Cannot find record "+rec);
       };
       if(r.file_data)
       {
        rd=r.file_data;
       }else
       {
        app.log("warning","Cannot find data for record "+rec);
        rd=false;
       };
      };
      break;
     case "SeriesList":
      rec=this.record.header.record;
      rd=this.record;r=this.findRecord(rec)
      break;
     case "ProjectSeriesList":
      rd=this.project;
      break;
     };
     if(!rd)
     {
      continue;
     };
     if(ser!=d[i].series)
     {
      ser=d[i].series;
      if(this.exchange.mode=="ProjectSeriesList")
      {
       r=this.findProjectSeries(ser);
       if(!r){r=this.findProjectSeries(this.safeName(ser));};
       if(!r)
       {
        s=duplItem(d[i]);
        s.series=this.safeName(s.series);
        s.project_series_type=this.exchange.source.series_type;
        s.selected=true;
        s.data=[];s.refs=[];
        r={"series":ser,"project_series_type":s.project_series_type,"file_data":s};
        rd.project_series_list.push(r);
        app.log("inform","Project series "+s.series+" added");
        r.changed=true;
       }
       else
       {
        if(r.project_series_type!=this.exchange.source.series_type)
        {
         app.log("warning","Project series "+r.series+" is "+r.project_series_type+" not "+this.exchange.source.series_type);
         continue;
        };
        if(!(s=r.file_data))
        {
         app.log("warning","No file data for project series "+r.series);
         continue;
        };
       };
       if(!s)
       {
        s={"series":this.safeName(ser),"project_series_type":this.exchange.source.series_type};
        s.data=[];s.refs=[];
        r={"series":s.series,"project_series_type":s.project_series_type,"file_data":s,"selected":true,"created":true};
        rd.series_list.push(s);
        app.log("inform","Project series "+s.series+" added");
        r.created=true;
       };
       if((rpl==2)&&(s.data.length>0))
       {
        app.log("inform","Replacing data for project series "+s.series);
        s.data.length=0;
       }
       else
       {
        app.log("inform","Adding data to project series "+s.series);
       };
       dest_parms=this.mergeLists(this.itemList(s.series_type),s.parameter_list);
       r.changed=true;
       while((i<d.length)&&(d[i].series==ser))
       {
        if(dest_parms.length==1)
        {
         s.data.push(d[i][dest_parms[0]]);
        }
        else
        {
         o=duplItem(d[i]);
         delete o.series;
         s.data.push(o);
        };
        i++;
       };
       if(s.project_series_type=="Dendro_Master"){dendro.checkImport(s);};
       i--;       
      }
      else
      {
       s=this.findSeries(ser,rd);
       if(!s){s=this.findSeries(this.safeName(ser),rd);};
       if(!s)
       {
        s=duplItem(d[i]);
        delete s.record;
        s.series=this.safeName(s.series);
        s.series_type=this.exchange.source.series_type;
        s.selected=true;
        s.data=[];s.refs=[];
        rd.series_list.push(s);
        app.log("inform","Series "+s.series+" added to "+r.record);
        r.changed=true;
       }
       else
       {
        if(s.series_type!=this.exchange.source.series_type)
        {
         app.log("warning","Series "+s.series+" is "+s.series_type+" not "+this.exchange.source.series_type);
         continue;
        };
       };
       if(!s)
       {
        s={"series":this.safeName(ser),"series_type":this.exchange.source.series_type,"selected":true};
        s.data=[];s.refs=[];
        rd.series_list.push(s);
        app.log("inform","Series "+s.series+" added to "+r.record);
        r.changed=true;
       };
       if((rpl==2)&&(s.data.length>0))
       {
        app.log("inform","Replacing data for series "+s.series+" in record "+r.record);
        s.data.length=0;
       }
       else
       {
        app.log("inform","Adding data to series "+s.series+" in record "+r.record);
       };
       r.changed=true;
       dest_parms=this.mergeLists(this.itemList(s.series_type),s.parameter_list);
       while((i<d.length)&&(d[i].series==ser)&&((this.exchange.mode=="SeriesList")||(d[i].record==rec)))
       {
        if(dest_parms.length==1)
        {
         s.data.push(d[i][dest_parms[0]]);
        }
        else
        {
         o=duplItem(d[i]);
         if(this.exchange.mode=="RecordsSeriesList")
         {
          delete o.record;
         };
         delete o.series;
         s.data.push(o);
        };
        i++;
       };
       if(s.series_type=="Dendro_Sample"){dendro.checkImport(s);};
       i--;
      };
     };
    };
    if(this.exchange.mode=="ProjectSeriesList")
    {
     this.projectSeriesSpec.fillContainer();
     this.seriesListSpec.fillContainer();
    }
    else
    {
     this.recordsSpec.fillContainer();
     this.recordSpec.fillContainer();
     this.seriesSpec.fillContainer();
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  };
 };
 if(this.exchange.source==this.searchResults)
 {
  this.showSearchResults();
 };
};

integrateApp.prototype.genExchangeSpec=function()
{
 var spec,s,ss;
 spec=new itemSpec("exchange_data","Import/Export tool","Object");
 spec.edit=true;
 spec.transparent=true;
 s=this.genSpec(spec,"series");
 s=this.genSpec(spec,"parameter_list");
 s.changer=this.refreshExchange.bind(this,"parameter_list");
 s.width=80;
 s=this.genSpec(spec,"headerLine");
 s.changer=this.refreshExchange.bind(this,"headerLine");
 s.width=80;
 s=this.genSpec(spec,"data");
 s.special=false;s.editor=false; // don't treat like any data
 s.changer=this.refreshExchange.bind(this,"data");
 s.width=80;
 s.height=20;
 s=spec.appendChild("options","Options","Object");
 s.inline=true;
 ss=this.genSpec(s,"series_type");
 spec.series_type=ss;
 ss.changer=this.refreshExchange.bind(this,"series_type");
 ss=this.genSpec(s,"z_units");
 ss.changer=this.refreshExchange.bind(this,"z_units");
 ss=this.genSpec(s,"z_style");
 ss.changer=this.refreshExchange.bind(this,"z_style");
 ss=this.genSpec(s,"t_units");
 ss.changer=this.refreshExchange.bind(this,"t_units");
 ss=this.genSpec(s,"t_schulman");
 ss.changer=this.refreshExchange.bind(this,"t_schulman");
 ss=this.genSpec(s,"header");
 ss.changer=this.refreshExchange.bind(this,"header");
 return spec;
};

integrateApp.prototype.indexLabels=function()
{
 var i;
 this.labelIndex={};
 for(i=0;i<this.parameters.length;i++)
 {
  this.labelIndex[this.parameters[i].parameter]=
  	this.parameters[i].label;
  
 };
 this.parameterIndex={};
 for(i=0;i<this.project.parameters.length;i++)
 {
  if(this.project.parameters[i].record)
  {
   this.labelIndex[this.project.parameters[i].record+"P"+
   	this.project.parameters[i].parameter]=
  	this.parameterLabel(this.project.parameters[i].label);
   this.parameterIndex[this.project.parameters[i].record+"P"+
   	this.project.parameters[i].parameter]=
  	this.project.parameters[i];
  }
  else
  {
   this.labelIndex[this.project.parameters[i].parameter]=
  	this.parameterLabel(this.project.parameters[i].label);
   this.parameterIndex[this.project.parameters[i].parameter]=
  	this.project.parameters[i];
  };
 };
};

integrateApp.prototype.parameterLabel=function(parameter)
{
 if(!this.labelIndex){return parameter;};
 if(this.labelIndex[parameter]){return this.labelIndex[parameter];};
 if(parameter.indexOf("_sigma")!=-1){return this.labelIndex["error"];};
 return parameter;
};

integrateApp.prototype.onProjectSeriesChange=function(header,ser)
{
 var rh=false,sh=false,i,j;
 if(!ser ||(ser.constructor==itemSpec)){ser=this.projectSeries;};
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(this.project.project_series_list[i].file_data==ser)
  {
   rh=this.project.project_series_list[i];break;
  };
 };
 if(rh)
 {
  if(!rh.changed || header)
  {
   this.seriesListSpec.emptyContainer();
   rh.changed=true;
   this.setProjectSeriesContent(rh,ser);
   this.seriesListSpec.fillContainer(true);
  };
  return rh;
 }
 else
 {
  this.seriesListSpec.emptyContainer();
  rh={};
  this.setProjectSeriesContent(rh,this.projectSeries);
  rh.created=true;
  rh.selected=true;
  this.project.project_series_list.push(rh);
  this.seriesListSpec.fillContainer(true);
  app.showTool("SeriesList");
  app.showTool("ProjectSeries");
  this.checkDuplicates('ProjectSeries');
  return rh;
 };
};

integrateApp.prototype.onSeriesChange=function(header,ser)
{
 var rh=false,sh=false,i,j;
 if(!ser || (ser.constructor==itemSpec)){ser=this.series;};
 for(i=0;i<this.project.records.length;i++)
 {
  if(!this.project.records[i].file_data){continue;};
  for(j=0;!rh && (j<this.project.records[i].file_data.series_list.length);j++)
  {
   if(this.project.records[i].file_data.series_list[j]==ser)
   {
    sh=this.project.records[i].file_data.series_list[j];
    rh=this.project.records[i];
    break;
   };
  };
 };
 if(rh)
 {
  if((this.series==ser)||(this.record==rh.file_data))
  {
   this.viewRecord(rh,true);
   if(!rh.changed)
   {
    this.recordsSpec.emptyContainer();
    rh.changed=true;
    this.recordsSpec.fillContainer();
   };
   if(!sh.changed||!sh.selected || header)
   {
    this.recordSpec.emptyContainer();
    this.seriesSpec.emptyContainer();
    sh.changed=true;
    sh.selected=true;
    this.seriesSpec.fillContainer();
    this.recordSpec.fillContainer();
   };
  }
  else
  {
   if(!rh.changed)
   {
    this.recordsSpec.emptyContainer();
    rh.changed=true;
    this.recordsSpec.fillContainer();
   };
   if(!sh.changed||!sh.selected || header)
   {
    sh.changed=true;
    sh.selected=true;
   };
  };
 }
 else
 {
  if(this.record)
  {
   this.recordSpec.emptyContainer();
   this.seriesSpec.emptyContainer();
   this.series.created=true;
   this.series.selected=true;
   this.record.series_list.push(this.series);
   this.seriesSpec.fillContainer();
   this.recordSpec.fillContainer();
   this.onRecordChange();
   app.showTool("Record");
   app.showTool("Series");
   this.checkDuplicates('Series');
  };
 };
 if(this.record && this.sample_index && this.sample_index['record'][this.record.header.record])
 {
  this.sample_index['record'][this.record.header.record].lastUpdated=this.series;
 };
 return false;
};

integrateApp.prototype.onProjectSeriesTypeChange=function(noedit)
{
 var rh=this.onProjectSeriesChange(true);
 if(rh){this.viewProjectSeries(rh);};
 this.projectSeriesSpec.makeEdit(!noedit);
};


integrateApp.prototype.onSeriesTypeChange=function(noedit)
{
 this.onSeriesChange(true);
 this.viewSeries(this.series);
 this.seriesSpec.makeEdit(!noedit);
};

integrateApp.prototype.noDeleteList=function(a)
{
 var i,r=[];
 if(typeof(a)=="string"){a=a.split(/\s*,\s*/);};
 for(i in a)
 {
  if(a[i].indexOf('~')==0){continue;};
  if(a[i]){r.push(a[i]);};
 };
 return r;
};

integrateApp.prototype.mergeLists=function(aa,b)
{
 var i,j,t;
 if(typeof(aa)=="string"){aa=aa.split(/\s*,\s*/);};
 a=[];
 if(aa){for(i=0;i<aa.length;i++){a[i]=aa[i];};}; // copy array
 if(!b){return a;};
 if(typeof(b)=="string"){b=b.split(/\s*,\s*/);};
 for(i=0;i<b.length;i++)
 {
  if(!b[i]){continue;};
  if(b[i].indexOf("~")==0)
  {
   t=b[i].slice(1);
   for(j=0;j<a.length;j++)
   {
    if(t==a[j])
    {
     a.splice(j,1);j--;
    };
   };
  }
  else
  {
   t=b[i];
   for(j=0;(j<a.length)&&b[i];j++)
   {
    if(t==a[j])
    {
     b[i]=false;
    };
   };
   if(b[i]){a.push(b[i]);};
  };
 };
 return a;
};

integrateApp.prototype.itemList=function(typ,head,proj,list,ignoreOpts)
{
 var a,i,po;
 if(head)
 {
  if(typ=="Records") //returns header information
  {
   a=this.findObjInArray(this.seriesParameters,"type",typ).parameters;
   if(this.project.options && this.project.options.record_parameters && !ignoreOpts)
   {
    a=this.mergeLists(a,this.project.options.record_parameters);
   };
   a=this.mergeLists(a,this.recordDetails);
   if(list){a=this.mergeLists(a,list);};
   return a;
  };
  a=this.findObjInArray(this.seriesHeaders,"type",typ).parameters;
  if(this.project.options && this.project.options.series && !ignoreOpts)
  {
   for(i=0;i<this.project.options.series.length;i++)
   {
    po=this.project.options.series[i];
    if(po.series_type!=typ){continue;};
    if(proj)
    {
     if(!po.project){continue;};
    }
    else
    {
     if(!po.record){continue;};
     if(po.site_type && (po.site_type!=this.record.header.site_type)){continue;};
    };
    a=this.mergeLists(a,po.header_list);
   };
  };
 }
 else
 {
  a=this.findObjInArray(this.seriesParameters,"type",typ).parameters;
  if(this.project.options && (typ=="Records") && this.project.options.record_parameters  && !ignoreOpts)
  {
   a=this.mergeLists(a,this.project.options.record_parameters);
  };
  if(this.project.options && this.project.options.series && !ignoreOpts)
  {
   for(i=0;i<this.project.options.series.length;i++)
   {
    po=this.project.options.series[i];
    if(po.series_type!=typ){continue;};
    if(proj)
    {
     if(!po.project){continue;};
    }
    else
    {
     if(!po.record){continue;};
     if(po.site_type && (po.site_type!=this.record.header.site_type)){continue;};
    };
    a=this.mergeLists(a,po.parameter_list);
   };
  };
 };
 if(list){a=this.mergeLists(a,list);};
 return a;
}; 

integrateApp.prototype.genProjectSeriesSpec=function(series)
{
 var spec,s,ss,i,prox,a,po,t="Proxies";
 this.specGenObject=series;
 spec=new itemSpec("data","Project data series","Object");
 if(series.readonly){spec.readonly=true;};
 spec.transparent=true;
 spec.changer=this.onProjectSeriesChange.bind(this,true);
 s=this.genSpec(spec,"project_series_type");
 if(series.project_series_type){t=series.project_series_type;}else{t="Data";spec.edit=true;};
 if(series.data && series.data.length)
 {
  switch(t)
  {
  case "Dendro_Sample":
  case "Dendro_Master":
   this.ring_z=true;
   for(i=0;i<series.data.length;i++)
   {
    if(typeof(series.data[i].z)=='undefined'){series.data[i].z=i+1;};
   };
   break;
  };
  s.readonly=true;
 }
 else
 {
  s.changer=this.onProjectSeriesTypeChange.bind(this);
 };
 s=this.genSpec(spec,"series");
 if(!series.series){s.readonly=false;}
 else
 {
  s.readonly=false;
  s.editor=function(spc){
   app.prompt("Series name",spc.object).then(function(rpl){
    var ps,os,ns,of,nf,op,np;
    os=this.projectSeries.series;ns=this.safeName(rpl);
    if(!this.uniqueName(ns)){throw("Duplicate name");};
    if(!(this.projectSeries.series==spc.object)){throw("Series changed");};
    if(!(ps=this.findProjectSeries(spc.object))){throw("Series not found");};
    if(of=ps.file) // no files involved
    {nf=of.replace(os,ns);}else{of=nf='';};
    this.projectSeriesSpec.emptyContainer();
    this.projectSeries.series=ns;
    this.projectSeriesSpec.fillContainer();
    this.onProjectSeriesChange(true);
    if(of!=nf)
    {
     op=this.projectSeriesRoot()+"/"+os;
     np=this.projectSeriesRoot()+"/"+ns;
     app.mv(this.fullPath(of),this.fullPath(nf),function(txt){
      var ofp,nfp
      this.projectSeriesSpec.emptyContainer();
      this.seriesListSpec.emptyContainer();
      ps.file=nf;
      if(this.projectSeries.file && (this.projectSeries.file.indexOf(op)!=-1))
      {
       ofp=this.drivePath(this.projectSeries.file);
       this.projectSeries.file=this.projectSeries.file.replace(op,np);
       nfp=this.drivePath(this.projectSeries.file);
       if(ofp && nfp)
       {
        app.mv(ofp,nfp);
       };
      };
      if(this.projectSeries.path && (this.projectSeries.path.indexOf(op)!=-1))
      {
       ofp=this.drivePath(this.projectSeries.path);
       this.projectSeries.path=this.projectSeries.path.replace(op,np);
       nfp=this.drivePath(this.projectSeries.path);
       if(ofp && nfp)
       {
        app.mv(ofp,nfp);
       };
      };
      this.seriesListSpec.fillContainer();
      this.projectSeriesSpec.fillContainer();
      this.onProjectSeriesChange(true);
      this.filenames['ProjectSeries']=ps.file;
      app.fileSave('ProjectSeries');
      app.fileSave('Project');
     }.bind(this),function(rpl){app.alert(rpl);});
    };
   }.bind(this)).catch(function(e){app.alert(e)});
  }.bind(this);
 };
 a=this.itemList(t,true,true,series.header_list);
 for(i=0;i<a.length;i++)
 {
  s=this.genSpec(spec,a[i]);
  switch(a[i])
  {
  case "code":
   if(series.file){s.readonly=true;};
   if(series.model_type=="Dendro")
   {
    s.special="dendro.showOptions(this)";
    s.readonly=true;
   };
   break;
  case "file":
   if(series.code){s.readonly=true;};
   if(series.model_type=="Dendro"){s.hidden=true;};
   break;
  case "site": case "region": case "country": case "longitude": case "latitude": case "notes":case "series_sample":
   s.hidden="ifFalse";
   break;
  };
 };
 s=this.genSpec(spec,"header_list");
 s.changer=this.onProjectSeriesTypeChange.bind(this);
 s.hidden="onView";
 s=this.genSpec(spec,"parameter_list");
 s.changer=this.onProjectSeriesTypeChange.bind(this);
 s.hidden="onView";
 s=this.genSpec(spec,"refs");
 this.seriesRefsSpec=s;
 s.hidden="ifFalse";
 s=spec.appendChild("data","Data","Array");
 s.transparent=true;
 s.hidden="ifFalse";
 s.exchanger="integ.importData('ProjectSeries')";
 s.changer=this.onProjectSeriesChange.bind(this,false);
 this.indexLabels();
 a=this.itemList(t,false,true,series.parameter_list);
 switch(series.project_series_type)
 {
 case "Files":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
 case "Maps":
  s.prompt=series.project_series_type;
  s.readonly=true;
  s.propagateEdit=false;
  break;
 case "IntCal_Curve":
 case "IntCal_Curve_B":
  s.readonly=true;
  s.propagateEdit=false;
  break;
 };
 for(i=0;i<a.length;i++)
 {
  ss=this.genSpec(s,a[i]);
  if(ss.type=="TextArea"){ss.popup=true;};
  if(ss.type=="Array"){ss.popup=true;};
 };
 switch(series.project_series_type)
 {
 case "Files":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
 case "Maps":
  s.prompt=series.project_series_type;
  s.readonly=true;
  break;
 case "IntCal_Curve":
 case "IntCal_Curve_B":
  s.readonly=true;
  break;
 };
 if(series.database){s.database=true;};
 delete(this.ring_z);
 return spec;
};

integrateApp.prototype.genSeriesSpec=function(series)
{
 var spec,s,ss,i,prox,a,t="Proxies";
 this.specGenObject=series;
 spec=new itemSpec("data","Data series","Object");
 spec.transparent=true;
 spec.changer=this.onSeriesChange.bind(this,false);
 s=this.genSpec(spec,"series_type");
 if(series.series_type){t=series.series_type;}else{spec.edit=true;};
 if(series.data && series.data.length)
 {
  switch(t)
  {
  case "Dendro_Sample":
  case "Dendro_Master":
   this.ring_z=true;
   for(i=0;i<series.data.length;i++)
   {
    if(typeof(series.data[i].z)=='undefined'){series.data[i].z=i+1;};
   };
  };
  s.readonly=true;
 }
 else
 {
  s.changer=this.onSeriesTypeChange.bind(this);
 };
 if((t=="Dendro_Sample")&&(!series.dated)){this.ring_data=true;};
 s=this.genSpec(spec,"series");
 if(!series.series){s.readonly=false;}
 else
 {
  s.readonly=false;
  s.editor=function(spc){
   app.prompt("Series name",spc.object).then(function(rpl){
    var saveNeeded=false,os,ns,op,np,ofp,nfp;
    os=this.series.series;ns=this.safeName(rpl);
    if(!this.uniqueName(ns)){throw("Duplicate name");};
    if(!(this.series.series==spc.object)){throw("Series changed");};
    this.seriesSpec.emptyContainer();
    this.series.series=ns;
    if(os!=ns)
    {
     op="~/record/"+this.record.header.record+"/"+os;
     np="~/record/"+this.record.header.record+"/"+ns;
     if(this.series.file 
      && (this.series.file.indexOf("~/record/"+this.record.header.record+"/")!=-1)
      && (this.series.file.indexOf("/"+os+".")!=-1))
     {
      ofp=this.drivePath(this.series.file);
      this.series.file=this.series.file.replace("/"+os+".","/"+ns+".");
      nfp=this.drivePath(this.series.file);
      if(ofp && nfp)
      {
       app.mv(ofp,nfp);
      };
      saveNeeded=true;
     };
     if(this.series.path && (this.series.path.indexOf(op)!=-1))
     {
      ofp=this.drivePath(this.series.path);
      this.series.path=this.series.path.replace(op,np);
      nfp=this.drivePath(this.series.path);
      if(ofp && nfp)
      {
       app.mv(ofp,nfp);
      };
      saveNeeded=true;
     };
     this.seriesSpec.fillContainer();
     this.onSeriesChange();
     if(saveNeeded)
     {
      app.fileSave('Record');
     };
    };
   }.bind(this)).catch(function(e){app.alert(e)});
  }.bind(this);
 };
 s.changer=this.onSeriesChange.bind(this,true);
 a=this.itemList(t,true,false,series.header_list);
 for(i=0;i<a.length;i++)
 {
  s=this.genSpec(spec,a[i]);
  switch(a[i])
  {
  case "l_units":
   s.changer=this.onSeriesTypeChange.bind(this,true);
   break;
  case "code":
   if(series.file){s.readonly=true;};
   if(series.model_type=="Dendro")
   {
    s.special="dendro.showOptions(this)";
    s.readonly=true;
   };
   s.hidden="ifFalse";
   break;
  case "file":
   if(series.code){s.readonly=true;};
   if(series.model_type=="Dendro"){s.hidden=true;};
   break;
  case "dated_against":
  case "combines":
   s.special="dendro.showStats(this)";
  case "t_to_orig": 
   s.hidden="ifFalse";
   break;
  case "notes":case "series_sample":
   s.hidden="ifFalse";
   break;
  default:
   if((a[i].indexOf("dated_")==0)||(a[i].indexOf("combine_")==0))
   {
    s.hidden=true;
   };
   break;
  };
 };
 s=this.genSpec(spec,"header_list");
 s.changer=this.onSeriesTypeChange.bind(this);
 s.hidden="onView";
 s=this.genSpec(spec,"parameter_list");
 s.changer=this.onSeriesTypeChange.bind(this,true);
 s.hidden="onView";
 s=this.genSpec(spec,"refs");
 s.hidden="ifFalse";
 s.appender=function(s)
 {
  this.editRef(s);
 }.bind(this);
 this.seriesRefsSpec=s;
 s=spec.appendChild("data","Data","Array");
 s.transparent=true;
// if(t=="Dendro_Sample"){s.numberArray=true;};
 s.hidden="ifFalse";
 s.exchanger="integ.importData('Series')";
 s.changer=this.onSeriesChange.bind(this,false);
 a=this.itemList(t,false,false,series.parameter_list);
 for(i=0;i<a.length;i++)
 {
  ss=this.genSpec(s,a[i]);
  if(ss.type=="TextArea"){ss.popup=true;};
 };
 delete(this.ring_data);delete(this.ring_z);
 return spec;
};

// import or export funtions

integrateApp.prototype.importData=function(context,source,mode,head,type)
{
 switch(context)
 {
 case "Records":
  if(source){break;};
  app.menu("Import/Export|Records|Record details|Record references||Import series information|Import series data|Import series references||Export series information|Export series data|Export series references",{"id":"exchange"}).then(function(rpl){
   var i,j,k,obj,r,men,hed,opt=this.findParameter("series_type").options;
   var src;
   switch(rpl)
   {
   case 1:
   case 2:
    this.importData("Records",this.project.records,"Records",rpl==2);
    return;
   case 3:
    src={"series_type":"Record_Refs","data":[],"parameter_list":["record","ref"]}
    for(i=0;i<this.project.records.length;i++)
    {
     if(!this.project.records[i].selected){continue;};
     if(!this.project.records[i].file_data){continue;};
     r=this.project.records[i].file_data;
     if(!Array.isArray(r.refs)){continue;};
     for(k=0;k<r.refs.length;k++)
     {
      obj={"record":r.header.record,"ref":r.refs[k]};
      src.data.push(obj);
     };
    };
    this.importData("Records",src,"Record_Refs",false);
    return;
   case 5:
   case 6:
    men="Import";
    break;
   case 7:
    src={"series_type":"Series_Refs","data":[],"parameter_list":["record","series","ref"]};
    this.importData("Records",src,"Series_Refs",false);
    return;
   case 9:
   case 10:
    opt=[];
    for(i=0;i<this.project.records.length;i++)
    {
     if(!this.project.records[i].selected){continue;};
     if(r=this.project.records[i].file_data)
     {
      for(j=0;j<r.series_list.length;j++)
      {
       this.addUnique(opt,r.series_list[j].series_type);
      };
     };
    };
    men="Export";break;
    break;
   case 11:
    src={"series_type":"Series_Refs","data":[],"parameter_list":["record","series","ref"]};
    for(i=0;i<this.project.records.length;i++)
    {
     if(!this.project.records[i].selected){continue;};
     if(!this.project.records[i].file_data){continue;};
     r=this.project.records[i].file_data;
     for(j=0;j<r.series_list.length;j++)
     {
      if(!Array.isArray(r.series_list[j].refs)){continue;};
      for(k=0;k<r.series_list[j].refs.length;k++)
      {
       obj={"record":r.header.record,"series":r.series_list[j].series,"ref":r.series_list[j].refs[k]};
       src.data.push(obj);
      };
     };
    };
    this.importData("Records",src,"Series_Refs",false);
    return;
   };
   men+="|"+opt.join("|");
   app.menu(men).then(function(ty){
    ty=opt[ty-1];
    var i,j,k,l,r,obj;
    var src={"series_type":ty,"data":[],"parameter_list":[]};
    switch(rpl)
    {
    case 5:
    case 6:
     this.importData("Records",src,"RecordsSeriesList",rpl==5);
     return;
    };
    for(i=0;i<this.project.records.length;i++)
    {
     if(!this.project.records[i].selected){continue;};
     if(!this.project.records[i].file_data){continue;};
     r=this.project.records[i].file_data;
     for(j=0;j<r.series_list.length;j++)
     {
      if(!r.series_list[j].selected){continue;};
      if(r.series_list[j].series_type!=ty){continue;};
      switch(rpl)
      {
      case 9: // Export series information
       obj={"record":r.header.record};
       src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(r.series_list[j].header_list));
       for(k in r.series_list[j])
       {
        if(Array.isArray(r.series_list[j][k])){continue;};
        obj[k]=r.series_list[j][k];
       };
       src.data.push(obj);
       break;
      case 10: // Export series data
       if(!Array.isArray(r.series_list[j].data)){continue;};
       src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(r.series_list[j].parameter_list));
       for(k=0;k<r.series_list[j].data.length;k++)
       {
        if(typeof(r.series_list[j].data[k])!='object')
        {
         obj={};obj[src.parameter_list[0]]=r.series_list[j].data[k];
        }
        else
        {
         obj=duplItem(r.series_list[j].data[k]);
        };
        obj.record=r.header.record;
        obj.series=r.series_list[j].series;
        src.data.push(obj);
       };
       break;
      };
     };
    }
    switch(rpl)
    {
    case 3:
     src.parameter_list="record,ref";
     this.importData("Records",src,"RecordRefs",false);
    case 9: // Export series information
    case 10: // Export series data
     src.parameter_list=src.parameter_list.join(",");
     this.importData("Records",src,"RecordsSeriesList",rpl==9);
     return;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }.bind(this)).catch(function(e){app.alert(e);});
  return;
 case "ProjectSeriesList":
  if(source){break;};
  app.menu("Import/Export|Import series information|Import series data||Export series information|Export series data",{"id":"exchange"}).then(function(rpl){
   var i,j,s,men,hed,opt=this.findParameter("project_series_type").options;
   switch(rpl)
   {
   case 1:
   case 2:
    men="Import";break;
   case 4:
   case 5:
    opt=[];
    for(j=0;j<this.project.project_series_list.length;j++)
    {
     if(!this.project.project_series_list[j].selected){continue;};
     this.addUnique(opt,this.project.project_series_list[j].project_series_type);
    };
    men="Export";break;
    break;
   };
   men+="|"+opt.join("|");
   app.menu(men).then(function(ty){
    ty=opt[ty-1];
    var i,j,k,l,r,obj;
    var src={"series_type":ty,"data":[],"parameter_list":[]};
    switch(rpl)
    {
    case 1:
    case 2:
     this.importData("ProjectSeries",src,"ProjectSeriesList",rpl==1);
     return;
    };
    for(j=0;j<this.project.project_series_list.length;j++)
    {
     s=this.project.project_series_list[j];
     if(!s.selected){continue;};
     if(s.project_series_type!=ty){continue;};
     if(!(s=s.file_data)){continue;};
     switch(rpl)
     {
     case 4:
      src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(s.header_list));
      obj={};
      for(k in s)
      {
       if(Array.isArray(s[k])){continue;};
       obj[k]=s[k];
      };
      src.data.push(obj);
      break;
     case 5:
      if(!Array.isArray(s.data)){continue;};
      src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(s.parameter_list));
      for(k=0;k<s.data.length;k++)
      {
       if(typeof(s.data[k])!='object')
       {
        obj={};obj[src.parameter_list[0]]=s.data[k];
       }
       else
       {
        obj=duplItem(s.data[k]);
       };
       obj.series=s.series;
       src.data.push(obj);
      };
      break;
     };
    }
    switch(rpl)
    {
    case 4:
    case 5:
     src.parameter_list=src.parameter_list.join(",");
     this.importData("ProjectSeries",src,"ProjectSeriesList",rpl==4);
     return;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }.bind(this)).catch(function(e){app.alert(e);});
  return;
 case "SeriesList":
  if(source){break;};
  app.menu("Import/Export|Import series information|Import series data||Export series information|Export series data",{"id":"exchange"}).then(function(rpl){
   var i,j,r,men,hed,opt=this.findParameter("series_type").options;
   switch(rpl)
   {
   case 1:
   case 2:
    men="Import";break;
   case 4:
   case 5:
    opt=[];
    if(r=this.record)
    {
     for(j=0;j<r.series_list.length;j++)
     {
      if(!r.series_list[j].selected){continue;};
      this.addUnique(opt,r.series_list[j].series_type);
     };
    };
    men="Export";break;
    break;
   };
   men+="|"+opt.join("|");
   app.menu(men).then(function(ty){
    ty=opt[ty-1];
    var i,j,k,l,r,obj;
    var src={"series_type":ty,"data":[],"parameter_list":[]};
    switch(rpl)
    {
    case 1:
    case 2:
     this.importData("Series",src,"SeriesList",rpl==1);
     return;
    };
    r=this.record;
    for(j=0;j<r.series_list.length;j++)
    {
     if(!r.series_list[j].selected){continue;};
     if(r.series_list[j].series_type!=ty){continue;};
     switch(rpl)
     {
     case 4:
      obj={};
      src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(r.series_list[j].header_list));
      for(k in r.series_list[j])
      {
       if(Array.isArray(r.series_list[j][k])){continue;};
       obj[k]=r.series_list[j][k];
      };
      src.data.push(obj);
      break;
     case 5:
      if(!Array.isArray(r.series_list[j].data)){continue;};
      src.parameter_list=this.mergeLists(src.parameter_list,this.noDeleteList(r.series_list[j].parameter_list));
      for(k=0;k<r.series_list[j].data.length;k++)
      {
       obj=duplItem(r.series_list[j].data[k]);
       obj.record=r.header.record;
       obj.series=r.series_list[j].series;
       src.data.push(obj);
      };
      break;
     };
    }
    switch(rpl)
    {
    case 4:
    case 5:
     src.parameter_list=src.parameter_list.join(",");
     this.importData("Series",src,"SeriesList",rpl==4);
     return;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }.bind(this)).catch(function(e){app.alert(e);});
  return;
 case "Series":
  if(source){break;};
  switch(this.series.series_type)
  {
  case "Files":
  case "Dendro_Cores":
  case "SubSample_Images":
  case "Plans":
  case "Maps":
   if(this.localPath(this.series.path))
   {
    app.dirView(this.drivePath(this.series.path));  
   }
   else
   {
    app.alert("Readonly files")
   };
   return;
  case "IntCal_Correlation":
   app.menu("Correlation matrix|Upload|Download",{"id":"Series"}).then(function(rpl){
    switch(rpl)
    {
    case 1:
     app.upload("Upload matrix","text/plain")
      .then(function(rpl){
        var input = event.target;
        var fo;
        var reader = new FileReader();
        fo=rpl.item(0);
        if(fo.type!="text/plain")
        {
         app.alert("File type needs to be text");
        };
        reader.onload = function()
        {
         this.seriesSpec.emptyContainer();
         this.series.intcal_cor_matrix=reader.result;
         this.seriesSpec.fillContainer();
         this.onSeriesChange();
        }.bind(this);
        reader.readAsText(fo);
     }.bind(this)).catch(function(e){app.alert(e);});
     break;
    case 2:
     app.fileDownload(this.series.series+".txt",this.series.intcal_cor_matrix);
     break;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
   return;
  case "NOAA_NCEI_Study":
   app.menu("NOAA NCEI study|Import references|Import dendro data|View study",{"id":"Series"}).then(function(rpl){
    switch(rpl)
    {
    case 1:
     noaa.parseNoaaStudy(this.series.noaa_ncei_study,{"record":this.record.header.record,
      "series":this.series});
     break;
    case 2:
     noaa.parseNoaaStudy(this.series.noaa_ncei_study,{"urlDescription":"Raw Measurements",
      "record":this.record.header.record,"series":this.series});
     break;
    default:
     window.open(noaa.NoaaStudyURL+this.series.noaa_ncei_study);
     break;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
   return;
  };
  break;
 case "ProjectSeries":
  if(source){break;};
  switch(this.projectSeries.project_series_type)
  {
  case "Files":
  case "Dendro_Cores":
  case "SubSample_Images":
  case "Plans":
  case "Maps":
   if(this.localPath(this.projectSeries.path))
   {
    app.dirView(this.drivePath(this.projectSeries.path));
   }
   else
   {
    app.alert("Readonly files")
   };
   return;
  case "NOAA_NCEI_Study":
   app.menu("NOAA NCEI study|Import records|Import references|Import dendro data|View study",{"id":"ProjectSeries"}).then(function(rpl){
    switch(rpl)
    {
    case 1:
     noaa.parseNoaaStudy(this.series.noaa_ncei_study,{});
     break;
    case 2:
     noaa.parseNoaaStudy(this.series.noaa_ncei_study,{"series":this.projectSeries});
     break;
    case 3:
     noaa.parseNoaaStudy(this.series.noaa_ncei_study,{"urlDescription":"Raw Measurements",
      "record":null,"series":this.projectSeries});
     break;
    default:
     window.open(noaa.NoaaStudyURL+this.projectSeries.noaa_ncei_study);
     break;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
   return;
  };
  break;
 };
 this.exchangeSpec.emptyContainer();
 this.exchange.mode=mode;
 this.exchange.head=head;
 switch(context)
 {
 case "Series":
  this.exchange.options.z_units=this.zUnits();
  switch(this.exchange.options.series_type)
  {
  case "Dendro_Sample":
   this.exchange.options.z_units="rings";
   break;
  case "Dendro_Cores":
  case "SubSample_Images":
  case "SubSample_Data":
   this.exchange.options.z_units="length";
   break;
  };
  if(mode=="SeriesList")
  {
   this.exchangeSpec.series_type.options=[source.series_type];
   this.exchange.options.series_type=source.series_type;
   this.exchange.source=source;
   if(head)
   {
    this.exchange.series="Series_Information";
   }
   else
   {
    this.exchange.series="Series_Data";
   };
   this.exchange.parameter_list=source.parameter_list;
  }
  else
  {
   this.exchangeSpec.series_type.options=this.findParameter('series_type').options;
   this.exchange.options.series_type=this.series.series_type;
   if(this.exchange.options.series_type=="Dendro_Sample")
   {
    this.exchange.options.z_units="rings";
   };
   this.exchange.source=this.series;
   this.exchange.series=this.series.series;
   this.exchange.parameter_list=this.series.parameter_list;
  };
  this.exchange.options.z_style=this.project.options.z_style;
  this.exchange.importing=false;
  break;
 case "ProjectSeries":
  this.exchange.options.z_units=this.project.options.z_units;
  if(mode=="ProjectSeriesList")
  {
   this.exchangeSpec.series_type.options=[source.series_type];
   this.exchange.options.series_type=source.series_type;
   if(this.exchange.options.series_type=="Dendro_Master")
   {
    this.exchange.options.z_units="rings";
   };
   this.exchange.source=source;
   if(head)
   {
    this.exchange.series="ProjectSeries_Information";
   }
   else
   {
    this.exchange.series="ProjectSeries_Data";
   };
   this.exchange.parameter_list=source.parameter_list;
  }
  else
  {
   this.exchangeSpec.series_type.options=this.findParameter('project_series_type').options;
   this.exchange.options.series_type=this.projectSeries.project_series_type;
   if(this.exchange.options.series_type=="Dendro_Master")
   {
    this.exchange.options.z_units="rings";
   };
   this.exchange.source=this.projectSeries;
   this.exchange.series=this.projectSeries.series;
   this.exchange.parameter_list=this.projectSeries.parameter_list;
  };
  this.exchange.options.z_style=this.project.options.z_style;
  this.exchange.importing=false;
  break;
 case "Records":
  this.exchange.options.z_units=this.project.options.z_units;
  switch(mode)
  {
  case "Record_Refs":
  case "Series_Refs":
   this.exchangeSpec.series_type.options=[source.series_type];
   this.exchange.options.series_type=source.series_type;
   this.exchange.series=source.series_type;
   this.exchange.parameter_list=source.parameter_list;
   break;
  case "RecordsSeriesList":
   this.exchangeSpec.series_type.options=[source.series_type];
   this.exchange.options.series_type=source.series_type;
   if(this.exchange.options.series_type=="Dendro_Sample")
   {
    this.exchange.options.z_units="rings";
   };
   if(head)
   {
    this.exchange.series="Series_Information";
   }
   else
   {
    this.exchange.series="Series_Data";
   };
   this.exchange.parameter_list=source.parameter_list;
   break;
  default:
   this.exchangeSpec.series_type.options=["Records"];
   this.exchange.options.series_type="Records";
   this.exchange.series=context;
   this.exchange.parameter_list="";
   break;
  };
  this.exchange.options.z_style=this.project.options.z_style;
  this.exchange.importing=false;
  this.exchange.head=head;
  this.exchange.source=source;
  break;
 case "Search":
  this.exchangeSpec.series_type.options=["Search"];
  this.exchange.options.series_type="Search";
  this.exchange.options.z_units=this.project.options.z_units;
  this.exchange.options.z_style=this.project.options.z_style;
  this.exchange.series=context;
  this.exchange.parameter_list=this.searchResults.parameter_list.join(",");
  this.exchange.importing=false;
  this.exchange.source=this.searchResults;
  break;
 };
 this.exchange.options.t_units=this.project.options.t_units;
 this.exchange.options.t_schulman=
  this.project.options.t_schulman  
   && this.record && this.record.header
   && (this.record.header.site_type=="Dendrochronological")
   && (this.record.header.t_source=="DendroSH");
 this.exchangeSpec.fillContainer();
 this.refreshExchange("series_type");
 app.showTool('Exchange'); 
};

integrateApp.prototype.prepDataOut=function(context)
{
 var data,flag="";
 switch(context)
 {
 case "Series":
  data=this.series;flag=context;
  break;
 case "ProjectSeries":
  data=this.projectSeries;flag="Series";
  break;
 case "Record":
  data=this.record;flag=context;
  break;
 };
 data=JSON.parse(JSON.stringify(data));
 data=this.recursiveDataFlip(data,this.arrayToObject);
 data=app.tagObject(data,flag);
 return JSON.stringify(data);
};
integrateApp.prototype.projectContentsSpec=function()
{
 var spec,s;
 spec=new itemSpec("options","Options","Object");
 s=spec.appendChild("include","Include data","Number");
 s.options=["All","Local","Links"];
 s=spec.appendChild("records","Records","Boolean");
 s=spec.appendChild("series","Series","Boolean");
 s=spec.appendChild("selected","Selected only","Boolean");
 s=spec.appendChild("bibliography","Bibliography","Boolean");
 s=spec.appendChild("options","Options","Boolean");
 return spec;
};

integrateApp.prototype.downloadData=function(context)
{
 var fn="Intchron_"+context+"_";
 switch(context)
 {
 case "Series":
  fn+=this.series.series;
  break;
 case "ProjectSeries":
  fn+=this.projectSeries.series;
  break;
 case "Record":
  fn+=this.record.header.record;
  break;
 case "Project":
  fn+=this.project.options.name;
  app.prompt("Download",{"include":0,"records":true,"series":true,"selected":false,"bibliography":true,"options":true},this.projectContentsSpec())
  .then(function(rpl){
   app.fileDownload(fn,JSON.stringify(app.tagObject(this.getProjectContent(rpl),"Project")));
  }.bind(this),function(e){});
  return;
 };
 app.fileDownload(fn,this.prepDataOut(context));
};

integrateApp.prototype.dataDescriptor=function(context)
{
 switch(context)
 {
 case "Series":
  return "series";
 case "ProjectSeries":
  return "project series";
 case "Record":
  return "record";
 };
 return "data";
};

integrateApp.prototype.copyData=function(context)
{
 var str=this.prepDataOut(context);
 app.prompt("Copy "+this.dataDescriptor(context),str,"copy");
};

integrateApp.prototype.swallowData=function(context,rpl,silent)
{
 var o=this.recursiveDataFlip(JSON.parse(rpl),this.objectToArray);
 if(!this.checkObject(o,context,true))
 {
  switch(context)
  {
  case "Project":
   if(this.swallowData("ProjectSeries",rpl,true)){return true;};
   if(this.swallowData("Record",rpl,true)){return true;};
   break;
  case "Record":
   if(this.swallowData("Series",rpl)){return true;};
   break;
  };
  if(!silent)
  {
   app.alert("Cannot import this data into "+context);
  };
  return false;
 };
 try
 {
  switch(context)
  {
  case "Series":
   this.seriesSpec.emptyContainer();
   this.series=o;
   this.seriesSpec.object=o;
   this.seriesSpec.fillContainer();
   this.onSeriesTypeChange(true);
   break;
  case "ProjectSeries":
   this.projectSeriesSpec.emptyContainer();
   this.projectSeries=o;
   this.projectSeriesSpec.object=o;
   this.projectSeriesSpec.fillContainer();
   this.onProjectSeriesTypeChange(true);
   break;
  case "Record":
   this.recordSpec.emptyContainer();
   this.record=o;
   this.recordSpec.object=o;
   this.recordSpec.fillContainer();
   this.onRecordChange();
   break;
  case "Project":
   app.menu("Add data to|New project|Existing project",{"id":"Project"})
   .then(async function(rpl){
    var i;
    switch(rpl)
    {
    case 1:
     if(o.options){o.options.database=false;};
     app.fileNew('Project',JSON.stringify(o));
     break;
    case 2:
     if(o.bibliography)
     {
      this.addBibliography(o.bibliography);
     };
     if(o.records && o.records.length)
     {
      app.showTool("Records");
      this.recordsSpec.emptyContainer();
      for(i=0;i<o.records.length;i++)
      {
       o.records[i].created=true;
       this.project.records.push(o.records[i]);
      };
      this.recordsSpec.fillContainer();
      await(this.checkDuplicates("Record"));
     };
     if(o.project_series_list && o.project_series_list.length)
     {
      app.showTool("SeriesList");
      this.seriesListSpec.emptyContainer();
      for(i=0;i<o.project_series_list.length;i++)
      {
       o.project_series_list[i].created=true;
       this.project.project_series_list.push(o.project_series_list[i]);
      };
      this.seriesListSpec.fillContainer();
      await(this.checkDuplicates("ProjectSeries"));
     };
     this.readProjectData();
     break;
    };
    this.checkProjectToolMenu();
   }.bind(this)).catch(function(e){app.alert(e)});
   return;
  }; 
 }catch(e){app.alert(e);};
 return true;
};

integrateApp.prototype.uploadData=function(context)
{
 app.upload("Upload "+this.dataDescriptor(context),"application/json")
  .then(function(rpl){
     var input = event.target;
     var fo;
     var reader = new FileReader();
     fo=rpl.item(0);
     if(fo.type!="application/json")
     {
      app.alert("File type needs to be JSON");
     };
     reader.onload = function()
     {
      this.swallowData(context,reader.result);
     }.bind(this);
     reader.readAsText(fo);
  }.bind(this)).catch(function(e){app.alert(e);});
};

integrateApp.prototype.pasteData=function(context)
{
 var ti="Paste ";
 app.prompt("Paste "+this.dataDescriptor(context),"","paste")
  .then(function(rpl){
   this.swallowData(context,rpl);
  }.bind(this)).catch(function(e){app.alert(e);});
};


// viewing functions

integrateApp.prototype.defaultTools=function()
{
 return {"AgeDepth":false,"Dendro":false,"PlotProxies":false,"OxCal":false,"Map":false,"IntCal":false,"AgeRing":false,"Tephra":false,"Samples":false,"MRDB":false};
};

integrateApp.prototype.addUnique=function(ar,v,nosort)
{
 var i,j,changed=false;
 if(!v){return;};
 if(Array.isArray(v))
 {
  for(i=0;i<v.length;i++)
  {
   if(this.addUnique(ar,v[i],true)){changed=true;};
  };
 }
 else
 {
  for(i=0;i<ar.length;i++)
  {
   while((i<ar.length) && !ar[i])
   {
    for(j=i+1;j<ar.length;j++)
    {
     ar[j-1]=ar[j];
    };
    ar.length--;
    changed=true;
   };
  };
  for(i=0;i<ar.length;i++)
  {
   if(ar[i]==v){return changed;};
  };
  ar.push(v);
  changed=true;
 };
 if(nosort||!changed){return changed;};
 ar.sort();
 return changed;
};

integrateApp.prototype.seriesTools=function(obj,s)
{
 if(!obj){obj=this.defaultTools();};
 if(!s){s=this.series;};
 switch(s.series_type)
 {
 case "IntCal_Data_B":
  if(!this.intcalPO.plot){this.intcalPO.plot=2;};
 case "IntCal_Data":
  if(s["intcal_set_type"])
  {
   if(typeof(this.intcalPO[s["intcal_set_type"].replace("New","")])=="undefined")
   {
    this.intcalPO[s["intcal_set_type"].replace("New","")]=true;
   };
   if((s["intcal_set_type"].indexOf("New")==0)&&(typeof(this.intcalPO["New"])=="undefined"))
   {
    this.intcalPO["New"]=true;
   };
  };
 case "IntCal_Curve":
 case "IntCal_Curve_B":
  obj["IntCal"]=true;
  obj["Plot"]=true;
  break;
 case "AgeDepth":
  obj["AgeDepth"]=true;
  obj["Plot"]=true;
  break;
 case "Dates":
  obj["OxCal"]=true;
  break;
 case "Dendro_Sample":
  obj["Dendro"]=true;
  obj["Plot"]=true;
  break;
 case "Proxies":
  obj["PlotProxies"]=true;
  obj["Plot"]=true;
  break;
 case "Volc_Eruptions":
  obj["Tephra"]=true;
  break;
 case "Model":
  obj[s.model_type]=true;
  break;
 case "MRDB_Data":
  obj["MRDB"]=true;
  break;
 case "R_Datelist":
 case "R_Dates":
  obj["OxCal"]=true;
  break;
 case "Sample_Data":
  obj["Map"]=true;
  break;
 case "Tephras":
  break;
 case "Tephra_Sample_Majors":
 case "Tephra_Sample_Trace":
 case "Tephra_Samples":
  obj["Tephra"]=true;
  obj["Plot"]=true;
  break;
 };
 return obj;
};

integrateApp.prototype.addToMenu=function(mode,style,text,action,hidden)
{
 var li,a,l;
 l=document.getElementById(mode+"Menu");
 if(l){mode+="Menu";}else{l=document.getElementById(mode);};
 if(!l){app.alert(mode+" not found");return false;};
 li=document.createElement('LI');
 if(action)
 {
  a=document.createElement('A');
  a.href="#";
  a.onmousedown=action;
 }
 else
 {
  a=document.createElement('SPAN');
 };
 a.id=mode+"__"+l.children.length;
 if(style)
 {
  a.className="app"+style;
  a.ariaLabel=style;
 };
 a.style.display=hidden?'none':'block';
 a.appendChild(document.createTextNode(text));
 li.appendChild(a);
 l.appendChild(li);
 return a.id;
};

integrateApp.prototype.initSeriesToolMenu=function()
{
 app.appendToMenu("Series","Button","Plot",this.plot.bind(this,'Series'),true);
 app.appendToMenu("Series","Button","OxCal",this.oxcalMenu.bind(this,'Series'),true);
 app.appendToMenu("Series","Button","IntCal",this.intcalMenu.bind(this,'Series'),true);
 app.appendToMenu("Series","Button","Cite",this.cite.bind(this,"Series"),false);
};

integrateApp.prototype.checkSeriesToolMenu=function()
{
 var e,i,o=this.seriesTools();
 for(i=0;e=document.getElementById("SeriesMenu__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "OxCal":
   if(o["OxCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "IntCal":
   if(o["IntCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Plot":
   if(o["Plot"]){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};

integrateApp.prototype.recordTools=function(obj,r)
{
 var i,k;
 if(!obj){obj=this.defaultTools();};
 if(!r){r=this.record;};
 if(!r.series_list){return obj;};
 if(r.header && r.header.longitude && r.header.latitude){obj["Map"]=true;};
 for(k=0;k<r.series_list.length;k++)
 {
  obj=this.seriesTools(obj,r.series_list[k]);
 };
 if(this.sample_index && this.sample_index.record[r.header.record])
 {
  for(i in this.sample_index.record[r.header.record].sample)
  {
   obj["Samples"]=true;
   break;
  };
 };
 if(obj["IntCal"] && (obj["Dendro"]||r.header.site_type=="Dendrochronological")){obj["AgeRing"]=true;};
 return obj;
};

integrateApp.prototype.initRecordToolMenu=function()
{
 app.appendToMenu("Record","ButtonLeft","Map",this.plot.bind(this,'Map','Record'),false);
 app.appendToMenu("Record","ButtonRight","Plot",this.plot.bind(this,'Record'),false);
 app.appendToMenu("Record","Button","Samples",this.showRecordSamples.bind(this),true);
 app.appendToMenu("Record","Button","AgeDepth",this.ageModel.bind(this),true);
 app.appendToMenu("Record","Button","OxCal",this.oxcalMenu.bind(this,'Record'),true);
 app.appendToMenu("Record","Button","Dendro",dendro.dendroMenu.bind(dendro,'Record'),true);
 app.appendToMenu("Record","Button","Tephra",tephra.tephraMenu.bind(tephra,'RecordTephra'),true);
 app.appendToMenu("Record","Button","MRDB",this.MRDBMenu.bind(this,'Record'),true);
 app.appendToMenu("Record","Button","Cite",this.cite.bind(this,"Record"),false);
};

integrateApp.prototype.checkRecordToolMenu=function()
{
 var e,i,o=this.recordTools();
 for(i=0;e=document.getElementById("RecordMenu__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "Samples":
   if(o["Samples"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "OxCal":
   if(o["OxCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Dendro":
   if(o["Dendro"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "AgeDepth":
   if(o["AgeDepth"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Map":
   if(o["Map"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Location":
   if(!o["Map"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Tephra":
   if(o["Tephra"]||(this.record.site_type=="Volcano")){e.style.display='block';}else{e.style.display='none';};
   break;
  case "MRDB":
   if(o["MRDB"]){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};

integrateApp.prototype.viewRecord=function(obj,noframe,onload)
{
 var j;
 app.locationSpec=false;
 if(!obj.file_data)
 {
  if(this.project.options.ondemand && obj.file)
  {
   this.fq.addAction(this.fileOpen.bind(this,'ProjectRecord',
    obj.file,
    this.project.options.t_from,
    this.project.options.t_to));
   this.fq.addAction(this.finishProjectData.bind(this));
   this.fq.addAction(this.viewRecord.bind(this,obj,noframe,true));
   this.fq.modal("Opening file...","integ.finishProjectData()");
   this.fq.step();
   return;
  }
  else
  {
   app.alert("Record "+obj.record+" not found",{"id":"ViewRecord"});
   return;
  };
 };
 if(onload){this.fq.step();};
 this.recordSpec.emptyContainer();
 this.record=obj.file_data;
 this.recordSpec.object=obj.file_data;
 this.addUnique(this.timeRefs,obj.record);
 if(obj.file && ((obj.file.indexOf('~/')==0)||(obj.file.indexOf('/')==0)))
 {
  this.filenames['Record']=obj.file;
 }
 else
 {
  if(this.canSave(true))
  {
   this.filenames['Record']='~/record/'+this.record.header.record+".json";
   app.mkDir(this.fullPath('~/record'));
  }
  else
  {
   this.filenames['Record']="";
  };
 };
/* if(this.filenames['Record']!=obj.file)  // make sure full path is stored here
 {
  for(j=0;j<this.record.series_list.length;j++)
  {
   switch(this.record.series_list[j].series_type)
   {
   case "Files":
   case "Maps":
   case "Plans":
    this.record.series_list[j].path=this.fullPath(this.record.series_list[j].path);
   };
  }; 
 };*/
 this.recordSpec.fillContainer();
 if(this.indexSamples(this.record.header.record,"both"))
 {
  this.onRecordChange();
 };
 this.checkRecordToolMenu();
 if(!noframe)
 {
  if(this.record.header.site)
  {
   app.toolTitle("Record",this.record.header.site);
  }
  else
  {
   app.toolTitle("Record",this.record.header.record);
  };
  app.showTool("Record");
  app.hideTool("Series");
 };
};

integrateApp.prototype.linkRecord=function(r)
{
 var rec;
 if(rec=this.findRecord(r))
 {
  this.viewRecord(rec);
 };
};

integrateApp.prototype.projectSeriesTools=function(obj,s)
{
 if(!obj){obj=this.defaultTools();};
 if(!s){s=this.projectSeries;};
 switch(s.project_series_type)
 {
 case "Eruptions":
  obj["PlotProxies"]=true;
  break;
 case "Dendro_Master":
  obj["Dendro"]=true;
  break;
 case "IntCal_Curve":
 case "IntCal_Curve_B":
  obj["IntCal"]=true;
  obj["Plot"]=true;
  break;
 case "Events":
  obj["PlotProxies"]=true;
  break;
 case "Periods":
  obj["PlotProxies"]=true;
  break;
 case "Relationship":
  obj["PlotProxies"]=true;
  break;
 case "R_Datelist":
  obj["OxCal"]=true;
  obj["Plot"]=true;
  obj["Map"]=true;
  break;
 case "Sample_Dataset":
  break;
 case "Model":
  obj[s.model_type]=true;
  break;
 };
 return obj;
};

integrateApp.prototype.projectTools=function(obj)
{
 var k;
 if(!obj){obj=this.defaultTools();};
 for(k=0;k<this.project.project_series_list.length;k++)
 {
  obj=this.projectSeriesTools(obj,this.project.project_series_list[k]);
 };
 for(k=0;k<this.project.records.length;k++)
 {
  if(this.project.records[k]["site_type"])
  {
   if(typeof(this.intcalPO[this.project.records[k]["site_type"]])=="undefined")
   {
    this.intcalPO[this.project.records[k]["site_type"]]=true;
   };
  };
 };
 for(k=0;k<this.project.records.length;k++)
 {
  if(!this.project.records[k].file_data)
  {
   if(this.project.records[k].longitude && this.project.records[k].latitude)
   {
    obj['Map']=true;
   };
  }
  else
  {
   obj=this.recordTools(obj,this.project.records[k].file_data);
  };
 };
 return obj;
};

integrateApp.prototype.initProjectToolMenu=function()
{
 app.appendToMenu("Project","Button","Map",this.plot.bind(this,'Map','Project'),true);
 app.appendToMenu("Project","Button","Plot",this.plot.bind(this,'Project'),true);
 app.appendToMenu("Project","Button","Integrate",this.integrate.bind(this),true);
 app.appendToMenu("Project","Button","OxCal",this.oxcalMenu.bind(this,'Project'),true);
 app.appendToMenu("Project","Button","Dendro",dendro.dendroMenu.bind(dendro,'Project'),true);
 app.appendToMenu("Project","Button","Tephra",tephra.tephraMenu.bind(tephra,'Project'),true);
 app.appendToMenu("Project","Button","MRDB",this.MRDBMenu.bind(this,'Project'),true);
 app.appendToMenu("Project","Button","Help",this.help.bind(this,"IntChron"),false);
 this.timeUnitLabelId=app.appendToMenu("Project","MainMenu","--",this.timeUnitsPanel.bind(this),false);
 this.showTimeUnits();
};

integrateApp.prototype.checkProjectToolMenu=function()
{
 var e,i,o=this.projectTools();
 if(o["MRDB"]){this.showServers("MRDB");};
 if(o["IntCal"]){this.showServers("IntCal");};
 for(i=0;e=document.getElementById("ProjectMenu__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "OxCal":
   if(o["OxCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Dendro":
   if(o["Dendro"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Tephra":
   if(o["Tephra"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Integrate":
   if(o["AgeDepth"] && o["PlotProxies"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "MRDB":
   if(o["MRDB"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Plot":
   if(o["PlotProxies"] || o["IntCal"]){e.style.display='block';}else{e.style.display='none';};
   break;   
  case "Map":
   if(o["Map"]){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};

integrateApp.prototype.initProjectSeriesToolMenu=function()
{
 app.appendToMenu("ProjectSeries","Button","Plot",this.plot.bind(this,'ProjectSeries'),true);
 app.appendToMenu("ProjectSeries","Button","Map",this.plot.bind(this,'Map','ProjectSeries'),true);
 app.appendToMenu("ProjectSeries","Button","OxCal",this.oxcalMenu.bind(this,'ProjectSeries'),true);
 app.appendToMenu("ProjectSeries","Button","Cite",this.cite.bind(this,"ProjectSeries"),false);
};

integrateApp.prototype.checkProjectSeriesToolMenu=function()
{
 var e,i,o=this.projectSeriesTools();
 for(i=0;e=document.getElementById("ProjectSeriesMenu__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "OxCal":
   if(o["OxCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Plot":
   if(o["Dendro"]||o["IntCal"]||o["Plot"]){e.style.display='block';}else{e.style.display='none';};
   break;   
  case "Map":
   if(o["Map"]){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};

integrateApp.prototype.initSearchToolMenu=function()
{
 app.appendToMenu("SearchHeader","Button","Map",this.plot.bind(this,'Map','Search'),true);
 app.appendToMenu("SearchHeader","Button","OxCal",this.oxcalMenu.bind(this,'Search'),true);
 app.appendToMenu("SearchHeader","Button","Plot",this.plot.bind(this,'Search'),true);
 app.appendToMenu("SearchHeader","Button","Tephra",tephra.tephraMenu.bind(tephra,'SearchTephra'),true);
 app.appendToMenu("SearchHeader","Button","Samples",this.searchSamples.bind(this),true);
 app.appendToMenu("SearchHeader","Button","MRDB",this.MRDBMenu.bind(this,'Search'),true);
};

integrateApp.prototype.searchTools=function()
{
 var i,o={"Map":false,"OxCal":false},p=this.projectTools();
 if(this.searchResults && this.searchResults.parameter_list)
 {
  for(i=0;i<this.searchResults.parameter_list.length;i++)
  {
   switch(this.searchResults.parameter_list[i])
   {
    case "record":
     if(this.searchResults.query.mode=="Records")
     {
      o["Samples"]=true;
     };
    case "series":
     if(p["OxCal"]){o["OxCal"]=true;};
     if(p["Tephra"]){o["Tephra"]=true;o["Plot"]=true;};
     break;
    case "latitude":
    case "longitude":
     o["Map"]=true;
     break;
    case "r_date":
    case "r_f14c":
     o["OxCal"]=true;
     break;
    case "sample":
     if(this.searchResults.query.mode=="Samples")
     {
      o["Plot"]=true;
     };
     break;
   };
  };
  if(this.searchResults.query.mode=="MRDB")
  {
   o["MRDB"]=true;o["OxCal"]=false;
   o["Plot"]=true;
  };
 };
 return o;
};

integrateApp.prototype.checkSearchToolMenu=function()
{
 var e,i,o=this.searchTools();
 for(i=0;e=document.getElementById("SearchHeader__"+i);i++)
 {
  switch(e.innerHTML)
  {
  case "OxCal":
   if(o["OxCal"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Tephra":
   if(o["Tephra"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Plot":
   if(o["Plot"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Map":
   if(o["Map"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "Samples":
   if(o["Samples"]){e.style.display='block';}else{e.style.display='none';};
   break;
  case "MRDB":
   if(o["MRDB"]){e.style.display='block';}else{e.style.display='none';};
   break;
  };
 };
};


integrateApp.prototype.projectSeriesRoot=function(obj) // takes series object or list element as argument
{
 return "~/series";
};


integrateApp.prototype.projectSeriesPath=function(obj) // takes series object or list element as argument
{
 return this.projectSeriesRoot()+"/"+obj.series;
};

integrateApp.prototype.viewProjectSeries=function(obj,noframe,onload)
{
 if(!obj.file_data)
 {
  obj.file_data={};
  if(this.project.options.ondemand && obj.file)
  {
   this.fq.addAction(this.fileOpen.bind(this,'ProjectSeries',
    obj.file,
    this.project.options.t_from,
    this.project.options.t_to));
   this.fq.addAction(this.finishProjectData.bind(this));
   this.fq.addAction(this.viewProjectSeries.bind(this,obj,noframe,true));
   this.fq.modal("Opening files...","integ.finishProjectData()");
   this.fq.step();
   return;
  };
 };
 switch(obj.project_series_type)
 {
 case "Files":
 case "Maps":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
  if(this.localPath(obj.file_data.path))
  {
   obj.file_data.path=this.projectSeriesPath(obj);
   app.dir(this.fullPath(obj.file_data.path),function(res){
    var ind={},i,j,d=obj.file_data.data,o;
    for(i in d){if(d[i].filename){ind[d[i].filename]=d[i]};};
    this.projectSeriesSpec.emptyContainer();
    obj.file_data.data=[];
    for(i=0;i<res.dirs.length;i++)
    {
     obj.file_data.data.push({"filename":res.dirs[i],"dir":true});
    };
    for(i=0;i<res.files.length;i++)
    {
     o={"filename":res.files[i].name,"filesize":res.files[i].size,"updated":new Date(res.files[i].updated),"dir":false};
     if(ind[res.files[i].name])
     {
      for(j in ind[res.files[i].name])
      {
       switch(j)
       {
       case "filename":case "filesize": case "updated": case "dir":break;
       default:
        o[j]=ind[res.files[i].name][j];
        break;
       };
      };
     };
     obj.file_data.data.push(o);
    };
    this.projectSeriesSpec.fillContainer();
   }.bind(this),function(err){
    app.confirm("Create directory?")
    .then(function(){
     app.mkDir(this.fullPath(obj.file_data.path),function(){
     }.bind(this),function(e){
      app.alert(e);
     }.bind(this));
    }.bind(this)).catch(function(){});
   }.bind(this));
  };
  break;
 };
 if((obj.project_series_type=="Model") && obj.file_data && obj.file_data.file && this.fullPath(obj.file_data.file))
 {
  if((obj.file_data.model_type=="OxCal")&&(obj.file_data.done)){this.oxcalCheck(obj.file_data);};
  app.fread(this.fullPath(obj.file_data.file),function(txt){
   if(obj.file_data.code!=txt)
   {
    this.projectSeriesSpec.emptyContainer();
    obj.file_data.code=txt;
    this.projectSeriesSpec.fillContainer();   
    this.onProjectSeriesChange();
   };
  }.bind(this),function(error){app.alert(error);});
 };
 if(onload){this.fq.step();};
 this.projectSeriesSpec.emptyContainer();
 app.clearTool("ProjectSeries");
 this.projectSeries=obj.file_data;
 if(obj.file && ((obj.file.indexOf('~/')==0)||(obj.file.indexOf('/')==0)))
 {
  this.filenames['ProjectSeries']=obj.file;
 }
 else
 {
  if(this.canSave(true))
  {
   this.filenames['ProjectSeries']='~/series/'+this.projectSeries.series+".json";
   app.mkDir(this.fullPath('~/series'));
  }
  else
  {
   this.filenames['ProjectSeries']="";
  };
 };
 switch(obj.file_data.project_series_type)
 {
 case "Files":
 case "Maps":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
  if(this.filenames['ProjectSeries']!=obj.file)
  {
   this.projectSeries.path=this.fullPath(this.projectSeries.path);
  };
  break;
 };
 this.projectSeriesSpec=this.genProjectSeriesSpec(obj.file_data);
 document.getElementById("projectSeriesArea").appendChild(this.projectSeriesSpec.createDisplay(obj.file_data)); 
 this.checkProjectSeriesToolMenu();
 if(!noframe)
 {
  app.toolTitle("ProjectSeries",this.projectSeries.series);
  app.showTool("ProjectSeries");
 };
};

integrateApp.prototype.seriesRecordPath=function(obj)
{
 var i,j,r,rr=false,p="";
 r=this.record;
 // first check current record
 for(j=0;(j<r.series_list.length)&&!rr;j++)
 {
  if(r.series_list[j]==obj){rr=r;};
 };
 // then check all others
 for(i==0;(i<this.project.records.length)&&!rr;i++)
 {
  r=this.project.records.file_data;
  if(!r){continue;};
  for(j=0;(j<r.series_list.length)&&!rr;j++)
  {
   if(r.series_list[j]==obj){rr=r;};
  };
 };
 // finallay assume current record
 if(!rr){rr=this.record;};
 return "~/record/"+rr.header.record; 
};

integrateApp.prototype.seriesPath=function(obj)
{
 return this.seriesRecordPath()+"/"+obj.series;
};

integrateApp.prototype.viewSeries=function(obj,noframe)
{
 switch(obj.series_type)
 {
 case "Files":
 case "Maps":
 case "Plans":
 case "Dendro_Cores":
 case "SubSample_Images":
  if(this.localPath(obj.path))
  {
   if(!obj.path){obj.path=this.seriesPath(obj);};
   app.dir(this.fullPath(obj.path),function(res){ 
    var ind={},i,j,d=obj.data,o;
    for(i in d){if(d[i].filename){ind[d[i].filename]=d[i]};};
    this.seriesSpec.emptyContainer();
    obj.data=[];
    for(i=0;i<res.dirs.length;i++)
    {
     obj.data.push({"filename":res.dirs[i],"dir":true});
    };
    for(i=0;i<res.files.length;i++)
    {
     o={"filename":res.files[i].name,"filesize":res.files[i].size,"updated":new Date(res.files[i].updated),"dir":false};
     if(ind[res.files[i].name])
     {
      for(j in ind[res.files[i].name])
      {
       switch(j)
       {
       case "filename":case "filesize": case "updated": case "dir":break;
       default:
        o[j]=ind[res.files[i].name][j];
        break;
       };
      };
     };
     obj.data.push(o);
    };
    this.seriesSpec.fillContainer();
   }.bind(this),function(err){
    app.confirm("Create directory?")
    .then(function(){
     app.mkDir(this.fullPath(obj.path),function(){
     }.bind(this),function(e){
      app.alert(e);
     }.bind(this));
    }.bind(this)).catch(function(){});
   }.bind(this));
  };
  break;
 };
 if((obj.series_type=="Model") && obj.file && this.fullPath(obj.file))
 {
  if((obj.model_type=="OxCal")&&(obj.done)){this.oxcalCheck(obj);};
  app.fread(this.fullPath(obj.file),function(txt){
   if(obj.code!=txt)
   {
    this.seriesSpec.emptyContainer();
    obj.code=txt;
    this.seriesSpec.fillContainer();   
    this.onSeriesChange();
   };
  }.bind(this),function(error){app.alert(error);});
 };
 this.seriesSpec.emptyContainer();
 if(this.indexSamples(this.record.header.record,"both"))
 {
  this.onRecordChange();
 };
 app.clearTool("Series");
 this.series=obj;
 this.seriesSpec=this.genSeriesSpec(this.series);
 document.getElementById("seriesArea").appendChild(this.seriesSpec.createDisplay(this.series)); 
 this.checkSeriesToolMenu();
 if(!noframe)
 {
  app.toolTitle("Series",this.series.series);
  app.showTool("Series");
 };
};

integrateApp.prototype.linkSeries=function(spec)
{
 var series=spec.object,i,r;
 if(spec.parent.object.project_series_type && spec.parent.object.file_data)
 {
  this.viewProjectSeries(spec.parent.object);
  return;
 };
 if(spec.parent.object.series_type)
 {
  this.viewSeries(spec.parent.object);
  return;
 };
 if(spec.parent.object.record)
 {
  r=this.findRecord(spec.parent.object.record);
  this.viewRecord(r);
  if(r=r.file_data)
  {
   for(i=0;i<r.series_list.length;i++)
   {
    if(r.series_list[i].series==series)
    {
     this.viewSeries(r.series_list[i]);
     return;
    };
   };
  };
  return;
 };
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(this.project.project_series_list[i].series==series)
  {
   this.viewProjectSeries(this.project.project_series_list[i]);
   return;
  };
 };
};

integrateApp.prototype.processSample=function(obj)
{
 var k,i,p={},s,ss,n,parm,w;
 for(k in obj)
 {
  if(k.indexOf("__")==0){continue;};
  if(k.indexOf("suppress_")==0){continue;};
  if(obj[k]||(typeof(obj[k])=='number')||(typeof(obj[k])=='boolean'))  // catch 0
  {
   if(Array.isArray(obj[k]))
   {
    try
    {
     if(k.indexOf("_sigma")!=-1){continue;};
     if(typeof(obj[k][0])=="string"){p[k]=obj[k].join(',');continue;};
     if(k.indexOf("_id")!=-1){p[k]=obj[k].join(',');continue;};
     if(typeof(obj[k][0])!="number"){continue;};
     if(obj[k+"_sigma"]&&Array.isArray(obj[k+"_sigma"])) // error weighted mean
     {
      s=0;ss=0;n=0;
      for(i=0;i<obj[k].length;i++)
      {
       w=obj[k+"_sigma"][i];w=1/(w*w);
       s+=obj[k][i]*w;
       ss+=w;
      };
      p[k]=s/ss;
      p[k+"_sigma"]=Math.sqrt(1/ss);
     }
     else
     {
      s=0;ss=0;n=0;
      for(i=0;i<obj[k].length;i++)
      {
       s+=obj[k][i];
       ss+=obj[k][i]*obj[k][i];
       n++;
      };
      p[k]=s/n;
      p[k+"_sigma"]=Math.sqrt((ss-s*s/n)/(n-1));
     };
    }catch(e){};
   }
   else
   {
    p[k]=obj[k];
   };
  };
 };
 return p;
};

integrateApp.prototype.viewSampleDirect=function(obj)
{
 var spec,k,s;
 if(!obj){return;};
 obj=this.processSample(obj);
 spec=new itemSpec("data",obj.sample,"Object");
 for(k in obj)
 {
  if(k=="sample"){continue;};
  s=this.genSpec(spec,k);
  s.popup=false;
 };
 spec.readonly=true;
 app.prompt(obj.sample,obj,spec)
 .then(function(){}).catch(function(){});
};

integrateApp.prototype.viewRecordSample=function(rec,sam)
{
 var obj;
 obj=this.sample_index["record"][rec];
 if(!obj){return;};
 obj=obj["sample"][sam];
 this.viewSampleDirect(obj);
};


integrateApp.prototype.viewSample=function(spec)
{
 var obj;
 if(!this.sample_index){return;};
 if(spec.parent.object.record)
 {
  obj=this.sample_index["record"][spec.parent.object.record];
 }
 else
 {
  if(!this.sample_index || !this.record || !this.record.header){return;};
  obj=this.sample_index["record"][this.record.header.record];
 };
 if(!obj){return;};
 obj=obj["sample"][spec.object];
 this.viewSampleDirect(obj);
};

integrateApp.prototype.criteraMet=function(q,sd)
{
 var i,reg,code=false;
 for(i in sd)
 {
  if(!code){code='"use strict";var '}else{code+=",";};
  if(typeof(sd[i])=='number')
  {
   code+=i+"="+sd[i];
  }
  else
  {
   if(sd[i]==null)
   {
    code+=i+"=null";
   }
   else
   {
    code+=i+"="+JSON.stringify(sd[i]);
   };
  };
 };
 if(q.where=='error')
 {
  code+="; return false;";
 }
 else
 {
  code+="; return "+q.where+";";
 };
 try
 {
  return Function(code)();
 }
 catch
 {
  return q.where=='error';
 };
};

integrateApp.prototype.replExpr=function(str,pattern,flag,to)
{
 return str.replace(new RegExp("((?:[^\\\\]|^)(?:\\\\{2})*(?:\"[^\"\\\\]*(?:\\\\[^][^\"\\\\]*)*\"|'[^'\\\\]*(?:\\\\[^][^'\\\\]*)*'))|"+pattern,flag),
      function(match, group)
      {
       if(group)
       {
        return group.replace(new RegExp("^("+pattern+")",flag),to);
       };
       return to;
      });
};

integrateApp.prototype.cleanCriteria=function(w)
{
 w=this.replExpr(w,"=+","g","==");
 w=this.replExpr(w,"\\)\\s*","g",") ");
 w=this.replExpr(w,"\\s*\\(","g"," (");
 w=this.replExpr(w,"\\s+and\\s+","gi"," && ");
 w=this.replExpr(w,"\\s+or\\s+","gi"," || ");
 w=this.replExpr(w,"^\\s+|\\s+$","gi","");
 w=this.replExpr(w,">==","g",">=");
 w=this.replExpr(w,"<==","g","<=");
 w=this.replExpr(w,"!==","g","!=");
 w=this.replExpr(w,"search\\s*\\(","g","search(");
 return w;
};


integrateApp.prototype.regExpClean=function(string) 
{
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

integrateApp.prototype.ignoreOnSearch=function(l)
{
 switch(l)
 {
 case "changed": case "deleted": case "created": case "selected":
 case "suppress_t": case "suppress_z": case "__updated":
 case "parameters": case "headers": case "json_application":
 //case "project_series_type":case "series_type": 
 case "parameter_list": case "header_list":
  return true;
 };
 return false;
};

integrateApp.prototype.doSearch=function(mode,q)
{
 return new Promise(async function(resolve,reject){
 var r,rr,s,i,j,k,sd,obj,res=[],parms=[],updates=[],parmIndex={},updateIndex={},dres=[],distinct={},step=0,steps,jtest=false;
 q.mode=mode;
 q.parameter_list=q.parameter_list.replace(/^\s+|\s+$/g,"");
 if(q.parameter_list==''){q.parameter_list='*';};
 q.where=this.cleanCriteria(q.where);
 if(q.where==''){q.where='true';};
 if(q.parameter_list.indexOf('*')!=0){parms=q.parameter_list.split(/\s*,\s*/);};
 if(q.update)
 {
  app.createProgress("Updating "+mode,false,0);
 }
 else
 {
  app.createProgress("Searching "+mode,false,0);
 };
 q.index={"records":{},"series":{},"refs":[]};
 switch(mode)
 {
 case 'Data':
  steps=this.project.records.length+this.project.project_series_list.length;
  for(i in this.project.records)
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   if(!(r=this.project.records[i].file_data)){continue;};
   for(j in r.series_list)
   {
    s=r.series_list[j];
    if(s.data && s.data.length)
    {
     sd={};
     for(l in r.header)
     {
      switch(typeof(r.header[l]))
      {
      case "number":
      case "string":
      case "boolean":
      sd[l]=r.header[l];
      };
     };
     for(l in s)
     {
      switch(typeof(s[l]))
      {
      case "number":
      case "string":
      case "boolean":
       sd[l]=s[l];
      };
     };
     for(k in s.data)
     {
      for(l in s.data[k])
      {
       sd[l]=s.data[k][l];
       if(q.parameter_list=='**'){updateIndex[l]=true;};
      };
      if(q.parameter_list=='**')
      {
       for(l in sd){parmIndex[l]=true;};
       break;
      };
      if(this.criteraMet(q,sd))
      {
       obj={};
       if(q.parameter_list=='*')
       {
        for(l in sd)
        {
         if(this.ignoreOnSearch(l)){continue;};
         obj[l]=sd[l];parmIndex[l]=true;
        };
       }
       else
       {
        for(i in parms){obj[parms[i]]=sd[parms[i]];};
       };
       if(q.update && q.update_function)
       {
        if((s!=this.series)||!jtest)
        {
         jtest=JSON.stringify(s.data);
         if(this.series==s){this.seriesSpec.emptyContainer();};
        };
        q.update_function(s.data[k]);
       }
       else
       {
        if(!q.index.records[r.header.record])
        {
         q.index.records[r.header.record]={"series":{}};
         this.addUnique(q.index.refs,r.refs);
        };
        if(!q.index.records[r.header.record].series[s.series])
        {
         q.index.records[r.header.record].series[s.series]=true;
         this.addUnique(q.index.refs,s.refs);
        };
        res.push(obj);
       };
      };
     };
     if(jtest)
     {
      if(this.series==s){this.seriesSpec.fillContainer();}
      if(jtest!=JSON.stringify(s.data))
      {
       this.onSeriesChange(false,s);
      };
      jtest=false;
     };
    };
   };
  };
  for(j in this.project.project_series_list)
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   if(!this.project.project_series_list[j].file_data){continue;};
   if(this.project.project_series_list[j].series=='Users'){continue;};
   s=this.project.project_series_list[j].file_data;
   if(s.data && s.data.length)
   {
    sd={};
    for(l in s)
    {
     switch(typeof(s[l]))
     {
     case "number":
     case "string":
     case "boolean":
     sd[l]=s[l];
     };
    };
    for(k in s.data)
    {
     for(l in s.data[k])
     {
      sd[l]=s.data[k][l];
      if(q.parameter_list=='**'){updateIndex[l]=true;};
     };
     if(q.parameter_list=='**')
     {
      for(l in sd){parmIndex[l]=true;};
      break;
     };
     if(this.criteraMet(q,sd))
     {
      obj={};
      if(q.parameter_list=='*')
      {
       for(l in sd)
       {
        if(this.ignoreOnSearch(l)){continue;};
        obj[l]=sd[l];parmIndex[l]=true;
       };
      }
      else
      {
       for(l in parms){obj[parms[l]]=sd[parms[l]];};
      };
      if(q.update && q.update_function)
      {
       if(!jtest)
       {
//        this.viewProjectSeries(this.project.project_series_list[j]);
        jtest=JSON.stringify(s.data);
        await app.delay(1);
        if(s==this.projectSeries){this.projectSeriesSpec.emptyContainer();};
       };
       q.update_function(s.data[k]);
      }
      else
      {
       if(!q.index.series[s.series])
       {
        q.index.series[s.series]=true;
        this.addUnique(q.index.refs,s.refs);
       };
       res.push(obj);
      };
     };
    };
    if(jtest)
    {
     if(s==this.projectSeries){this.projectSeriesSpec.fillContainer();};
     if(jtest!=JSON.stringify(s.data))
     {
      this.onProjectSeriesChange(s);
      await app.delay(1);
     };
     jtest=false;
    };
   };
  };
  break;
 case 'Records':
  steps=this.project.records.length;
  for(i in this.project.records)
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   if(!(r=this.project.records[i].file_data)){continue;};
   sd={};
   for(l in r.header)
   {
    switch(typeof(r.header[l]))
    {
    case "number":
    case "string":
    case "boolean":
     sd[l]=r.header[l];
     if(q.parameter_list=='**'){updateIndex[l]=true;};
    };
   };
   if(q.parameter_list=='**')
   {
    for(l in sd){parmIndex[l]=true;};
    break;
   };
   if(this.criteraMet(q,sd))
   {
    obj={};
    if(q.parameter_list=='*')
    {
     for(l in sd)
     {
      if(this.ignoreOnSearch(l)){continue;};
      obj[l]=sd[l];parmIndex[l]=true;
     };
    }
    else
    {
     for(l in parms){obj[parms[l]]=sd[parms[l]];};
    };
    if(q.update && q.update_function)
    {
     jtest=JSON.stringify(r.header);
     await app.delay(1);
     if(this.record.file_data==r){this.recordSpec.emptyContainer();};
     q.update_function(r.header);
     if(this.record.file_data==r){this.recordSpec.fillContainer();};
     if(jtest!=JSON.stringify(r.header))
     {
      this.onRecordChange(true,false,r);
      await app.delay(1);
     };
     jtest=false;
    }
    else
    {
     if(!q.index.records[r.header.record])
     {
      q.index.records[r.header.record]={"series":{},"all":true};
      this.addUnique(q.index.refs,r.refs);
      for(j in r.series_list)
      {
       this.addUnique(q.index.refs,r.series_list[j].refs);
      };
     };
     res.push(obj);
    };
   };
  };
  break;
 case 'Samples':
  if(!this.sample_index){this.indexSamples();};
  for(r in this.sample_index["record"])
  {
   steps++;
  };
  for(r in this.sample_index["record"])
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   for(s in this.sample_index["record"][r].sample)
   {
    sd=this.sample_index["record"][r].sample[s];
    sd=this.processSample(sd);
    if(q.parameter_list=='**')
    {
     for(l in sd){parmIndex[l]=true;};
     break;
    };
    if(this.criteraMet(q,sd))
    {
     obj={};
     if(q.parameter_list=='*')
     {
       for(i in sd){obj[i]=sd[i];parmIndex[i]=true;};
     }
     else
     {
      for(i in parms){obj[parms[i]]=sd[parms[i]];};
     };
     if(obj.record)
     {
      if(!q.index.records[obj.record])
      {
       rr=this.findRecord(obj.record);
       if(rr && rr.file_data)
       {
        rr=rr.file_data;
        q.index.records[rr.header.record]={"series":{},"all":true};
        this.addUnique(q.index.refs,rr.refs);
        for(j in rr.series_list)
        {
         this.addUnique(q.index.refs,rr.series_list[j].refs);
        };
       };
      };
     };
     res.push(obj);
    };
   };
  };
  break;
 case 'Series':
  steps=this.project.records.length+this.project.project_series_list.length;
  for(i in this.project.records)
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   if(!(r=this.project.records[i].file_data)){continue;};
   for(j in r.series_list)
   {
    s=r.series_list[j];
    sd={};
    for(l in r.header)
    {
     switch(typeof(r.header[l]))
     {
     case "number":
     case "string":
     case "boolean":
      sd[l]=r.header[l];
     };
    };
    for(l in s)
    {
     switch(typeof(s[l]))
     {
     case "number":
     case "string":
     case "boolean":
      sd[l]=s[l];
      if(q.parameter_list=='**'){updateIndex[l]=true;};
     };
    };
    if(q.parameter_list=='**')
    {
     for(l in sd){parmIndex[l]=true;};
     break;
    };
    if(this.criteraMet(q,sd))
    {
     obj={};
     if(q.parameter_list=='*')
     {
      for(l in sd)
      {
       if(this.ignoreOnSearch(l)){continue;};
       obj[l]=sd[l];parmIndex[l]=true;
      };
     }
     else
     {
      for(l in parms){obj[parms[l]]=sd[parms[l]];};
     };
     if(q.update && q.update_function)
     {
      if(r!=this.record)
      {
       await app.delay(1);
      };
      jtest=JSON.stringify(s);
      await app.delay(1);
      if(s==this.series){this.seriesSpec.emptyContainer();};
      q.update_function(s);
      if(s==this.series){this.seriesSpec.fillContainer();};
      if(jtest!=JSON.stringify(s))
      {
       this.onSeriesChange(true,s);
      };
      jtest=false;
     }
     else
     {
      if(!q.index.records[r.header.record])
      {
       q.index.records[r.header.record]={"series":{}};
       this.addUnique(q.index.refs,r.refs);
      };
      if(!q.index.records[r.header.record].series[s.series])
      {
       q.index.records[r.header.record].series[s.series]=true;
       this.addUnique(q.index.refs,s.refs);
      };
      res.push(obj);
     };
    };
   };
  };
  for(j in this.project.project_series_list)
  {
   step++;
   app.updateProgress(80*step/steps);
   await app.delay(1);
   if(!this.project.project_series_list[j].file_data){continue;};
   if(this.project.project_series_list[j].series=='Users'){continue;};
   s=this.project.project_series_list[j].file_data;
   sd={};
   for(l in s)
   {
    switch(typeof(s[l]))
    {
    case "number":
    case "string":
    case "boolean":
    sd[l]=s[l];
    };
   };
   if(q.parameter_list=='**')
   {
    for(l in sd){parmIndex[l]=true;};
    break;
   };
   if(this.criteraMet(q,sd))
   {
    obj={};
    if(q.parameter_list=='*')
    {
     for(l in sd)
     {
      if(this.ignoreOnSearch(l)){continue;};
      obj[l]=sd[l];parmIndex[l]=true;
     };
    }
    else
    {
     for(l in parms){obj[parms[l]]=sd[parms[l]];};
    };
    if(q.update && q.update_function)
    {
     jtest=JSON.stringify(s);
     await app.delay(1);
     if(this.projectSeries==s){this.projectSeriesSpec.emptyContainer();};
     q.update_function(s);
     if(this.projectSeries==s){this.projectSeriesSpec.fillContainer();};
     if(jtest!=JSON.stringify(s))
     {
      this.onProjectSeriesChange(true,s);
      await app.delay(1);
     };
     jtest=false;
    }
    else
    {
     if(!q.index.series[s.series])
     {
      q.index.series[s.series]=true;
      this.addUnique(q.index.refs,s.refs);
     };
     res.push(obj);
    };
   };
  };
  break;
 };
 for(l in parmIndex)
 {
  if(this.ignoreOnSearch(l)){continue;};
  parms.push(l);
 };
 for(l in updateIndex)
 {
  if(this.ignoreOnSearch(l)){continue;};
  updates.push(l);
 };
 if(q.distinct)
 {
  distinct={};
  for(i=0;i<res.length;i++)
  {
   s=JSON.stringify(res[i]);
   if(distinct[s]){continue;};
   distinct[s]=true;
   dres.push(res[i]);
  };
 }
 else
 {
  dres=res;
 };
 app.updateProgress(90);
 if(parms.length==1) // reduce to simple arrray
 {
  for(i=0;i<dres.length;i++)
  {
   dres[i]=dres[i][parms[0]];
  };
 };
 app.endProgress();
 if(q.order){dres.sort(this.compareBy.bind(this,q.order.split(/\s*,\s*/)));};
 resolve({"parameter_list":parms,"update_list":updates,"data":dres,"query":q});
 }.bind(this));
};

integrateApp.prototype.searchSamples=async function()
{
 var q=this.searchResults.query;
 this.searchResults=await this.doSearch("Samples",{"parameter_list":"","where":q.where,"order":"record,sample","distinct":true,"search_title":q.search_title});
 this.showSearchResults();
};

integrateApp.prototype.showSearchResults=function()
{
  var spec=new itemSpec("data","Query results","Array");
  spec.transparent=true;
  spec.exchanger="integ.importData('Search')";
  var res=this.searchResults;
  var k,s;
  for(k in res.parameter_list)
  {
   s=this.genSpec(spec,res.parameter_list[k]);
   if(s.type=="TextArea"){s.popup=true;};
  };
  app.clearTool('Search');
  this.searchSpec=spec;
  document.getElementById("searchArea").appendChild(this.searchSpec.createDisplay(res.data));
  this.checkSearchToolMenu();
  if(res.query.search_title)
  {
   app.toolTitle("Search",res.query.search_title);
  }
  else
  {
   app.toolTitle("Search","Search");
  };
  app.showTool('Search');
};

integrateApp.prototype.selectAll=function(sel,ind)
{
 var i,j;
 this.recordsSpec.emptyContainer();
 this.recordSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(ind && !ind.series[this.project.project_series_list[i].series]){continue;};
  this.project.project_series_list[i].selected=sel;
 };
 for(i=0;i<this.project.records.length;i++)
 {
  if(ind && !ind.records[this.project.records[i].record]){continue;};
  this.project.records[i].selected=sel;
  if(this.project.records[i].file_data)
  {
   for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
   {
    if(ind)
    {
     if(!ind.records[this.project.records[i].record].all)
     {
      if(!ind.records[this.project.records[i].record].series[this.project.records[i].file_data.series_list[j].series]){continue;};
     };
    };
    this.project.records[i].file_data.series_list[j].selected=sel;
   };
  };
 };
 this.seriesListSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.touch=function(sel,ind)
{
 var i,j;
 this.recordsSpec.emptyContainer();
 this.recordSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(!sel || this.project.project_series_list[i].selected)
  {
   this.project.project_series_list[i].changed=true;
  };
 };
 for(i=0;i<this.project.records.length;i++)
 {
  if(!sel || this.project.records[i].selected)
  {
   this.project.records[i].changed=true;
  };
 };
 this.seriesListSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.search=async function(mode,update)
{
 var s,ss,r,obj={"mode":mode,"distinct":true},p,pl,pld=[],ul,uld=[],i,title="Search",psrch;
 switch(mode)
 {
 case "Repeat":
  if(!this.searchResults){app.alert("No previous search found");return;};
  obj=this.searchResults.query;
  obj.search_title=false;
  mode=obj.mode;
  if(mode=="MRDB"){this.MRDBSearch();return;};
  update=obj.update;
  break;
 case "Select":
  if(!this.searchResults){app.alert("No previous search found");return;};
  this.selectAll(true,this.searchResults.query.index);
  return;
 case "SelectPlot":
  if(!this.pl || !this.pl.index){app.alert("No plot search found");return;};
  this.selectAll(true,this.pl.index);
  return;
 case "References":
  if(!this.searchResults){app.alert("No previous search found");return;};
  this.showRefs(this.searchResults.query.index.refs);
  return;
 };
 if(update){title="Update";};
 if(mode=='Samples')
 {
  this.indexSamples();
 };
 psrch=await this.doSearch(mode,{"parameter_list":"**","where":""});
 pl=psrch.parameter_list;
 ul=psrch.update_list;
 for(i=0;i<pl.length;i++)
 {
  p=this.findParameter(pl[i]);
  if(p)
  {
   pld[i]=p.label+" ("+p.parameter+")";
  }
  else
  {
   pld[i]=pl[i];
  };
 };
 for(i=0;i<ul.length;i++)
 {
  p=this.findParameter(ul[i]);
  if(p)
  {
   uld[i]=p.label+" ("+p.parameter+")";
  }
  else
  {
   uld[i]=ul[i];
  };
 };
 var spec=new itemSpec("data",title+" "+mode,"Object");
 if(mode!='Records'  & !update)
 {
  s=spec.appendChild("parameter_list","Parameters","Text");
  s.width=40;
  s=spec.appendChild("parameter_add","+","Button");
  s.readonly=true;
  s.special=function(sp){
   sp.container.className="objAdd";
   sp.container.appendChild(itemSpec.prototype.control('adder'));
   sp.container.appendChild(document.createTextNode(" Add search parameters"));
   sp.container.onclick=function(s)
   {
    app.menu("Parameter|"+pld.join("|"),{"resolve":function(v){
     s.parent.emptyContainer();
     if(s.parent.object.parameter_list){s.parent.object.parameter_list+=",";};
     s.parent.object.parameter_list+=pl[v-1];
     s.parent.fillContainer();
    },"reject":function(){},"multiple":true,"id":"search"});
   }.bind(this,sp);
  }.bind(this);
 }
 else
 {
  obj.parameter_list='';
  if(mode=='Records')
  {
   obj.parameter_list=this.mergeLists(this.itemList("Records"),['color']).join(",");
  };
  obj.distinct=false;
 };
 s=spec.appendChild("where","Query","Text");
 s.width=40;
 s.hint="Javascript condition";
 
 obj.where_add=0;
 s=spec.appendChild("where_add","+","Button");
 s.readonly=true;
 s.special=function(sp){
   sp.container.className="objAdd";
   sp.container.appendChild(itemSpec.prototype.control('adder'));
   sp.container.appendChild(document.createTextNode(" Meet "))
   sp.container.appendChild(function(ss){
    var op,sel=document.createElement('select'),vals=["all","any"];
    for(i=0;i<2;i++)
    {
     op=document.createElement('option');
     op.text=op.value=vals[i];
     sel.appendChild(op);
    };
    sel.selectedIndex=ss.object;
    sel.onchange=function(){ss.object=sel.selectedIndex;};
    sel.style.width="auto";
    return sel;
   }(sp));
   sp.container.appendChild(document.createTextNode(" new criteria"));
   sp.container.onclick=function(s)
   {
    app.menu("Criterion on|"+pld.join("|"),{"resolve":function(v){
     var spc,ss,p=integ.findParameter(pl[v-1]);
     if(!p){return false;};
     spc=new itemSpec("data","","Object");
     spc.noheader=true;
     ss=spc.appendChild("condition","condition","Text");
     switch(p.type)
     {
     case "Boolean":
      ss.options=['true','false','null','not null'];
      break;
     case "Text":
      ss.options=['=','!=','>','<','>=','<=','true','false','null','not null','contains','starts with'];
      ss=spc.appendChild("value","string",p.type);
      break;
     case "Number":
      ss.options=['=','!=','>','<','>=','<=','true','false','null','not null'];
      ss=spc.appendChild("value","value",p.type);
      break;
     };
     app.prompt(pld[v-1],{},spc).then(function(res){
      if(!res){return;};
      s.parent.emptyContainer();
      if(s.parent.object.where=='error'){s.parent.object.where='';};
      if(s.parent.object.where=='true'){s.parent.object.where='';};
      if(s.parent.object.where)
      {
       switch(s.parent.object.where_add)
       {
       case 0:
        s.parent.object.where+=' && ';
        break;
       case 1:
        s.parent.object.where+=' || ';
        break;
       };
      };
      switch(res.condition)
      {
      case "":return;
      case "true":
       s.parent.object.where+=pl[v-1];
       break;
      case "false":
       s.parent.object.where+="!"+pl[v-1];
       break;
      case "contains":
       s.parent.object.where+="("+pl[v-1]+".search(/"+integ.regExpClean(res.value)+"/i)>=0)";
       break;
      case "starts with":
       s.parent.object.where+="("+pl[v-1]+".search(/"+integ.regExpClean(res.value)+"/i)==0)";
       break;
      case "null":
       res.condition="==";
      case "not null":
       res.value=null;
       if(res.condition=='not null'){res.condition="!=";};
      case "=":
       if(res.condition=='='){res.condition="==";};
      default:
       s.parent.object.where+="("+pl[v-1]+" "+res.condition+" "+JSON.stringify(res.value)+")";
       break;
      };
      s.parent.fillContainer();
     }).catch(function(){});
    },"reject":function(){},"multiple":true,"id":"search"});
   }.bind(this,sp);
  }.bind(this);
 if(update)
 {
  obj.order='';
  s=spec.appendChild("update","Do function","TextArea");
  s.width=40;
  s=spec.appendChild("parameter_add","+","Button");
  s.readonly=true;
  s.special=function(sp){
   sp.container.className="objAdd";
   sp.container.appendChild(itemSpec.prototype.control('adder'));
   sp.container.appendChild(document.createTextNode(" Add parameters"));
   sp.container.onclick=function(s)
   {
    app.menu("Parameter|"+uld.join("|"),{"resolve":function(v){
     s.parent.emptyContainer();
     s.parent.object.update+=ul[v-1]+' ';
     s.parent.fillContainer();
    },"reject":function(){},"multiple":true,"id":"search"});
   }.bind(this,sp);
  }.bind(this);
 }
 else
 {
  s=spec.appendChild("parameter_error","+","Button");
  s.readonly=true;
  s.special=function(sp){
   sp.container.style.color='darkRed';
   sp.container.appendChild(itemSpec.prototype.control('search'));
   sp.container.appendChild(document.createTextNode(" Find errors"));
   sp.container.onclick=function(s)
   {
    s.parent.emptyContainer();
    s.parent.object.where='error';
    s.parent.fillContainer();
   }.bind(this,sp);
  }.bind(this);
  s=spec.appendChild("order","Order by","Text");
  s.width=40;
  s=spec.appendChild("order_add","+","Button");
  s.readonly=true;
  s.special=function(sp){
    sp.container.className="objAdd";
    sp.container.appendChild(itemSpec.prototype.control('adder'));
    sp.container.appendChild(document.createTextNode(" Add sort parameters"));
    sp.container.onclick=function(s)
    {
     app.menu("Order by|"+pld.join("|"),{"resolve":function(v){
      s.parent.emptyContainer();
      if(s.parent.object.order){s.parent.object.order+=",";};
      s.parent.object.order+=pl[v-1];
      s.parent.fillContainer();
     },"reject":function(){},"multiple":true,"id":"search"});
    }.bind(this,sp);
   }.bind(this);
  s=spec.appendChild("distinct","Distinct","Boolean");
  s.width=40;
 };
 app.prompt(title,obj,spec).then(async function(obj){
  if(obj.update)
  {
   for(i=0;i<ul.length;i++)
   {
    obj.update=obj.update.replace(new RegExp("\\b"+ul[i].replace(/\_/g,"\\_")+"\\b","g"),"upd_o."+ul[i]);
   };
   try
   {
    obj.update_function=new Function("upd_o",obj.update+";");
   }
   catch(e){app.alert(e);};
  };
  this.searchResults=await this.doSearch(mode,obj);
  if(!obj.update)
  {
   this.showSearchResults();
  };
 }.bind(this)).catch(function(e){app.alert(e)});
};

integrateApp.prototype.checkProxyPlot=function(parameter)
{
 var i,obj;
 for(i=0;i<this.pl.multiPlots.plots.length;i++)
 {
  if(this.pl.multiPlots.plots[i].y_calc==parameter){return;};
  if(this.pl.multiPlots.plots[i].y_calc.indexOf("("+parameter+")")!=-1){return;};
  if(this.pl.multiPlots.plots[i].y_calc+"_sigma"==parameter)
  {
   this.pl.multiPlots.plots[i].dy_calc=parameter;
   if(i==0)
   {
    this.pl.plotInfo.dy_calc=parameter;
   };
   return;
  };
 };
 obj={row:this.pl.multiPlots.plots.length/2,
    column:0,
    x_calc:this.pl.plotInfo.x_calc,
 	dx_calc:this.pl.plotInfo.dx_calc,
 	xlabel:this.pl.plotInfo.xlabel,
 	autox:this.pl.plotInfo.autox,
 	minx:this.pl.plotInfo.minx,
 	maxx:this.pl.plotInfo.maxx,
 	autoy:1,
 	y_calc:parameter,
 	hideRectangle:true,
 	yright:i%2,
 	ylabel:this.parameterLabel(parameter),
 	selected:true};
 if(this.parameterIndex[parameter])
 {
  if(this.parameterIndex[parameter].invert)
  {
   obj.autoy=2;
  };
 };
 switch(parameter)
 {
 case "events":
   obj.dy_calc="events_sigma";
 case "tephra":
   obj.ylabel="noaxis";
   obj.miny=0;
   obj.maxy=1.0;
   obj.autoy=0;
   obj.rowspan=0.5;
   obj.row+=0.5;
   obj.hideRectangle=false;
   break;
 case "sed":
   obj.y_calc=this.project.options.z_units+"(sed)";
   break;
 };
 if(this.pl.multiPlots.plots.length==0)
 {
  this.pl.plotInfo.y_calc=parameter;
  this.pl.plotInfo.ylabel=this.parameterLabel(parameter);
  this.pl.plotInfo.autoy=obj.autoy;
 };
 this.pl.appendPlot(obj);
 this.pl.multiPlots.keyRow=this.pl.multiPlots.plots.length/2+1;
};

integrateApp.prototype.sortProxies=function(a,b)
{
 switch(a.parameter)
 {
 case 'events':if(b.value=='tephra'){return 0;}else{return 1;};
 case 'tephra':if(b.value=='events'){return 0;}else{return 1;};
 };
 switch(b.parameter)
 {
 case 'events':if(a.value=='tephra'){return 0;}else{return -1;};;
 case 'tephra':if(a.value=='events'){return 0;}else{return -1;};
 };
 return 0;
};

integrateApp.prototype.addProxyPlots=function()
{
 var i,j,p,s,found,control=[],pl=this.proxyList;
 this.projectParametersSpec.emptyContainer();
 this.projectParametersSpec.edit=false;
 for(j=0;j<this.project.parameters.length;j++)
 {
  if(!this.project.parameters[j].type){this.project.parameters[j].type="Number";};
  control[j]={"used":false,"sigma":false};
 };
 for(i=0;i<pl.length;i++)
 {
  s=(pl[i].indexOf("_sigma")!=-1);
  p=pl[i].replace("_sigma","");
  found=false;
  for(j=0;j<this.project.parameters.length;j++)
  {
   if((p==this.project.parameters[j].parameter && (!this.project.parameters[j].record))||
    (p==this.project.parameters[j].record+"P"+
    this.project.parameters[j].parameter))
   {
    if(this.project.parameters[j].selected)
    {
     control[j].used=true;
     if(s){control[j].sigma=true;};
     control[j].parameter=p;
     control[j].invert=this.project.parameters[j].invert;
    };
    found=true;
   };
  };
  if(!found)
  {
   this.project.parameters.push({"parameter":p,"label":p,"record":"","selected":true,"type":"Number","dp":null});
   control.push({"used":true,"sigma":s,"parameter":p,"invert":false});
  };
 };
 control.sort(this.sortProxies);
 for(i=0;i<control.length;i++)
 {
  if(control[i].used)
  {
   this.checkProxyPlot(control[i].parameter);
  };
  if(control[i].sigma)
  {
   this.checkProxyPlot(control[i].parameter+"_sigma");
  };
 };
 this.projectParametersSpec.fillContainer();
};

integrateApp.prototype.addToProxyList=function(p)
{
 this.addUnique(this.proxyList,p);
};

integrateApp.prototype.addRelationshipData=function(series)
{
 var h=360*Math.random();
 this.pl.appendData({"name":series.series+"("+series.source_record+"-"+series.dest_record+")",
  line:"solid",markerColor:"",
  markerFill:this.pl.hsvaToRgba(h,100,100,0.2),lineColor:this.pl.hsvaToRgba(h,100,100,1),
  marker:"",selected:true,
  data:duplItem(series.data)});
 this.plotIndex(false,series);
};

integrateApp.prototype.addProjectSeriesData=function(series)
{
 var i,j,pl,dat;
 var symb=["circle","square","diamond","triangle","cross","x"],sym;
 var col;
 dat=duplItem(series.data);
 switch(series.project_series_type)
 {
 case 'IntCal_Curve_B':
  for(i=0;i<dat.length;i++)
  {
   if(typeof(dat[i].r_date)=="undefined")
   {
    try
    {
     dat[i].r_date=-8033*Math.log(dat[i].F14C);
     dat[i].r_date_sigma=8033*dat[i].F14C_sigma/dat[i].F14C;
    }catch(e){};   
   };
   if(!dat[i].t_sigma){dat[i].t_sigma=0;};
   if(!dat[i].calage_range){dat[i].calage_range=0;};
  };
 case 'IntCal_Curve':
  col=this.intcalTypeCol[series.intcal_set_type];
  if(series.site_type=="Marine"){col=this.intcalTypeCol["Marine"];};
  if(!col){col=this.intcalTypeCol["Int"];};
  if(series.color){col=series.color;};
  this.plotIndex(false,series);
  this.pl.appendData({name:series.series,
   line:"solid",markerColor:"rgba(0,0,0,0)",
   markerFill:this.pl.setTransparency(col,0.3),lineColor:this.pl.setTransparency(col,0.7),
   marker:"",selected:true,noauto:true,
   data:dat},true);
  return;
 };
};

integrateApp.prototype.addSeriesData=function(record,series)
{
 var parameters,i,j,pl,dat;
 var symb=["circle","square","diamond","triangle","cross","x"],sym;
 dat=duplItem(series.data);
 switch(series.series_type)
 {
 case 'IntCal_Data_B':
  for(i=0;i<dat.length;i++)
  {
   if(typeof(dat[i].r_date)=="undefined")
   {
    try
    {
     dat[i].r_date=-8033*Math.log(dat[i].F14C);
     dat[i].r_date_sigma=8033*dat[i].F14C_sigma/dat[i].F14C;
    }catch(e){};   
   };
   if(!dat[i].t_sigma){dat[i].t_sigma=0;};
   if(!dat[i].calage_range){dat[i].calage_range=0;};
  };
 case 'MRDB_Data':
 case 'IntCal_Data':
  sym="circle";
  switch(series.intcal_set_type)
  {
  case "Int":
  case "NewInt":
   sym="circle";break;
  case "SH":
  case "NewSH":
   sym="square";break;
  case "Extra":
   sym="triangle";break;
  case "Compare":
   sym="diamond";break;
  };
  this.plotIndex(record,series);
  if(!this.pl.z_type && record.header.z_type){this.pl.z_type=record.header.z_type;};
  this.pl.appendData({name:(series.series_sample?series.series_sample:record.header.record)+" ("+series.series.replace(/[_]+/g," ")+")",
   line:"",markerColor:record.header.color,
   markerFill:this.pl.setTransparency(record.header.color,0.2),lineColor:record.header.color,
   marker:sym,selected:true,
   data:this.checkDataParameters(record.header.record,dat)},true);
  if(this.pl.plotData.length>1)
  {
   for(i=0;i<this.pl.plotData.length;i++)
   {
    if(!this.pl.plotData[i].marker){continue;};
    this.pl.plotData[i].markerFill=this.pl.hsvaToRgba(300*i/this.pl.plotData.length,100,100,0.4);
   };
  };
  return;
 case 'Dendro_Sample':
  this.plotIndex(record,series);
  if(!this.pl.z_type && record.header.z_type){this.pl.z_type=record.header.z_type;};
  this.pl.appendData({name:record.header.record+" ("+series.series+")",
   line:"solid",markerColor:"",
   markerFill:"",lineColor:record.header.color,
   marker:"",selected:true,noauto:true,
   data:this.checkDataParameters(record.header.record,duplItem(series.data))},true);
  if(this.pl.plotData.length>1)
  {
   for(i=0;i<this.pl.plotData.length;i++)
   {
    if(this.pl.plotData[i].marker){continue;};
    this.pl.plotData[i].lineColor=this.pl.hsvaToRgba(300*i/this.pl.plotData.length,100,100,1);
   };
  };
  return;
 };
 this.plotIndex(record,series);
 this.pl.appendData({name:record.header.record+"("+series.parameter_list+")",
  line:"solid",markerColor:"",
  markerFill:this.pl.setTransparency(record.header.color,0.2),lineColor:record.header.color,
  marker:"",selected:true,
  data:this.checkDataParameters(record.header.record,duplItem(series.data))},true);
 parameters=series.parameter_list.replace(/^\s+|\s+$/g,"").split(/\s*,\s*/);
 for(i=0;i<parameters.length;i++)
 {
  if(!parameters[i]){continue;};
  for(j=0;j<this.project.parameters.length;j++)
  {
   // check for split out parameters
   pl=this.project.parameters[j];
   if((pl.record==record.header.record)&&
   	((pl.parameter==parameters[i])||((pl.parameter)+"_sigma"==parameters[i])))
   {
    parameters[i]=record.header.record+"P"+parameters[i];
   };
  };
  this.addToProxyList(parameters[i]);
 };
};

integrateApp.prototype.plotIndex=function(record,series)
{
 if(!record && series)
 {
  this.pl.index["series"][series.series]=true;
  this.addUnique(this.pl.index.refs,series.refs);
  return;
 };
 if(record)
 {
  if(record.header)
  {
   if(!this.pl.index["records"][record.header.record])
   {
    this.pl.index["records"][record.header.record]={"series":{}};
   };
   if(series)
   {
    this.pl.index["records"][record.header.record]["series"][series.series]=true;
    this.addUnique(this.pl.index.refs,this.seriesRefs(record,series));
   }
   else
   {
    this.addUnique(this.pl.index.refs,this.recordRefs(record));
   };
  }
  else
  {
   if(!this.pl.index["records"][record.record])
   {
    this.pl.index["records"][record.record]={"series":{},"all":true};
   };
  };
 };
};

integrateApp.prototype.setupParameterAxis=function(obj,ax,parm,parm_err)
{
 var p=this.findParameter(parm),ts=false;
 obj[ax+"_calc"]=parm;
 if(parm_err)
 {
  obj["d"+ax+"_calc"]=parm_err;
 }
 else
 {
  obj["d"+ax+"_calc"]="";
 };
 if(p)
 {
  obj[ax+"label"]=p.label;
  obj["auto"+ax]=1;
  if(p.invert){obj["auto"+ax]=2;};
 }
 else
 {
  obj[ax+"label"]=parm;
  obj["auto"+ax]=1;
 };
 if(parm.indexOf("_t")!=-1)
 {
  ts=parm.replace("_t","");
 };
 if(ts || (parm=="t") || (parm=="t_median"))
 {
  obj[ax+"label"]=this.dateLabel();
  if(ts)
  {
   if(ts!="Years")
   {
    obj[ax+"label"]=ts+" "+this.dateLabel();
   };
  };
  obj[ax+"_calc"]="G("+parm+")";
  if(parm_err)
  {
   obj["d"+ax+"_calc"]="G("+parm_err+")";
  };
  obj["auto"+ax]=1;
  switch(this.project.options.t_units)
  {
  case "b2k":
  case "calBP":
  case "BC":
  case "BCE":
   obj["auto"+ax]=2;
  case "AD":
  case "CE":
   obj[ax+"_calc"]=this.project.options.t_units+"("+parm+")";
   break;
  };
  return;
 };
 switch(parm)
 {
 case "z":
  obj[ax+"label"]=this.depthLabel();
  break;
 case "latitude":
  obj["nonlin"+ax]="mercator";
 case "longitude":
  obj[ax+"label"]="";
  break;
 };
};

integrateApp.prototype.setupPlot=function(ts,auto)
{
 this.pl=new plotLink(document.getElementById('plotArea'));
 this.pl.index={"records":{},"series":{},"refs":[]};
 this.pl.plotOptions.plotPosY=1.5;
 this.pl.plotOptions.plotWidth=13.5;
 this.pl.plotOptions.plotHeight=4;
 this.pl.plotOptions.multiPlot=true; 
 this.pl.multiPlots.tiedXAxes=3;
 this.pl.playerMin="",this.pl.playerMax="";
 this.setupParameterAxis(this.pl.plotInfo,"x",ts?ts+"_t":"t",ts?ts+"_dt":"t_sigma");
 this.pl.plotInfo.y_calc="";
 this.pl.plotInfo.dy_calc="";
 this.pl.plotInfo.ylabel="";
 this.pl.plotInfo.title="";
 if(this.project.options.t_from && this.project.options.t_to && !auto)
 {
  this.pl.plotInfo.minx=this.calcT(this.project.options.t_from);
  this.pl.plotInfo.maxx=this.calcT(this.project.options.t_to);
  this.pl.plotInfo.autox=false;
  this.pl.plotOptions.player_min=this.project.options.t_from;
  this.pl.plotOptions.player_max=this.project.options.t_to;
 };
 this.pl.multiPlots.tiedXAxes=3;
 this.pl.multiPlots.showKey=true;
 this.pl.multiPlots.keyRow=0;
 this.pl.multiPlots.keyColumn=0;
 if(this.oxcalLink && this.oxcalLink.oxcal)
 {
  this.pl.plotInfo.minx=this.calcT(this.oxcalLink.oxcal.plotOptions.minx);
  this.pl.plotInfo.maxx=this.calcT(this.oxcalLink.oxcal.plotOptions.maxx);
  this.pl.plotOptions.plotWidth=this.oxcalLink.oxcal.plotOptions.plotWidth;
  this.pl.plotOptions.multiPlot=false; 
  this.pl.plotInfo.autox=false;
 };
};

integrateApp.prototype.location=function()
{
 app.alert("Enter latitude and longitude");
};

integrateApp.prototype.intcalPlotOptions=function(mode)
{
 var spec,s,i,nw=false;
 spec=new itemSpec("data","Options","Object");
 if(mode!='RecordIntCalChoose')
 {
  s=this.genSpec(spec,"t_from");
  s.prompt+=' ('+this.project.options.t_units+')';
  s=this.genSpec(spec,"t_to");
  s.prompt+=' ('+this.project.options.t_units+')';
 };
 if(mode=='ProjectIntCalChoose')
 {
  for(i in this.intcalPO)
  {
   if(i.toLowerCase()!=i)
   {
    if(i.indexOf("New")==0){nw=true;continue;};
    s=spec.appendChild(i,i+" data","Boolean");
   };
  };
  if(nw)
  {
   s=spec.appendChild("New","New data","Boolean");
  };
/*  s=spec.appendChild("Int","IntCal data","Boolean");
  s=spec.appendChild("SH","SHCal data","Boolean");
  s=spec.appendChild("Compare","Comparison data","Boolean");
  s=spec.appendChild("Extra","Extra data","Boolean");
  s=spec.appendChild("Dendrochronological","Dendrochronological","Boolean");
  s=spec.appendChild("Terrestrial","Terrestrial","Boolean");
  s=spec.appendChild("Speleothem","Speleothem","Boolean");
  s=spec.appendChild("Marine","Marine","Boolean");*/
 };
 s=spec.appendChild("plot","Plot","Number");
 s.options=["14C date","Δ14C","F14C"];
 s=spec.appendChild("curves","Curves","Number");
 s.options=["","Underlay","Overlay"];
 return app.prompt("IntCal Plot",this.intcalPO,spec);
};


integrateApp.prototype.getRecordSamples=function(record)
{
 var r,i,j,obj,params={},ar=[];
 if(record=this.record.header.record)
 {
  r=this.record.header;
 }
 else
 {
  if((r=this.findRecord(record))&&(r.file_data))
  {
   r=r.file_data.header;
  }
  else{return false;};
 };
 if(!(this.sample_index && this.sample_index.record[r.record]))
 {
  return false;
 };
 for(i in this.sample_index.record[r.record].sample)
 {
  obj=this.processSample(this.sample_index.record[r.record].sample[i]);
  for(j in r)
  {
   if(obj[j]==r[j]){delete obj[j];};  // ignore record wide data
  };
  delete obj["__updated"];
  if((typeof(obj.x)=='number')&&(typeof(obj.y)=='number')&&(typeof(obj.longitude)!='number')&&(typeof(obj.latitude)!='number'))
  {
   if((typeof(r.longitude)=='number')&&(typeof(r.latitude)=='number'))
   {
    obj.longitude=r.longitude+this.d_x_long(r,obj.x);
    obj.latitude=r.latitude+this.d_y_lat(r,obj.y);
   };
  }
  else
  {
   if((typeof(r.longitude)=='number')&&(typeof(r.latitude)=='number')
    &&(typeof(obj.longitude)=='number')&&(typeof(obj.latitude)=='number'))
   {
    obj.x=this.d_long_x(r,obj.longitude-r.longitude);
    obj.y=this.d_lat_y(r,obj.latitude-r.latitude);
   };
  };
  if((typeof(obj.z)=='number')&&(typeof(obj.elevation)!='number'))
  {
   if(typeof(r.elevation)=='number')  // ie not already set
   {
    switch(r.z_type)
    {
    case "depth":obj.elevation=r.elevation-obj.z;break;
    case "height":obj.elevation=r.elevation+obj.z;break;
    };
   };
  };
  for(j in obj)
  {
   params[j]=true;
  };
  ar.push(obj);
 };
 for(i in ar)
 {
  for(j in params)
  {
   if(typeof(ar[i][j])=='undefined'){ar[i][j]=null;};
  };
 };
 return ar;
};

integrateApp.prototype.showRecordSamples=function()
{
 var i,res;
 var ar=this.getRecordSamples(this.record.header.record);
 if(ar.length==0){app.alert("No samples");return;};
 var res={};
 res.parameter_list=[];
 for(i in ar[0])
 {
  if(i.indexOf("_sigma")!=-1){continue;};
  res.parameter_list.push(i);
  if(typeof(ar[0][i+"_sigma"])!="undefined"){res.parameter_list.push(i+"_sigma");};
 };
 res.data=ar;
 res.query={"mode":"Samples","parameter_list":res.parameter_list.join(","),
  "where":"record='"+this.record.header.record+"'","search_title":"Samples: "+this.record.header.record,
  "index":{"refs":this.recordRefs(this.record)}};
 this.searchResults=res;
 this.showSearchResults();
};

integrateApp.prototype.playerSpec=function()
{
 var spec,s;
 spec=new itemSpec("data","Player options","Object");
 s=spec.appendChild("mint","Min T","Number");
 s.special="integ.showT(this)";
 s.editor={"read":this.readDate.bind(this),"write":this.writeDate.bind(this)};
 s.changer=function(s){if(!s.object){return;};s.parent.emptyContainer();s.parent.object.autot=0;s.parent.fillContainer();};
 s=spec.appendChild("maxt","Max T","Number");
 s.special="integ.showT(this)";
 s.editor={"read":this.readDate.bind(this),"write":this.writeDate.bind(this)};
 s.changer=function(s){if(!s.object){return;};s.parent.emptyContainer();s.parent.object.autot=0;s.parent.fillContainer();};
 s=spec.appendChild("autot","Auto T","Number");
 s.options=["off","forward","backward"];
 s=spec.appendChild("normalise","Normalise","Boolean");
 s=spec.appendChild("circleZoom","Circle zoom","Number");
 return spec;
};

integrateApp.prototype.addMapsAndPlans=function(record)
{
 var rec,r,s,i,j,img,added=0;
 if(record=this.record.header.record)
 {
  rec=this.record;
  r=this.record.header;
 }
 else
 {
  if((r=this.findRecord(record))&&(r.file_data))
  {
   rec=r.file_data;
   r=rec.header;
  }
  else{return false;};
 };
 for(i=0;i<rec.series_list.length;i++)
 {
  s=rec.series_list[i];
  switch(s.series_type)
  {
  case "Maps":case "Plans":
   dt=this.pl.appendData({id:s.series,name,line:"",markerColor:"",
   markerFill:r.color,lineColor:"",
   marker:"image",include_url:false,selected:true});
   dt.data=[];
   for(j=0;j<s.data.length;j++)
   {
    img=duplItem(s.data[j]);
    img["src"]=this.urlPath(s.path+"/"+img.filename);
    delete img["filename"];delete img["updated"];
    delete img["dir"];delete img["filesize"];
    if(s.type=="Maps")
    {
     if((typeof(r.longitude)=="number")&&(typeof(r.latitude)=="number")
    	&&(typeof(img.longitude)=="number")&&(typeof(img.latitude)=="number"))
     {
      img["x"]=this.d_long_x(r,img.longitude-r.longitude);
      img["y"]=this.d_lat_y(r,img.latitude-r.latitude);
      img["x_range"]=this.d_long_x(r,img.longitude_range);
      img["y_range"]=this.d_lat_y(r,img.latitude_range);
     };
    }
    else
    {
     if((typeof(r.longitude)=="number")&&(typeof(r.latitude)=="number")
    	&&(typeof(img.x)=="number")&&(typeof(img.y)=="number"))
     {
      img["longitude"]=r["longitude"]+this.d_x_long(r,img.x);
      img["latitude"]=r["latitude"]+this.d_y_lat(r,img.y);
      img["longitude_range"]=this.d_x_long(r,img.x_range);
      img["latitude_range"]=this.d_y_lat(r,img.y_range);
     };
    };
    dt.data.push(img);added++;
   };
   if(dt.data.length==0){this.pl.data.pop();};
   break;
  };
 };
 return added>0;
};

integrateApp.prototype.addSamplesAndRender=async function(record,x,y,data)
{
   var pl=this.pl,r,dt,obj,i,ar,vars={},props={},vars_options=[],props_options=[];
   var markers=["circle","square","diamond","triangle","cross","x"];
   var marker_type;
   var spec,s,mem,rec;
   if(record)
   {
    ar=this.getRecordSamples();
   }
   else
   {
    if(data)
    {
     ar=duplItem(data);
    }
    else
    {
     ar=this.searchResults.data;
    };
   };
   if(!ar || (ar.length==0))
   {
    pl.render();
    app.showTool('Plot');
   };
   for(i in ar)
   {
    obj=ar[i];
    if(obj["sample"])
    {
     obj["label"]=obj["sample"];
    };
    for(j in obj)
    {
     switch(typeof(obj[j]))
     {
     case "number":
      vars[j]=true;
      break;
     case "boolean":
      if(!props[j]){props[j]=[true,false];};
      break;
     case "string":
      if(!props[j]){props[j]=[obj[j]];}else{this.addUnique(props[j],obj[j],true);};
      break;
     };
    };
   };
   for(i in props)
   {
    if((props[i].length>ar.length/4)||(props[i].length==1)||(props[i].length>26))
    {
     delete props[i];
    }
    else
    {
     props[i].sort();   
     props_options.push(i);
    };
   };
   for(i in vars)
   {
    if(i.indexOf("_sigma")!=-1){continue;};
    if(i.indexOf("_range")!=-1){continue;};
    if(i.indexOf("__")==0){continue;};
    if(!this.findParameter(i)){continue;};
    vars_options.push(i);
   };
   props_options.sort();
   vars_options.sort();
   if(!this.plotSamps){this.plotSamps={};};
   if(this.plotSamps["x"] && !vars[this.plotSamps["x"]]){delete this.plotSamps["x"];};
   if(this.plotSamps["y"] && !vars[this.plotSamps["y"]]){delete this.plotSamps["y"];};
   if(this.plotSamps["split"] && !props[this.plotSamps["split"]]){delete this.plotSamps["split"];};
   if(this.plotSamps["color"] && !vars[this.plotSamps["color"]]){delete this.plotSamps["color"];};
   if(!this.plotSamps["markers"]){this.plotSamps["markers"]="auto";};
   spec=new itemSpec("plotSamps","Sample plot","Object");
   spec.transparent=true;
   if(x){this.plotSamps["x"]=x;}else
   {
    s=spec.appendChild("x","X axis","Text");
    s.options=vars_options;
   };
   if(x){this.plotSamps["y"]=y;}else
   {
    s=spec.appendChild("y","Y axis","Text");
    s.options=vars_options;
   };
   s=spec.appendChild("split","Split by","Text");
   s.options=props_options;
   s.options.unshift("");
   s=spec.appendChild("markers","Markers","Text");
   s.options=["auto","color","category","symbol","1234...","ABCD...","abcd..."];
   s=spec.appendChild("color","Color by","Text");
   s.options=vars_options;
   s.options.unshift("");
   s=spec.appendChild("player","Player...","Boolean");
   try
   {
    this.plotSamps=await app.prompt("Sample plot",this.plotSamps,spec,{"id":"plot"});
   }
   catch(e){return;};
   if(!x)
   {
    x=this.plotSamps.x;
    pl.plotOptions.plotHeight=13.5;
    this.setupParameterAxis(pl.plotInfo,"x",x,vars[x+"_sigma"]?x+"_sigma":(vars[x+"_range"]?"("+x+"_range/2)":""));
   };
   if(!y)
   {
    y=this.plotSamps.y;
    this.setupParameterAxis(pl.plotInfo,"y",y,vars[y+"_sigma"]?y+"_sigma":(vars[y+"_range"]?"("+y+"_range/2)":""));
   };
   if((x=='t') && (y!='r_date')){pl.plotOptions.plotHeight=5;}
   if(this.plotSamps.player) // give a unique id to each point
   {
    for(i in ar)
    {
     obj=ar[i];
     this.plotID++;
     obj["id"]="PltID_"+this.plotID;
    };
   };
   switch(x+"_"+y)
   {
   case "longitude_latitude":
    pl.plotInfo.mapPlot=true;
   case "x_y":case "y_z":case "x_z":
    if(record && this.addMapsAndPlans(record))
    {
     pl.plotInfo.dx_calc="("+pl.plotInfo.x_calc+"_range/2)";
     pl.plotInfo.dy_calc="("+pl.plotInfo.y_calc+"_range/2)";
     if((y=="z"))
     {
      if(this.record.header.z_type=="depth"){pl.plotInfo.autoy=2;};
      pl.plotInfo.ylabel=this.depthLabel(this.record,this.zUnits(this.record));
      switch(this.zUnits(this.record))
      {
      case "cm":
       pl.plotInfo.y_calc+="*100";
       pl.plotInfo.dy_calc+="*100";
       break;
      case "mm":
       pl.plotInfo.y_calc+="*1000";
       pl.plotInfo.dy_calc+="*1000";
       break;
      };
     };
    };
    break;
   };
   if(this.plotSamps.split)
   {
    marker_type=this.plotSamps.markers;
    pl.plotOptions.showKey=1;
    if(marker_type=='category'){pl.plotOptions.showKey=0;};
    if(marker_type=='auto')
    {
     if(this.plotSamps.color)
     {
      if(props[this.plotSamps.split].length > markers.length)
      {
       marker_type="ABCD...";
      }
      else
      {
       marker_type='symbol';
      };
     }
     else
     {
      marker_type='color';
     };
    };
    if((marker_type=='symbol')&&(props[this.plotSamps.split].length > markers.length))
    {
     marker_type="ABCD...";
    };
    if((marker_type=='color')&&(this.plotSamps.color))
    {
     marker_type="ABCD...";
    };
    for(j=0;j<props[this.plotSamps.split].length;j++)
    {
     dt=pl.appendData({name:props[this.plotSamps.split][j],line:"",markerColor:"rgb(128,128,128)",
     markerFill:"rgba(128,128,128,0.25)",lineColor:"",include_id:true,
     marker:"circle",include_url:true,selected:true});
     if(typeof(props[this.plotSamps.split][j])=='boolean')
     {
      dt.name=this.plotSamps.split;
      if(!props[this.plotSamps.split][j]){dt.name="~"+dt.name;};
     };
     switch(marker_type)
     {
     case "color":
      dt.markerFill=pl.hsvaToRgba(300*j/props[this.plotSamps.split].length,100,80,0.2);
      dt.markerColor=pl.hsvaToRgba(300*j/props[this.plotSamps.split].length,100,80,1);
      break;
     case "category":
      dt.marker=props[this.plotSamps.split][j];
      break;
     case "symbol":
      dt.marker=markers[j];
      break;
     case "1234...":
      dt.marker=(j+1).toString();
      break;
     case "ABCD...":
     case "abcd...":
      dt.marker=String.fromCharCode(j+(marker_type).charCodeAt(0));
      break;
     };
     if(!this.plotSamps.color)
     {
      dt.markerFill=pl.hsvaToRgba(300*j/props[this.plotSamps.split].length,100,80,0.2);
      dt.markerColor=pl.hsvaToRgba(300*j/props[this.plotSamps.split].length,100,80,1);
     };
     dt.data=[];
     for(i in ar)
     {
      obj=ar[i];
      if(obj['record']){rec=obj['record'];}else{rec=record;};
      if((typeof(obj[x])=='number')&&(typeof(obj[y])=='number')&&(obj[this.plotSamps.split]==props[this.plotSamps.split][j]))
      {
       if(rec)
       {
        obj.url="javascript:window.parent.parent.integ.viewRecordSample('"+rec+"','"+obj.sample+"')";
        dt.include_url=true;
       };
       dt.data.push(obj);
      };
     };
     if(dt.data.length==0){pl.plotData.pop();};
    };
   }
   else
   {
    pl.plotOptions.showKey=0;
    dt=pl.appendData({name:"Samples",line:"",markerColor:"rgb(255,0,0)",
    markerFill:"rgba(255,0,0,0.25)",lineColor:"",
    marker:"circle",include_url:true,selected:true,include_id:true});
    dt.data=[];
    for(i in ar)
    {
     obj=ar[i];
     if(obj['record']){rec=obj['record'];}else{rec=record;};
     if((typeof(obj[x])=='number')&&(typeof(obj[y])=='number'))
     {
      if(rec)
      {
       obj.url="javascript:window.parent.parent.integ.viewRecordSample('"+rec+"','"+obj.sample+"')";
       dt.include_url=true;
      };
      dt.data.push(obj);
     };
    };
    if(dt.data.length==0){pl.plotData.pop();};
   };
   if(this.plotSamps.color)
   {
    this.setupParameterAxis(pl.plotColor,"z",this.plotSamps.color,vars[this.plotSamps.color+"_sigma"]?this.plotSamps.color+"_sigma":"");
    pl.plotColor.showKey=1;
   };
   pl.plotPlayer.showPlayer=false;
   if(this.plotSamps.player)
   {
    pl.plotPlayer.mint=null;
    pl.plotPlayer.maxt=null;
    pl.plotPlayer.autot=1;
    pl.plotPlayer.t_units=this.project.options.t_units;
    try
    {
     pl.plotPlayer=await app.prompt("Player",pl.plotPlayer,this.playerSpec(),{"id":"Player"});
     if(pl.plotPlayer.autot){pl.plotPlayer.mint=null;plotPlayer.maxt=null;};
    }catch(e){return;};
    pl.plotPlayer.showPlayer=true;
    pl.plotInfo.weight="playerWeight(id)";
   };
   pl.render();
   app.showTool('Plot');
};

integrateApp.prototype.plot=function(mode,context)
{
 var dt,i,j,k,r,s,img,st,opt,men,opts=[false],obj,obj_json,curveOpt={};
 this.indexLabels();
 this.timescales=[];
 this.proxyList=[];
 function includeCurves()
 {
   for(j=0;j<this.project.project_series_list.length;j++)
   {
    switch(this.project.project_series_list[j].project_series_type)
    {
    case 'IntCal_Curve':
    case 'IntCal_Curve_B':
     break;
    default:
     continue;
    };    if(!curveOpt[this.project.project_series_list[j].file_data.intcal_set_type]){continue;};
    if(!curveOpt[this.project.project_series_list[j].file_data.site_type]){continue;};
    if(!this.project.project_series_list[j].selected){continue;};
    this.addProjectSeriesData(this.project.project_series_list[j].file_data);
   };
 };
 switch(mode)
 {
 case 'Project':
  opt=this.projectTools();
  men="Plot";
  if(opt["PlotProxies"]){men+="|Proxies";opts.push("ProjectProxies");};
  if(opt["IntCal"]){men+="|IntCal";opts.push("ProjectIntCalChoose");};
  if(opt["MRDB"]){men+="|MRDB";opts.push("ProjectMRDBChoose");};
  switch(opts.length)
  {
  case 0:case 1:
   app.alert("Nothing to plot");
   break;
  case 2:
   this.plot(opts[1],context);
   break;
  default:
   app.menu(men,{"id":"Project"})
   .then(function(rpl){
    if(rpl)
    {
     this.plot(opts[rpl],context)
    };
   }.bind(this)).catch(function(e){});
   break;
  };
  return;
 case 'ProjectProxies':
  this.setupPlot();
  this.timescaleSelector.newOptions([]);
  this.pl.mode=mode;
  for(i=0;i<this.project.records.length;i++)
  {
   if(!this.project.records[i].selected){continue;};
   if(!this.project.records[i].file_data){continue;};
   for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
   {
    if(!this.project.records[i].file_data.series_list[j].selected){continue;};
    if(this.project.records[i].file_data.series_list[j].series_type!='Proxies'){continue;};
    this.addSeriesData(this.project.records[i].file_data,
      this.project.records[i].file_data.series_list[j]);
   };
  };
  break;
 case 'ProjectMRDBChoose':
 case 'ProjectIntCalChoose':
 case 'RecordIntCalChoose':
  this.intcalPlotOptions(mode)
  .then(function(opt){
   opt.chosen=true;
   this.intcalPO=opt;
   this.plot(mode.replace("Choose",""));
  }.bind(this)).catch(function(e){app.alert(e)});
  return;
 case 'SeriesIntCalChoose':
  this.intcalPlotOptions(mode)
  .then(function(opt){
   opt.chosen=true;
   this.intcalPO=opt;
   this.plot(mode.replace("Choose","").replace("IntCal",""));
  }.bind(this)).catch(function(e){app.alert(e)});
  return;
 case 'ProjectSeriesIntCalChoose':
  app.menu("Plot|14C date|Δ14C|F14C",{"id":"ProjectSeries"})
  .then(function(rpl){
   this.intcalPO.plot=rpl-1;
   this.intcalPO.chosen=true;
   this.plot(mode.replace("Choose","").replace("IntCal",""));
  }.bind(this)).catch(function(e){app.alert(e)});
  return;
 case 'ProjectMRDB':
 case 'ProjectIntCal':
  if(!this.intcalPO.chosen){this.plot(mode+"Choose");return;};
  this.setupPlot(null,true);
  this.pl.plotInfo.dx_calc="Math.max(G(t_sigma),calage_range/2)";
  this.pl.mode="IntCal";
  if(this.intcalPO.curves)
  {
   for(i in this.intcalPO)
   {
    if(i.toLowerCase()==i){continue;};
    switch(i)
    {
    case "Marine":
     if(this.intcalPO[i]){curveOpt[i]=true;};
    case "Int":case "Compare":case "Extra":
     if(this.intcalPO[i]){curveOpt["Int"]=true;};
     break;
    case "Terrestrial":case "Speleothem":case "Dendrochronological":case "Atmospheric":
     if(this.intcalPO[i]){curveOpt["Terrestrial"]=true;};
     break;
    default:
     if(this.intcalPO[i]){curveOpt[i]=true;};
     break;
    };
   };
   if(this.intcalPO.curves==1){includeCurves.bind(this)();};
  };
  for(i=0;i<this.project.records.length;i++)
  {
   if(!this.project.records[i].selected){continue;};
   if(!this.project.records[i].file_data){continue;};
   if(!this.intcalPO[this.project.records[i].site_type]){continue;};
   for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
   {
    switch(this.project.records[i].file_data.series_list[j].series_type)
    {
    case 'IntCal_Data':
    case 'IntCal_Data_B':
     if(!this.intcalPO[this.project.records[i].file_data.series_list[j].intcal_set_type])
     {
      if(!this.project.records[i].file_data.series_list[j].intcal_set_type)
      {
       app.log("warning","No type for "+this.project.records[i].file_data.series_list[j].series);
      };
      if(this.intcalPO["New"] && this.project.records[i].file_data.series_list[j].intcal_set_type)
      {
       if(!this.intcalPO[this.project.records[i].file_data.series_list[j].intcal_set_type.replace("New","")])
       {
        continue;
       };
      }
      else
      {
       continue;
      };
     };
     break;
    case 'MRDB_Data':break;
    default: continue;
    };
    if(!this.project.records[i].file_data.series_list[j].selected){continue;};
    if(this.intcalPO.t_from && this.intcalPO.t_to)
    {
     if(this.intcalPO.t_from>this.intcalPO.t_to)
     {st=this.intcalPO.t_to;this.intcalPO.t_to=this.intcalPO.t_from;this.intcalPO.t_from=st;};
     for(k=0;k<this.project.records[i].file_data.series_list[j].data.length;k++)
     {
      st=this.project.records[i].file_data.series_list[j].data[k].t;
      if((st>this.intcalPO.t_from)&&(st<this.intcalPO.t_to))
      {
       this.addSeriesData(this.project.records[i].file_data,
        this.project.records[i].file_data.series_list[j]);
       k=this.project.records[i].file_data.series_list[j].data.length;
      };
     };
    }
    else
    {
     this.addSeriesData(this.project.records[i].file_data,
       this.project.records[i].file_data.series_list[j]);
    };
   };
  };
  if(this.intcalPO.curves==2){includeCurves.bind(this)();};
  break;
 case 'Record':
  opt=this.recordTools();
  men="Plot";
  if(opt["PlotProxies"]){men+="|Proxies";opts.push("RecordProxies");};
  if(opt["Dendro"]){men+="|Dendro";opts.push("RecordDendro");};
  if(opt["IntCal"]){men+="|IntCal";opts.push("RecordIntCal");};
  if(opt["AgeRing"]){men+="|AgeRing";opts.push("RecordAgeRing");};
  if(opt["Tephra"]){men+="|Tephra";opts.push("RecordTephra");};
  if(opt["Samples"]){men+="|Samples";opts.push("RecordSamples");};
  if(opt["MRDB"]){men+="|MRDB";opts.push("RecordMRDB");};
  switch(opts.length)
  {
  case 0:case 1:
   app.alert("Nothing to plot");
   break;
  case 2:
   this.plot(opts[1],context);
   return;
  default:
   app.menu(men,{"id":mode})
   .then(function(rpl){
    if(rpl)
    {
     this.plot(opts[rpl],context)
    };
   }.bind(this)).catch(function(e){});
   break;
  };
  return;
 case 'RecordProxies':
  if(!this.pl||(this.pl.mode!=mode)){this.setupPlot();this.timescaleSelector.newOptions([]);};
  this.pl.mode=mode;
  for(j=0;j<this.record.series_list.length;j++)
  {
   if(!this.record.series_list[j].selected){continue;};
   switch(this.record.series_list[j].series_type)
   {
   case 'Proxies':
    break;
   default: continue;
   };
   if(this.record.series_list[j].series_type!='Proxies'){continue;};
   this.addSeriesData(this.record,this.record.series_list[j]);
  };
  break;
 case 'RecordSamples':
  this.setupPlot();
  this.plotIndex(this.record,false);
  this.addSamplesAndRender(this.record.header.record);
  return;
 case 'RecordDendro':
  if(!this.pl||(this.pl.mode!=st)){this.setupPlot();};
  dendro.dendroPlot('Record');
  return;
 case 'RecordMRDB':
 case 'RecordIntCal':
  mode='IntCal';
  if(!this.pl||(this.pl.mode!=mode))
  {
   if(!this.intcalPO.chosen){this.plot("RecordIntCalChoose");return;};
   this.setupPlot(null,true);
   this.pl.plotInfo.dx_calc="Math.max(G(t_sigma),calage_range/2)";
   if(this.intcalPO){this.intcalPO.t_from=null;this.intcalPO.t_to=null;};
  };
  this.pl.mode=mode;
  if(this.intcalPO.curves)
  {
   if(this.record.header.site_type=="Marine")
   {
    curveOpt.Marine=true;curveOpt.Int=true;
   }
   else
   {
    curveOpt.Terrestrial=true;
    if(this.record.header.latitude && this.record.header.latitude<0)
    {
     curveOpt.SH=true;
    }
    else
    {
     curveOpt.Int=true;
    };
   };
   for(j=0;j<this.record.series_list.length;j++)
   {
    if(!this.record.series_list[j].selected){continue;};
    switch(this.record.series_list[j].series_type)
    {
    case 'IntCal_Data':case 'IntCal_Data_B':case 'MRDB_Data':
     if(this.record.series_list[j].intcal_set_type)
     {
      curveOpt[this.record.series_list[j].intcal_set_type]=true;
     };
     break;
    };
   };
   if(this.intcalPO.curves==1){includeCurves.bind(this)();};
  };
  for(j=0;j<this.record.series_list.length;j++)
  {
   if(!this.record.series_list[j].selected){continue;};
   switch(this.record.series_list[j].series_type)
   {
   case 'IntCal_Data':case 'IntCal_Data_B':case 'MRDB_Data':break;
   default:continue;
   };
   this.addSeriesData(this.record,this.record.series_list[j]);
  };
  if(this.intcalPO.curves==2){includeCurves.bind(this)();};
  break;
 case 'RecordAgeRing':
  this.setupPlot(null,true);
  this.pl.plotInfo.dx_calc="Math.max(G(t_sigma),calage_range/2)";
  this.pl.mode=mode;
  this.pl.z_type="rings";
  this.pl.plotOptions.multiPlot=false; 
  this.pl.plotOptions.plotHeight=13.5;
  this.pl.plotInfo.y_calc="z";
  this.pl.plotInfo.dy_calc="(z_range/2)";
  this.pl.plotInfo.ylabel=this.depthLabel();
  for(j=0;j<this.record.series_list.length;j++)
  {
   if(!this.record.series_list[j].selected){continue;};
   switch(this.record.series_list[j].series_type)
   {
   case "IntCal_Data":
   case "IntCal_Data_B":
   case "Dendro_Sample":
    this.addSeriesData(this.record,this.record.series_list[j]);
    break;
   };
  };
  break;
 case 'RecordTephra':
  tephra.tephraMenu('Record');
  return;
 case 'Series':
  if(this.series.series_type){st=this.series.series_type;};
  if((st=='IntCal_Data')||(st=='IntCal_Data_B')){st='IntCal';};
  switch(st)
  {
  case "Tephra_Sample_Majors":
  case "Tephra_Sample_Trace":
  case "Tephra_Samples":
   tephra.tephraMenu("Series");
   return;
  };
  if(!this.pl||(this.pl.mode!=st))
  { 
   this.setupPlot(null,true);
   if(this.intcalPO){this.intcalPO.t_from=null;this.intcalPO.t_to=null;};
  };
  this.pl.mode=st;
  switch(this.pl.mode)
  {
  default:
   this.addSeriesData(this.record,this.series);
   break;
  case 'IntCal':
   if(!this.intcalPO.chosen){this.plot("SeriesIntCalChoose");return;};
   if(this.intcalPO.curves)
   {
    if(this.record.header.site_type=="Marine")
    {
     curveOpt.Marine=true;curveOpt.Int=true;
    }
    else
    {
     curveOpt.Terrestrial=true;
     if(this.record.latitude && this.record.latitude<0)
     {
      curveOpt.SH=true;
     }
     else
     {
      curveOpt.Int=true;
     };
    };
    if(this.series.intcal_set_type)
    {
     curveOpt[this.series.intcal_set_type]=true;
    };
    if(this.intcalPO.curves==1){includeCurves.bind(this)();};
   };
   this.addSeriesData(this.record,this.series);
   if(this.intcalPO.curves==2){includeCurves.bind(this)();};
   break;
  case 'AgeDepth':
   this.addSeriesData(this.record,this.series);
   this.pl.plotOptions.multiPlot=false; 
   this.pl.plotOptions.plotHeight=13.5;
   this.pl.plotInfo.y_calc=this.project.options.z_units+"(z)";
   this.pl.plotInfo.ylabel=this.depthLabel();
   break;
  case 'Relationship':
   this.addRelationshipData(this.series);
   this.pl.plotOptions.multiPlot=false; 
   this.pl.plotOptions.plotHeight=13.5;
   this.pl.plotInfo.y_calc="t_dash-t";
   this.pl.plotInfo.dy_calc="t_sigma";
   this.pl.plotInfo.dx_calc="";
   this.pl.plotInfo.ylabel="Age offset";
   break;
  case 'Dendro_Sample':
   dendro.dendroPlot("Series")
   return;
/*   dendro.data=this.series;
   if((this.projectSeries.project_series_type=='Dendro_Master')&& app.getTool('ProjectSeries').active)
   {
    dendro.master=this.projectSeries;
    dendro.plot('Master|Data');
   }
   else
   {
    dendro.plot('Data');
   };
   return;*/
  };
  break;
 case 'ProjectSeries':
  if(this.projectSeries.project_series_type){st=this.projectSeries.project_series_type;};
  if((st=='IntCal_Curve')||(st=='IntCal_Curve_B')){st='IntCal';};
  if(!this.pl||(this.pl.mode!=st)){this.setupPlot();};
  this.pl.mode=st;
  switch(this.pl.mode)
  {
  case 'Dendro_Master':
   dendro.dendroPlot("ProjectSeries");
   return;
/*   dendro.master=this.projectSeries;
   if((this.series.series_type=='Dendro_Sample')&& app.getTool('Series').active)
   {
    dendro.data=this.series;
    dendro.plot('Master|Data');
   }
   else
   {
    dendro.plot('Master');
   };
   return;*/
  case 'IntCal':
   if(!this.intcalPO.chosen){this.plot("ProjectSeriesIntCalChoose");return;};
   this.addProjectSeriesData(this.projectSeries);
   if(this.pl.plotData.length==1)
   {
    this.pl.plotData[0].noauto=false;
   };
   break;
  default:
   r=this.projectSeries;
   this.plotIndex(r,false);
   this.addSamplesAndRender(false,"","",r.data);
   return;
  };
  break;
 case 'AgeDepth':
  if(!this.pl||(this.pl.mode!=mode)){this.setupPlot();};
  this.pl.mode=mode;
  this.pl.plotOptions.multiPlot=false; 
  this.pl.plotOptions.plotHeight=13.5;
  this.pl.plotInfo.y_calc=this.project.options.z_units+"(z)";
  this.pl.plotInfo.ylabel=this.depthLabel();
  for(j=0;j<this.record.series_list.length;j++)
  {
   if(!this.record.series_list[j].selected){continue;};
   if(this.record.series_list[j].series_type!='AgeDepth'){continue;};
   this.addSeriesData(this.record,this.record.series_list[j]);
  };
  break;
 case 'Search':
  opt=this.searchTools();
  if(this.searchResults.query.mode=="MRDB")
  {
   this.marinePlot("Search");
   return;
  };
  if(this.searchResults.query.mode=="Samples")
  {
   this.setupPlot();
   this.pl.index=this.searchResults.index;
   this.addSamplesAndRender();
   return;
  }
  else
  {
   if(opt["Tephra"])
   {
    tephra.tephraMenu('Search');
   };
  };
  break;
 };
 if(this.pl)
 {
 switch(this.pl.mode)
 {
 case 'IntCal':
  if(this.intcalPO && this.intcalPO.t_from && this.intcalPO.t_to)
  {
   this.pl.plotInfo.minx=this.calcT(this.intcalPO.t_from);
   this.pl.plotInfo.maxx=this.calcT(this.intcalPO.t_to);
   this.pl.plotInfo.autox=false;
  };
  this.pl.plotOptions.multiPlot=false; 
  this.pl.plotOptions.plotHeight=13.5;
  if(this.intcalPO && this.intcalPO.plot)
  {
//	   F=Math.exp(-r/8033);dF=F*dr/8033;
//	   D=(F*Math.exp((1950.5-t)/8267)-1)*1000;dD=(dF*Math.exp((1950.5-t)/8267))*1000;
   switch(this.intcalPO.plot)
   {
   case 1:
    this.pl.plotInfo.y_calc='(Math.exp(-r_date/8033)*Math.exp((1950.5-t)/8267)-1)*1000';
    this.pl.plotInfo.dy_calc='((Math.exp(-r_date/8033)*r_date_sigma/8033)*Math.exp((1950.5-t)/8267))*1000';
    this.pl.plotInfo.ylabel='Δ^{14}C (‰)';
    break;
   case 2:
    this.pl.plotInfo.y_calc='Math.exp(-r_date/8033)';
    this.pl.plotInfo.dy_calc='Math.exp(-r_date/8033)*r_date_sigma/8033';
    this.pl.plotInfo.ylabel='F^{14}C';
    break;
   };
  }
  else
  {
   this.pl.plotInfo.y_calc='r_date';
   this.pl.plotInfo.dy_calc='r_date_sigma';
   this.pl.plotInfo.ylabel='Radiocarbon date';
  };
  break;
 };
 };
 switch(mode)
 {
 default:
  this.addProxyPlots();
  if(!this.pl.optionsSet)
  {
   if(this.project.options.vert){this.pl.reflect();};
   if(this.project.options.reversex){this.pl.reflect('x');};
   if(this.project.options.reversey){this.pl.reflect('y');};
   if(this.project.options.depth){this.project.options.depth=false;this.plotSwapTimeDepth();};
   this.pl.optionsSet=true;
  };
  this.pl.render();
  break;
 case 'Map':
  pl=new plotLink(document.getElementById('plotArea'));
  this.pl=pl;
  this.pl.index={"records":{},"series":{},"refs":[]};
  pl.plotInfo.x_calc="longitude";
  pl.plotInfo.y_calc="latitude";
  pl.plotInfo.dx_calc="longitude_range/2";
  pl.plotInfo.dy_calc="latitude_range/2";
  pl.plotInfo.nonliny="mercator";
  pl.plotInfo.mapPlot=true;
  pl.plotOptions.showKey=0;
  switch(context)
  {
  case "Record":
   r=this.record.header;
   this.plotIndex(this.record,false);
   dt=pl.appendData({id:"r.site?r.site:r.record",name:"",line:"",markerColor:r.color,
   markerFill:r.color,lineColor:"",
   marker:"cross",include_url:false,selected:true});
   dt.data=[];
   if(r.longitude || r.latitude)
   {
    dt.data.push({"longitude":r.longitude,
      "latitude":r.latitude,
      "label":r.site?r.site:r.record});
   }
   else
   {
    app.alert("No location");
    return;
   };
   this.addSamplesAndRender(this.record.header.record,"longitude","latitude");
   return;
  case "ProjectSeries":
   this.plotIndex(false,this.projectSeries);
/*   dt=pl.appendData({id:"",name:"",line:"",markerColor:"rgba(255,0,0,1)",
   markerFill:"rgba(255,0,0,0.2)",lineColor:"",
   marker:"circle",include_url:false,selected:true});
   dt.data=[];*/
   this.addSamplesAndRender(false,"longitude","latitude",this.projectSeries.data);
   return;
  case "Search":
   pl.index=this.searchResults.index;
   if(this.searchResults.query.mode=="Samples")
   {
    this.addSamplesAndRender(false,"longitude","latitude");
    return;
   };
   pl.duplCheck={};
   dt=pl.appendData({name:"Sites",line:"",markerColor:"rgb(255,0,0)",
   markerFill:"rgba(255,0,0,0.25)",lineColor:"",
   marker:"circle",include_url:false,selected:true,include_color:false});
   dt.data=[];
   r=this.searchResults.data;
   for(i=0;i<r.length;i++)
   {
    if(r[i].longitude && r[i].latitude)
    {
     obj={"longitude":r[i].longitude,"latitude":r[i].latitude};
     if(r[i].elevation){obj.elevation=r[i].elevation;};
     obj.title=r[i].site?r[i].site:r[i].record;
     obj.label=r[i].site?r[i].site:r[i].record;
     if(r[i].color)
     {
      obj.color=r[i].color;dt.include_color=true;
     }
     else
     {
      if(r[i].site_type && this.site_type_colors[r[i].site_type])
      {
       obj.color=this.site_type_colors[r[i].site_type];dt.include_color=true;
      };
     };
     if(r[i].record)
     {
      obj.url="javascript:window.parent.parent.integ.linkRecord('"+r[i].record+"')";
      dt.include_url=true;
     };
     obj_json=JSON.stringify(obj);
     if(!pl.duplCheck[obj_json])
     {
      pl.duplCheck[obj_json]=true;
      dt.data.push(obj);
     };
    };
   };
   break;
  default:
   dt=pl.appendData({name:"Sites",line:"",markerColor:"rgb(255,0,0)",
   markerFill:"rgba(255,0,0,0.25)",lineColor:"",
   marker:"circle",include_url:true,selected:true,include_color:true});
   dt.data=[];
   r=this.project.records;
   for(i=0;i<r.length;i++)
   {
    if(r[i].longitude && r[i].latitude && r[i].selected)
    {
     if(r[i].file_data)
     {   
      this.plotIndex(r[i].file_data);
     }
     else
     {
      this.plotIndex(r[i]);
     };
     dt.data.push({"longitude":r[i].longitude,
      "latitude":r[i].latitude,"elevation":r[i].elevation,
      "title":r[i].site?r[i].site:r[i].record,
      "label":r[i].site?r[i].site:r[i].record,
      "color":r[i].color,
      "url":"javascript:window.parent.parent.integ.linkRecord('"+r[i].record+"')"});
    };
   };
   break;
  };
  pl.render();
  break;
 };
 app.showTool('Plot');
};

integrateApp.prototype.plotMap=function()
{
 // link back from plotter
 this.plot("Map","Project");
};


integrateApp.prototype.clearPlot=function()
{
 if(this.pl)
 {
  this.pl.clearPlot();
  this.pl=false;
 }
 else
 {
  new plotLink(document.getElementById('plotArea')).clearPlot(); 
 };
 this.intcalPO.chosen=false;
};

integrateApp.prototype.showTimeUnits=function()
{
 var el,txt="";
 if(this.project.options)
 { 
  txt+=this.project.options.t_units;
  switch(this.project.options.t_units)
  {
  case "G":case "b2k":
   break;
  default:
   if(this.project.options.t_schulman){txt+=" (Sch)";};
   break;
  };
 };
 el=document.getElementById(this.timeUnitLabelId);
 el.removeChild(el.firstChild);
 el.appendChild(document.createTextNode(txt));
};

integrateApp.prototype.setTimeUnits=function(t_units)
{
 if(!t_units){t_units="G";};
 function checkObjSpecific(obj,ax)
 {
  if(obj[ax+"_calc"].indexOf(oldCalc)==0)
  {
   obj[ax+"_calc"]=obj[ax+"_calc"].replace(oldCalc,newCalc);
   if(integ.project.options.timescale && (integ.project.options.timescale!="Years"))
   {
    obj[ax+"label"]=integ.project.options.timescale+" "+integ.dateLabel();
   }
   else
   {
    obj[ax+"label"]=integ.dateLabel();
   };
   obj["min"+ax]=(obj["min"+ax]-a0)*(b1-b0)/(a1-a0)+b0;
   obj["max"+ax]=(obj["max"+ax]-a0)*(b1-b0)/(a1-a0)+b0;
   if((b1-b0)*(a1-a0)<0)
   {
    switch(obj["auto"+ax])
    {
    case 1:obj["auto"+ax]=2;break;
    case 2:obj["auto"+ax]=1;break;
    };
   };
  };
 };
 function checkObj(obj)
 {
  checkObjSpecific(obj,"x");checkObjSpecific(obj,"y");
 };
 var oldCalc=this.project.options.t_units;
 var newCalc=t_units;
 var a0,a1,b0,b1;
 if(oldCalc=="±CE"){oldCalc="G";};
 if((newCalc=="±CE")||(newCalc=="")){newCalc="G";}; 
 oldCalc+="(";newCalc+="(";
 this.projectOptionsSpec.emptyContainer();
 a0=this.calcT(0);a1=this.calcT(1);
 this.project.options.t_units=t_units;
 b0=this.calcT(0);b1=this.calcT(1);
 this.projectOptionsSpec.fillContainer();
 this.reloadAll();
 if(this.pl)
 {
  checkObj(this.pl.plotInfo);
  for(i=0;i<this.pl.multiPlots.plots.length;i++)
  {
   checkObj(this.pl.multiPlots.plots[i]);
  };
  this.pl.render();
 };
};

integrateApp.prototype.setSchulman=function(value)
{
 this.projectOptionsSpec.emptyContainer();
 this.project.options.t_schulman=value;
 this.projectOptionsSpec.fillContainer();
 this.reloadAll();
};

integrateApp.prototype.timeUnitsPanel=function()
{
 app.menu("Time units|±CE|calBP|b2k\nAD|BC\nCE|BCE\n\nSchulman:|On|Off",{"id":"TimeUnits","resolve":function(rpl){
  switch(rpl)
  {
  case 1:this.setTimeUnits("");break;
  case 2:this.setTimeUnits("calBP");break;
  case 3:this.setTimeUnits("b2k");break;
  case 4:this.setTimeUnits("AD");break;
  case 5:this.setTimeUnits("BC");break;
  case 6:this.setTimeUnits("CE");break;
  case 7:this.setTimeUnits("BCE");break;
  case 10:this.setSchulman(true);break;
  case 11:this.setSchulman(false);break;
  };
 }.bind(this),"reject":function(){},"multiple":true});
};

integrateApp.prototype.setUnits=function(units)
{
 function checkObjSpecific(obj,ax)
 {
  if(obj[ax+"_calc"].indexOf(oldCalc)==0)
  {
   try{obj[ax+"_calc"]=obj[ax+"_calc"].replace(oldCalc,newCalc);}catch(e){};
   try{obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace(oldCalc,newCalc);}catch(e){};
   try
   {
    if(obj[ax+"label"].indexOf("Depth")!=-1)
    {
     if(obj[ax+"label"].indexOf("Depth")!=0)
     {
      obj[ax+"label"]=integ.project.options.timescale+" ";
     }
     else
     {
      obj[ax+"label"]="";
     };
     obj[ax+"label"]+=integ.depthLabel();
    };
   }catch(e){};
   try{obj["auto"+ax]=2;}catch(e){};
  };
 };
 function checkObj(obj)
 {
  checkObjSpecific(obj,"x");checkObjSpecific(obj,"y");
 };
 var oldCalc=this.project.options.z_units;
 var newCalc=units;
 var a0,a1,b0,b1;
 oldCalc+="(";newCalc+="(";
 this.projectOptionsSpec.emptyContainer();
 this.project.options.z_units=units;
 this.projectOptionsSpec.fillContainer();
 this.reloadAll();
 if(this.pl)
 {
  checkObj(this.pl.plotInfo);
  for(i=0;i<this.pl.multiPlots.plots.length;i++)
  {
   checkObj(this.pl.multiPlots.plots[i]);
  };
  this.pl.render();
 };
};

integrateApp.prototype.setDepthStyle=function(style)
{
 this.projectOptionsSpec.emptyContainer();
 this.project.options.z_style=style;
 this.projectOptionsSpec.fillContainer();
 this.reloadAll();
};

integrateApp.prototype.plotSwapTimeDepth=function()
{
 function checkObjSpecific(obj,ax)
 {
  if((obj[ax+"_calc"].indexOf(oldCalc)==0)&&(obj[ax+"_calc"].indexOf("(sed)")==-1))
  {
   try{obj[ax+"_calc"]=obj[ax+"_calc"].replace(oldCalc,newCalc);}catch(e){};
   if(integ.project.options.depth)
   {
    try{obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace("G(",newCalc);}catch(e){};
   }
   else
   {
    try{obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace(oldCalc,"G(");}catch(e){};
   };
   if(integ.timescales.length)
   {
    try{obj[ax+"_calc"]=obj[ax+"_calc"].replace("_"+oldvar,"_"+newvar);}catch(e){};
    try{obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace("_d"+oldvar,"_d"+newvar);}catch(e){};
    try{obj[ax+"label"]=integ.project.options.timescale+" "+integ.labelLabel();}catch(e){};
   }
   else
   {
    try{obj[ax+"_calc"]=obj[ax+"_calc"].replace(oldvar,newvar);}catch(e){};
    try{obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace(oldvar+"_sigma",newvar+"_sigma");}catch(e){};
    try{obj[ax+"label"]=integ.labelLabel();}catch(e){};
   };
   switch(newCalc)
   {
   case 'G(':case 'AD(': case 'CE(':  // greater values are younger
    try{if(integ.project.options['reverse'+ax]){obj["auto"+ax]=2;}else{obj["auto"+ax]=1;};}catch(e){};
    break;
   default:
    try{if(integ.project.options['reverse'+ax]){obj["auto"+ax]=1;}else{obj["auto"+ax]=2;};}catch(e){};
    break;
   };
  };
 };
 function checkObj(obj)
 {
  checkObjSpecific(obj,"x");checkObjSpecific(obj,"y");
 };
 var oldCalc,newCalc,oldvar,newvar;
 if(this.timescales.length && this.integData && this.project.options.timescale)
 {
  if(this.project.options.depth)
  {
   if(!this.integData.timeScales[this.project.options.timescale+"_t"])
   {
    app.alert("No available timescale");return;
   };
  }
  else
  {
   if(!this.integData.depthScales[this.project.options.timescale+"_z"])
   {
    app.alert("No available depthscale");return;
   };
  };
  this.setTimescaleOptions(!this.project.options.depth);
 };
 if(this.project.options.depth)
 {
  oldCalc=this.project.options.z_units;
  newCalc=this.project.options.t_units;
  if((newCalc=="±CE")||(newCalc=="")){newCalc="G";}; 
  oldCalc+="(";newCalc+="(";
  oldvar="z";newvar="t";
 }
 else
 {
  newCalc=this.project.options.z_units;
  oldCalc=this.project.options.t_units;
  if(oldCalc=="±CE"||(oldCalc=="")){oldCalc="G";};
  oldCalc+="(";newCalc+="(";
  oldvar="t";newvar="z";
 };
 this.project.options.depth=!this.project.options.depth;
 if(this.pl)
 {
  checkObj(this.pl.plotInfo);
  for(i=0;i<this.pl.multiPlots.plots.length;i++)
  {
   checkObj(this.pl.multiPlots.plots[i]);
  };
  this.pl.render();
 };
};

integrateApp.prototype.plotSwap=function(mode)
{
 var tmp;
 switch(mode)
 {
 case 'Horiz':
  if(!this.project.options.vert){return;};
  this.project.options.vert=false;
  tmp=this.project.options.reversex;
  this.project.options.reversex=this.project.options.reversey;
  this.project.options.reversey=tmp;
  if(this.pl)
  {
   this.pl.reflect();this.pl.render();return;
  };
  break;
 case 'Vert':
  if(this.project.options.vert){return;};
  this.project.options.vert=true;
  tmp=this.project.options.reversex;
  this.project.options.reversex=this.project.options.reversey;
  this.project.options.reversey=tmp;
  if(this.pl)
  {
   this.pl.reflect();this.pl.render();return;
  };
  this.project.options.vert=true;
  break;
 case 'LeftRight':
  this.project.options.reversex=!this.project.options.reversex;
  if(this.pl)
  {
   this.pl.reflect('x');this.pl.render();return;
  };
  break;
 case 'UpDown':
  this.project.options.reversey=!this.project.options.reversey;
  if(this.pl)
  {
   this.pl.reflect('y');this.pl.render();return;
  };
  break;
 };
};

integrateApp.prototype.setTimescaleFromSelect=function(sel)
{
 this.setTimescale(this.timescaleSelector.getValue());
};

integrateApp.prototype.setTimescale=function(ts)
{
 function checkObjSpecific(obj,ax)
 {
  if(obj[ax+"_calc"].indexOf(oldTs+"_")!=-1)
  {
   obj[ax+"_calc"]=obj[ax+"_calc"].replace(oldTs+"_",newTs+"_");
   obj["d"+ax+"_calc"]=obj["d"+ax+"_calc"].replace(oldTs+"_d",newTs+"_d");
   if(newTs && (newTs!="Years"))
   {
    obj[ax+"label"]=newTs+" "+integ.labelLabel();
   }
   else
   {
    obj[ax+"label"]=integ.labelLabel();
   };
  };
 };
 function checkObj(obj)
 {
  checkObjSpecific(obj,"x");checkObjSpecific(obj,"y");
 };
 var oldTs=this.project.options.timescale,newTs=ts;
 this.project.options.timescale=newTs;
 if(this.pl)
 {
  checkObj(this.pl.plotInfo);
  for(i=0;i<this.pl.multiPlots.plots.length;i++)
  {
   checkObj(this.pl.multiPlots.plots[i]);
  };
  this.pl.render();
 };
};

integrateApp.prototype.reloadAll=function()
{
 app.setCookie(app.header.id+"_t_units",this.project.options.t_units);
 this.indexParameters();
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 this.projectOptionsSpec.refillContainer();
 this.recordSpec.emptyContainer();
 this.seriesSpec.emptyContainer();
 this.recordsSpec=this.genRecordsSpec();
 this.seriesListSpec=this.genSeriesListSpec();
 this.recordSpec=this.genRecordSpec();
 this.seriesSpec=this.genSeriesSpec(this.series,true);
 this.projectSeriesSpec=this.genProjectSeriesSpec(this.projectSeries,true);
 app.clearTool('Records');
 app.clearTool('SeriesList');
 app.clearTool('Record');
 app.clearTool('Series');
 app.clearTool('ProjectSeries');
 document.getElementById("recordsArea").appendChild(this.recordsSpec.createDisplay(this.project.records));   
 document.getElementById("seriesListArea").appendChild(this.seriesListSpec.createDisplay(this.project.project_series_list));   
 document.getElementById("recordArea").appendChild(this.recordSpec.createDisplay(this.record));   
 document.getElementById("seriesArea").appendChild(this.seriesSpec.createDisplay(this.series));
 document.getElementById("projectSeriesArea").appendChild(this.projectSeriesSpec.createDisplay(this.projectSeries));
 this.showTimeUnits();
 // this.clearPlot();
};

integrateApp.prototype.calcT=function(t)
{
 t=Number(t);
 switch(integ.project.options.t_units)
 {
 case "b2k": return this.B2K_DATUM-t;
 case "BC": case "BCE": return 1-t;
 case "calBP": return this.CALBP_DATUM-t;
 };
 return t; 
};

integrateApp.prototype.yearBoundary=function(t)
{
 if(t===null){return false;};
 if(isNaN(t)){return false;};
 t=Number(t);
 return (Math.abs(t-Math.floor(t))<0.001); // less than a day
};

integrateApp.prototype.showTString=function(o)
{
 var e,str="",d=Math.floor(o);
 if(this.yearBoundary(o))
 {
  switch(integ.project.options.t_units)
  {
  case "calBP":
  case "AD":
  case "BC":
  case "CE":
  case "BCE":
   if(integ.project.options.t_schulman)
   {
    return this.showTString(d-0.01)+"⊣";
   }
   else
   {
    return this.showTString(d+0.01)+"⊢";
   };
  };
 };
 if((typeof(o)!="number")||(isNaN(o))){return str;};
 switch(integ.project.options.t_units)
 {
 case "b2k":
  str=app.toFixed((this.B2K_DATUM-d),0);
  break;
 case "calBP":
  str=app.toFixed((this.CALBP_DATUM-Number(o)),0);
  break;
 case "AD":
 case "BC":
  if(d>0)
  {
   str="AD "+d;
  }
  else
  {
   str=(1-d)+" BC";
  };
  break;
 case "CE":
 case "BCE":
  if(d>0)
  {
   str=d+" CE";
  }
  else
  {
   str=(1-d)+" BCE";
  };
  break;
 default:
  str=app.toFixed(o,1);
  break;
 };
 return str;
};

integrateApp.prototype.showT=function(spec)
{
 spec.specialTeX=this.showTString(spec.object);
 spec.appendComplexText(spec.container,spec.specialTeX);
};

integrateApp.prototype.showDT=function(spec)
{
 var o=spec.object;
 if((typeof(o)!="number")||(isNaN(o))){return;};
 if(!o){return;};
 switch(integ.project.options.t_units)
 {
 case "b2k":
 case "calBP":
 case "AD":
 case "BC":
 case "CE":
 case "BCE":
  spec.specialTeX=app.toFixed(o,0);
  break;
 default:
  spec.specialTeX=app.toFixed(o,1);
  break;
 };
 e=document.createTextNode(spec.specialTeX);
 spec.container.appendChild(e);
};

integrateApp.prototype.dateLabel=function()
{
 switch(this.project.options.t_units)
 {
 case "b2k":
 case "calBP":
  return 'Age ('+this.project.options.t_units+')';
 case "AD":
 case "BC":
 case "CE":
 case "BCE":
  return 'Date ('+this.project.options.t_units+')';
 default:
  return 'Years';
 };
};

integrateApp.prototype.zUnits=function()
{
 var lu;
 if((lu=this.lUnits()) && (lu!='geo')){return "length";};
 if(this.record && this.record.header && this.record.header.z_units){return this.record.header.z_units;};
 return this.project.options.z_units;
};

integrateApp.prototype.zUnitsDisp=function()
{
 var zu=this.zUnits();
 if(zu=='length'){return this.lUnitsDisp();};
 return ' ('+zu+')';
};


integrateApp.prototype.lUnits=function()
{
 var st;
 if(this.specGenObject)
 {
  if(this.specGenObject.l_units)
  {
   if(this.specGenObject.l_units=="geo"){return null;};
   return this.specGenObject.l_units;
  };
  if(this.specGenObject.series_type){st=this.specGenObject.series_type;};
  if(this.specGenObject.project_series_type){st=this.specGenObject.project_series_type;};
  if(st && (st.indexOf("Dendro")==0)){return "mm";};
 };
 return null;
};

integrateApp.prototype.lUnitsDisp=function()
{
 var lu=this.lUnits();
 switch(lu)
 {
  case null:return "";
  case "um":return " (μm)";
  default:return " ("+lu+")";
 };
};


integrateApp.prototype.zVal=function(z,units)
{
 z=Number(z);
 if(!units){units=this.zUnits();};
 switch(units)
 {
 case "mm": z=z*1000;break;
 case "cm": z=z*100;break;
 };
 return parseFloat(z.toPrecision(10));
};

integrateApp.prototype.zString=function(z,zr,units,style,disp)
{
 var dp=2,str;
 switch(units)
 {
 case "mm":
 case "cm":
  dp=1;
  break;
 case "layers":
 case "rings":
  dp=0;
  break;
 case "m":
  dp=2;
  break;
 };
 if((typeof(z)!="number")||(isNaN(z))){return '';};
 if(!zr){style=false;};
 if(disp && (units!='length'))
 {
  switch(style)
  {
  case "z_from-z_to":
   str=app.toFixed(this.zVal(z-zr/2,units),dp)+"-"+app.toFixed(this.zVal(z+zr/2,units),dp);
   break;
  case "z±dz":
   str=app.toFixed(this.zVal(z,units),dp)+"±"+app.toFixed(this.zVal(zr/2,units),dp);
   break;
  default:
   str=app.toFixed(this.zVal(z,units),dp);
   break;
  };
 }
 else
 {
  switch(style)
  {
  case "z_from-z_to":
   str=this.zVal(z-zr/2,units)+"-"+this.zVal(z+zr/2,units);
   break;
  case "z±dz":
   str=this.zVal(z,units)+"±"+this.zVal(zr/2,units);
   break;
  default:
   str=this.zVal(z,units)+"";
   break;
  };
 };
 return str;
};

integrateApp.prototype.showZ=function(spec)
{
 var e,o=spec.object,z=Number(o),zrop,zr=0;
 if((typeof(o)!="number")||(isNaN(o))){return;};
 if(spec.name=="z")
 {
  switch(this.project.options.z_style)
  {
   case "z_from-z_to":case "z±dz":
    if(spec.parent.object.z_range){zr=Number(spec.parent.object.z_range);};
    break;
  };
 };
 spec.specialTeX=this.zString(z,zr,this.zUnits(),this.project.options.z_style,true);
 e=document.createTextNode(spec.specialTeX);
 spec.container.appendChild(e);
};

integrateApp.prototype.depthLabel=function(record,units)
{
 var t="depth",lu;
 if(!units){units=this.project.options.z_units;};
 if(record)
 {
  if(record.header && record.header.z_type){t=record.header.z_type;};
 }
 else
 {
  t=this.pl.z_type;
 };
 if(this.lUnits())
 {
  t="length";
 };
 switch(t)
 {
 case "rings":
  return 'Ring';
 case "layers":
  return 'Layer';
 case "height":
  return 'Height ('+units+')';
 case "length":
  return 'z'+this.lUnitsDisp();
 default:
  return 'Depth ('+units+')';
 };
};

integrateApp.prototype.labelLabel=function()
{
 if(this.project.options.depth){return this.depthLabel();};
 return this.dateLabel();
};

integrateApp.prototype.writeDate=function(o)
{
 var e,dt='';
 if((typeof(o)!="number")||(isNaN(o))){return '';};
 o=Number(o);
 if(this.yearBoundary(o) && this.project.options.t_schulman)
 {
  switch(this.project.options.t_units)
  {
  case "AD":case "CE":
  case "BCE":case "BC":
  case "calBP":
    o-=0.5;
    break;
  };
 };
 switch(this.project.options.t_units)
 {
 case "b2k": dt=this.B2K_DATUM-o;break;
 case "calBP": dt=this.CALBP_DATUM-o;break;
 case "CE": 
 case "AD": dt=o-0.5;break;
 case "BCE":
 case "BC": dt=1.5-o;break;
 default: dt=o;break;
 };
 return dt;
};

integrateApp.prototype.readDate=function(dt)
{
 if((dt!="")&&(!isNaN(dt)))
 {
  dt=Number(dt);
  switch(this.project.options.t_units)
  {
  case "b2k": dt=this.B2K_DATUM-dt;break;
  case "calBP": dt=this.CALBP_DATUM-dt;break;
  case "CE": 
  case "AD": dt=dt+0.5;break;
  case "BCE":
  case "BC": dt=(1.5-dt);break;
  default:break;
  };
  return dt;
 };
 return null;
};

integrateApp.prototype.writeZ=function(o,spec)
{
 var z=Number(o),zr=0,u=this.zUnits();
 if(spec && spec.zunits){u=spec.zunits;};
 if((typeof(o)!="number")||(isNaN(o))){return '';};
 if(spec && spec.name=="z")
 {
  switch(this.project.options.z_style)
  {
   case "z_from-z_to":case "z±dz":
    if(spec.parent.object.z_range){zr=Number(spec.parent.object.z_range);};
    break;
  };
 };
 return this.zString(z,zr,u,this.project.options.z_style,false);
};

integrateApp.prototype.parseZ=function(dz,obj,sty,units)
{
 var z,r=0;
 if(obj)
 {
  if(dz==''){obj.z=null;obj.z_range=null;return null;};
  switch(sty)
  {
  case "z_from-z_to":
   dz=dz.split('-');
   switch(dz.length)
   {
   case 4: // two negative values
    dz[2]+="-"+dz.pop(); // merge the last one
   case 3: // one negative value at start
    dz.shift();
    dz[0]="-"+dz[0];
   case 2: // either a negative value or a range
    if(dz[0])
    {
     r=Math.abs(Number(dz[1])-Number(dz[0]));
     dz[0]=(Number(dz[1])+Number(dz[0]))/2;
     dz.pop();
    }
    else
    {
     dz[0]=-Number(dz[1]);
    };
   case 1: // only one positive value
    dz=Number(dz[0]);
    switch(units)
    {
    case "cm": obj.z_range=r/100;obj.z=dz/100;break;
    case "mm": obj.z_range=r/1000;obj.z=dz/1000;break;
    default:obj.z_range=r;obj.z=dz;break;
    };
    break;
   };
   break;
  case "z±dz":
   dz=dz.split('±');
   switch(dz.length)
   {
   case 2: // value and half range
    if(dz[1])
    {
     r=Number(dz[1])*2;
     dz.pop();
    };
   case 1: // only one positive value
    dz=Number(dz[0]);
    switch(units)
    {
    case "cm": obj.z_range=r/100;obj.z=dz/100;break;
    case "mm": obj.z_range=r/1000;obj.z=dz/1000;break;
    default:obj.z_range=r;obj.z=dz;break;
    };
    break;
   };
   break;
  default:
   break;
  };
  obj.z=Number(Number(obj.z).toPrecision(10));
  obj.z_range=Number(Number(obj.z_range).toPrecision(10));
 };
 if(!isNaN(dz))
 {
  z=Number(dz);
  switch(units)
  {
  case "cm": z=dz/100;break;
  case "mm": z=dz/1000;break;
  default:break;
  };
  z=Number(Number(z).toPrecision(10));
  if(obj){obj.z=z;};
  return z;
 };
 return null;
};

integrateApp.prototype.readZ=function(dz,spec)
{
 var z,u=this.zUnits();
 if(spec && spec.zunits){u=spec.zunits;};
 if(spec && spec.name=="z")
 {
  spec.parent.emptyContainer();
  z=this.parseZ(dz,spec.parent.object,this.project.options.z_style,u);
  spec.parent.fillContainer();
  return z;
 };
 return this.parseZ(dz,false,this.project.options.z_style,u);
};

integrateApp.prototype.isNaNoN=function(v)
{
 return (isNaN(v)||(typeof(v)!='number'));
};

integrateApp.prototype.distance=function(a,b)// distance in m between two locations a,b with long lat
{
 function sqr(c){return c*c;};
 var i,phi,beta=[],lambda,P,Q,X,Y,Dlambda,c;
 var f=WGS84.f; //WGS84 flattening
 var R=WGS84.R; //WGS84 equitorial radius
 if(this.isNaNoN(a.latitude)||this.isNaNoN(a.longitude)||this.isNaNoN(b.latitude)||this.isNaNoN(b.longitude)){return null;};
 phi=[a.latitude*Math.PI/180,b.latitude*Math.PI/180];
 lambda=[a.longitude*Math.PI/180,b.longitude*Math.PI/180];
 Dlambda=lambda[1]-lambda[0];
 if((Dlambda==0)&&(phi[0]==phi[1])){return 0;};  // add check for zero
 // use Lambert 1942 https://www.jstor.org/stable/24531873 method to correct for ellipsoid
 // tested against http://edwilliams.org/gccalc.htm using WGS84 referred to by https://www.nhc.noaa.gov/gccalc.shtml
 // 676832.5828791548 vs 676.8327133980346 <1m different
 // 2623304.69739664 vs 2623.3076246548453 ~3m different
 // 128792.24037157361 vs 128.79237741084657 <1m different
 for(i in phi){beta[i]=Math.atan((1-f)*Math.tan(phi[i]));};
 // central angle of sphere using the Vincenty formula https://doi.org/10.1179%2Fsre.1975.23.176.88
 c=Math.atan2(Math.sqrt(sqr(Math.cos(beta[1])*Math.sin(Dlambda))
  +sqr(Math.cos(beta[0])*Math.sin(beta[1])-Math.sin(beta[0])*Math.cos(beta[1])*Math.cos(Dlambda)))
  ,(Math.sin(beta[0])*Math.sin(beta[1])+Math.cos(beta[0])*Math.cos(beta[1])*Math.cos(Dlambda)));
  // now apply Lambert's correction
 P=(beta[0]+beta[1])/2;
 Q=(beta[1]-beta[0])/2;
 X=(c-Math.sin(c))*sqr(Math.sin(P)*Math.cos(Q)/Math.cos(c/2));
 Y=(c+Math.sin(c))*sqr(Math.cos(P)*Math.sin(Q)/Math.sin(c/2));
 // app.alert(JSON.stringify({"phi":phi,"beta":beta,"lambda":lambda,"c":c,"P":P,"Q":Q,"X":X,"Y":Y,"R":R,"f":f}))
 return R*(c-(f/2)*(X+Y));
};
integrateApp.prototype.shift_east=function(a,x)
{
 var i,phi,beta,lambda;
 var f=WGS84.f; //WGS84 flattening
 var R=WGS84.R; //WGS84 equitorial radius
 phi=a.latitude*Math.PI/180;
 beta=Math.atan((1-f)*Math.tan(phi));
 lambda=a.longitude*Math.PI/180;
 return (180/Math.PI)*(lambda+x/(R*Math.cos(beta)));
};
integrateApp.prototype.shift_north=function(a,y)
{
 function sqr(c){return c*c;};
 var i,phi,beta,lambda;
 var f=WGS84.f; //WGS84 flattening
 var R=WGS84.R; //WGS84 equitorial radius
 var incr=5*1000;  //this seems otpimal ~1m  off at 90 degrees north
 if(Math.abs(y)>incr)
 {
  return this.shift_north({"longitude":a["longitude"],"latitude":shift_north(a,y/2)},y/2);
 };
 phi=a.latitude*Math.PI/180;
 beta=Math.atan((1-f)*Math.tan(phi));
 lambda=a.longitude*Math.PI/180;
 return (180/Math.PI)*(Math.atan(Math.tan(beta+y/(R*(1-f)*Math.sqrt(1+(f*(2-f)/(1-f*(2-f)))*sqr(Math.sin(beta)))))/(1-f)));
};
integrateApp.prototype.d_x_long=function(a,dx)
{
 return this.shift_east(a,dx)-a.longitude;
};
integrateApp.prototype.d_y_lat=function(a,dy)
{
 return this.shift_north(a,dy)-a.latitude;
};
integrateApp.prototype.d_long_x=function(a,d_long)
{
 var i,phi,beta,lambda;
 var f=WGS84.f; //WGS84 flattening
 var R=WGS84.R; //WGS84 equitorial radius
 phi=a.latitude*Math.PI/180;
 beta=Math.atan((1-f)*Math.tan(phi));
 lambda=a.longitude*Math.PI/180;
 return (Math.PI/180)*d_long*R*Math.cos(beta);
};
integrateApp.prototype.d_lat_y=function(a,d_lat)
{
 return (d_lat>0?1:-1)*this.distance(a,{"longitude":a["longitude"],"latitude":a["latitude"]+d_lat});
};


integrateApp.prototype.checkDataParameters=function(r,d)
{
 var i,j,pl;
 for(i=0;i<this.project.parameters.length;i++)
 {
  pl=this.project.parameters[i];
  if(pl.record==r)
  {
   for(j=0;j<d.length;j++)
   {
    if(typeof(d[j][pl.parameter])!='undefined')
    {
     d[j][r+"P"+pl.parameter]=d[j][pl.parameter];
     delete d[j][pl.parameter];
    };
    if(typeof(d[j][pl.parameter+"_sigma"])!='undefined')
    {
     d[j][r+"P"+pl.parameter+"_sigma"]=d[j][pl.parameter+"_sigma"];
     delete d[j][pl.parameter+"_sigma"];
    };
   };
  };
 };
 return d;
};

integrateApp.prototype.findProxies=function()
{
 var i,j,e,found,obj,prox;
 var p=new Array();
 for(i=0;i<this.integData.proxies.length;i++)
 {
  if(this.integData.proxies[i].data.length)
  {
   for(e=0;e<this.integData.proxies[i].proxies.length;e++)
   {
    prox=this.integData.proxies[i].proxies[e];
    for(j=0;j<this.project.parameters.length;j++)
    {
     if((this.integData.proxies[i].record==this.project.parameters[j].record)&&
     	(prox.replace("_sigma","")==this.project.parameters[j].parameter))
     {
      prox=this.integData.proxies[i].record+"P"+prox;
      break;
     };
    };
    this.addToProxyList(prox);
   };
  };
 };
};

integrateApp.prototype.plotProxies=function()
{
 var i,obj,hadTephra=false;
 var dt;
 var ts=this.project.options.timescale;
 this.project.options.timescale=ts;
 this.proxyList=[];
 this.findProxies();
 this.indexLabels();
 
 this.setupPlot(ts);
 // mapping section
 this.pl.plotOptions.player_min=-30000;
 this.pl.plotOptions.player_max=-10000;
 this.pl.plotOptions.ts_min=-30000;
 this.pl.plotOptions.ts_max=-10000;
 this.pl.plotOptions.ts_incr=100;
 this.pl.plotOptions.player_proxy=true;
 this.pl.plotOptions.player_proxies=new Array("");
 this.pl.plotOptions.current=0;
 this.pl.plotOptions.backwards=false;
 this.pl.plotOptions.currentMax=100;
 this.pl.plotOptions.probMax="NaN";
 this.pl.plotOptions.mapPlotNormalise=true;
 this.pl.plotOptions.mapPlotCircleZoom=1.0;
 this.pl.plotOptions.mapPlotMultiIncr=200;
 
 if(this.integData.refs){this.pl.index.refs=this.integData.refs;};
 dt=this.pl.appendData({name:"",marker:"circle",markerColor:"rgb(255,0,0)",
 	markerFill:"rgba(255,0,0,0.5)",line:"",lineColor:"rgb(255,0,0)",
 	id:"",include_label:true,include_id:true,selected:true});
 dt.data=this.integData.sites;
 
 for(i=0;i<this.integData.proxies.length;i++)
 {
  if(!this.integData.proxies[i].data.length){continue;};
  obj=new Object;
  if((i==0)||(this.integData.proxies[i].record!=this.integData.proxies[i-1].record))
  {
   obj.name=this.integData.proxies[i].record;
  }
  else
  {
   obj.name="";
  };
  if(this.integData.proxies[i].record_no)
  {
   obj.line="solid";
   obj.markerFill=this.pl.setTransparency(this.integData.proxies[i].record_no,0.2);
   obj.lineColor=this.integData.proxies[i].record_no;
   obj.markerColor="";
   obj.marker="";
  }
  else
  {
   switch(this.integData.proxies[i].record)
   {
   case "Events":
    obj.line="solid";
    obj.lineColor=this.pl.hsvaToRgba(0,0,0,1.0);
    obj.markerColor="";
    obj.markerFill=this.pl.hsvaToRgba(0,0,0,0.1);
    obj.marker="";
    break;
   case "EventLabels":
    obj.line="";
    obj.lineColor="rgba(255,0,0,0.0)";
    obj.markerColor="rgba(0,0,0,0.0)";
    obj.markerFill="rgba(0,0,0,1.0)";
    obj.marker="label";
    obj.name="";
    break;
   case "Warm":
    obj.line="solid";
    obj.lineColor="rgba(255,0,0,0.0)";
    obj.markerColor="";
    obj.markerFill="rgba(255,0,0,0.2)";
    obj.marker="";
    obj.name="";
    break;
   case "Cold":
    obj.line="solid";
    obj.lineColor="rgba(0,0,255,0.0)";
    obj.markerColor="";
    obj.markerFill="rgba(0,0,255,0.2)";
    obj.marker="";
    obj.name="";
    break;
   case "Tephra":
    obj.line="solid";
    obj.lineColor=this.pl.hsvaToRgba(36,100,80,1.0);
    obj.markerColor="";
    obj.markerFill=this.pl.hsvaToRgba(36,100,80,0.1);
    obj.marker="";
    if(hadTephra)
    {
     obj.name="";
    };
    hadTephra=true;
    break;
   case "TephraLabels":
    obj.line="";
    obj.lineColor="rgba(255,0,0,0.0)";
    obj.markerColor="rgba(0,0,0,0.0)";
    obj.markerFill="rgba(0,0,0,1.0)";
    obj.marker="cross";
    obj.include_label=true;
    obj.name="";
    break;
   };
  };
  obj.id=this.integData.proxies[i].record+"_proxy";
  obj.data=this.integData.proxies[i].data;
  this.checkDataParameters(this.integData.proxies[i].record,this.integData.proxies[i].data);
  obj.selected=true;
  this.pl.appendData(obj);
 };
 
 this.addProxyPlots();
 if(!this.oxcalLink)
 {
  this.pl.plotOptions.multiPlot=(this.pl.multiPlots.plots.length > 1);
 };
 if(this.pl.plotData.length>2)
 {
  this.pl.plotOptions.showKey=1;
  this.pl.multiPlots.showKey=true;
 }
 else
 {
  this.pl.plotOptions.showKey=0;
  this.pl.multiPlots.showKey=false;
 };
 this.pl.plotOptions.showKey=(this.pl.multiPlots.plots.length > 1)?1:0;
 if(this.project.options.vert){this.pl.reflect();};
 if(this.project.options.reversex){this.pl.reflect('x');};
 if(this.project.options.reversey){this.pl.reflect('y');};
 if(this.project.options.depth){this.project.options.depth=false;this.plotSwapTimeDepth();};
 this.pl.render();
 app.showTool('Plot');
};


// integration

integrateApp.prototype.sortOnTime=function(a,b)
{
 if(a.t>b.t){return 1;};
 if(a.t<b.t){return -1;};
 return 0;
};

integrateApp.prototype.integrate=function()
{
 var i,j,k,cnt=0,obj,refs=[];
 var calc;
 this.proxy_info=[];
 this.proxies=[];
 this.sites=[];
 this.events=[];
 this.periods=[];
 this.tephra=[];
 min_t=this.project.options.t_from;
 max_t=this.project.options.t_to;
 for(i=0;i<this.project.records.length;i++)
 {
  if(!this.project.records[i].selected){continue;};
  if(!this.project.records[i].file_data){continue;};
  for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
  {
   if(!this.project.records[i].file_data.series_list[j].selected){continue;};
   if(this.project.records[i].file_data.series_list[j].series_type!='Proxies'){continue;};
   this.proxy_info[cnt]=duplItem(this.project.records[i].file_data.header);
   this.proxy_info[cnt].record_no=this.project.records[i].color;
   this.proxies[cnt]=duplItem(this.project.records[i].file_data.series_list[j].data);
   cnt++;
   this.sites.push(duplItem(this.project.records[i].file_data.header));
   this.addUnique(refs,this.seriesRefs(this.project.records[i].file_data,
   	this.project.records[i].file_data.series_list[j]));
  };
 };
 this.ageDepth=[];
 for(i=0;i<this.project.records.length;i++)
 {
  if(!this.project.records[i].selected){continue;};
  if(!this.project.records[i].file_data){continue;};
  for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
  {
   if(!this.project.records[i].file_data.series_list[j].selected){continue;};
   if(this.project.records[i].file_data.series_list[j].series_type!='AgeDepth'){continue;};
   for(k=0;k<this.project.records[i].file_data.series_list[j].data.length;k++)
   {
    obj=duplItem(this.project.records[i].file_data.series_list[j].data[k]);
    obj.record=this.project.records[i].file_data.header.record;
    obj.t_source=this.project.records[i].file_data.header.t_source;
    obj.suppress_z=this.project.records[i].file_data.header.suppress_z;
    obj.suppress_t=this.project.records[i].file_data.header.suppress_t;
    this.ageDepth.push(obj);
    this.addUnique(refs,this.seriesRefs(this.project.records[i].file_data,
   	 this.project.records[i].file_data.series_list[j]));
   };
  };
 };
 this.ageAge=[];
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(!this.project.project_series_list[i].selected){continue;};
  if(!this.project.project_series_list[i].file_data){continue;};
  switch(this.project.project_series_list[i].project_series_type)
  {
  case 'Relationship':
   for(j=0;j<this.project.project_series_list[i].file_data.data.length;j++)
   {
    obj=duplItem(this.project.project_series_list[i].file_data.data[j]);
    obj.dest_record=this.project.project_series_list[i].file_data.dest_record;
    obj.source_record=this.project.project_series_list[i].file_data.source_record;
    k=this.ageAge.push(obj);
   };
   this.addUnique(refs,this.project.project_series_list[i].file_data.refs);
   break;
  case 'Events':
  case 'Periods':
   for(j=0;j<this.project.project_series_list[i].file_data.data.length;j++)
   {
    obj=duplItem(this.project.project_series_list[i].file_data.data[j]);
    obj.period=(this.project.project_series_list[i].file_data.project_series_type=='Periods');
    k=this.events.push(obj);
   };
   this.addUnique(refs,this.project.project_series_list[i].file_data.refs);
   break;
/*  case 'Eruptions':
   for(j=0;j<this.project.project_series_list[i].file_data.data.length;j++)
   {
    obj=duplItem(this.project.project_series_list[i].file_data.data[j]);
    k=this.tephra.push(obj);
    this.addUnique(refs,obj.refs);
   };
   break;*/
  };
 };
 if(!tephra.eruptions){tephra.findEruptions();};
 this.tephra=duplItem(tephra.eruptions);
 this.events.sort(this.sortOnTime);
 this.integData=new Integrator();
 this.integData.refs=refs;
 this.integData.importData();
 this.integData.findTimeScales();
 this.integData.integrate();
 if(!this.project.options.timescale){this.project.options.timescale="GICC05";};
 this.setTimescaleOptions(this.project.options.depth);
 this.project.options.timescale=this.timescaleSelector.getValue();
 this.plotProxies();
};

integrateApp.prototype.setTimescaleOptions=function(depth)
{
 this.timescales=[];
 if(depth)
 {
  for(ts in this.integData.depthScales)
  {
   this.timescales.push(ts.replace("_z",""));
  };
 }
 else
 {
  for(ts in this.integData.timeScales)
  {
   this.timescales.push(ts.replace("_t",""));
  };
 };
 this.timescales.sort();
 this.timescaleSelector.newOptions(this.timescales,this.project.options.timescale);
};

// section for age-depth models on individual records

integrateApp.prototype.sortOnDepth=function(a,b)
{
 return (a.z-b.z);
};
integrateApp.prototype.interpDepthModel=function(a,k,i,j)
{
 var g,gdt,t_sigma;
 if(a[i].z==a[j].z){a[k].t=null;a[k].t=null;a[k].changed=true;return;};
 g=(a[i].t-a[j].t)/(a[i].z-a[j].z);
 a[k].t=a[i].t+g*(a[k].z-a[i].z);
 a[k].t_sigma=0.288*g*a[k].z_range;
// if(this.record.header.suppress_t) // find error against master scale
// {
  gdt=(a[i].t_sigma-a[j].t_sigma)/(a[i].z-a[j].z);
  t_sigma=a[i].t_sigma+gdt*(a[k].z-a[i].z);
  a[k].t_sigma=Math.sqrt(t_sigma*t_sigma+a[k].t_sigma*a[k].t_sigma);
// };
 if(k<i)
 {
  t_sigma=this.extrapolation_error*(a[k].t-a[i].t);
  a[k].t_sigma=Math.sqrt(t_sigma*t_sigma+a[k].t_sigma*a[k].t_sigma);
 };
 if(k>j)
 {
  t_sigma=this.extrapolation_error*(a[k].t-a[j].t);
  a[k].t_sigma=Math.sqrt(t_sigma*t_sigma+a[k].t_sigma*a[k].t_sigma);
 };
 a[k].t=Math.round(a[k].t*100)/100;
 a[k].t_sigma=Math.round(Math.abs(a[k].t_sigma)*100)/100;
};
integrateApp.prototype.applyAgeModel=function()
{
 var i,j,k;
 var ad_found=false;
 var a=new Array();
 var dta,agd;
 this.recordSpec.emptyContainer();
 this.seriesSpec.emptyContainer(); // incase editor contains a series being updated
 for(k=0;k<this.record.series_list.length;k++)
 {
  if(!this.record.series_list[k].selected){continue;};
  switch(this.record.series_list[k].series_type)
  {
  case "AgeDepth":
   if(ad_found){app.alert("Only one Age-Depth model can be applied at the same time",{"id":"AgeModel"});continue;};
   ad_found=true;
   agd=this.record.series_list[k].data;
   this.record.header.t_source=this.record.series_list[k].t_source;
   for(i=0;i<agd.length;i++)
   {
    agd[i].age_depth=true;
    a.push(agd[i]);
   };
   break;
  default:
   dta=this.record.series_list[k].data;
   this.record.series_list[k].changed=true;
   for(i=0;i<dta.length;i++)
   {
    delete dta[i].age_depth;
    a.push(dta[i]);
   };
   break;
  };
 };
 a.sort(this.sortOnDepth);
 i=0;
 if(ad_found)
 {
  while((typeof(a[i].age_depth)=='undefined')&&((i+1)<a.length)){i++;};
  j=a.length-1;
  while((typeof(a[j].age_depth)=='undefined')&&(j>0)){j--;};
  for(k=0;k<i;k++)
  {
   this.interpDepthModel(a,k,i,j);
  };
  for(k=j+1;k<a.length;k++)
  {
   this.interpDepthModel(a,k,i,j);
  };
  while((i+1)<a.length)
  {
   j=i+1;
   while((typeof(a[j].age_depth)=='undefined')&&((j+1)<a.length)){j++;};
   for(k=i+1;k<j;k++)
   {
    this.interpDepthModel(a,k,i,j);
   };
   i=j;
  };
 }
 else
 {
  app.alert("No age-depth model found",{"id":"AgeModel"});
 };
 for(i=0;i<a.length;i++)
 {
  delete a[i].age_depth;
 };
 this.seriesSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.onRecordChange();
};

integrateApp.prototype.clearAgeModel=function()
{
 var i,k;
 var ad_found=false;
 var a=new Array();
 var dta,agd;
 this.recordSpec.emptyContainer();
 this.seriesSpec.emptyContainer(); // incase editor contains a series being updated
 for(k=0;k<this.record.series_list.length;k++)
 {
  if(!this.record.series_list[k].selected){continue;};
  switch(this.record.series_list[k].series_type)
  {
  case "AgeDepth":
   continue;
   break;
  default:
   dta=this.record.series_list[k].data;
   this.record.series_list[k].changed=true;
   for(i=0;i<dta.length;i++)
   {
    dta[i].t=null;
    dta[i].t_sigma=null;
   };
   break;
  };
 };
 this.seriesSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.onRecordChange();
};

integrateApp.prototype.ageModel=function()
{
 app.menu("Age depth model|Clear|Apply",{"id":"Record"})
 .then(function(rpl){
  switch(rpl)
  {
  case 1: this.clearAgeModel();break;
  case 2: this.applyAgeModel();break;
  };
 }.bind(this))
 .catch(function(e){app.alert(e);});
};


// intcal Tools

integrateApp.prototype.intcalMenu=function(mode)
{
 var actions=[null],menu="IntCal",a,b,ref=false,i,earliest=0,ring_seg="EW/LW";
 for(i=0;i<this.series.data.length;i++)
 {
  if(this.series.data[i].calage+(this.series.data[i].calage_range-1)/2>earliest)
  {
   earliest=this.series.data[i].calage+(this.series.data[i].calage_range-1)/2;
  };
 };
 for(i=0;i<this.record.series_list.length;i++)
 {
  if(this.record.series_list[i].series==this.series.series_sample 
   && (this.record.series_list[i].series_type=="Dendro_Sample")
   && this.record.series_list[i].data.length)
  {
   ref=this.record.series_list[i];
   b=(ref.data[ref.data.length-1].t-ref.data[0].t)/(ref.data[ref.data.length-1].z-ref.data[0].z);
   a=ref.data[0].t-b*ref.data[0].z;
   break;
  };
 };
 switch(mode)
 {
 case "Series":
  switch(this.series.series_type)
  {
  case "IntCal_Data":
  case "IntCal_Data_B":
   actions.push("calage_to_t");menu+=("|Calage > Date");
   switch(this.record.header.site_type)
   {
   case "Dendrochronological":
    if(this.series.series_sample)
    {
     if(ref)
     {
      actions.push("ring_to_calage");menu+="|Ring > Calage";
     };
     actions.push("calage_to_ring");menu+="|Calage > Ring";
     actions.push("ring_to_sample");menu+="|Ring/Calage > Sample";
    };
    actions.push("ring_segment");menu+="|Ring segment";
    break
   default:
    if(this.series.series_sample)
    {
     actions.push("z_to_sample");menu+="|Depth > Sample";
    };
    break;
   };
   break;
  };
 };
 if(this.project.options.database && (mode=="Series") && (this.series.series_type=="IntCal_Data"))
 {
  actions.push(null);menu+="|";
  actions.push("reset");menu+=("|Reset");
  actions.push("save_meta");menu+=("|Save metadata");
  actions.push("save_data");menu+=("|Save data");
  actions.push("move_here");menu+=("|Move here");
  actions.push(null);menu+="|";
  actions.push("delete");menu+=("|Delete all");
 };
 if(actions.length<2)
 {
  app.alert("No actions");
  return;
 };
 app.menu(menu,{"id":mode}).then(async function(rpl){
  function manipulate()
  {
   var i,obj;
   integ.seriesSpec.emptyContainer();
   for(i=0;i<integ.series.data.length;i++)
   {
    switch(actions[rpl])
    {
    case "ring_segment":
     integ.series.data[i].ring_segment=ring_seg;
     break;
    case "calage_to_ring":
    case "calage_to_t":
     if((integ.record.header.site_type=="Dendrochronological")
      &&(integ.record.header.t_source=="DendroSH"))
     {
      integ.series.data[i].t=0.5+integ.CALBP_DATUM-integ.series.data[i].calage;
     }
     else
     {
      integ.series.data[i].t=integ.CALBP_DATUM-integ.series.data[i].calage;
     };
     if(actions[rpl]=="calage_to_ring")
     {
      if(!ref){break;};
      integ.series.data[i].z=(integ.series.data[i].t-a)/b;
      integ.series.data[i].z_range=integ.series.data[i].calage_range-1;
     };
     break;
    case "ring_to_calage":
     if(!ref){break;};
     if(integ.series.data[i].z==null){break;};
     integ.series.data[i].t=a+integ.series.data[i].z*b;
     if((integ.record.header.site_type=="Dendrochronological")
      &&(integ.record.header.t_source=="DendroSH"))
     {
      integ.series.data[i].calage=0.5+integ.CALBP_DATUM-integ.series.data[i].t;
     }
     else
     {
      integ.series.data[i].calage=integ.CALBP_DATUM-integ.series.data[i].t;
     };
     integ.series.data[i].calage_range=integ.series.data[i].z_range+1;
     break;
    case "ring_to_sample":
     if(!integ.series.series_sample){break;};
     if(integ.series.data[i].z!==null)
     {
      integ.series.data[i].sample=integ.series.series_sample+"_r"+
       integ.zString(integ.series.data[i].z,integ.series.data[i].z_range,
       "rings","z_from-z_to",true);
      break;
     };
    case "z_to_sample":
     if(!integ.series.series_sample){break;};
     if(integ.series.data[i].z!==null)
     {
      integ.series.data[i].sample=integ.series.series_sample+"_z"+
       integ.zString(integ.series.data[i].z,integ.series.data[i].z_range,
       integ.project.options.z_units,"z_from-z_to",true);
      break;
     };
     integ.series.data[i].sample=integ.series.series_sample+"_"+integ.series.data[i].calage+"calBP";
     break;
    };
   };
   integ.seriesSpec.fillContainer();
   integ.onSeriesChange();
  };
  switch(actions[rpl])
  {
  case "calage_to_ring":
   if(!ref && earliest)
   {
    b=1;
    a=this.CALBP_DATUM-earliest-b*(await app.prompt("Ring for "+earliest+"calBP"));
    ref=true;
   };
   if(ref){manipulate();};
   break;
  case "calage_to_t": 
  case "ring_to_calage":
  case "ring_to_sample":
  case "z_to_sample":
   manipulate();
   break;
  case "ring_segment":
   ring_seg=await app.prompt("Ring segment",ring_seg);
   manipulate();
   break;
  case "delete":
   await app.confirm("Are you sure you wish to delete all!?");
  case "save_meta":
  case "reset":
  case "save_data":
  case "move_here":
   obj={"json_application":app.header.id+".IntCalData","action":actions[rpl],"data":JSON.parse(JSON.stringify(this.series))};
   for(i=0;i<obj.data.data.length;i++)
   {
    obj.data.data[i].changed=true;
    if((actions[rpl]=="save_data")&&(!obj.data.data[i].intcal_data_id))
    {
     obj.data.data[i].created=true;
    };
    if(actions[rpl]=="delete")
    {
     obj.data.data[i].deleted=true;
    };
   };
   putToServer(this.fullPath(this.filenames["Record"]),JSON.stringify(obj),function(text){
    var rpl,ind,parms,i,j,new_line;
    try
    {
     rpl=JSON.parse(text);
    }
    catch(e){app.alert(text);};
    try
    {
     if(!rpl.status){throw(rpl.error);};
     this.seriesSpec.emptyContainer();
     if(this.series.parameter_list) // keep any other parameters
     {
      parms=this.series.parameter_list.split(/\s*,\s*/);
      ind={};
      for(i=0;i<rpl.data.length;i++)
      {
       ind[rpl.data[i]["intcal_data_id"]]=rpl.data[i];
      };
      for(i=0;i<this.series.data.length;i++)
      {
       if(new_line=ind[this.series.data[i]["intcal_data_id"]])
       {
        for(j=0;j<parms.length;j++)
        {
         if(parms[j].indexOf("~")==0){continue;};
         if(!parms[j]){continue;};
         new_line[parms[j]]=this.series.data[i][parms[j]];
        };
       };
      };
     };
     this.series.data=rpl.data;
     this.seriesSpec.fillContainer();
     this.onSeriesChange();
    }
    catch(e){app.alert(e);};
   }.bind(this),function(e){app.alert(e);});
   break;
  };
 }.bind(this)).catch(function(e){app.alert(e);});
};
integrateApp.prototype.intcalSelect=function(filter)
{
 var i,j,ind={},fd;
 filter=filter.split(/\s*,\s*/);
 this.recordsSpec.emptyContainer();
 this.recordSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 for(i=0;i<filter.length;i++){filter[i]=filter[i].trim();ind[filter[i]]=true;};
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(fd=this.project.project_series_list[i].filedata)
  {
   if(typeof(fd["intcal_set_type"])!="undefined")
   {
    this.project.project_series_list[i].selected=(ind[fd["intcal_set_type"]]==true);
   };
  };
  if(this.project.project_series_list[i].series=="Users"){this.project.project_series_list[i].selected=false;}
 };
 for(i=0;i<this.project.records.length;i++)
 {
  this.project.records[i].selected=false;
  if(fd=this.project.records[i].file_data)
  {
   for(j=0;j<fd.series_list.length;j++)
   {
    if(typeof(fd.series_list[j]["intcal_set_type"])!="undefined")
    {
     if(ind[fd.series_list[j]["intcal_set_type"]])
     {
      fd.series_list[j].selected=true;
      this.project.records[i].selected=true;
     }
     else
     {
      fd.series_list[j].selected=false;
     };
    };
   };
   for(j=0;j<fd.series_list.length;j++)
   {
    if((typeof(fd.series_list[j]["intcal_set_type"])=="undefined")||!this.project.records[i].selected)
    {
     fd.series_list[j].selected=this.project.records[i].selected;
    };
   };
  };
 };
 this.seriesListSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.recordsSpec.fillContainer();
};

// file handling

integrateApp.prototype.localPath=function(fname,project)
{
 var appLocal=false,prj;
 if((!this.filenames["Project"])&&(!project)){return false;};
 if((fname!=this.filenames["Project"])&&(!project))
 {
  appLocal=(this.localPath(this.filenames["Project"],true) || this.project.options.database);
  if(!appLocal){return false;};
  fname=this.fullPath(fname);
  prj=this.filenames['Project'].replace("/index.json","").split(".json")[0];
  if(prj && (fname.indexOf(prj)==0)){return appLocal;};
 };
 if(fname.indexOf('/')==0){return true;}; //simple user file
 if(fname.indexOf('http')==0){return false;}; // url
 if(fname.indexOf(':/')!=-1){return true;}; // drive
 return appLocal;
};

integrateApp.prototype.fullPath=function(fname)
{
 var a,obj=false;
 if(!fname){return "";};
 if((fname.indexOf("./")==0)||(fname.indexOf("~/")==0))
 {
  if(!this.filenames['Project']){return false;};
  a=fname.split("/");
  if(a.length>2)
  {
   switch(a[1])
   {
   case "series":
    obj=this.findProjectSeries(a[2].replace(".json",""));break;
   case "record":
    obj=this.findRecord(a[2].replace(".json",""));break;
   };
   if(obj && obj.file && (obj.file.indexOf("~/")!=0) && (obj.file.indexOf("./")!=0) && (!obj.changed))
   {
    a.shift();
    return obj.file.split("/"+a[0]+"/")[0]+"/"+a.join("/");
   };
  };
  fname=this.filenames['Project'].replace("/index.json","").split(".json")[0]+fname.substring(1);
//  fname=app.myDataUrl(fname);
 };
 return fname;
};

integrateApp.prototype.urlPath=function(fname)
{
 if(!fname){return "";};
 return app.myDataUrl(this.fullPath(fname));
};


integrateApp.prototype.requiredPath=function(fname) // path needed for transport
{
 if(!this.localPath(fname) && !this.project.options.database)
 {
  return this.fullPath(fname);
 };
 return fname;
};

integrateApp.prototype.projDriveAndName=function()
{
 var obj={"drive":"","name":""};
 if(!this.filenames['Project']){return false;};
 var fname=this.filenames['Project'].replace("/index.json","").split(".json")[0]+"/";
 var fa;
 if(this.localPath(fname) && (fname.indexOf(":")!=-1) && (fname.indexOf("http")!=0))
 {
  fa=fname.split(":");
  obj.drive=fa[0]+":";
  fa=fa[1].split("/");fa.pop();
  obj.drive+=fa.join("/");
  obj.name=fa.pop();
  return obj;
 };
 fa=fname.split("/");fa.pop();
 if(!fa.length){return obj;};
 obj.name=fa.pop();
 if(!fa.length){return obj;};
 switch(fa.pop())
 {
 case "drive":
 case "project":
  obj.drive=obj.name+":";
  break;
 default:
  obj.drive="/"+obj.name;
  break;
 };
 return obj;
};

integrateApp.prototype.drivePath=function(fname)
{
 var a,d,f=false,obj=false;
 if(!fname){return "";};
 var dAndN=this.projDriveAndName();
 if((fname.indexOf("./")==0)||(fname.indexOf("~/")==0))
 {
  if(!dAndN){return false;};
  a=fname.split("/");
  if(a.length>2)
  {
   switch(a[1])
   {
   case "series":
    obj=this.findProjectSeries(a[2].replace(".json",""));break;
   case "record":
    obj=this.findRecord(a[2].replace(".json",""));break;
   };
   if(obj && obj.file && (obj.file.indexOf("~/")!=0) && (obj.file.indexOf("./")!=0) && (!obj.changed))
   {
    a.shift();
    if(obj.file.indexOf('http')==0)
    {
     if(obj.file.indexOf('/project/')!=-1)
     {
      f=obj.file.split('/project/').pop();
     };
     if(obj.file.indexOf('/drive/')!=-1)
     {
      f=obj.file.split('/drive/').pop();
     };
     if(f)
     {
      d=f.split("/");
      fname=d[0]+":";
      d.shift();fname+="/"+d.join("/");
      return fname.split("/"+a[0]+"/")[0]+"/"+a.join("/");
     };
    }
    else
    {
     if(obj.file.indexOf(":")!=-1) // already a drive
     {
      a.shift();return obj.file.split("/"+a[0]+"/")[0]+"/"+a.join("/");
     };
    };
   };
  };
  fname=dAndN.drive+fname.substring(1);
 };
 return fname;
};


integrateApp.prototype.relativePath=function(fname)
{
 var prj=this.filenames['Project'].replace("/index.json","").split(".json")[0];
 if(!fname){return "";};
 if(prj && (fname.indexOf(prj)==0))
 {
  fname=fname.replace(prj,"~");
 };
 var dAndN=this.projDriveAndName();
 if((dAndN!=null)&&(fname.indexOf(dAndN.name+":")==0))
 {
  fname=fname.replace(dAndN.name+":","~");
 };
 return fname;
};

integrateApp.prototype.setFilename=function()
{
 var i,r,oldpath;
 switch(app.fileMode)
 {
 case "Events":
 case "Periods":
 case "Eruptions":
 case "Relationship":
  app.alert(app.fileMode);
  break;
 case "Series":
  this.filenames["Series"]=this.relativePath(app.filename);
  if(app.filename==""){return;};
  break;
 case "ProjectSeries":
  this.filenames[this.fileMode]=this.relativePath(app.filename);
  if(app.filename==""){return;};
  this.seriesListSpec.emptyContainer();
  for(i=0;i<this.project.project_series_list.length;i++)
  {
   if(app.fileSaving && (this.project.project_series_list[i].file_data==this.projectSeries))
   {
    this.fileModeIndex=i;
    this.project.project_series_list[i].file=this.relativePath(app.filename);
    this.project.project_series_list[i].changed=false;
    this.project.project_series_list[i].deleted=false;
    if((this.projectSeries.project_series_type=='Model') && (this.projectSeries.model_type=='OxCal'))
    {
     this.projectSeriesSpec.emptyContainer();
     this.projectSeries.file=this.relativePath(app.filename).replace('.json','.oxcal').replace("/series/","/series/oxcal/");
     if(this.fullPath("~/series/oxcal")&&(this.projectSeries.file.indexOf("~/series/oxcal/")==0))
     {
      app.mkDir(this.fullPath("~/series/oxcal"),function(message){
       app.fwrite(this.fullPath(this.projectSeries.file),this.projectSeries.code);
      }.bind(this));
     }
     else
     {
      app.fwrite(this.fullPath(this.projectSeries.file),this.projectSeries.code);
     };
     // puts project level models in an oxcal subdirectory of series
     this.projectSeriesSpec.fillContainer();
    };
    this.seriesListSpec.fillContainer();
    return;
   }
   else
   {
    if(this.fullPath(this.project.project_series_list[i].file)==app.filename)
    {
     this.fileModeIndex=i;
     this.project.project_series_list[i].file=this.relativePath(app.filename);
     this.project.project_series_list[i].changed=false;
     this.project.project_series_list[i].deleted=false;
     return;
    };
   };
  };
  this.project.project_series_list.push({"file":this.relativePath(app.filename),"created":true,"selected":true});
  this.fileModeIndex=this.project.project_series_list.length-1;
  if(app.fileSaving)
  {
   r=this.project.project_series_list[this.fileModeIndex];
   this.setProjectSeriesContent(r,this.series);
  };
  this.seriesListSpec.fillContainer();
  break;
 case "Record":
  this.filenames[app.fileMode]=this.relativePath(app.filename);
  if(app.filename==""){return;};
 case "ProjectRecord":
  this.filenames[this.fileMode]=this.relativePath(app.filename);
  this.recordsSpec.emptyContainer();
  this.recordSpec.emptyContainer();
  for(i=0;i<this.project.records.length;i++)
  {
   if((app.fileSaving && (this.project.records[i].file_data==this.record))||
     (this.fullPath(this.project.records[i].file)==app.filename))
   {
    this.fileModeIndex=i;
    this.project.records[i].changed=false;
    this.project.records[i].deleted=false;
    this.project.records[i].file=this.relativePath(app.filename);
    this.recordsSpec.fillContainer();
    this.recordSpec.fillContainer();
    return;
   };
  };
  this.project.records.push({"file":this.relativePath(app.filename),"created":true,"selected":true});
  this.recolorRecords(true,this.project.records.length-1);
  this.fileModeIndex=this.project.records.length-1;
  if(app.fileSaving)
  {
   r=this.project.records[this.fileModeIndex];
   this.setRecordContent(r,this.record);
  };
  this.recordsSpec.fillContainer();
  this.recordSpec.fillContainer();
  break;
 case "Project":
  this.filenames[app.fileMode]=app.filename;
  app.showFilename(app.filename);
  this.fileModeIndex=-1;
  break;
 case "OxCal":
  this.filenames[app.fileMode]=this.relativePath(app.filename);
  break;
 case "OxCalCode":
  this.filenames[app.fileMode]=this.relativePath(app.filename);
  if(this.oxcalSource==this.projectSeries)
  {
   this.projectSeriesSpec.emptyContainer();
   oldpath=this.projectSeries.file;
   this.projectSeries.file=this.relativePath(this.filenames[app.fileMode]);
   this.projectSeriesSpec.fillContainer();
   if(oldpath!=this.projectSeries.file){this.onProjectSeriesChange(true);};
  }
  else
  {
   this.seriesSpec.emptyContainer();
   oldpath=this.series.file;
   this.series.file=this.relativePath(this.filenames[app.fileMode]);
   this.seriesSpec.fillContainer();
   if(oldpath!=this.series.file){this.onSeriesChange(true);};
  };
  app.filecontent=this.oxcalSource.code; 
  break;
 };
};

integrateApp.prototype.getFilename=function()
{
 switch(app.fileMode)
 {
 case "Events":
 case "Periods":
 case "Eruptions":
  app.filename=app.fileMode+".json";
  break;
 case "ProjectRecord":
  break;
 case "ProjectSeries":
 case "Project":
 case "Record":
  app.filename=this.fullPath(this.filenames[app.fileMode]);
  if(!this.localPath(app.filename) && !this.project.options.database)
  {
   app.filename="";
  };
  break;
 case "OxCalCode":
  app.filename=this.drivePath(this.oxcalSource.file);
  break;
 };
};

integrateApp.prototype.checkObject=function(obj,mode,strict)
{
 var i,a,objmode;
 if(mode=="ProjectRecord"){mode="Record";};
 if(mode=="ProjectSeries"){mode="Series";};
 if(!obj.json_application)
 {
  if(obj.error)
  {
   app.alert(obj.error);
   obj.error=false;
  };
  return false;
 };
 obj.json_application=obj.json_application.replace('INTIMATE.integration',app.header.id);
 obj.json_application=obj.json_application.replace('INTIMATE',app.header.id);
 objmode=obj.json_application.split(":")[0];
 if(objmode==app.header.id+'.'+mode){return true;};
 if(mode=="Series")
 {
  a=this.findParameter('project_series_type').options;
  for(i=0;i<a.length;i++){if(objmode==app.header.id+'.'+a[i]){return true;};};
 };
 switch(mode)
 {
 case 'DBRecords':
 case 'DBRecordsSingle':
 case 'DBRelationships':
 case 'DBRelationshipsSingle':
  if(objmode==app.header.id+'.Records'){return true;};
  break;
 };
 if(!app.checkObject(obj,mode))
 {
  if(objmode==app.header.id+'.Project'){return false;};
  if(strict){return false;};
  return confirm("Load file type "+objmode+" into "+app.fileMode);
 };
 return true;
};

integrateApp.prototype.fileOpen=function(mode,name,from,to)
{
 var base;
 if(name.indexOf('DB:')==0) //database record - old version
 {
  switch(mode)
  {
  case 'ProjectRecord':
  case 'Record':
   name=this.intchronRoot+"record/intimate/"+encodeURIComponent(name.split(":")[1])+".json";
   break;
  case 'ProjectSeries':
  case 'Series':
   name=this.intchronRoot+"series/intimate/"+encodeURIComponent(name.split(":")[1])+".json";
   break;
  };
 };
 if((mode=="Project")&&(name!=app.getArgs().filename))
 {
  name=window.location.href.split(/[?#]/)[0]+"?filename="+name;
  if(app.getArgs().filename)
  {
   window.open(name,"_blank")
  }
  else
  {
   window.location=name;
  };
  return;
 };
 name=this.fullPath(name);
 if(name && (name.indexOf('/')==-1)) // fixed file in directory
 {
  base=window.location.href.split('/');base.pop();base=base.join('/');
  name=base+'/'+name;
 };
 if((name.indexOf('://')!=-1)||(name.indexOf('.')==0)) //remote file
 {
  if(mode=="Project")
  {
   this.pq.addAction(app.fileOpenRemote.bind(app,mode,name));
   this.pq.addAction(function(){});
   this.pq.modal("Opening project...",function(){app.fileMode=null;integ.pq.finish();});
   this.pq.step(10);
  }
  else
  {
   app.fileOpenRemote(mode,name).catch(function(e){
    integ.fq.step();});
  };
  return;
 };
 if(this.localPath(name,true)) // server file
 {
  if(mode=="Project")
  {
   login.login().then(function(){
    this.pq.addAction(app.fileOpen.bind(app,mode,name));
    this.pq.addAction(function(){});
    this.pq.modal("Opening project...",function(){app.fileMode=null;integ.pq.finish();});
    this.pq.step(10);
   }.bind(this)).catch(function(error){app.alert(error);});
  }
  else
  {
   app.fileOpen(mode,name).catch(function(e){
    integ.fq.step();});
  };
  return;
 };
 this.fq.step();
};

integrateApp.prototype.fileNew=function(mode)
{
 switch(mode)
 {
 case "Project":
  if(this.filenames["Project"])
  {
   this.action="New";
   window.open(window.location.href.split(/[?#]/)[0],"_blank");
  }
  else
  {
   app.fileNew("Project");
  };
  break;
 };
};

integrateApp.prototype.fileImport=function(mode)
{
 switch(mode)
 {
 case "Project":
  app.menu("Import|IntChron|NOAA NCEI study|OxCal|Dendro|Calib Marine",{"id":mode})
  .then(function(rpl){
   switch(rpl)
   {
   case 1:this.goIntchron();break;
   case 2:
    app.prompt("Study").then(function(rpl){
     if(isNaN(rpl)){return;};
     noaa.parseNoaaStudy(Number(rpl),{});
    }.bind(this)).catch(function(e){});
    break;
   case 3:app.fileOpen('OxCal','*.js');break;
   case 4:dendro.dendroImport('Project');break;
   case 5:try{this.marineImport();}catch(e){};break;
   };
  }.bind(this));
  break;
 case "Record":
  app.menu("Import|NOAA NCEI study|OxCal|Dendro",{"id":mode})
  .then(function(rpl){
   switch(rpl)
   {
   case 1:
    app.prompt("Study").then(function(rpl){
     if(isNaN(rpl)){return;};
     noaa.parseNoaaStudy(Number(rpl),{"record":this.record.header.record});
    }.bind(this)).catch(function(e){});
    break;
   case 2:app.fileOpen('OxCal','*.js');break;
   case 3:dendro.dendroImport('Record');break;
   };
  }.bind(this)).catch(function(e){});;
  break;
 };
};

integrateApp.prototype.cancelProjectData=function()
{
 this.fq.finish();
 this.finishProjectData();
 this.projectOptionsSpec.emptyContainer();
 this.project.options.ondemand=true;
 this.projectOptionsSpec.fillContainer();
};

integrateApp.prototype.compareBy=function(by,a,b)
{
 var k;
 for(k=0;k<by.length;k++)
 {
  if(a[by[k]]==b[by[k]]){continue;}
  else
  {
   if(a[by[k]]>b[by[k]]){return 1;};
   return -1;
  }; 
 };
 return 0;
};

integrateApp.prototype.findRecordBy=function(by,obj,seed)
{
 var i,j,r;
 if(seed && (this.compareBy(by,obj,seed)==0)){return seed;};
 for(i=0;i<this.project.records.length;i++)
 {
  if(r=this.project.records[i].file_data)
  {
   if(this.compareBy(by,r.header,obj)==0){return this.project.records[i];};
  };
 };
 return false;
};

integrateApp.prototype.indexParameters=function()
{
 this.globalParameterIndex={};
 for(i in this.parameters)
 {
  this.globalParameterIndex[this.parameters[i]["parameter"]]=this.parameters[i];
 };
 if(!this.project || !this.project.parameters){return;};
 for(i in this.project.parameters)
 {
  this.globalParameterIndex[this.project.parameters[i]["parameter"]]=this.project.parameters[i];
 };
};


integrateApp.prototype.indexSamples=function(rec,direction)
{
 var i,j,k,rd,obj,ser,sm,changed=false;
 if(direction=="both"){this.indexSamples(rec,"read");this.indexSamples(rec,"write");return;};
 if(!this.sample_index)
 {
  if(direction=="write"){return;};
  this.sample_index={"record":{},"site":{}};
  this.indexSamples(false,"read");
  return;
 };
 if(!rec)
 {
  for(i=0;i<this.project.records.length;i++)
  {
   if(rd=this.project.records[i].file_data)
   {
    if(direction=="read")
    {
     obj={"record":rd,"sample":{},"lastUpdated":false};
     this.sample_index["record"][rd.header.record]=obj;
     if(!this.sample_index["site"][rd.header.site])
     {
      this.sample_index["site"][rd.header.site]=obj;
     }
     else
     {
      if(Array.isArray(this.sample_index["site"][rd.header.site]))
      {
       this.sample_index["site"][rd.header.site].push(obj);
      }
      else
      {
       this.sample_index["site"][rd.header.site]=[this.sample_index["site"][rd.header.site],obj];
      };
     };
     this.indexSamples(rd.header.record,"read");
    }
    else
    {
     if(this.indexSamples(rd.header.record,"write"))
     {
      this.project.records[i].changed=true;
     };
    };
   };
  };
 }
 else
 {
  if(!this.sample_index["record"][rec]){return;};
  obj=this.sample_index["record"][rec];
  if(direction=="read"){obj.sample={};};
  for(i=0;i<obj.record.series_list.length;i++)
  {
   ser=obj.record.series_list[i];
   try
   {
    if(!ser.data || !ser.data.length){continue;};
   }
   catch(e){app.log("warning",obj.record.header.record+" "+i+" "+e);continue;};
   for(j=0;j<ser.data.length;j++)
   {
    if(sm=ser.data[j]["sample"])
    {
     if(direction=="read")
     {
      if(!obj.sample[sm])
      {
       obj.sample[sm]={"__updated":0};
       for(k in obj.record.header)
       {
        switch(k)
        {
        case "deleted":case "changed":case "created":continue;
        };
        obj.sample[sm][k]=obj.record.header[k];
       };
      };
      for(k in ser.data[j])
      {
       if(k.indexOf("_sigma")!=-1){continue;}; // errors collected together with measurements
       switch(k)
       {
       case "deleted":case "changed":case "created":continue;
       case "__updated":continue;
       };
       if((typeof(obj.sample[sm][k])=='undefined')||(obj.sample[sm][k]==null)||(obj.sample[sm][k]==ser.data[j][k]))
       {
        if(k=='notes') // don't share notes
        {
         obj.sample[sm][k]=[ser.data[j][k]];
        }
        else
        {
         obj.sample[sm][k]=ser.data[j][k];
         if(typeof(ser.data[j][k+"_sigma"])!='undefined')
         {
          obj.sample[sm][k+"_sigma"]=ser.data[j][k+"_sigma"];
         };
        };
       }
       else
       {
        if(ser.data[j][k]!=null)
        {
         if(this.globalParameterIndex[k] && this.globalParameterIndex[k].single)
         {
          if(ser.data[j]["__updated"] && (ser.data[j]["__updated"]>obj.sample[sm]["__updated"]))
          {
           obj.sample[sm][k]=ser.data[j][k];
           if(typeof(ser.data[j][k+"_sigma"])!='undefined')
           {
            obj.sample[sm][k+"_sigma"]=ser.data[j][k+"_sigma"];
           };
          };
          continue;
         }; // only take latest value
         if(Array.isArray(obj.sample[sm][k]))
         {
          obj.sample[sm][k].push(ser.data[j][k]);
          if(Array.isArray(obj.sample[sm][k+"_sigma"]))
          {
           obj.sample[sm][k+"_sigma"].push(ser.data[j][k+"_sigma"]);
          };
         }
         else
         {
          obj.sample[sm][k]=[obj.sample[sm][k],ser.data[j][k]];
          if(typeof(obj.sample[sm][k+"_sigma"])!='undefined')
          {
           obj.sample[sm][k+"_sigma"]=[obj.sample[sm][k+"_sigma"],ser.data[j][k+"_sigma"]];
          };
         };
        };
       };
      };
      if(ser.data[j]["__updated"]>obj.sample[sm]["__updated"])
      {
       obj.sample[sm]["__updated"]=ser.data[j]["__updated"];
      };
     }
     else
     {
      if(!obj.sample[sm])
      {
       continue;
      }
      else
      {
       for(k in ser.data[j])
       {
        if(this.globalParameterIndex[k] && this.globalParameterIndex[k].single) 
        { 
         if(ser.data[j][k]!=obj.sample[sm][k])
         {
          changed=true;
          ser.data[j][k]=obj.sample[sm][k];
          // make all values the same
         };
         continue;
        }; 
        if((ser.data[j][k]==null) && obj.sample[sm][k] && !Array.isArray(obj.sample[sm][k]))
        {
         changed=true;
         ser.data[j][k]=obj.sample[sm][k];
        };
       };
      };
     };
    };
   };
  };
 };
 return changed;
};

integrateApp.prototype.sampNames=async function()
{
 var prefix="",max=0,men;
 function drill(obj,op)
 {
  var i,res=0,smp,smp_no;
  if(typeof(obj)!='object'){return;};
  if(typeof(obj.file_data)=='object')
  {
   res+=drill(obj.file_data,op);
   switch(op)
   {
   case "strip":case "assign":
    if(res){obj.changed=true;};
   };
   return res;
  };
  if(typeof(obj.series_list)=='object')
  {
   res+=drill(obj.series_list,op);
   switch(op)
   {
   case "strip":case "assign":
    if(res){obj.changed=true;};
   };
   return res;
  };
  if(typeof(obj.data)=='object')
  {
   res+=drill(obj.data,op);
  };
  if(typeof(obj.sample)!='undefined')
  {
   switch(op)
   {
   case "strip":
    if(obj.sample && ((prefix=="")||(obj.sample.indexOf(prefix)==0)))
    {
     res++;
     obj.sample=null;
    };
    break;
   case "assign":
    if(!obj.sample)
    {
     max++;res++;
     obj.sample=prefix+max;
    };
    break;
   case "max":
    if(obj.sample && obj.sample.indexOf(prefix)==0)
    {
     smp_no=Number(obj.sample.replace(prefix,""));
     if(!isNaN(smp_no) && (smp_no>max)){max=smp_no;};
    };
    break;
   };
  };
  if(Array.isArray(obj))
  {
   for(i=0;i<obj.length;i++)
   {
    res+=drill(obj[i],op);
   };
  };
  return res;
 };
 try
 {
  men=await app.menu("Sample names|Add unique|Strip specific|Strip all");
  if(men<3){prefix=await app.prompt("Sample name prefix");};
  switch(men)
  {
  case 1:
   await app.confirm("Assign unique sample names\nstarting with "+prefix+"?");
   break;
  case 2:
   if(prefix)
   {
    await app.confirm("Strip all sample names\nstarting with "+prefix+"?");
    break;
   };
  case 3:
   await app.confirm("Strip all sample names?");
   await app.confirm("Are you sure?\nThis cannot be undone!");
   break;
  };
 }catch(e){app.alert(e);};
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 this.seriesSpec.emptyContainer();
 this.projectSeriesSpec.emptyContainer();
 try
 {
  switch(men)
  {
  case 1:
   drill(this.project.records,"max");
   drill(this.project.project_series_list,"max");
   drill(this.project.records,"assign");
   drill(this.project.project_series_list,"assign");
   break;
  case 2:
  case 3:
   drill(this.project.records,"strip");
   drill(this.project.project_series_list,"strip");
   break;
  };
 }catch(e){app.alert(e);};
 this.indexSamples();
 this.projectSeriesSpec.fillContainer();
 this.seriesSpec.fillContainer();
 this.seriesListSpec.fillContainer();
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.checkSeriesDistributions=function()
{
 var i,j,k,m,n,l,ll,by,rec=false,memrec=false,ser,sh,s,memser=false;
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 for(n=0;n<this.project.project_series_list.length;n++)
 {
  memrec=false;memser=false;
  l=this.project.project_series_list[n].file_data;
  if(!l){continue;};
  if(l.distribute)
  {
   sh=this.itemList(l.distribute.to_type,true);
   l.data.sort(this.compareBy.bind(this,l.distribute.by));
   if(l.distribute.key=='ref')
   {
    for(i=0;i<l.data.length;i++)
    {
     ser=l.distribute.to;
     if(!ser){ser=l.data[i].series;};
     if(rec=this.findRecordBy(l.distribute.by,l.data[i],rec))
     {
      if(!rec.file_data){continue;};
      if(ser)
      {
       for(j=0;j<rec.file_data.series_list.length;j++)
       {
        if(rec.file_data.series_list[j].series==ser)
        {
         ll=rec.file_data.series_list[j];
         if(this.addRefToList(ll.refs,l.data[i].ref)){rec.changed=true;};
        };
       };
      }
      else
      {
       for(k=0;k<rec.file_data.refs.length;k++)
       {
        if(rec.file_data.refs[k]==l.data[i].ref){k=rec.file_data.refs.length+1;};
       };
       if(k==rec.file_data.refs.length) // not found
       {
        rec.file_data.refs.push(l.data[i].ref);
        rec.changed=true;
       };
      };
     };
    };
    this.project.project_series_list.splice(n,1);
    n--;
    continue;
   };
   if(l.distribute.replace)
   {
    for(i=0;i<l.data.length;i++)
    {
     ser=l.distribute.to;
     if(!ser){ser=l.data[i].series;};
     if(!ser){continue;};
     if(rec=this.findRecordBy(l.distribute.by,l.data[i],rec))
     {
      if((memrec!=rec)||(memser!=ser))
      {
       for(j=0;j<rec.file_data.series_list.length;j++)
       {
        if(rec.file_data.series_list[j].series==ser)
        {
         rec.file_data.series_list.splice(j,1);j--;
         rec.changed=true;
        };
       };
      };
      memrec=rec;
      memser=ser;
     };
    };
   };
   for(i=0;i<l.data.length;i++)
   {
    ser=l.distribute.to;
    if(!ser){ser=l.data[i].series;};
    if(!ser){continue;};
    if(rec=this.findRecordBy(l.distribute.by,l.data[i],rec))
    {
     memrec=rec,memser=ser;ll=false;
     for(j=0;j<rec.file_data.series_list.length;j++)
     {
      if((rec.file_data.series_list[j].series==ser) 
       && (rec.file_data.series_list[j].series_type==l.distribute.to_type))
      {
       ll=rec.file_data.series_list[j];
      };
     };
     if(ll)
     {
      for(s in sh)
      {
       if((ll[sh[s]]!=l.data[i][sh[s]]) && l.data[i][sh[s]])
       {
        ll[sh[s]]=l.data[i][sh[s]];
        rec.changed=true;
       };
      };
      do
      {
       if(l.distribute.key)
       {
        for(k=0;k<ll.data.length;k++)
        {
         if(l.data[i][l.distribute.key]==ll.data[k][l.distribute.key])
         {
          for(m=0;m<l.distribute.update.length;m++)
          {
           if(ll.data[k][l.distribute.update[m]]!=l.data[i][l.distribute.update[m]])
           {
            ll.data[k][l.distribute.update[m]]=l.data[i][l.distribute.update[m]];
            rec.changed=true;
           };
          };
          k=ll.data.length+1;
         };
        };
       }
       else  // no key - don't add anything in the data (only header info)
       {
        k=-1;
       };
       if(k==ll.data.length) // not been found and key is given
       {
        if(!l.distribute.to){delete l.data[i].series;};
        for(s in l.distribute.by){delete l.data[i][l.distribute.by[s]];};
        for(s in sh){delete l.data[i][sh[s]];};
        ll.data.push(l.data[i]);
        rec.changed=true;
       };
       l.data.splice(i,1);
      }while(i<l.data.length && (memrec==(rec=this.findRecordBy(l.distribute.by,l.data[i],rec))) && (l.distribute.to || (ser==l.data[i].series)));
      i--;
     }
     else
     {
      rec.changed=true;
      ll={"series":ser,"series_type":l.distribute.to_type,"data":[],"parameter_list":l.parameter_list,"selected":true,"refs":[]};
      for(s in sh)
      {
       ll[sh[s]]=l.data[i][sh[s]];
      };
      rec.file_data.series_list.push(ll);
      do
      {
       if(!l.distribute.to){delete l.data[i].series;};
       for(s in l.distribute.by){delete l.data[i][l.distribute.by[s]];};
       for(s in sh){delete l.data[i][sh[s]];};
       if(l.distribute.key)
       {
        ll.data.push(l.data[i]);
       };
       l.data.splice(i,1);
      }while(i<l.data.length && (memrec==(rec=this.findRecordBy(l.distribute.by,l.data[i],rec))) && (l.distribute.to || (ser==l.data[i].series)));
      i--;
     };
    };
   };
   if(l.data.length==0)
   {
    this.project.project_series_list.splice(n,1);
    n--;
   };
  };
 };
 this.seriesListSpec.fillContainer();
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.finishProjectData=function()
{
 var args=app.getArgs();
 this.findAllRefs();
 this.fileModeIndex=-1;
 this.checkProjectToolMenu();
 this.checkSeriesDistributions();
 this.fq.step();
 if(args.action)
 {
  switch(args.action)
  {
  case "integrate":
   this.integrate();
   break;
  };
 };
 this.flashPage(this.project.options);
 try
 {
  if(args.projectSeries){this.viewProjectSeries(this.findProjectSeries(args.projectSeries));};
  if(args.record)
  {
   this.viewRecord(this.findRecord(args.record));
   if(args.series){this.viewSeries(this.findSeries(args.series));};
  };
 }
 catch(e){app.alert("Could not find all links");};
};
integrateApp.prototype.convertName=function(mode,name)
{
 if(name.indexOf('DB:')==0) //database record - old style
 {
  switch(mode)
  {
  case 'ProjectRecord':
  case 'Record':
   name=this.intchronRoot+"record/intimate/"+encodeURIComponent(name.split(":")[1])+".json";
   break;
  case 'ProjectSeries':
  case 'Series':
   name=this.intchronRoot+"series/intimate/"+encodeURIComponent(name.split(":")[1])+".json";
   break;
  };
 };
 return name;
};

integrateApp.prototype.readProjectData=function()
{
 var i,j;
 this.fq.finish();
 this.projectOptionsSpec.refillContainer();
 if(!this.project.records){this.project.records=[];};
 for(i=0;this.project.records && (i<this.project.records.length);i++)
 {
  if(this.project.records[i].data) // rename for older version
  {
   this.project.records[i].file_data=this.project.records[i].data;
   delete this.project.records[i].data;
  };
  if(this.project.records[i].file_data)  
  {
    for(j=0;j<this.project.records[i].file_data.series_list.length;j++)
    {
     this.project.records[i].file_data.series_list[j].data
     	=this.objectToArray(this.project.records[i].file_data.series_list[j].data);
    };
    this.setRecordContent(this.project.records[i],this.project.records[i].file_data);
   continue;
  };
  if(!this.project.records[i].file){app.alert("No data for record: "+this.project.records[i].record);continue;};
  this.project.records[i].file=this.convertName('ProjectRecord',
   this.project.records[i].file);
  if(this.project.options.ondemand){continue;};
  this.fq.addAction(this.fileOpen.bind(this,'ProjectRecord',
   this.project.records[i].file,
   this.project.options.t_from,
   this.project.options.t_to));
 };
 if(!this.project.project_series_list){this.project.project_series_list=[];}
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(this.project.project_series_list[i].data)  // rename for older version
  {
   this.project.project_series_list[i].file_data=this.project.project_series_list[i].data;
   delete this.project.project_series_list[i].data;
  };
  if(this.project.project_series_list[i].file_data)
  {
   this.setProjectSeriesContent(this.project.project_series_list[i],this.project.project_series_list[i].file_data);   
   continue;
  };
  if(!this.project.project_series_list[i].file){app.alert("No data for record: "+this.project.project_series_list[i].series);continue;};
  this.project.project_series_list[i].file=this.convertName('ProjectSeries',
   this.project.project_series_list[i].file);
  if(this.project.options.ondemand){continue;};
  this.fq.addAction(this.fileOpen.bind(this,
   'ProjectSeries',
   this.project.project_series_list[i].file,
   this.project.options.t_from,
   this.project.options.t_to));
 };
 this.fq.addAction(this.finishProjectData.bind(this));
 this.fq.modal("Opening files...","integ.cancelProjectData()");
 this.fq.step(10);
};


// file handing

integrateApp.prototype.addIcon=function(ico,alt)
{
 var u,l,a,i;
 u=document.getElementById('Servers');
 if(!ico){return;};
 if(this.serversShown[ico]){return;};
 this.serversShown[ico]=true;
 l=document.createElement("LI");
 i=document.createElement("IMG");
 i.src=ico;
 i.alt=alt;
 i.style.height=APP_HEAD+"px";
 l.appendChild(i);u.appendChild(l);
};

integrateApp.prototype.showServers=function(serv)
{
 var o;
 if(serv)
 {
  this.addIcon(this.serverIcons[serv],serv);
 }
 else
 {
  for(o in logins)
  {
   this.addIcon(logins[o].icon,logins[o].server);
  };
 };
};


integrateApp.prototype.setFileContent=function()
{
 var obj,i,j,d,log;
 var single=false;
 function autoSelect(a)
 {
  var i,s=false;
  if(!a || !a.length){return;};
  for(i=0;i<a.length;i++)
  {
   s=s || a[i].selected;
  };
  if(!s)
  {
   for(i=0;i<a.length;i++)
   {
    a[i].selected=true;
   };
  };
 };
 if(app.filecontent.charAt(0)=="{")
 {
  obj=myParseJSON(app.filecontent);
  if(obj.action && (obj.action=="login") && (obj.status==false))
  {
   if((app.fileMode=="Project")&&this.pq.active()){this.pq.finish();};
   log=new LoginInterface(obj.data);
   log.login("login")
   .then(function(ok){
    this.showServers();
    if(app.fileMode=="Project")
    {
     this.pq.addAction(app.fileOpenRemote.bind(app,app.fileMode,app.filename));
     this.pq.addAction(function(){});
     this.pq.modal("Opening project...",function(){app.fileMode=null;integ.pq.finish();});
     this.pq.step(10);
    }
    else
    {
     app.fileOpenRemote(app.fileMode,app.filename);
    };
   }.bind(this))
   .catch(function(err){
    app.alert(err);
   }.bind(this));
   return;
  };
 };
 switch(app.fileMode)
 {
 case "OxCal":
  this.importFromOxCal(app.filecontent);
  this.fileOpen("OxCalCode",this.filenames["OxCal"].replace(".js",".oxcal"));
  return;
 case "OxCalCode":
  this.importOxCalCode(app.filecontent);
  return;
 };
 if(app.filecontent && obj)
 {
  if(!this.checkObject(obj,app.fileMode))
  {
   if(this.checkObject(obj,'Project'))
   {
    if(obj.bibliography){this.addBibliography(obj.bibliography);}
	switch(app.fileMode)
	{
	case 'IntChron':
	 break;
	case 'Record':
	case 'ProjectRecord':
	 if(obj.records && obj.records[0] && obj.records[0].file_data)
	 {
	  obj=obj.records[0].file_data;
	 }
	 else
	 {
      if(this.fq.active()){this.fq.step(1);}else{this.finishProjectData();};
	  return;
	 };
	 break;
	default:
	 if(obj.project_series_list && obj.project_series_list[0] && obj.project_series_list[0].file_data)
	 {
 	  obj=obj.project_series_list[0].file_data;
 	 }
 	 else
 	 {
      if(this.fq.active()){this.fq.step(1);}else{this.finishProjectData();};
 	  return;
 	 };
	 break;
	};
   }
   else
   {
     if(this.fq.active()){this.fq.step(1);}else{this.finishProjectData();};
    return;
   };
  };
 }
 else
 {
  this.fileModeIndex=-1; // new file
  obj={};
 };
 switch(app.fileMode)
 {
 case "Project":
  app.hideTool("Record");
  app.hideTool("Series");
  app.hideTool('ProjectSeries');
  app.hideTool("Exchange");
  app.hideTool("refUtility");
  app.hideTool("Search");
  app.hideTool("Plot");
  this.recordsSpec.emptyContainer();
  this.seriesListSpec.emptyContainer();
  this.projectOptionsSpec.emptyContainer();
  this.projectParametersSpec.emptyContainer();
  this.project=obj;
  if(obj.relationships)
  {
   obj.project_series_list=[];
   for(i=0;i<obj.relationships.length;i++)
   {
    obj.relationships[i].data={};
	obj.project_series_list.push(obj.relationships[i]);
   };
   delete obj.relationships;
  };
  delete obj.events;
  delete obj.periods;
  delete obj.eruptions;
  if(!this.project.records){this.project.records=[];};
  if(!this.project.project_series_list){this.project.project_series_list=[];};
  this.recordsSpec.object=this.project.records;
  this.seriesListSpec.object=this.project.project_series_list;
  if(!this.project.options){this.project.options=this.defaultOptions();};
  if(this.oxcalLink)
  {
   this.project.options.t_units=this.oxcalLink.oxcal.t_units();
  };
  if(obj.title){this.project.options.name=obj.title;delete obj.title;};
  if(this.project.options.from || this.project.options.to) // update for older version
  {
   this.project.options.t_from=this.project.options.from;
   this.project.options.t_to=this.project.options.to;
   delete this.project.options.from;delete this.project.options.to;
   this.project.options.t_autorange=false;
  };
  if(this.project.options.parameterLabels) //update older version
  {
   this.project.parameters=this.project.options.parameterLabels;
   for(i=0;i<this.project.parameters.length;i++)
   {
    if(this.project.parameters[i].dp==0){this.project.parameters[i].dp=null;};
   };
   delete this.project.options.parameterLabels;
  };
  if(this.project.options.proxyLabels) //update older version
  {
   delete this.project.options.proxyLabels;
  };
  if(this.project.options.record_parameters) //update older version
  {
   if(typeof(this.project.options.record_parameters)!="string")
   this.project.options.record_parameters=this.project.options.record_parameters.join(",");
  };
  if(!this.project.options.t_units){this.project.options.t_units='calBP';};
  if(!this.project.options.z_units){this.project.options.z_units='m';};
  if(isNaN(this.project.options.t_from)||(this.project.options.t_from==''))
  {
   this.project.options.t_from=null;
   this.project.options.t_autorange=true;
  };
  this.project.options.name=this.projDriveAndName().name;
  this.projectOptionsSpec.object=this.project.options;
  if(!this.project.parameters){this.project.parameters=[];};
  if(!this.project.bibliography){this.project.bibliography=[];};
  this.projectParametersSpec.object=this.project.parameters;
  this.projectOptionsSpec.fillContainer();
  autoSelect(this.project.parameters);
  autoSelect(this.project.records);
  autoSelect(this.project.project_series_list);
  if(this.pq.active()){this.pq.step(10);};
  this.readProjectData();
  this.recordsSpec.fillContainer();
  this.recordsSpec.emptyContainer();
  this.recordsSpec.fillContainer();
  this.seriesListSpec.fillContainer();
  this.projectParametersSpec.fillContainer();
  if(this.project.records.length){app.showTool("Records");};
  if(this.project.project_series_list.length){app.showTool("SeriesList");};
  this.reloadAll();
  break;
 case "ProjectRecord":
  if(this.fileModeIndex>-1)
  {
   if(obj.header)
   {
    this.recordsSpec.emptyContainer();
    try
    {
     this.setRecordContent(this.project.records[this.fileModeIndex],obj);
    }
    catch(e)
    {
     app.alert(this.project.records[this.fileModeIndex].file+"\n"+e,{"id":"ProjectRecord"});
    };
    this.recordsSpec.fillContainer();
   }
   else
   {
    app.alert("File "+this.project.records[this.fileModeIndex].file+" not found",{"id":"ProjectRecord"});
   };
  };
  if(this.fq.active()){this.fq.step(1);}else{this.finishProjectData();};
  break;
 case "ProjectSeries":
  this.seriesListSpec.emptyContainer();
  if(this.fileModeIndex>-1)
  {
   this.setProjectSeriesContent(this.project.project_series_list[this.fileModeIndex],obj,app.FileMode);
  };
  this.seriesListSpec.fillContainer();
  if(this.fq.active()){this.fq.step(1);}else{this.finishProjectData();};
  break;
 case "Record":
  this.recordsSpec.emptyContainer();
  if(this.fileModeIndex>-1)
  {
   this.setRecordContent(this.project.records[this.fileModeIndex],obj);
  };
  this.recordsSpec.fillContainer();
  this.recordSpec.emptyContainer();
  this.record=obj;
  if(!obj.header){obj.header={"z_units":this.project.options.z_units};};
  this.recordSpec.object=this.record;
  this.recordSpec.fillContainer();
  break;
 case "Events":
 case "Periods":
 case "Eruptions":
 case "Relationship":
 case "Series":
  this.seriesListSpec.emptyContainer();
  if(this.fileModeIndex>-1)
  {
   this.setProjectSeriesContent(this.project.project_series_list[this.fileModeIndex],obj,app.FileMode);
  };
  this.seriesListSpec.fillContainer();
  this.projectSeriesSpec.emptyContainer();
  this.viewProjectSeries({"file_data":obj},true);
  break; 
 case "IntChron":
  this.setIntchronContent(obj);
  break;
 };
};

integrateApp.prototype.roughCal=function(r)
{
 // error ~ 750 on IntCal13
 return this.CALBP_DATUM-(-0.000000000000005756*r*r*r*r+0.0000000006344*r*r*r-0.00001861*r*r+0.9972*r+7.924);
};

integrateApp.prototype.ageLim=function(data)
{
 var i,t;
 if(!data){return;};
 if(!this.project.options.t_autorange){return;};
 this.projectOptionsSpec.emptyContainer();
 if(data.t && data.t.length)
 {
  t=data.t[0];
  if(this.project.options.t_from===null){this.project.options.t_from=t;this.project.options.t_to=t;};
  for(i=0;i<data.t.length;i++)
  {
   t=data.t[i];
   if(t<this.project.options.t_from){this.project.options.t_from=t;};
   if(t>this.project.options.t_to){this.project.options.t_to=t;};
  };
 };
 if(data.r_date && data.r_date.length)
 {
  t=this.roughCal(data.r_date[0]);
  if(this.project.options.t_from===null){this.project.options.t_from=t-this.CALIB_MARGIN;this.project.options.t_to=t+this.CALIB_MARGIN;};
  for(i=0;i<data.r_date.length;i++)
  {
   t=this.roughCal(data.r_date[i]);
   t-=this.CALIB_MARGIN;
   if(t<this.project.options.t_from){this.project.options.t_from=t;};
   t+=2*this.CALIB_MARGIN;
   if(t>this.project.options.t_to){this.project.options.t_to=t;};
  };
 };
 this.projectOptionsSpec.fillContainer();
};

integrateApp.prototype.cleanObject=function(o,list,def,keep)
{
 var i,ind={},changed=false,swp;
 for(i=0;i<list.length;i++)
 {
  ind[list[i]]=true;
  if(typeof(def)!="undefined")
  {
   if(typeof(o[list[i]])=="undefined")
   {
    o[list[i]]=def;
    app.log("warning",list[i]+" undefined");
    changed=true;
   };
  };
  if(typeof(o[list[i]])!="undefined")  // reorder as in list
  {
   swp=o[list[i]];
   delete o[list[i]];
   o[list[i]]=swp;
  };
 };
 for(i in o)
 {
  if(!ind[i] && !keep)
  {
   if(typeof(o[i])!="undefined")
   {
    app.log("warning",i+" not needed");
    changed=true;
   };
   delete o[i];
   continue;
  };
  switch(o[i])
  {
  case "undefined":
  case "null":
   app.log("warning",i+" null set as value");
   o[i]=null;
   changed=true;
   continue;
  };
 };
 return changed;
};

integrateApp.prototype.expandParameters=function(parms)
{
 var i,j,p,rtn=[];
 for(i=0;i<parms.length;i++)
 {
  p=this.findParameter(parms[i]);
  if(p.options && p.options.length && (p["type"]=="Array"))
  {
   for(j=0;j<p.options.length;j++)
   {
    rtn.push(p.options[j]);
   };
  }
  else
  {
   rtn.push(parms[i])
  };
 };
 return rtn;
};

integrateApp.prototype.findAdditional=function(a,b,list)
{
 var ind_a={},ind_b={},i,nw=[];
 for(i in a){ind_a[a[i]]=true;};
 for(i in b){ind_b[b[i]]=true;};
 for(i in ind_b){if(!ind_a[i]){nw.push("~"+i);};};
 for(i in ind_a){if(!ind_b[i]){nw.push(i);};};
 if(nw.length)
 {
  if(list){list=","+list;}else{list="";};
  return nw.join(",")+list;
 };
 return false;
};

integrateApp.prototype.cleanSeries=function(ser)
{
 var changed=false,i,h,d,h_b,d_b,add,len,nullAr,o;
 if(!ser){ser=this.series;};
 if(ser==this.series){this.seriesSpec.emptyContainer();};
 if(!ser.selected){ser.selected=false;};
 if(typeof(ser.parameter_list)=="undefined"){ser.parameter_list="";changed=true;app.log("warning","  parameter_list added");};
 if(typeof(ser.header_list)=="undefined"){ser.header_list="";changed=true;app.log("warning","  header_list added");};
 if(!ser.data || !Array.isArray(ser.data)){ser.data=[];changed=true;app.log("warning","  data added");};
 if(!ser.refs || !Array.isArray(ser.refs)){ser.refs=[];changed=true;app.log("warning","  refs added");};
 h=this.itemList(ser.series_type,true,false,ser.header_list);
 h_b=this.itemList(ser.series_type,true,false,ser.header_list,true);
 if(add=this.findAdditional(h,h_b,ser.header_list))
 {
  app.log("warning","  header_list updated to "+add);
  ser.header_list=add;
  changed=true;
 };
 h=this.mergeLists(["series","series_type","parameter_list","header_list","selected"],h);
 h=this.mergeLists(h,["notes","data","refs"]);
 if(this.cleanObject(ser,h)){changed=true;};
 d=this.itemList(ser.series_type,false,false,ser.parameter_list);
 d_b=this.itemList(ser.series_type,false,false,ser.parameter_list,true);
 if(add=this.findAdditional(d,d_b,ser.parameter_list))
 {
  app.log("warning","  parameter_list updated to "+add);
  ser.parameter_list=add;
  changed=true;
 };
 d=this.expandParameters(d);
 if(ser.data.length)
 {
  nullAr=[];
  for(i=0;i<ser.data.length;i++){nullAr.push(null);};
 };
 ser.data=this.arrayToObject(ser.data);
 if(Array.isArray(ser.data))
 {
  if(d.length<2){return changed;};
  o={};
  o[d[0]]=ser.data;
  ser.data=o;
 };
 if(this.cleanObject(ser.data,d,nullAr)){changed=true;};
 ser.data=this.objectToArray(ser.data);
 if(ser==this.series){this.seriesSpec.fillContainer();};
 return changed;
};

integrateApp.prototype.cleanProjectSeries=function(ser)
{
 var changed=false,i,h,d,h_b,d_b,add,nullAr,o;
 if(!ser){ser=this.projectSeries;};
 app.log("inform",ser.series);
 if(ser==this.projectSeries){this.projectSeriesSpec.emptyContainer();};
 if(typeof(ser.parameter_list)=="undefined"){ser.parameter_list="";changed=true;app.log("warning","  parameter_list added");};
 if(typeof(ser.header_list)=="undefined"){ser.header_list="";changed=true;app.log("warning","  header_list added");};
 if(!ser.data || !Array.isArray(ser.data)){ser.data=[];changed=true;app.log("warning","  data added");};
 if(!ser.refs || !Array.isArray(ser.refs)){ser.refs=[];changed=true;app.log("warning","  refs added");};
 h=this.itemList(ser.project_series_type,true,true,ser.header_list);
 h_b=this.itemList(ser.project_series_type,true,true,ser.header_list,true);
 if(add=this.findAdditional(h,h_b,ser.header_list))
 {
  app.log("warning","  header_list updated to "+add);
  ser.header_list=add;
  changed=true;
 };
 h=this.mergeLists(["series","project_series_type","parameter_list","header_list"],h);
 h=this.mergeLists(h,["notes","data","refs","json_application"]);
 if(this.cleanObject(ser,h)){changed=true;};
 d=this.itemList(ser.project_series_type,false,true,ser.parameter_list);
 d_b=this.itemList(ser.project_series_type,false,true,ser.parameter_list,true);
 if(add=this.findAdditional(d,d_b,ser.parameter_list))
 {
  app.log("warning","  parameter_list updated to "+add);
  ser.parameter_list=add;
  changed=true;
 };
 d=this.expandParameters(d);
 if(ser.data.length)
 {
  nullAr=[];
  for(i=0;i<ser.data.length;i++){nullAr.push(null);};
 };
 ser.data=this.arrayToObject(ser.data);
 if(Array.isArray(ser.data))
 {
  if(d.length<2){return changed;};
  o={};
  o[d[0]]=ser.data;
  ser.data=o;
 };
 if(this.cleanObject(ser.data,d,nullAr)){changed=true;};
 ser.data=this.objectToArray(ser.data);
 if(ser==this.projectSeries){this.projectSeriesSpec.fillContainer();};
 return changed;
};


integrateApp.prototype.cleanRecord=function(rec)
{
 var changed=false,i;
 if(!rec){rec=this.record;};
 app.log("inform",rec.header.record);
 if(rec==this.record){this.recordSpec.emptyContainer();};
 if(!rec.series_list || !Array.isArray(rec.series_list)){rec.series_list=[];changed=true;app.log("warning"," series_list added");};
 if(!rec.refs || !Array.isArray(rec.refs)){rec.refs=[];changed=true;app.log("warning"," refs added");};
 if(this.cleanObject(rec,["header","series_list","refs","json_application"])){changed=true;};
 if(this.cleanObject(rec.header,this.mergeLists(this.itemList("Records"),this.recordDetails),null)){changed=true;};
 for(i=0;i<rec.series_list.length;i++)
 {
  app.log("inform",i+" "+rec.series_list[i].series);
  if(this.cleanSeries(rec.series_list[i])){changed=true;};
 };
 if(rec==this.record){this.recordSpec.fillContainer();};
 return changed;
};

integrateApp.prototype.cleanAllRecords=function()
{
 var i,ch;
 this.recordsSpec.emptyContainer();
 for(i=0;i<this.project.records.length;i++)
 {
  if(this.project.records[i].file_data)
  {
   ch=this.cleanRecord(this.project.records[i].file_data);
   if(ch){this.project.records[i].changed=true;};
  };
 };
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.cleanAllProjectSeries=function()
{
 var i,ch;
 this.seriesListSpec.emptyContainer();
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(this.project.project_series_list[i].file_data)
  {
   if(this.project.project_series_list[i].series=='Users'){continue;};
   ch=this.cleanProjectSeries(this.project.project_series_list[i].file_data);
   if(ch){this.project.project_series_list[i].changed=true;};
  };
 };
 this.seriesListSpec.fillContainer();
};


integrateApp.prototype.setRecordContent=function(proj_rec,rec)
{
 var i,pl,parms,needed=["site","country","region","latitude","longitude","elevation","record","site_type"];
 if(this.cleanObject(rec.header,needed,null,true))
 {
  app.log("warning","in "+rec.header.record);
  proj_rec.changed=true;
 };
 for(i in needed)
 {
  proj_rec[needed[i]]=rec.header[needed[i]];
 };
 if(this.project && this.project.options && this.project.options.record_parameters)
 {
  parms=this.project.options.record_parameters.replace(/^\s+|\s+$/g,"").split(/\s*,\s*/);
  for(i=0;i<parms.length;i++)
  {
   if(parms[i].indexOf("~")==0){continue;};
   proj_rec[parms[i]]=rec.header[parms[i]];
  };
 };
 proj_rec.file_data=rec;
 if(!rec.header.color)
 {
  if(proj_rec.color)
  {
   rec.header.color=proj_rec.color;
  }
  else
  {
   pl=new plotLink();
   rec.header.color=pl.hsvaToRgba(360*Math.random(),100,100,1);
  };
 };
 proj_rec.color=rec.header.color;
 if(rec.age_depth)
 {
  rec.series_list.push({"series":"AgeDepth","series_type":"AgeDepth","t_source":rec.header.t_source,"data":rec.age_depth,"selected":true});
  delete rec.age_depth;
 };
 if(rec.tephras)
 {
  rec.series_list.push({"series":"Tephras","series_type":"Tephras","data":rec.tephras,"selected":true});
  delete rec.tephras;
 };
 if(rec.header.site_type=='Dendrochronological')
 {
  if(!rec.header.z_units){rec.header.z_units='rings';};
  if(!rec.header.z_type){rec.header.z_type='rings';};
 };
 for(i=0;i<rec.series_list.length;i++)
 {
  rec.series_list[i].data=this.objectToArray(rec.series_list[i].data);
  if(!rec.series_list[i].series_type){rec.series_list[i].series_type="Proxies";};
  if(typeof(rec.series_list[i].proxies)!='undefined')
  {
   rec.series_list[i].parameter_list=rec.series_list[i].proxies;
   delete rec.series_list[i].proxies;
  };
 };
};

integrateApp.prototype.setProjectSeriesContent=function(proj_rec,rec)
{
 var a,mode,i;
 var mode=false;
 rec.data=this.objectToArray(rec.data);
 if(rec.json_application)
 {
  a=rec.json_application.split('.');
  if(a.length && a.length>1)
  {
   mode=a[1].split(':')[0];
  };
 };
 if(!rec.project_series_type && mode){rec.project_series_type=mode;};
 if(!rec.project_series_type){rec.project_series_type="Data";};
 if(!rec.series && proj_rec.file){rec.series=proj_rec.file.split(/[\/:]/).pop();};
 proj_rec.file_data=rec;
 if(typeof(rec.t_from)!='undefined'){proj_rec.t_from=rec.t_from;};
 if(typeof(rec.t_to)!='undefined'){proj_rec.t_to=rec.t_to;};
 proj_rec.series=rec.series;
 proj_rec.project_series_type=rec.project_series_type;
};

integrateApp.prototype.removeDeleted=function(a,otherFlags,selFlags)
{
 var i,j;
 for(i=0;i<a.length;i++)
 {
  while((i<a.length) && a[i].deleted)
  {
   for(j=i+1;j<a.length;j++)
   {
    a[j-1]=a[j];
   };
   a.length--;
  };
  if((i<a.length) && otherFlags)
  {
   if(a[i].created){delete a[i].created;};
   if(a[i].changed){delete a[i].changed;};
  };
  if((i<a.length) && selFlags)
  {
   if(a[i].selected){delete a[i].selected;};
  };
 };
};

integrateApp.prototype.getSeriesContent=function(s)
{
 var o,k;
 o={};
 for(k in s)
 {
  if(k=='data')
  {
   o[k]=this.arrayToObject(s[k]);
  }
  else
  {
   o[k]=s[k];
  };
 };
 return o;
};

integrateApp.prototype.getRecordContent=function(r,selectedOnly)
{
 var o,i,k;
 o={};
 for(k in r)
 {
  switch(k)
  {
  case 'file_data': // deals with embedded data
    o[k]=this.getRecordContent(r[k],selectedOnly);
    break;
  case 'series_list':
   o[k]=[];
   for(i=0;i<r[k].length;i++)
   {
    if(selectedOnly && !r[k][i].selected){continue;};
    o[k].push(this.getSeriesContent(r[k][i]));
   };
   break;
  default:
   o[k]=r[k];
   break;
  };
 };
 return o;
};

integrateApp.prototype.getProjectContent=function(opt)
{
 function setDataStatus(o)
 {
   o.created=false;
   if(o.file)
   {
    switch(opt.include)
    {
    case 1: // local data included otherwise links
     o.file=integ.fullPath(o.file);
     if(integ.localPath(o.file)){o.changed=true;delete o.file;};
     if(o.file && !o.changed && o.file_data){delete o.file_data;};
     break;
    case 2: // links only included
     o.file=integ.fullPath(o.file);
     if(o.file && !o.changed && o.file_data){delete o.file_data;};
     break;
    case 3: // archive where files are being duplicated
     break;
    default: // data included and absolute links where needed
     o.changed=true;
     delete o.file;
     break;
    };
   }
   else
   {
    o.changed=true;
   };
 };
 var i,j,obj,sel=false;
 if(opt && opt.selected){sel=true;};
 var p={records:[],project_series_list:[]};
 for(i=0;i<this.project.records.length;i++)
 {
  if(opt)
  {
   if(!opt.records||(opt.selected && !this.project.records[i].selected)){continue;};
   if(!this.project.records[i].file_data){continue;};
   obj=this.getRecordContent(this.project.records[i],sel);
   this.removeDeleted(obj.file_data.series_list,true);
   if(opt.include!=3)
   {
    for(j=0;j<obj.file_data.series_list.length;j++)
    {
     switch(obj.file_data.series_list[j].series_type)
     {
     case "Files":
     case "Maps":
     case "Plans":
     case "Dendro_Cores":
     case "SubSample_Images":
      obj.file_data.series_list[j].path=this.fullPath(obj.file_data.series_list[j].path);
      break;
     };
    };
   };
   setDataStatus(obj);
   if(!obj.deleted){p.records.push(obj);};
   continue;
  };
  if(((this.project.records[i].file.indexOf('/')==-1)
   &&((this.project.records[i].file.indexOf('DB:')==-1)))||
   this.project.records[i].changed||
   this.project.options.include_data) //uploaded file - embed data
  {
   if(this.project.options.database)
   {
    p.records.push(this.getRecordContent(this.project.records[i]));
    delete this.project.records[i].changed;
    delete this.project.records[i].created;
    this.removeDeleted(this.project.records[i].file_data.series_list,true);
   }
   else
   {
    if(this.project.records[i].file)
    {
//     this.project.records[i].changed=true;
    }
    else
    {
     this.project.records[i].changed=false;
     delete this.project.records[i].changed;
    };
    delete this.project.records[i].created;
    this.removeDeleted(this.project.records[i].file_data.series_list,true);
    p.records.push(this.getRecordContent(this.project.records[i]));
   };
  }
  else
  {
   if(this.project.options.database)
   {
    p.records.push({"file":this.project.records[i].file,
     "record":this.project.records[i].record,
     "country":this.project.records[i].country,
     "site":this.project.records[i].site,
     "latitude":this.project.records[i].latitude,
     "longitude":this.project.records[i].longitude,
     "color":this.project.records[i].color,
     "selected":this.project.records[i].selected,
     "deleted":this.project.records[i].deleted,
     "created":this.project.records[i].created});
    delete this.project.records[i].created;
   }
   else
   {
    delete this.project.records[i].created;
    p.records.push({"file":this.requiredPath(this.project.records[i].file),
     "record":this.project.records[i].record,
     "country":this.project.records[i].country,
     "site":this.project.records[i].site,
     "latitude":this.project.records[i].latitude,
     "longitude":this.project.records[i].longitude,
     "color":this.project.records[i].color,
     "selected":this.project.records[i].selected});
   };
  };
 };
 for(i=0;i<this.project.project_series_list.length;i++)
 {
  if(opt)
  {
   if(!opt.series||(opt.selected && !this.project.project_series_list[i].selected)){continue;};
   if(!this.project.project_series_list[i].file_data){continue;};
   obj={"file":this.project.project_series_list[i].file,
     "project_series_type":this.project.project_series_list[i].project_series_type,
     "series":this.project.project_series_list[i].series,
     "changed":this.project.project_series_list[i].changed,
     "created":this.project.project_series_list[i].created,
     "selected":this.project.project_series_list[i].selected,
     "deleted":this.project.project_series_list[i].deleted,
     "file_data":this.getSeriesContent(this.project.project_series_list[i].file_data)};
   if(opt.include!=3)
   {
    switch(obj.file_data.project_series_type)
    {
    case "Files":
    case "Maps":
    case "Plans":
    case "Dendro_Cores":
    case "SubSample_Images":
     obj.file_data.path=this.fullPath(obj.file_data.path);
     break;
    };
   };
   setDataStatus(obj);
   if(!obj.deleted){p.project_series_list.push(obj);};
   continue;
  };
  if(((this.project.project_series_list[i].file.indexOf('/')==-1)
   &&((this.project.project_series_list[i].file.indexOf('DB:')==-1)))||
   this.project.project_series_list[i].changed||
   this.project.options.include_data) //uploaded file - embed data
  {
   if(this.project.options.database)
   {
    p.project_series_list.push({"file":this.project.project_series_list[i].file,
     "project_series_type":this.project.project_series_list[i].project_series_type,
     "series":this.project.project_series_list[i].series,
     "changed":this.project.project_series_list[i].changed,
     "created":this.project.project_series_list[i].created,
     "selected":this.project.project_series_list[i].selected,
     "deleted":this.project.project_series_list[i].deleted,
     "file_data":this.getSeriesContent(this.project.project_series_list[i].file_data)});
    delete this.project.project_series_list[i].changed;
    delete this.project.project_series_list[i].created;
   }
   else
   {
    delete this.project.project_series_list[i].created;
    if(this.project.project_series_list[i].file)
    {
//     this.project.project_series_list[i].changed=true;
     p.project_series_list.push({"file":this.requiredPath(this.project.project_series_list[i].file),
      "project_series_type":this.project.project_series_list[i].project_series_type,
      "series":this.project.project_series_list[i].series,
      "changed":this.project.project_series_list[i].changed,
      "selected":this.project.project_series_list[i].selected,
      "file_data":this.getSeriesContent(this.project.project_series_list[i].file_data)});
    }
    else
    {
     delete this.project.project_series_list[i].changed;
     p.project_series_list.push({"file":this.requiredPath(this.project.project_series_list[i].file),
      "project_series_type":this.project.project_series_list[i].project_series_type,
      "series":this.project.project_series_list[i].series,
      "selected":this.project.project_series_list[i].selected,
      "file_data":this.getSeriesContent(this.project.project_series_list[i].file_data)});
    };
   };
  }
  else
  {
   if(this.project.options.database)
   {
    p.project_series_list.push({"file":this.project.project_series_list[i].file,
     "project_series_type":this.project.project_series_list[i].project_series_type,
     "series":this.project.project_series_list[i].series,
     "selected":this.project.project_series_list[i].selected,
     "deleted":this.project.project_series_list[i].deleted,
     "created":this.project.project_series_list[i].created});
    delete this.project.project_series_list[i].created;
   }
   else
   {
    delete this.project.project_series_list[i].created;
    p.project_series_list.push({"file":this.requiredPath(this.project.project_series_list[i].file),
     "project_series_type":this.project.project_series_list[i].project_series_type,
     "series":this.project.project_series_list[i].series,
     "selected":this.project.project_series_list[i].selected});
   };
  };
 };
 if(opt)
 {
  p.parameters=this.project.parameters;
  if(opt.bibliography)
  {
   if(sel)
   {
    p.refs=[];p.bibliography=[];
    for(i=0;i<p.records.length;i++)
    {
     if(p.records[i].file_data)
     {
      this.addUnique(p.refs,p.records[i].file_data.refs);
      for(j=0;j<p.records[i].file_data.series_list.length;j++)
      {
       this.addUnique(p.refs,p.records[i].file_data.series_list[j].refs);
      };
     };
    };
    for(i=0;i<p.project_series_list.length;i++)
    {
     if(p.project_series_list[i].file_data)
     {
      this.addUnique(p.refs,p.project_series_list[i].file_data.refs);
     }
    };
    this.findAllRefs();
    for(i=0;i<p.refs.length;i++)
    {
     p.bibliography[i]=this.bibIndex[p.refs[i]];
    };
    p.bibliography.sort(this.sortRefs);
    delete p.refs;
   }
   else
   {
    p.bibliography=this.project.bibliography;
   };
  };
  if(opt.options)
  {
   p.options=JSON.parse(JSON.stringify(this.project.options));
   p.options.database=false;
  };
 }
 else
 {
  p.events=this.project.events;
  p.periods=this.project.periods;
  p.eruptions=this.project.eruptions;
  p.options=this.project.options;
  p.parameters=this.project.parameters;
  p.bibliography=this.project.bibliography;
 };
// return this.recursiveDataFlip(p,this.arrayToObject);
 return p;
};

integrateApp.prototype.getFileContent=function()
{
 switch(app.fileMode)
 {
 case "Project":
  this.recordsSpec.emptyContainer();
  this.seriesListSpec.emptyContainer();
  this.recordsSpec.edit=false;
  this.seriesListSpec.edit=false;
  this.recordSpec.emptyContainer();
  this.recordSpec.edit=false;
  this.projectParametersSpec.emptyContainer();
  this.projectParametersSpec.edit=false;
  this.projectOptionsSpec.emptyContainer();
  if(this.project.options.database)
  {
   app.filecontent=JSON.stringify(app.tagObject(this.getProjectContent(),app.fileMode));
   this.removeDeleted(this.project.records,false);
   this.removeDeleted(this.project.project_series_list,false);
   this.removeDeleted(this.project.parameters,true);
   this.removeDeleted(this.project.bibliography,true,true);
  }
  else
  {
   this.removeDeleted(this.project.records,false);
   this.removeDeleted(this.project.project_series_list,false);
   this.removeDeleted(this.project.parameters,true);
   this.removeDeleted(this.project.bibliography,true,true);
   app.filecontent=JSON.stringify(app.tagObject(this.getProjectContent(),app.fileMode));
  };
  this.projectOptionsSpec.fillContainer();
  this.projectParametersSpec.fillContainer();
  this.recordSpec.fillContainer();
  this.seriesListSpec.fillContainer();
  this.recordsSpec.fillContainer();
  app.reloadTool("refUtility");
  break;
 case "Record":
  this.recordSpec.edit=false;
  this.recordSpec.emptyContainer();
  if(this.project.options.database)
  {
   this.removeDeleted(this.record.series_list,true);
   app.filecontent=JSON.stringify(app.tagObject(this.getRecordContent(this.record),app.fileMode));
  }
  else
  {
   this.removeDeleted(this.record.series_list,true);
   app.filecontent=JSON.stringify(app.tagObject(this.getRecordContent(this.record),app.fileMode));
  };
  this.recordSpec.fillContainer();
  break;
 case "ProjectSeries":
// case "Series":
  this.projectSeriesSpec.edit=false;
  this.projectSeriesSpec.refillContainer();
  app.filecontent=JSON.stringify(app.tagObject(this.getSeriesContent(this.projectSeries),"Series"));
  break;
 case "OxCalCode":
  if(this.oxcalSource==this.projectSeries)
  {
   this.projectSeriesSpec.edit=false;
   this.projectSeriesSpec.refillContainer();
  }
  else
  {
   this.seriesSpec.edit=false;
   this.seriesSpec.refillContainer();
  };
  app.filecontent=this.oxcalSource.code; 
  break;
 };
};

integrateApp.prototype.canSave=function(silent)
{
  if(!this.localPath(this.filenames["Project"]) && !this.project.options.database)
  {
   if(!silent)
   {
    if(!this.filenames["Project"]){app.alert("Project filename not set");return false;};
    app.alert("Readonly file");
   };
   return false;
  };
  return true;
};

integrateApp.prototype.recordFile=async function(action)
{
  var h;
  switch(action)
  {
  case 'Open':
   app.fileOpen('Record');
   break;
  case 'Save':
   if(!this.canSave()){return;};
   h=this.onRecordChange(false);
   if(h.file)
   {
    await app.fileSave('Record');
   };
   await this.projectFile('Save');
   break;
  case 'SaveAs':
   await app.fileSaveAs('Record');
   await this.projectFile('Save');
   break;
  case 'Embed':
   h=this.onRecordChange(false);
   this.recordsSpec.emptyContainer();
   h.file='';
   this.recordsSpec.fillContainer();
   break;
  };
};

integrateApp.prototype.projectUrl=function(proj)
{
 if(!proj){proj="";};
 var url=window.location.href.split(/[?#]/)[0];
 return url.substring(0,url.substring(0,url.lastIndexOf('/')).lastIndexOf('/')).replace("/tools","")+"/project/"+proj;
};

integrateApp.prototype.projectFile=function(action)
{
  var h,opt;
  switch(action)
  {
  case 'Open':
   if(this.filenames["Project"])
   {
    this.action="Open";
    window.open(window.location.href.split(/[?#]/)[0],"_blank");
    return;
   };
   login.logged_in().then(async function(rpl){
    if(rpl)
    {
     this.projectFile("OpenPrivate");
    }
    else
    {
     try
     {
      rpl=await app.menu("Open|URL...|Other...");
      if(rpl==1)
      {
       rpl=await app.prompt("Project URL","");
       this.fileOpen("Project",rpl);
      }
      else
      {
       this.projectFile("OpenPrivate");
      };
     }
     catch(e){this.fileOpen("Project","");};
    };
   }.bind(this)).catch(function(e){app.alert(e);});
   break;
  case 'OpenPrivate':
   login.login().then(async function(){
    var projs=[],dir,sub,local=[],i,j,men="Projects",rpl;
    var projects=[""];
    try
    {
     app.createProgress("Finding projects...",false,10,"IntProjs");
     if(onAServer())
     {
      projs=await app.getFrom(this.projectUrl());
      projs=JSON.parse(projs);
      if(projs.status){projs=projs.data;}else{projs=[];throw "Projects not found";};
      for(i=0;i<projs.length;i++)
      {
       men+="|"+projs[i];
       projects.push(this.projectUrl(projs[i]));
      };
      if(projects.length>1)
      {
       men+="|";
       projects.push("");
      };
      if(logins["root"] && logins["root"].data && logins["root"].data.admin)
      {
       men+="|+New project|";
       projects.push("+New project","");       
      };
     };
     app.updateProgress(20,"IntProjs");
     local=[];
     dir=await app.dir('/',false,false,true);
     app.updateProgress(25,"IntProjs");
     for(i=0;i<dir.dirs.length;i++)
     {
      sub=await app.dir('/'+dir.dirs[i],false,false,true);
      app.updateProgress(25+30*(i/dir.dirs.length),"IntProjs");
      if(sub && sub.files)
      {
       for(j=0;j<sub.files.length;j++)
       {
        if(sub.files[j]=='index.json')
        {
         local.push(dir.dirs[i]);
        };
       };
      };
     };
     for(i=0;i<local.length;i++)
     {
      men+="|"+local[i];
      projects.push('/'+local[i]+'/index.json');
     };
     if((projects.length>1)&&(local.length>0))
     {
      men+="|";
      projects.push("");
     };
     app.updateProgress(60,"IntProjs");
     if(onAServer())
     {
      local=[];
      try
      {
       dir=await app.dir('Shared:/',false,false,true);
      }catch(e){dir={"dirs":[]};};
      app.updateProgress(65,"IntProjs");
      for(i=0;i<dir.dirs.length;i++)
      {
       try
       {
        sub=await app.dir('Shared:/'+dir.dirs[i],false,false,true);
       }catch(e){continue;};
       app.updateProgress(65+30*(i/dir.dirs.length),"IntProjs");
       if(sub && sub.files)
       {
        for(j=0;j<sub.files.length;j++)
        {
         if(sub.files[j]=='index.json')
         {
          local.push(dir.dirs[i]);
         };
        };
       };
      };
      for(i=0;i<local.length;i++)
      {
       men+="|"+local[i];
       projects.push('Shared:/'+local[i]+'/index.json');
      };
      if((projects.length>1)&&(local.length>0))
      {
       men+="|";
       projects.push("");
      };
     };
     men+="|URL...";
     projects.push("URL");
     men+="|Files...";
     projects.push("File");
     app.endProgress("IntProjs");
     rpl=await app.menu(men);
     proj=projects[rpl];
     switch(proj)
     {
     case "":
     case "File":
      await app.fileOpen("Project","");
      break;
     case "+New project":
      try
      {
       rpl=this.safeName(await app.prompt("Project Name",""));
       await app.confirm("Create project: "+rpl);
       rpl=await app.getFrom(this.projectUrl(rpl)+"?create=true");
       rpl=JSON.parse(rpl);
       if(rpl.status)
       {
        this.projectFile("OpenPrivate");
       }
       else
       {
        app.alert(rpl.error);
       };
      }catch(e){app.alert(e);};
      break;
     case "URL":
      rpl=await app.prompt("Project URL","");
      this.fileOpen("Project",rpl);
      break;
     default:
      this.fileOpen("Project",proj);
      break;
     };
    }
    catch(e){app.endProgress("IntProjs");app.alert(e);};
   }.bind(this)).catch(function(error){app.alert(error);});
   break;
  case 'Save':
   if(!this.canSave()){return;};
   this.projectOptionsSpec.emptyContainer();
   this.project.options.updated=Date.now();
   this.projectOptionsSpec.fillContainer();
   return app.fileSave('Project');
   break;
  case 'SaveAs':
   if(this.project.options.database)
   {
    app.menu("Save as|File|Archive").then(function(rpl){
     switch(rpl)
     {
     case 1:
      this.projectFile("SaveAsFile");
      break;
     case 2:
      this.projectFile("SaveAsArchive");
      break;
     };
    }.bind(this)).catch(function(){});
    break;
   };
  case 'SaveAsFile':
   this.projectOptionsSpec.emptyContainer();
   this.project.options.updated=Date.now();
   this.projectOptionsSpec.fillContainer();
   app.dir("/",async function(d){
    var nm="",i,NM;
    try
    {
     while(!nm)
     {
      nm=await app.prompt("Project name");
      nm=this.safeName(nm);
      NM=nm.toUpperCase();
      for(i=0;i<d.dirs.length && NM;i++)
      {
       if(NM==d.dirs[i].toUpperCase()){NM="";};
      };
      if(NM)
      {
       NM+=".JSON";
       for(i=0;i<d.files.length && NM;i++)
       {
        if(NM==d.files[i].name.toUpperCase()){NM="";};
       };
      };
      if(!NM)
      {
       await app.alert("Name already used\n(as directory or .json)");
       nm="";
      };
     };
     if(opt=await app.prompt("Create project "+nm,{"include":1,"records":true,"series":true,"selected":true,"bibliography":true,"options":true},this.projectContentsSpec()))
     {
      app.mkDir("/"+nm,function(){
       this.project.options.database=false;
       app.fwrite("/"+nm+"/index.json",JSON.stringify(app.tagObject(this.getProjectContent(opt),"Project")),function(){
        window.setTimeout(function(){
         window.open(window.location.href.split('?')[0].replace(/\#/g,'')+"?filename="+"/"+nm+"/index.json","");
        },200);
       }.bind(this),function(error){app.alert(error);});
      }.bind(this),function(error){app.alert(error);})
     };
    }
    catch(e){app.alert(e);}
   }.bind(this),function(error){
    app.alert("Log in and then save as").then(function(){login.login('login');});
   }.bind(this));
   break;
  case "SaveAsArchive":
   this.projectOptionsSpec.emptyContainer();
   this.project.options.updated=Date.now();
   this.projectOptionsSpec.fillContainer();
   app.prompt("Archive name").then(async function(rpl){
    var content,filter;
    rpl=this.safeName(rpl);
    var i,arch="~/archive/"+rpl,r;
    try
    {
     if(this.projectTools()["IntCal"])
     {
      filter=[];
      for(i in this.intcalPO)
      {
       if(i.toLowerCase()!=i)
       {
        if(i.indexOf("New")==0){continue;};
        switch(i)
        {
        case "Marine":case "Compare":case "Extra":continue;break;
        };
        if(!this.intcalTypeCol[i]){continue;};
        filter.push(i);
       };
      };
      filter=filter.join(",");
      filter=await app.prompt("Include IntCal sets",filter);
      if(filter!='*')
      {
       this.intcalSelect(filter);
       await app.confirm("Check selection");
      };
     };
     arch="~/archive";
     r=await app.getFrom(this.fullPath(arch)+"?action=enableArchive");
     try
     {
      r=JSON.parse(r);
     }catch(e){throw r;};
     if(!r.status){throw r.error;};
     if(!this.drivePath(arch)){throw "No file name";};
     arch+="/"+rpl;
     try
     {
      await app.rm(this.drivePath(arch));
     }catch(e){}
     await app.mkDir(this.drivePath(arch));
     await app.mkDir(this.drivePath(arch+"/record"));
     await app.mkDir(this.drivePath(arch+"/series"));
     for(i=0;i<this.project.records.length;i++)
     {
      if(!this.project.records[i].file_data){continue;};
      if(this.project.records[i].selected)
      {
       try
       {
        await app.fwrite(this.drivePath(arch+"/record/"+this.project.records[i].record+".json"),
        			 JSON.stringify(app.tagObject(this.getRecordContent(this.project.records[i].file_data,true),"Record")));
        await app.cp(this.drivePath("~/record/"+this.project.records[i].record),
                     this.drivePath(arch+"/record/"+this.project.records[i].record));
       }catch(e){};
      };
     };
     for(i=0;i<this.project.project_series_list.length;i++)
     {
      if(!this.project.project_series_list[i].file_data){continue;};
      if(this.project.project_series_list[i].series=='Users')
      {
       this.seriesListSpec.emptyContainer();
       this.project.project_series_list[i].selected=false;
       this.seriesListSpec.fillContainer();
      };
      if(this.project.project_series_list[i].selected)
      {
       try
       {
        await app.fwrite(this.drivePath(arch+"/series/"+this.project.project_series_list[i].series+".json"),
        			 JSON.stringify(app.tagObject(this.getSeriesContent(this.project.project_series_list[i].file_data),"Series")));
        await app.cp(this.drivePath("~/series/"+this.project.project_series_list[i].series),
                     this.drivePath(arch+"/record/"+this.project.project_series_list[i].series));
       }catch(e){};
      };
     };
     content=this.getProjectContent(
      {"include":3,"records":true,"series":true,"selected":true,"bibliography":true,"options":true});
     content.options.include_data=true;
     await app.fwrite(this.drivePath(arch+"/index.json"),
      JSON.stringify(app.tagObject(content,"Project")));
     await app.alert("Archive "+rpl+" created");
    }
    catch(e){app.alert(e);};
   }.bind(this)).catch(function(e){app.alert(e);});
   break;
  };
};

integrateApp.prototype.projectSeriesFile=async function(action)
{
 var h;
 switch(action)
 {
 case 'New':app.fileNew('ProjectSeries');break;
 case 'Open':app.fileOpen('ProjectSeries');break;
 case 'Save':
  if(!this.canSave()){return;};
  h=this.onProjectSeriesChange(false);
  if(h.file)
  {
   await app.fileSave('ProjectSeries');
  };
  await this.projectFile('Save');
  break;
 case 'SaveAs':
  await app.fileSaveAs('ProjectSeries');
  await this.projectFile('Save');
  break;
 case 'Embed':
  h=this.onProjectSeriesChange(false);
  this.seriesListSpec.emptyContainer();
  h.file='';
  this.seriesListSpec.fillContainer();
  break;
 };
};

// references

integrateApp.prototype.displayRef=function(spec)
{
 var a;
 if(spec.parent.object.url)
 {
  a=document.createElement('a');
  a.target="_blank";
  a.href=spec.parent.object.url;
  spec.appendComplexText(a,spec.object);
  spec.container.appendChild(a);
 }
 else
 {
  spec.appendComplexText(spec.container,spec.object);
 };
};

integrateApp.prototype.checkRef=function(str)
{
 if(typeof(str)!='string')
 {
  // deal with older version
  if(typeof(str)=='object')
  {
   if(str==null){return "";};
   if(str['doi'])
   {
    return "doi:"+str['doi'];
   };
   if(str['ref'])
   {
    return "ref:"+str['ref'];
   };
  };
  return "";
 };
 var ref=str,typ="ref";
 if(str.indexOf(":")==3)
 {
  ref=str.slice(4);
  typ=str.slice(0,3);
 };
 if(!ref){return "";};
 switch(typ)
 {
 case "ref":
  if(this.bibIndex["ref:"+ref])
  {
   delete this.bibIndex["ref:"+ref].deleted;
   if(this.bibIndex["ref:"+ref].doi)
   {
    return "doi:"+this.bibIndex["ref:"+ref].doi;
   };
  }
  else
  {
   this.bibIndex["ref:"+ref]={"ref":ref,"created":true};
   this.project.bibliography.push(this.bibIndex["ref:"+ref]);
  };
  return "ref:"+ref;
 case "doi":
  if(this.bibIndex["doi:"+ref])
  {
   delete this.bibIndex["doi:"+ref].deleted;
  }
  else
  {
   this.bibIndex["doi:"+ref]={"doi":ref,"created":true};
   this.project.bibliography.push(this.bibIndex["doi:"+ref]);
  };
  return "doi:"+ref;
 };
};

integrateApp.prototype.sortRefs=function(a,b)
{
 if(a.citation && b.citation)
 {
  if(a.citation < b.citation){return -1;};
  if(a.citation > b.citation){return 1;};
  return 0;
 }
 else
 {
  if(a.ref && b.ref)
  {
   if(a.ref < b.ref){return -1;};
   if(a.ref > b.ref){return 1;};
   return 0;
  };
 };
 return 0;
};

integrateApp.prototype.addBibliography=function(bib)
{
 var i;
 for(i=0;i<bib.length;i++)
 {
  if(bib[i].ref && this.bibIndex["ref:"+bib[i].ref]){continue;};
  if(bib[i].doi && this.bibIndex["doi:"+bib[i].doi]){continue;};
  bib[i].created=true;
  bib[i].selected=true;
  this.project.bibliography.push(bib[i]);
  if(bib[i].ref){this.bibIndex["ref:"+bib[i].ref]=bib[i];};
  if(bib[i].doi){this.bibIndex["doi:"+bib[i].doi]=bib[i];};
 };
};
integrateApp.prototype.containsRefs=function(typ,proj,list)
{
 var i,ar=this.itemList(typ,false,proj,list);
 for(i in ar){if(ar[i]=='ref'){return true;};};
 return false;
};
integrateApp.prototype.findAllRefs=function(updateOnly,clearUnused)
{
 var i,j,k,temp=[];
 this.bibIndex={};
 for(i in this.project.bibliography)
 {
  if(this.bibIndex["ref:"+this.project.bibliography[i].ref])
  {
   if(this.project.bibliography[i].doi  && !this.bibIndex["ref:"+this.project.bibliography[i].ref].doi)
   {
    this.bibIndex["ref:"+this.project.bibliography[i].ref].doi=this.project.bibliography[i].doi;
   };
  }
  else
  {
   temp.push(this.project.bibliography[i]);
   this.bibIndex["ref:"+this.project.bibliography[i].ref]=this.project.bibliography[i];
   if(this.project.bibliography[i].doi)
   {
    this.bibIndex["doi:"+this.project.bibliography[i].doi]=this.project.bibliography[i];
   };
  };
 };
 // remove duplicates
 this.project.bibliography.length=0;
 for(i in temp)
 {
  if(clearUnused){temp[i].deleted=true;};
  this.project.bibliography.push(temp[i]);
 };
 for(i in this.project.records)
 {
  if(!this.project.records[i].file_data || !this.project.records[i].file_data.refs)
  {
   continue;
  };
  for(j in this.project.records[i].file_data.refs)
  {
   this.project.records[i].file_data.refs[j]=this.checkRef(this.project.records[i].file_data.refs[j]);
  };
  for(j in this.project.records[i].file_data.series_list)
  {
   for(k in this.project.records[i].file_data.series_list[j].refs)
   {
    this.project.records[i].file_data.series_list[j].refs[k]
    	=this.checkRef(this.project.records[i].file_data.series_list[j].refs[k]);
   };
   if(!this.containsRefs(this.project.records[i].file_data.series_list[j].series_type,false,
     this.project.records[i].file_data.series_list[j].parameters)){continue;};
   for(k in this.project.records[i].file_data.series_list[j].data)
   {
    if(this.project.records[i].file_data.series_list[j].data[k].ref)
    {
     this.project.records[i].file_data.series_list[j].data[k].ref
    	=this.checkRef(this.project.records[i].file_data.series_list[j].data[k].ref);
    };
   };
  };
 };
 for(i in this.project.project_series_list)
 {
  if(!this.project.project_series_list[i].file_data || !this.project.project_series_list[i].file_data.refs)
  {
   continue;
  };
  for(j in this.project.project_series_list[i].file_data.refs)
  {
   this.project.project_series_list[i].file_data.refs[j]
   		=this.checkRef(this.project.project_series_list[i].file_data.refs[j]);
  };
  if(!this.containsRefs(this.project.project_series_list[i].file_data.project_series_type,true,
     this.project.project_series_list[i].file_data.parameters)){continue;};
  for(j in this.project.project_series_list[i].file_data.data)
  {
   if(this.project.project_series_list[i].file_data.data[j].ref)
   {
    this.project.project_series_list[i].file_data.data[j].ref
   		=this.checkRef(this.project.project_series_list[i].file_data.data[j].ref);
   };
  };
 };
 this.project.bibliography.sort(this.sortRefs);
 if(!updateOnly)
 {
  app.reloadTool("refUtility");
 };
};

integrateApp.prototype.cleanBibliography=function()
{
 this.findAllRefs(false,true);
};

integrateApp.prototype.addRefs=function()
{
 this.findAllRefs();
 app.showTool("refUtility");
};

integrateApp.prototype.showRefs=function(refs)
{
 var i;
 if(!refs)
 {
  this.displayRefs=false;
  this.refEditSpec=false;
  this.findAllRefs();
 }
 else
 {
  if(refs.length<1){app.alert("No references found");return;};
  this.findAllRefs();
  this.displayRefs=[];
  for(i in refs)
  {
   this.displayRefs.push(this.bibIndex[refs[i]]);
  };
 };
 app.showTool("refUtility");
};

integrateApp.prototype.addRefToList=function(list,ref)
{
 var i;
 if(!ref){return;};
 for(i=0;i<list.length;i++)
 {
  if(list[i]==ref){return false;};
 };
 list.push(ref);
 return true;
};

integrateApp.prototype.getBibliography=function()
{
 if(this.displayRefs)
 {
  app.bibliography=JSON.stringify({"list":this.displayRefs,"view":"Display"});
 }
 else
 {
  app.bibliography=JSON.stringify({"list":this.project.bibliography,"view":this.refEditSpec?"List":"Display"});
 };
};

integrateApp.prototype.setBibliography=function(updateOnly)
{
 var bib=JSON.parse(app.bibliography);
 if(this.displayRefs){if(bib.finished){app.hideTool("refUtility");};return;};
 var up=bib.list;
 var i,el,update,rf,updated=false;
 for(i in up)
 {
  if(up[i].selected && !up[i].deleted && this.refEditSpec)
  {
   if((this.refEditSpec.name=="ref") && (this.refEditSpec.parent.name=="refs"))
   {
    this.refEditSpec=this.refEditSpec.parent;
   };
   this.refEditSpec.emptyContainer();
   if(up[i].doi)
   {
    rf="doi:"+up[i].doi;
   }
   else
   {
    rf="ref:"+up[i].ref;
   };
   switch(this.refEditSpec.name)
   {
   case "ref":
    this.refEditSpec.object=rf;
    this.refEditSpec.changed=true;
//    this.refEditSpec=false;
    break;
   case "refs":
    this.addUnique(this.refEditSpec.object,rf);
    break;
   };
   this.refEditSpec.fillContainer();
   this.refEditSpec.doChange();
  };
  update=false;
  if(up[i].selected || up[i].changed || up[i].created || up[i].deleted)
  {
   updated=true;
   if(this.bibIndex["ref:"+up[i].ref])
   {
    update=this.bibIndex["ref:"+up[i].ref];
   }
   else
   {
    if(up[i].doi && this.bibIndex["doi:"+up[i].doi])
    {
     update=this.bibIndex["doi:"+up[i].doi];
    };
   };
   if(update)
   {
    for(el in up[i])
    {
     update[el]=up[i][el];
    };
   }
   else
   {
    if(up[i].selected)
    {
     up[i].created=true;
     this.project.bibliography.push(up[i]);
    };
   };
  };
 };
 if(!this.project.options.database)
 {
  this.removeDeleted(this.project.bibliography,true,true);
 };
 this.findAllRefs(updateOnly);
 if(this.refEditSpec)
 {
  this.refEditSpec.refillContainer();
  if(bib.finished)
  {
   this.refEditSpec=false;
   app.hideTool("refUtility");
  };
 };
 if(bib.finished && !updated){app.hideTool("refUtility");};
 if(updated && !this.refEditSpec && this.canSave(true)){this.projectFile('Save');};
};

integrateApp.prototype.searchBibliography=function(spec)
{
 var obj=spec.parent.object,r,a=[],i,j,k,done;
 var spec=new itemSpec("data","Reference search","Array");
 var parms=["record","site","series"];
 var s;
 spec.transparent=true;spec.readonly=true;spec.edit=false;
 if(obj.doi){r="doi:"+obj.doi;}else{r="ref:"+obj.ref;};
 for(i in this.project.records)
 {
  if(!this.project.records[i].file_data || !this.project.records[i].file_data.refs)
  {
   continue;
  };
  for(j in this.project.records[i].file_data.refs)
  {
   if(this.project.records[i].file_data.refs[j]==r)
   {
    a.push({"record":this.project.records[i].record,"site":this.project.records[i].site,"series":""});
   };
  };
  for(j in this.project.records[i].file_data.series_list)
  {
   done=false;
   for(k in this.project.records[i].file_data.series_list[j].refs)
   {
    if(this.project.records[i].file_data.series_list[j].refs[k]==r)
    {
     a.push({"record":this.project.records[i].record,"site":this.project.records[i].site,"series":this.project.records[i].file_data.series_list[j].series});
    };
   };
   if(done){continue;};
   if(!this.containsRefs(this.project.records[i].file_data.series_list[j].series_type,false,
     this.project.records[i].file_data.series_list[j].parameters)){continue;};
   for(k in this.project.records[i].file_data.series_list[j].data)
   {
    if(done){break;};
    if(this.project.records[i].file_data.series_list[j].data[k].ref==r)
    {
     a.push({"record":this.project.records[i].record,"site":this.project.records[i].site,"series":this.project.records[i].file_data.series_list[j].series});
     done=true;
    };
   };
  };
 };
 for(i in this.project.project_series_list)
 {
  done=false;
  if(!this.project.project_series_list[i].file_data || !this.project.project_series_list[i].file_data.refs)
  {
   continue;
  };
  for(j in this.project.project_series_list[i].file_data.refs)
  {
   if(done){break;};
   if(this.project.project_series_list[i].file_data.refs[j]==r)
   {
    a.push({"record":"","site":"","series":this.project.project_series_list[i].series});
    done=true;
   };
  };
  if(done){continue;};
  if(!this.containsRefs(this.project.project_series_list[i].file_data.project_series_type,true,
     this.project.project_series_list[i].file_data.parameters)){continue;};
  for(j in this.project.project_series_list[i].file_data.data)
  {
   if(done){break;};
   if(this.project.project_series_list[i].file_data.data[j].ref)
   {
    if(this.project.project_series_list[i].file_data.data[j].ref==r)
    {
     a.push({"record":"","site":"","series":this.project.project_series_list[i].series});
     done=true;
    };
   };
  };
 };
 for(k in parms)
 {
  s=this.genSpec(spec,parms[k]);
  s.readonly=true;
 };
 app.prompt(obj.citation,a,spec,{"id":"RefSearch"}).catch(function(e){});;
};

integrateApp.prototype.showRef=function(spec)
{
 var r,a;
 r=this.bibIndex[spec.object];
 if(!r){r=this.bibIndex["ref:"+spec.object];};
 if(r && r.citation)
 {
  spec.container.title=r.reference;
  if(r.url||r.doi)
  {
   a=document.createElement('a');
   a.target="_blank";
   if(r.url)
   {
    a.href=r.url;
   }
   else
   {
    a.href="https:\/\/doi.org\/"+r.doi;
   };
   spec.appendComplexText(a,r.citation);
   spec.container.appendChild(a);
  }
  else
  {
   spec.appendComplexText(spec.container,r.citation);
  };
  return;
 };
 spec.appendComplexText(spec.container,spec.object);
};

integrateApp.prototype.editRef=function(spec)
{
 this.displayRefs=false;
 this.refEditSpec=spec;
 this.addRefs();
};

integrateApp.prototype.recordRefs=function(r)
{
 var refs=[],i;
 this.addUnique(refs,r.refs);
 for(i=0;i<r.series_list.length;i++)
 {
  if(r.series_list[i].refs){this.addUnique(refs,r.series_list[i].refs);};
 };
 return refs;
};

integrateApp.prototype.seriesRefs=function(r,s)
{
 var refs=[];
 this.addUnique(refs,r.refs);
 this.addUnique(refs,s.refs);
 return refs;
};

integrateApp.prototype.cite=function(mode)
{
 var refs=[],i;
 switch(mode)
 {
 case "Record":
  this.showRefs(this.recordRefs(this.record));
  return;
 case "Series":
  this.showRefs(this.seriesRefs(this.record,this.series));
  return;
 case "ProjectSeries":
  this.showRefs(this.projectSeries.refs);
  return;
 case "Plot":
  if(this.pl.index.refs){this.showRefs(this.pl.index.refs);return;};
  break;
 };
 app.alert("No references found");
};

integrateApp.prototype.help=function(page,anchor)
{
 var url='./help_'+page+".html";
 if(page.toLowerCase()=='schema'){url="https://intchron.org/schema";};
 if(anchor){url+="#"+anchor;};
 app.clearTool("Help",url);
 app.showTool("Help");
};

integrateApp.prototype.flashPage=function(opt)
{
 var p,e,img,i,needed=false,ma,time=3000;
 if(!opt){opt=this.applicationOpt;};
 p=document.createElement('div');
 p.className='appVeil';
 e=document.createElement('div');
 e.className="appProgressTitle";
 img=document.createElement('img');
 if(opt.icon)
 {
  img.src=opt.icon;
  img.style.maxWidth="200px";
  e.appendChild(img);
  e.appendChild(document.createElement('br'));
  needed=true;
 };
 if(opt.name)
 {
  e.appendChild(document.createTextNode(opt.name));
  e.appendChild(document.createElement('br'));
 };
 if(opt.message)
 {
  ma=opt.message.split("\n");
  for(i=0;i<ma.length;i++)
  {
   e.appendChild(document.createTextNode(ma[i]));
   e.appendChild(document.createElement('br'));
   needed=true;
  };
 };
 if(opt.updated)
 {
  e.appendChild(document.createTextNode(app.writeDate(opt.updated)));
  e.appendChild(document.createElement('br'));
 };
 if(needed)
 {
  p.appendChild(e);
  p=document.body.appendChild(p);
  if(opt!=this.applicationOpt)
  {
   this.addIcon(opt.icon,opt.name);
  };
  window.setTimeout(function(){document.body.removeChild(p);},time);
 };
};

integrateApp.prototype.login=function(action)
{
 switch(action)
 {
 case "logout":
 case "login":
  login.login(action)
  .then(function(rtn){window.location.reload();});
  break;
 default:
  login.login(action);
  break;
 };
};

integrateApp.prototype.link=function()
{
 var url=window.location.href.split(/[?#]/)[0]+"?filename="+this.filenames['Project'];
 if(app.getTool("ProjectSeries").active){url+="&projectSeries="+this.projectSeries.series;};
 if(app.getTool("Record").active)
 {
  url+="&record="+this.record.header.record;
  if(app.getTool("Series").active){url+="&series="+this.series.series;};
 };
 app.prompt("Copy ",url,"copy");
};

// initialisation code
integrateApp.prototype.initialise=function()
{
 login.icon=this.icon;
 this.indexLabels();
 this.findCountries();
 if(onAServer())
 {
  login.createLoginMenu();
 }
 else
 {
  app.appendToMenu("ProjectFile","Spacer","",false,false);
  app.appendToMenu("ProjectFile","MenuSub","Server...",function(){window.location.assign("../");},false);
 };
 document.getElementById("recordsArea").appendChild(this.recordsSpec.createDisplay(this.project.records));   
 document.getElementById("seriesListArea").appendChild(this.seriesListSpec.createDisplay(this.project.project_series_list));   
 document.getElementById("projectOptionsArea").appendChild(this.projectOptionsSpec.createDisplay(this.project.options));   
 document.getElementById("projectParametersArea").appendChild(this.projectParametersSpec.createDisplay(this.project.parameters));   
 document.getElementById("recordArea").style.backgroundColor="#F0F0F0";
 document.getElementById("recordArea").appendChild(this.recordSpec.createDisplay(this.record));   
 document.getElementById("seriesArea").style.backgroundColor="#F0F0F0";
 document.getElementById("seriesArea").appendChild(this.seriesSpec.createDisplay(this.series));   
 document.getElementById("projectSeriesArea").style.backgroundColor="#F0F0F0";
 document.getElementById("projectSeriesArea").appendChild(this.projectSeriesSpec.createDisplay(this.projectSeries));   
 document.getElementById("exchangeArea").appendChild(this.exchangeSpec.createDisplay(this.exchange));   
 this.timescaleSelector=new app.select([],this.setTimescaleFromSelect.bind(this));
 app.addToMenu("PlotMenu",this.timescaleSelector.element);
 this.initProjectToolMenu();
 this.initRecordToolMenu();
 this.initSeriesToolMenu();
 this.initProjectSeriesToolMenu();
 this.initSearchToolMenu();
 app.options.bib_set_content="integ.setBibliography(false)";
 app.options.bib_update_content="integ.setBibliography(true)";
 app.options.bib_get_content="integ.getBibliography()";
 app.options.bib_search=this.searchBibliography.bind(this);
 if(app.getArgs().key && app.getArgs().share)
 {
  login.login().then(function(){
   login.share("createShare",app.getArgs().share,app.getArgs().key).then(function(rpl){
    this.projectFile("Open");
   }.bind(this)).catch(function(error){app.alert(error);});
  }.bind(this)).catch(function(error){app.alert(error);});
  return;
 };
 if(window.opener && window.opener.oxcal){this.oxcalLink=window.opener;};
 if(app.getArgs().filename)
 {
  this.fileOpen("Project",app.getArgs().filename);
 }
 else
 {
   if(window.opener)
   {
    try
    {
     if(window.opener.integ)
     {
      switch(window.opener.integ.action)
      {
      case "New":
       app.showTool("Records");
       break;
      case "Open":
       integ.projectFile("Open");
       break;
      };
     };
    }
    catch(e)
    {
     app.showTool("Records");
     this.flashPage();
    };
   }
   else
   {
    app.showTool("Records");
    this.flashPage();
   };
 };
};

// for handling plotEvents
function plotEventHandler(obj,graph,data,redraw)
{
 if(dendro.plotEventHandler){return dendro.plotEventHandler(obj,graph,data,redraw);};
 return false;
};

function finishPlot(doc)
{
 if(integ.oxcalLink)
 {
  integ.oxcalLink.oxcal.includeGraph(doc);
 };
};

(function () {
 integ=new integrateApp();
})();

