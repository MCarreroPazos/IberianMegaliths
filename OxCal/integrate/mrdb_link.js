var MRDB_refs={"db":"doi:10.1017/s0033822200038339","Marine20":"doi:10.1017/RDC.2020.68"};

integrateApp.prototype.convertFromTable=function(txt,text)
{
 var div,tab,ar,head=[],rw,el,data=[],j,obj,rtn="",v;
 txt=txt.slice(txt.lastIndexOf("<table"),txt.lastIndexOf("\/table>")+7);
 div = document.createElement('div');
 div.innerHTML = txt.trim();
 tab=div.firstChild;
 rw=tab.firstElementChild;
 if(rw.tagName=="TBODY"){rw=rw.firstElementChild;};
 for(el=rw.firstElementChild;el;el=el.nextSibling)
 {
  head.push(el.textContent.trim());rtn+=el.textContent.trim()+"\t";
 };
 rtn+="\n";
 while(rw=rw.nextSibling)
 {
  obj={};
  if(!rw.firstElementChild){continue;};
  for(el=rw.firstElementChild,j=0;el && (j<head.length);el=el.nextSibling,j++)
  {
   if(el.innerHTML=="&nbsp;")
   {
    obj[head[j]]=null;
    rtn+="\t";
   }
   else
   {
    v=el.innerText.trim();
    if(Number.isNaN(Number.parseFloat(v)))
    {
     obj[head[j]]=v;
    }
    else
    {
     obj[head[j]]=Number(v);
    };
    rtn+=v+"\t";
   };
  };
  rtn+="\n";
  data.push(obj);
 }; 
 if(text){return rtn;};
 return data;
};

integrateApp.prototype.marineImport=async function()
{
 var txt,ref_s,ref_o,ref_ind=[],ref_n,class_o,class_ind=[],taxa_o,taxa_ind=[],t,i,j,data,mem;
 var ref_sn="MDB_Refs",rec_name,rec_found,rec_index={},refNoMem;
 var series,dupl;
 var records=[];
 var prog=app.createProgress("Importing Marine Radiocarbon Database",false,0);
 try{
 if(ref_s=this.findProjectSeries(ref_sn))
 {
  this.viewProjectSeries(ref_s);
  ref_o=ref_s.file_data.data;
  for(i=0;i<ref_o.length;i++){ref_ind[ref_o[i].refno]=ref_o[i].ref;};
 }
 else
 {
  ref_o={"json_application":"INTCHRON.Series:4","series":ref_sn,"project_series_type":"Data","notes":"Publications list from the Marine database on at calib.org","header_list":"","parameter_list":"refno,ref","refs":[MRDB_refs.db],"data":{"refno":[],"ref":[]}};
  this.swallowData("ProjectSeries",JSON.stringify(ref_o));
  ref_s=ref_s=this.findProjectSeries(ref_sn);
  ref_o=ref_s.file_data.data;
 };
 app.updateProgress(10);
 ref_n=this.convertFromTable(await app.getFrom("https://intchron.org/tools/integrate/mrdb.php?table=refs")); 
 app.updateProgress(20);
 app.endProgress();
 for(i=0;i<ref_n.length;i++)
 {
  if(ref_n[i].doi)
  {
   ref_n[i].doi=ref_n[i].doi.toLowerCase().replace("dx.doi.org/","");
   if((ref_n[i].refno>=ref_ind.length)||(!ref_ind[ref_n[i].refno]))
   {
    ref_ind[ref_n[i].refno]="doi:"+ref_n[i].doi;
    app.log("inform","Added reference "+ref_n[i].refno+" "+ref_ind[ref_n[i].refno]);
   }
   else
   {
    if(ref_ind[ref_n[i].refno].indexOf(ref_n[i].doi)!=4)
    {
     try
     {
      await app.confirm("Update DOI for "+ref_n[i].refno+" from "+ref_ind[ref_n[i].refno]+" to doi:"+ref_n[i].doi);
      app.log("inform","DOI changed for "+ref_n[i].refno+" from "+ref_ind[ref_n[i].refno]+" to doi:"+ref_n[i].doi);
      ref_ind[ref_n[i].refno]="doi:"+ref_n[i].doi;
     }
     catch(e)
     {
      app.log("warning","DOI discrepancy for "+ref_n[i].refno+": currently "+ref_ind[ref_n[i].refno]+" and doi:"+ref_n[i].doi+" in MDB");
     };
    };
   };
  }
  else
  {
   if(ref_ind[ref_n[i].refno])
   {
    app.log("inform","Reference "+ref_n[i].refno+"("+ref_n[i].authors.slice(0,10)+"..., "+ref_n[i].year_published+") resolved to "+ref_ind[ref_n[i].refno]);
   }
   else
   {
    app.log("warning","Reference "+ref_n[i].refno+"("+ref_n[i].authors.slice(0,10)+"..., "+ref_n[i].year_published+") unresolved");
    ref_ind[ref_n[i].refno]=null;
   };
  };
 };
 var prog=app.createProgress("Importing Marine Radiocarbon Database",false,0);
 this.projectSeriesSpec.emptyContainer();
 ref_o.length=0;
 for(i=1;i<ref_ind.length;i++)
 {
  if(typeof(ref_ind[i])=='undefined'){continue;};
  ref_o.push({"refno":i,"ref":ref_ind[i]});
 };
 this.projectSeriesSpec.fillContainer();
 app.updateProgress(30);
// txt=await app.getFrom("../CalibMarine/Class.html");
 txt=await app.getFrom("https://intchron.org/tools/integrate/mrdb.php?table=class"); 
 class_o=this.convertFromTable(txt);
 for(i=0;i<class_o.length;i++)
 {
  class_ind[class_o[i].ClassNo]=class_o[i].Name;
 };
// txt=await app.getFrom("../CalibMarine/Taxa.html");
 app.updateProgress(40);
 txt=await app.getFrom("https://intchron.org/tools/integrate/mrdb.php?table=taxa"); 
 taxa_o=this.convertFromTable(txt);
 for(i=0;i<taxa_o.length;i++)
 {
  t=taxa_o[i];
  taxa_ind[t.TaxaNo]={"taxon":t.Genus+" "+t.Species,"feeding":t.Feeding,"taxon_class":class_ind[t.ClassNo]};
 };
// txt=await app.getFrom("../CalibMarine/Details.html");
 app.updateProgress(50);
 txt=await app.getFrom("https://intchron.org/tools/integrate/mrdb.php?table=details"); 
 data=this.convertFromTable(txt);
 for(i=0;i<data.length;i++){data[i]["Table"]="_D";};
// txt=await app.getFrom("../CalibMarine/TimeDep.html");
 app.updateProgress(70);
 txt=await app.getFrom("https://intchron.org/tools/integrate/mrdb.php?table=timedep"); 
 data=data.concat(this.convertFromTable(txt));
 for(i=0;i<data.length;i++){if(!data[i]["Table"]){data[i]["Table"]="_T";};};
 for(i=0;i<data.length;i++)
 {
  if(!data[i].Locality){data[i].Locality="Unknown";app.log("warning","Null location MS"+data[i].Table+data[i].MapNo)};
  if(!data[i].Reference){data[i].Reference="Unknown";app.log("warning","Null reference MS"+data[i].Table+data[i].MapNo)};
 };
 app.updateProgress(90);
 data.sort(function(a,b)
 {
  var v;
  try
  {
   v=a.Table.localeCompare(b.Table);
   if(v!=0){return v;};
  }catch(e){};
  v=a.Lon-b.Lon;
  if(v!=0){return v;};
  v=a.Lat-b.Lat;
  if(v!=0){return v;};
  try
  {
   v=a.Locality.localeCompare(b.Locality);
   if(v!=0){return v;};
  }catch(e){};
  v=a.MapNo-b.MapNo;
  return v;
 });
 // correct names
 for(i=0;i<data.length;i++)
 {
  rec_name="MR"+data[i].Table+data[i].MapNo.toString().padStart(4,"0");
  data[i].record=rec_name;
  if((typeof(data[i].Locality)=="string") && (data[i].Locality.indexOf("\ufffd")!=-1))
  {
   mem=data[i].Locality;
   data[i].Locality=this.MRDBclean(rec_name,data[i].Locality);
   if(data[i].Locality.indexOf("?")!=-1)
   {
    app.log("warning","Unknown character in "+rec_name+": "+mem);
   }
   else
   {
    app.log("inform","Locality name corrected in "+rec_name+": from "+mem+" to "+data[i].Locality);
   };
  };
 };
 for(i=0;i<data.length;i++)
 {
  rec_name="MR"+data[i].Table+data[i].MapNo.toString().padStart(4,"0");
  records.push({"record":rec_name,"longitude":data[i].Lon,"latitude":data[i].Lat,"site":data[i].Locality,"region":data[i].Subregion,
   "site_type":"Marine","t_source":"Marine20"});
  while((i+1<data.length)&&(data[i+1].Lon==data[i].Lon)&&(data[i+1].Lat==data[i].Lat)&&(data[i+1].Locality.localeCompare(data[i].Locality)==0)&&(data[i+1].Table==data[i].Table))
  {
   i++;
   data[i].record=rec_name; 
  };
 };
 this.recordsSpec.emptyContainer();
// this.project.records.length=0;
 for(i=0;i<records.length;i++)
 {
  rec_found=false;
  for(j=0;j<this.project.records.length;j++)
  {
   if(this.project.records[j].record==records[i].record)
   {
    rec_found=this.project.records[j];
    break;
   };
  };
  if(rec_found){rec_found.changed=true;}
  else
  {
   rec_found={"file_data":{"header":{"country":"","elevation":0},"refs":[],"series_list":[]},"created":true,"selected":true};
   this.project.records.push(rec_found);
  };
  rec_index[records[i].record]=rec_found.file_data;
  for(j in records[i])
  {
   rec_found[j]=records[i][j];
   rec_found.file_data.header[j]=records[i][j];
   rec_found.file_data.series_list=[];
  };
 };
 data.sort(function(a,b)
 {
  var v;
  try
  {
   v=a.Table.localeCompare(b.Table);
   if(v!=0){return v;};
  }catch(e){};
  v=a.Lon-b.Lon;
  if(v!=0){return v;};
  v=a.Lat-b.Lat;
  if(v!=0){return v;};
  try
  {
   v=a.Locality.localeCompare(b.Locality);
   if(v!=0){return v;};
  }catch(e){};
  v=a.RefNo-b.RefNo;
  if(v!=0){return v;};
  v=a.MapNo-b.MapNo;
  return v;
 });
 for(i=0;i<data.length;i++)
 {
  data[i].sample="MS"+data[i].Table+data[i].MapNo.toString().padStart(4,"0");
  data[i].taxon=taxa_ind[data[i].TaxaNo].taxon;
  data[i].feeding=taxa_ind[data[i].TaxaNo].feeding;
  data[i].taxon_class=taxa_ind[data[i].TaxaNo].taxon_class;
  if((data[i].RefNo)&&ref_ind[data[i].RefNo])
  {
   data[i].ref=ref_ind[data[i].RefNo];
  }
  else
  {
   app.log("warning","Missing Refo:"+data[i].RefNo);
  };
 };
 dupl=0;
 for(i=0;i<data.length;i++)
 {
  rec_found=rec_index[data[i].record];
  do
  {
   series={"series":this.safeName(data[i].Reference),"series_type":"MRDB_Data","reconstruction":"","notes":"","header_list":"","parameter_list":"","refs":[],"data":[],"selected":true};
   refNoMem=data[i].refNo;
   if(data[i].ref){series.refs[0]=data[i].ref;};
   if(this.bibIndex[data[i].ref])
   {
    series.series=this.safeName(this.bibIndex[data[i].ref].citation);
   };
   do
   {
    dupl++;
    if((typeof(data[i].Notes)=="string") && (data[i].Notes.indexOf("\ufffd")!=-1))
    {
     mem=data[i].Notes;
     data[i].Notes=this.MRDBclean("notes",data[i].Notes);
     if(data[i].Notes.indexOf("?")!=-1)
     {
      app.log("warning","Unknown character in notes for "+rec_found.header.record+": "+mem);
     }
     else
     {
      app.log("inform","Notes corrected in "+rec_found.header.record+": from "+mem+" to "+data[i].Notes);
     };
    };
    series.data.push({
     "t":data[i].CollectionYear+0.5,
     "sample":data[i].sample,
     "labcode":data[i].LabID,
     "r_date":data[i].C14age,
     "r_date_sigma":data[i].C14err,
     "d13C":data[i].Delta13C,
     "delta_r":data[i].DeltaR,
     "delta_r_sigma":data[i].DeltaRErr,
     "reservoir":data[i].ReservoirAge,
     "reservoir_sigma":data[i].ReservoirErr,
     "taxon":data[i].taxon,
     "feeding":data[i].feeding,
     "taxon_class":data[i].taxon_class,
     "ref":data[i].ref,
     "notes":data[i].Notes
    });
    i++;
   }
   while((i<data.length)&&(refNoMem==data[i].refNo)&&(rec_found.header.record==data[i].record));
   rec_found.series_list.push(series);
   if(series.refs.length)
   {
    this.addUnique(rec_found.refs,series.refs[0],true);
   };
   this.addUnique(rec_found.refs,MRDB_refs.db,true);
   if(rec_found.header.t_source && MRDB_refs[rec_found.header.t_source])
   {
    this.addUnique(rec_found.refs,MRDB_refs[rec_found.header.t_source],true);
   };
  }
  while((i<data.length)&&(rec_found.header.record==data[i].record));
  i--;
 };
 this.recordsSpec.fillContainer();
 app.endProgress();
 }catch(e){app.endProgress();app.alert(e);};
};

integrateApp.prototype.marineAverage=function(data,parameter,context)
{
 var sigma=parameter+"_sigma";
 var res={},i,ar=[],s=0,ofs,w,ss=0,sw=0,n=0,err;
 res[parameter]=null;res[sigma]=null;
 if(Array.isArray(data))
 {
  for(i=0;i<data.length;i++)
  {
   if((context=="selected")&&(!data[i].selected)){continue;};
   ar.push(this.marineAverage(data[i],parameter));
  };
  for(i=0;i<ar.length;i++)
  {
   if((ar[i][parameter]==null)||(!ar[i][sigma])){continue;};
   n++;
   w=ar[i][sigma];w=1/(w*w);
   s+=ar[i][parameter]*w;
   sw+=w;
  };
  if(n>0)
  {
   res[parameter]=s/sw;
   res[sigma]=Math.sqrt(1/sw);
   if(n>1)
   {
    n=0,s=0;sw=0;
    for(i=0;i<ar.length;i++)
    {
     if((ar[i][parameter]==null)||(!ar[i][sigma])){continue;};
     n++;
     w=ar[i][sigma];w=1/(w*w);
     offs=ar[i][parameter]-res[parameter];
     s+=offs*offs*w;
     sw+=w;
    };
    err=Math.sqrt(s/((n-1)*sw/n));
    if(err>res[sigma]){res[sigma]=err;}; // take maximum estimate of the error
   };
  };
 }
 else
 {
  if(data.series_list)
  {
   res=this.marineAverage(data.series_list,parameter);
   if(context=='record') // for coloring records
   {
    switch(parameter)
    {
    case "delta_r":
     if(res.delta_r>500){res.delta_r=500;};
     if(res.delta_r<-500){res.delta_r=-500;};
     break;
    case "reservoir":
     if(res.reservoir>1000){res.reservoir=1000;};
     break;
    };
   };
   return res;
  };
  if(data[parameter])
  {
   res[parameter]=data[parameter];res[sigma]=data[sigma];
   return res;
  };
  if(data.data && (data.series_type == "MRDB_Data"))
  {
   return this.marineAverage(data.data,parameter)
  };
 };
 return res;
};

integrateApp.prototype.marinePlotSites=function(parameter)
{
  var pl,dt,r,i,sigma=parameter+"_sigma",res,dat;
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
  dt=pl.appendData({name:"Sites",line:"",markerColor:"rgb(255,0,0)",
   markerFill:"rgba(255,0,0,0.25)",lineColor:"",
   marker:"circle",include_url:true,selected:true,include_color:false});
  dt.data=[];
  r=this.project.records;
  this.setupParameterAxis(pl.plotColor,"z",parameter,sigma);
  pl.plotColor.showKey=1;
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
    res=this.marineAverage(r[i].file_data,parameter);
    dat={"longitude":r[i].longitude,
      "latitude":r[i].latitude,"elevation":r[i].elevation,
      "title":r[i].site?r[i].site:r[i].record,
      "label":r[i].site?r[i].site:r[i].record,
      "url":"javascript:window.parent.parent.integ.linkRecord('"+r[i].record+"')"};
    dat[parameter]=res[parameter];dat[sigma]=res[sigma];
    dt.data.push(dat);
   };
  };
  pl.render();
  app.showTool('Plot');
};

integrateApp.prototype.marineCollectData=function(mode)
{
 var i,j,k,l,r=this.project.records,dat,dd,ave,ser,sam;
 var res={"parameter_list":["record","latitude","longitude","site",
  "distance","t_source","delta_r","delta_r_sigma","reservoir","reservoir_sigma"],"refs":[],"data":[]};
 switch(mode)
 {
 case "record":
  res.parameter_list.push("refs");
  break;
 case "series":
  res.parameter_list.splice(1,0,"series");
  res.parameter_list.push("refs");
  break;
 case "sample":
  res.parameter_list.splice(1,0,"series");
  res.parameter_list.splice(6,0,"sample");
  res.parameter_list.push("t","labcode","r_date","r_date_sigma","d13C","taxon","taxon_class","feeding","ref");
  break;
 };
 for(i=0;i<r.length;i++)
 {
  if(!r[i].selected){continue;};
  dat={"record":r[i].record,"longitude":r[i].longitude,"latitude":r[i].latitude,"site":r[i].site,
   "distance":this.distance(this.MRDB_search,r[i])/1000,
   "t_source":r[i].file_data.header.t_source,"refs":[],"selected":true};
  this.addUnique(res.refs,r[i].file_data.refs);
  switch(mode)
  {
  case "record":
   ave=this.marineAverage(r[i].file_data,"delta_r");
   for(l in ave){dat[l]=ave[l];};
   ave=this.marineAverage(r[i].file_data,"reservoir");
   for(l in ave){dat[l]=ave[l];};
   this.addUnique(dat["refs"],r[i].file_data.refs);
   res.data.push(dat);
   break;
  case "series":
   for(j=0;j<r[i].file_data.series_list.length;j++)
   {
    ser=r[i].file_data.series_list[j];
    if(ser.series_type != "MRDB_Data"){continue;};
    dd=JSON.parse(JSON.stringify(dat));
    dd.series=ser.series;
    ave=this.marineAverage(ser,"delta_r");
    for(l in ave){dd[l]=ave[l];};
    ave=this.marineAverage(ser,"reservoir");
    for(l in ave){dd[l]=ave[l];};
    this.addUnique(dd["refs"],ser.refs);
    res.data.push(dd);
   };
   break;
  case "sample":
   for(j=0;j<r[i].file_data.series_list.length;j++)
   {
    ser=r[i].file_data.series_list[j];
    if(ser.series_type != "MRDB_Data"){continue;};
    for(k=0;k<ser.data.length;k++)
    {
     dd=JSON.parse(JSON.stringify(dat));
     dd.refs=undefined;
     dd.series=ser.series;
     for(l in ser.data[k]){dd[l]=ser.data[k][l];};
     res.data.push(dd);
    };
   };
   break;
  };
 };
 res.data.sort(function(a,b){return a.distance-b.distance;});
 return res;
};


integrateApp.prototype.marineShowData=function(res,insearch)
{
 var spc,s,ss,k;
 spc=new itemSpec("obj","Results","Object");
 spc.readonly=true;
 s=spc.appendChild("data","Data","Array");
 s.database=true;
 for(k=0;k<res.parameter_list.length;k++)
 {
  ss=this.genSpec(s,res.parameter_list[k]);
  if(ss.name=="t_source"){ss.prompt="Curve";};
  if((ss.type=="TextArea")||(ss.type=="Array")){ss.popup=true;};
 };
 s=spc.appendChild("average","Average","Object");
 s.inline=true;
 ss=this.genSpec(s,"delta_r");
 ss=this.genSpec(s,"delta_r_sigma");
 s=spc.appendChild("refs","References","Array");
 ss=this.genSpec(s,"ref");
 if(insearch)
 {
  res.query={"mode":"MRDB","index":{"records":{},"series":{},"refs":res.refs}};
  res.query.search_title="MRDB Lon:"+Math.round(this.MRDB_search.longitude,0)
   +" Lat:"+Math.round(this.MRDB_search.latitude,0)
   +" Nearest:"+this.MRDB_search.nearest;
  for(k=0;k<res.data.length;k++)
  {
   if(!res.query.index.records[res.data[k].record])
   {
    res.query.index.records[res.data[k].record]={"series":{}};
   };
   if(res.data[k].series)
   {
    res.query.index.records[res.data[k].record][res.data[k].series]=true;
   }
  };
  app.clearTool('Search');
  this.searchSpec=spc;
  this.searchResults=res;
  document.getElementById("searchArea").appendChild(this.searchSpec.createDisplay(res));
  this.checkSearchToolMenu();
  app.showTool('Search');
  return;
 }
 else
 {
  return app.prompt("Marine site data",res,spc,{"id":"MRDB"});
 };
};

integrateApp.prototype.marineFindSites=function(obj)  // filt is D or T for two tables
{
 var ar=[],r=this.project.records,i,d,filter="",IGNORE=9999999;
 switch(obj.filter){case 1:filter="MR_D";break; case 2: filter="MR_T";break;};
 for(i=0;i<r.length;i++)
 {
  d=this.distance(obj,r[i])/1000;
  if(d<0){d=IGNORE;};
  if(obj.filter){if(r[i].record.indexOf(filter)!=0){d=IGNORE;};};
  ar.push({"distance":d,"ind":i});
 };
 ar.sort(function(a,b){return a.distance-b.distance});
 this.recordsSpec.emptyContainer();
 for(i=0;((!obj.nearest)||(i<obj.nearest))&&(i<ar.length)&&(ar[i].distance!=IGNORE);i++)
 {
  r[ar[i].ind].selected=true;
 };
 for(;i<ar.length;i++)
 {
  r[ar[i].ind].selected=false;
 };
 this.recordsSpec.fillContainer();
};

integrateApp.prototype.MRDBSearch=async function()
{
    var spc,res;
    spc=new itemSpec("obj","Find sites","Object");
    spc.transparent=true;
    s=spc.appendChild("latitude","Lat","Number");
    s=spc.appendChild("longitude","Long","Number");
    s=spc.appendChild("nearest","Nearest","Number");
    s=spc.appendChild("filter","Site types","Number");
    s.options=["All","Normal","Time dependent"];
    s=spc.appendChild("parameter","Map","Text");
    s.options=["","delta_r","reservoir"];
    s=spc.appendChild("mode","Split by","Text");
    s.options=["record","series","sample"];
    if(!this.MRDB_search)
    {this.MRDB_search={"latitude":0,"longitude":0,"nearest":10,"filter":1,"parameter":"delta_r","mode":"record"};};
    this.MRDB_search=await app.prompt("Find sites",this.MRDB_search,spc,{"id":"MRDB"});
    this.marineFindSites(this.MRDB_search);
    this.marinePlotSites(this.MRDB_search.parameter);
    res=this.marineCollectData(this.MRDB_search.mode);
    res.average=this.marineAverage(res.data,"delta_r");
    this.marineShowData(res,true);
};

integrateApp.prototype.marineOxCalCode=function(search,res)
{
 var txt="",i,t_source=false;
 if(res.data && res.data.length && res.data[0].t_source)
 {
  t_source=res.data[0].t_source;
 };
 if(search.t_source){t_source=search.t_source;};
 if(t_source)
 {
  txt+='Curve("'+t_source+'","'+t_source.toLowerCase()+'.14c");\n';
  if(MRDB_refs[t_source])
  {
   txt+="\/\/ ";
   try
   {
    txt+=this.bibIndex[MRDB_refs[t_source]].citation;
   }catch(e){txt+=MRDB_refs[t_source]};
   txt+="\n";
  };
 };
 txt+='Delta_R("LocalMarine",'+Math.round(res.average.delta_r)
     +','+Math.round(res.average.delta_r_sigma)+'){longitude='
     +search.longitude+';latitude='
     +search.latitude+';';
     if(search.nearest){txt+='nearest='+search.nearest+';';};
     if(search.record){txt+='record="'+search.record+'";';};
     txt+='}\n\/\/ ';
 for(i=0;i<res.refs.length;i++)
 {
  if(i){txt+=", "};
  try
  {
   txt+=this.bibIndex[res.refs[i]].citation;
  }catch(e){txt+=res.refs[i]};
 }; 
 txt+=".\n";  
 return txt;
};

integrateApp.prototype.marinePlot=async function(context)
{
 if(context=="Record")
 {
  this.plot("RecordMRDBChoose");
 }
 else
 {
  this.plot("ProjectMRDBChoose");
 };
};

integrateApp.prototype.MRDBclean=function(record,str)
{
 switch(record)
 {
  case "MR_D0087":
  case "MR_D0093":
  case "MR_D0688":
  case "MR_D0689":
  case "MR_D0694":
  case "MR_D0701":
  case "MR_D1053":
  case "MR_D1054":
  case "MR_D1054":
  case "MR_D1055":
  case "MR_D1056":
  case "MR_D1057":
  case "MR_D1059":
  case "MR_D1060":
  case "MR_D1064":
  case "MR_D1065":
  case "MR_D1068":
  case "MR_D1070":
  case "MR_D1072":
  case "MR_D1073":
  case "MR_D1074":
   return str.replace(/\ufffd/g,"ø");
  case "MR_D0090":
  case "MR_D0091":
   return str.replace(/\ufffd/g,"Ø");
  case "MR_D0317":
  case "MR_D0319":
   return str.replace(/\ufffde/g,"cȇ");
  case "MR_D0320":
  case "MR_D0321":
  case "MR_D0322":
  case "MR_D2005":
   return str.replace(/\ufffd/g,"á");
  case "MR_D0842":
   return str.replace(/\ufffd/g,"à");
  case "MR_D0858":
  case "MR_D0869":
  case "MR_D1047":
  case "MR_D1050":
  case "MR_D1082":
  case "MR_D1083":
  case "MR_D1084":
  case "MR_D1085":
  case "MR_D1086":
  case "MR_D1359":
  case "MR_D1544":
  case "MR_D1545":
  case "MR_D1554":
  case "MR_D1559":
  case "MR_D1568":
  case "MR_D1573":
   return str.replace(/\ufffd/g,"é");
  case "MR_D1564":
   return str.replace(/\ufffd/g,"è");
  case "MR_D2015":
  case "MR_D2028":
  case "MR_D2032":
   return str.replace(/\ufffd/g,"í");
  case "MR_D1361":
   return str.replace(/\ufffd/g,'');
  case "MR_D1364":
   return str.replace(/\ufffd/g,'ʻ');
  case "MR_D1718":
   return str.replace(/\ufffd/g,'Å');
  case "MR_D1574":
   return str.replace(/\ufffd/,"'").replace(/\ufffd/,"é");
  case "notes":
   return str.replace(/\ufffd/g,'±');
  default:
   return str.replace(/\ufffd/g,"?");
 };
};

integrateApp.prototype.dump=function(str)
{
 dmp=""
 for(i=0;i<str.length;i++)
 {
  dmp+=str.charCodeAt(i).toString(16).padStart(4,"0")+" ";
 };
 return dmp;
};

integrateApp.prototype.MRDBMenu=async function(context)
{
 var men,res;
 try
 {
  switch(context)
  {
  case "Project":
   men="MRDB|Map ΔR|Map Reservoir|Find data";
   if(this.canSave(true)){men+="|Import update";};
   men=await app.menu(men,{"id":"MRDB"});
   switch(men)
   {
   case 1: this.marinePlotSites("delta_r");break;
   case 2: this.marinePlotSites("reservoir");break;
   case 3:
    this.MRDBSearch();
    break;
   case 4: this.marineImport();break;
   };
   break;
  case "Record":
   men=await app.menu(this.record.header.record+"|Reservoir|Delta_R|OxCal code|Name check",{"id":"MRDB"});
   switch(men)
   {
   case 1:
    res=this.marineAverage(this.record,"reservoir");
    app.alert("Reservoir\n"+Math.round(res.reservoir,0)+" ± "+Math.round(res.reservoir_sigma),{"id":"MRDB"});
    break;
   case 2:
    res=this.marineAverage(this.record,"delta_r");
    app.alert("Reservoir\n"+Math.round(res.delta_r,0)+" ± "+Math.round(res.delta_r_sigma),{"id":"MRDB"});
    break;
   case 3:
    res={"average":this.marineAverage(this.record,"delta_r"),"refs":this.record.refs};
    app.prompt("OxCal code",this.marineOxCalCode(this.record.header,res),"copy",{"id":"MRDB"});
    break;
   case 4:
    res=await this.dump(this.record.header.site);
    res=await this.dump(this.MRDBclean(this.record.header.record,this.record.header.site));
    res=await app.prompt("Site",this.MRDBclean(this.record.header.record,this.record.header.site));
    this.recordSpec.emptyContainer();
    this.record.header.site=res;
    this.recordSpec.fillContainer();
    this.onRecordChange();
    break;
   };
   break;
  case "Search":
   men=await app.menu("MRDB|Recalculate|Edit search|OxCal code");
   switch(men)
   {
   case 1:
    this.searchSpec.emptyContainer();
    this.searchResults.average=this.marineAverage(this.searchResults.data,"delta_r","selected");
    this.searchSpec.fillContainer();
    break;
   case 2:
    this.MRDBSearch();
    break;
   case 3:
    app.prompt("OxCal code",this.marineOxCalCode(this.MRDB_search,this.searchResults),"copy",{"id":"MRDB"});
    break;
   };
   break;
  };
 }catch(e){app.alert(e);};
};
