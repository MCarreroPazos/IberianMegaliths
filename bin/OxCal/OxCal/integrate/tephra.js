var tephra;

function tephraApp()
{
 this.normalise=true;
};

tephraApp.prototype.addPlotData=function(category,split,data)
{
 var sym,name,st=0;
 if(!data.length){return;};
 if(category=="series"){category="sample";};
 if(split=="series"){split="sample";};
 name=data[0][category];
 if((split!=category)&&(data[0][split])){name+="/"+data[0][split];};
 switch(split)
 {
 case "volc_region":
  sym="diamond";break;
 case "volcano":
  sym="triangle";break;
 case "eruption":
  sym="circle";break;
 case "record":
 case "site":
  sym="square";break;
 case "sample":
  sym="cross";break;
 case "instrument":
 case "batch":
  sym="x";break;
 };
 integ.pl.appendData({"name":name,
   "line":"","markerColor":"red",
   "markerFill":"pink","lineColor":"black",
   "marker":sym,"selected":true,
   "data":data},true);
 if(integ.pl.tephra.type=="Majors"){st=3;};
 if(integ.pl.plotData.length>1)
 {
  for(i=st;i<integ.pl.plotData.length;i++)
  {
   if(!integ.pl.plotData[i].marker){continue;};
   integ.pl.plotData[i].lineColor=integ.pl.hsvaToRgba(300*(i-st)/(integ.pl.plotData.length+st),100,100,1);
   integ.pl.plotData[i].markerColor=integ.pl.hsvaToRgba(300*(i-st)/(integ.pl.plotData.length+st),100,100,1);
   integ.pl.plotData[i].markerFill=integ.pl.hsvaToRgba(300*(i-st)/(integ.pl.plotData.length+st),100,100,0.4);
  };
 };
};

tephraApp.prototype.sortOnSplit=function(a,b)
{
 if(a[this.split]>b[this.split]){return 1;};
 if(a[this.split]<b[this.split]){return -1;};
 return 0;
};

tephraApp.prototype.splitData=function(data)
{
 var i,j=0,ar=[[]];
 if(!data.length){return ar;};
 data.sort(this.sortOnSplit.bind(this));
 ar[j].push(data[0]);
 for(i=1;i<data.length;i++)
 {
  if(data[i][this.split]!=data[i-1][this.split])
  {
   ar.push([]);j++;
  };
  ar[j].push(data[i]);
 };
 return ar;
};

tephraApp.prototype.parameterLabel=function(parameter)
{
 return parameter.replace(new RegExp("([0-9])","g"),"_{$1}").replace("FeOt","FeO_{t}");
};

tephraApp.prototype.plot=async function(mode,typ,data)
{
 if(typ=="Profile"){this.plotShardCount(data);return;};
 var pl,plotInfo,plotOptions,plotData,multiPlots,ar,splm,spla;
 var n,nn,plotSequence,vs,i,pd;
 if(!integ.pl || !integ.pl.tephra || (integ.pl.tephra.type!=typ))
 {
  integ.clearPlot();
  integ.setupPlot();
  pl=integ.pl;
  pl.tephra={"mode":mode,"type":typ};
  plotInfo=pl.plotInfo;
  plotOptions=pl.plotOptions;
  plotData=pl.plotData;
  multiPlots=pl.multiPlots;
  // general setup
  plotInfo.minx=0;
  plotInfo.maxx=100;
  plotInfo.autox=true;
  plotInfo.miny=0;
  plotInfo.maxy=100;
  plotInfo.autoy=true;

  plotOptions.background="rgb(255,255,255)";
  plotOptions.plotPosX=3.0; // cm
  plotOptions.plotPosY=1.5;  // cm
  plotOptions.plotWidth=11.5; // cm
  plotOptions.plotHeight=11.5; // cm
  plotOptions.showKey=1;
  plotOptions.BandW=false;
  plotOptions.contours="95%";
  plotOptions.multiPlot=false;
  switch(typ)
  {
  case "Majors":
   plotSequence=["TiO2","Al2O3","FeOt","MnO","MgO","CaO","Na2O","K2O","P2O3","Cl","F"]; 
   if(this.normalise)   
   {
    plotInfo.x_calc="100*SiO2/total";
    plotInfo.y_calc="100*(Na2O+K2O)/total";
   }
   else
   {
    plotInfo.x_calc="SiO2";
    plotInfo.y_calc="(Na2O+K2O)";
   };
   plotInfo.xlabel="SiO_{2} (wt%)";
   plotInfo.ylabel="Na_{2}O + K_{2}O (wt%)";
   plotInfo.title="TAS";
   plotInfo.pcaVariables="SiO2,TiO2,Al2O3,FeOt,MnO,MgO,CaO,Na2O,K2O";
   plotInfo.dx_calc="";
   plotInfo.dy_calc="";
   plotInfo.keyTitle="Key";
   plotInfo.category="Majors";
   plotInfo.table="volcMajors";
   multiPlots={plots:[],showKey:true,keyColumn:2,keyRow:2,columns:3};
   pl.multiPlots=multiPlots;
   multiPlots.plots[0]=duplItem(plotInfo);
   for(n=1;n<plotSequence.length;n++)
   {
    multiPlots.plots[n]=duplItem(plotInfo);
    multiPlots.plots[n].row=Math.floor((n-1)/3);
    multiPlots.plots[n].column=(n-1)%3;
    multiPlots.plots[n].selected=(n<9);
    multiPlots.plots[n].title=this.parameterLabel(plotSequence[n-1]);
    multiPlots.plots[n].ylabel=this.parameterLabel(plotSequence[n-1])+" (wt%)";
    if(this.normalise)
    {
     multiPlots.plots[n].y_calc="100*"+plotSequence[n-1]+"/total";
    }
    else
    {
     multiPlots.plots[n].y_calc=plotSequence[n-1];
    };
   };
   plotData=[{name:"",line:"solid",lineColor:"rgb(127,127,127)",
    marker:"",selected:true,singleOnly:true,id:"tas_1"},
    {name:"",line:"dotted",lineColor:"rgb(127,127,127)",
    marker:"",selected:true,singleOnly:true,id:"tas_2"},
    {name:"",line:"",marker:"label", markerFill:"rgb(127,127,127)",selected:true,singleOnly:true,id:"tas_3"}];
   pl.plotData=plotData;
   plotData[0].data=[{SiO2:41,Na2O:0.5,K2O:0,total:100},
    {SiO2:41,Na2O:3,K2O:0,total:100},
    {SiO2:45,Na2O:3,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:45,Na2O:0.5,K2O:0,total:100},
    {SiO2:45,Na2O:5,K2O:0,total:100},
    {SiO2:49.4,Na2O:7.3,K2O:0,total:100},
    {SiO2:53,Na2O:9.3,K2O:0,total:100},
    {SiO2:57.6,Na2O:11.7,K2O:0,total:100},
    {SiO2:61,Na2O:13.5,K2O:0,total:100},
    {SiO2:64,Na2O:15.1,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:52,Na2O:0.5,K2O:0,total:100},
    {SiO2:52,Na2O:5,K2O:0,total:100},
    {SiO2:49.4,Na2O:7.3,K2O:0,total:100},
    {SiO2:45,Na2O:9.4,K2O:0,total:100},
    {SiO2:48.4,Na2O:11.5,K2O:0,total:100},
    {SiO2:52.5,Na2O:14,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:57,Na2O:0.5,K2O:0,total:100},
    {SiO2:57,Na2O:5.9,K2O:0,total:100},
    {SiO2:53,Na2O:9.3,K2O:0,total:100},
    {SiO2:48.4,Na2O:11.5,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:63,Na2O:0.5,K2O:0,total:100},
    {SiO2:63,Na2O:7,K2O:0,total:100},
    {SiO2:57.6,Na2O:11.7,K2O:0,total:100},
    {SiO2:52.5,Na2O:14,K2O:0,total:100},
    {SiO2:49.2,Na2O:15.5,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:76.5,Na2O:0.5,K2O:0,total:100},
    {SiO2:69,Na2O:8,K2O:0,total:100},
    {SiO2:69,Na2O:13.5,K2O:0,total:100},
    {SiO2:'NaN',Na2O:'NaN',K2O:'NaN',total:100},
    {SiO2:45,Na2O:5,K2O:0,total:100},
    {SiO2:52,Na2O:5,K2O:0,total:100},
    {SiO2:57,Na2O:5.9,K2O:0,total:100},
    {SiO2:63,Na2O:7,K2O:0,total:100},
    {SiO2:69,Na2O:8,K2O:0,total:100}];
   plotData[1].data=[{SiO2:41,Na2O:3,K2O:0,total:100},
    {SiO2:41,Na2O:7,K2O:0,total:100},
    {SiO2:45,Na2O:9.4,K2O:0,total:100}];
   plotData[2].data=[{SiO2:43,Na2O:12,K2O:0,total:100,label:"F"},
    {SiO2:43,Na2O:2,K2O:0,total:100,label:"Pc"},
    {SiO2:43,Na2O:7,K2O:0,total:100,label:"U1"},
    {SiO2:48,Na2O:10,K2O:0,total:100,label:"U2"},
    {SiO2:52,Na2O:12,K2O:0,total:100,label:"U3"},
    {SiO2:57,Na2O:14.5,K2O:0,total:100,label:"Ph"},
    {SiO2:49,Na2O:2.5,K2O:0,total:100,label:"B"},
    {SiO2:49,Na2O:6,K2O:0,total:100,label:"S1"},
    {SiO2:52,Na2O:7,K2O:0,total:100,label:"S2"},
    {SiO2:57,Na2O:9,K2O:0,total:100,label:"S3"},
    {SiO2:62,Na2O:11,K2O:0,total:100,label:"T"},
    {SiO2:54,Na2O:3,K2O:0,total:100,label:"O1"},
    {SiO2:60,Na2O:4,K2O:0,total:100,label:"O2"},
    {SiO2:67,Na2O:5,K2O:0,total:100,label:"O3"},
    {SiO2:71,Na2O:10,K2O:0,total:100,label:"R"}];
   break;
  case "Trace":
   plotSequence=["Rb","Sr","Y","Zr","Nb","Ba","La","Ce","Pr","Nd",
   "Sm","Eu","Gd","Dy","Er","Yb","Lu","Ta","Th","U"];
   try
   {
    vs=plotSequence[(await app.menu("Trace vs:|"+plotSequence.join("|"),{"id":"Tephra"}))-1];
    ratio="La/Y";
   }catch(e){return;};
   plotInfo.x_calc=vs;
   plotInfo.y_calc=ratio;
   plotInfo.xlabel=vs+" (ppm)";
   plotInfo.ylabel=ratio;
   plotInfo.title=ratio+" vs "+vs;
   plotInfo.pcaVariables="Rb,Sr,Y,Zr,Nb,Ba,La,Ce,Pr,Nd,Sm,Eu,Gd,Dy,Er,Yb,Lu,Ta,Th,U";
   plotInfo.dx_calc="";
   plotInfo.dy_calc="";
   plotInfo.keyTitle="Key";
   plotInfo.category="Trace";
   plotInfo.table="volcTrace";
   multiPlots={plots:[],showKey:true,keyColumn:2,keyRow:2,columns:3};
   pl.multiPlots=multiPlots;
   multiPlots.plots[0]=duplItem(plotInfo);
   nn=1;
   for(n=1;(n-1)<plotSequence.length;n++)
   {
    if(plotSequence[n-1]==vs){continue;};
    multiPlots.plots[nn]=duplItem(plotInfo);
    multiPlots.plots[nn].row=Math.floor((nn-1)/3);
    multiPlots.plots[nn].column=(nn-1)%3;
    multiPlots.plots[nn].selected=true;
    multiPlots.plots[nn].title=plotSequence[n-1];
    multiPlots.plots[nn].x_calc=vs;
    multiPlots.plots[nn].xlabel=vs+" (ppm)";
    multiPlots.plots[nn].ylabel=plotSequence[n-1]+" (ppm)";
    multiPlots.plots[nn].y_calc=plotSequence[n-1];
    nn++;
   };
   multiPlots.keyColumn=(nn-1)%3;
   multiPlots.keyRow=Math.floor((nn-1)/3);
   break;
  };
 };
 pl=integ.pl;
 plotData=pl.plotData;
 ar=this.extractData(typ,data.data);
 if(!pl.tephra.tephra_search||(pl.tephra.tephra_search!=data.tephra_search))
 {
  splm="Split by|";
  switch(data.tephra_search)
  {
  case "volc_region":
   splm+="Region|Volcano|Eruption|Record|Site|Sample";
   spla=[null,"volc_region","volcano","eruption","record","site","series"];
   break;
  case "volcano":
   splm+="Volcano|Eruption|Record|Site|Sample";
   spla=[null,"volcano","eruption","record","site","series"];
   break;
  case "eruption":
   splm+="Eruption|Record|Site|Sample";
   spla=[null,"eruption","record","site","series"];
   break;
  case "record":
   splm+="Record|Site|Sample|Eruption";
   spla=[null,"record","site","series","eruption"];
   break;
  case "series":
   splm+="Sample|Record|Site|Eruption|Instrument|Batch";
   spla=[null,"series","record","site","eruption","instrument","batch"];
   break;
  };
  try
  {
   this.split=spla[await app.menu(splm,{"id":"Tephra"})];
  }catch(e){return;};
  pl.tephra.tephra_search=data.tephra_search;
  pl.tephra.tephra_split=this.split;
 }
 else
 {
  this.split=pl.tephra.tephra_split;
 };
 if(this.split==data.tephra_search)
 {
  pd=[ar];
 }
 else
 {
  pd=this.splitData(ar);
 };
 for(i=0;i<pd.length;i++)
 {
  this.addPlotData(data.tephra_search,this.split,pd[i]);
 };
 pl.render();
 app.showTool('Plot');
};

tephraApp.prototype.sortSector=function(a,b)
{
 if(a["sector"]>b["sector"]){return 1;};
 if(a["sector"]<b["sector"]){return -1;};
 return 0;
};

tephraApp.prototype.sortOnRes=function(a,b)
{
 return a.highRes-b.highRes;
};


tephraApp.prototype.plotShardCount=function(data)
{
 var lowToHigh,zeroToLow,i,sect,sectNames,max,min,width,threshold;
 var plotInfo,plotOptions,plotData,multiPlot;
 var sectMax,shardMax;
 sectNames=new Array;
 sectMax=new Array;
 integ.clearPlot();
 integ.setupPlot();
 pl=integ.pl;
 plotInfo=pl.plotInfo;
 plotInfo.minx=0;
 plotInfo.maxx=5000;
 plotInfo.autox=false;
 plotInfo.miny=0;
 plotInfo.maxy=100;
 plotInfo.autoy=1;
 plotInfo.reversey=false;
 if(integ.record.header && (integ.record.header.z_type=='depth'))
 {
  plotInfo.autoy=2;
 };
 plotInfo.x_calc="tephra_shards";
 plotInfo.dx_calc="";
 plotInfo.y_calc=integ.zUnits()+"(z)";
 plotInfo.dy_calc=integ.zUnits()+"(z_range/2)";
 plotInfo.xlabel="Shard count (per g)";
 plotInfo.ylabel=integ.depthLabel(integ.record,integ.zUnits());
 plotInfo.title=integ.record.header.site;
 
 plotOptions=pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=6; // cm
 plotOptions.plotHeight=12; // cm
 
 plotData=[{name:"",line:"",markerColor:"rgb(0,0,127)",
  markerFill:"rgba(0,0,127,0.25)",
  marker:"histogram",selected:true},
  {name:"",line:"",markerColor:"rgb(0,255,0)",
  markerFill:"rgba(0,255,0,0.25)",
  marker:"histogram",selected:true},
  {name:"",line:"",markerColor:"rgb(255,0,0)",
  markerFill:"rgba(255,0,0,0.25)",
  marker:"diamond",selected:true}];
 pl.plotData=plotData;
 ar=this.extractData("Profile",data.data);
 ar.sort(this.sortSector);
 sect=0;min=1000;max=0;shardMax=0;
 for(i=0;i<ar.length;i++)
 {
  if((i>0)&&(ar[i].sector!=ar[i-1].sector))
  {
   sect++;
  };
  sectNames[sect]=ar[i].sector;
  sectMax[sect]=0;
 };
 sect++;
 for(i=0;i<ar.length;i++)
 {
  for(j=0;j<sect;j++)
  {
   if(sectNames[j]==ar[i].sector)
   {
    ar[i]["tephra_shards_"+j]=ar[i]["tephra_shards"];
    if((ar[i]["tephra_shards"] > sectMax[j]) && (ar[i]["tephra_shards"]!=9999))
    {
     sectMax[j]=ar[i]["tephra_shards"];
    };
   }
   else
   {
    ar[i]["tephra_shards_"+j]="NaN";
   };
  };
  width=Math.abs(ar[i].z_range);
  if(width && (width > max)){max=width;};
  if(width && (width < min) && (width!=0)){min=width;};
  if((ar[i]["tephra_shards"] > shardMax) &&  (ar[i]["tephra_shards"]!=9999))
  {
   shardMax=ar[i]["tephra_shards"];
  };
 };
 if((max > min) && (min>0) && (max/min > 3))
 {
  threshold=min*Math.exp(0.3*Math.log(max/min));
 }
 else
 {
  threshold=0.03;
 };
 for(i=0;i<ar.length;i++)
 {
  width=Math.abs(ar[i].z_range);
  ar[i].highRes=0;
  if(width<threshold)
  {
   ar[i].highRes=1;
  };
  if((width==0) && (ar[i].z==0))
  {
   ar[i].highRes=-1;
  };
 };
 ar.sort(this.sortOnRes);
 lowToHigh=0;zeroToLow=0;
 for(i=0;i<ar.length;i++)
 {
  if((i>0)&&(ar[i].highRes!=ar[i-1].highRes))
  {
   if(ar[i-1].highRes==-1)
   {
    zeroToLow=i;
    lowToHigh=i;
   }
   else
   {
    lowToHigh=i;
   };
  };
 };
 plotData[0].data=ar.slice(zeroToLow,lowToHigh);
 plotData[1].data=ar.slice(lowToHigh);
 plotData[2].data=[];
 for(i=0;i<ar.length;i++)
 {
  for(j=0;j<data.data.length;j++)
  {
   if(data.data[j].series && data.data[j].series.sample && (data.data[j].series.sample==ar[i].sample))
   {
    plotData[2].data.push(duplItem(ar[i]));
    break;
   };
  };
 };
// plotData[2].data=dbData.majorSamples;
 if(sect>1)
 {
  multiPlots={plots:[],showKey:false,keyColumn:0,keyRow:0,columns:sect};
  for(i=0;i<sect;i++)
  {
   if(plotData[0].data.length)
   {
    if(!(plotData[0].data[0]["tephra_shards_"+i])){plotData[0].data[0]["tephra_shards_"+i]="NaN";};
   };
   if(plotData[1].data.length)
   {
    if(!(plotData[1].data[0]["tephra_shards_"+i])){plotData[1].data[0]["tephra_shards_"+i]="NaN";};
   };
   multiPlots.plots[i]=duplItem(plotInfo);
   multiPlots.plots[i].column=i;
   multiPlots.plots[i].selected=true;
   multiPlots.plots[i].title=sectNames[i];
   multiPlots.plots[i].x_calc="tephra_shards_"+i;
   if(sectMax[i])
   {
    multiPlots.plots[i].maxx=sectMax[i]*1.1;
   };
  };
  pl.multiPlots=multiPlots;
 };
 if(shardMax)
 {
  plotInfo.maxx=shardMax*1.1;
 };
 pl.render();
 app.showTool('Plot');
};


tephraApp.prototype.findEruptions=function()
{
 var i,j,k,index={},r,s,e,v;
 function transfer()
 {
  if(e["t"] && e["t_source"])
  {
   e["t_"+e["t_source"]]=e["t"];  
   e["t_"+e["t_source"]+"_sigma"]=e["t_sigma"];  
  };
  if(e["volcano"]){integ.addUnique(this.volcano_options,e["volcano"]);};
  if(e["volc_region"]){integ.addUnique(this.volc_region_options,e["volc_region"]);};
  if(e["eruption"]){integ.addUnique(this.eruption_options,e["eruption"]);};
 };
 function add()
 {
  index[e["eruption"]]=e;
  this.eruptions.push(e);
 };
 function update()
 {
  u=index[e["eruption"]];
  if(e["t"] && (!u["t"]|| (e["t_sigma"] < u["t_sigma"])))
  {
   u["t"]=e["t"];
   u["t_sigma"]=e["t_sigma"];
   u["t_source"]=e["t_source"];
   u["ref"]=e["ref"];
  };
  if(e["t"] && e["t_source"])
  {
   if(!u["t_"+e["t_source"]] || (e["t_"+e["t_source"]+"_sigma"] < u["t_"+e["t_source"]+"_sigma"]))
   {
    u["t_"+e["t_source"]]=e["t_"+e["t_source"]];  
    u["t_"+e["t_source"]+"_sigma"]=e["t_"+e["t_source"]+"_sigma"];  
   };
  };
 };
 this.eruptions=[];
 this.volcano_options=[];
 this.volc_region_options=[];
 this.eruption_options=[];
 for(i=0;i<integ.project.records.length;i++)
 {
  r=integ.project.records[i]
  if(r.site_type!='Volcano'){continue;};
  if(r.file_data){r=r.file_data;}else{continue;};
  for(j=0;j<r.series_list.length;j++)
  {
   s=r.series_list[j];
   if(s.series_type!="Volc_Eruptions"){continue;};
   for(k=0;k<s.data.length;k++)
   {
    e=duplItem(s.data[k]);
    e["volcano"]=r.header.record;
    e["volc_region"]=r.header.region;
    transfer.bind(this)();
    if(index[e.eruption]){update.bind(this)();}
    else{add.bind(this)();};
   };
  };
 };
 for(i=0;i<integ.project.project_series_list.length;i++)
 {
  s=integ.project.project_series_list[i];
  if(s.file_data){s=s.file_data;}else{continue;};
  if(s.project_series_type!="Eruptions"){continue;};
  for(k=0;k<s.data.length;k++)
  {
   e=duplItem(s.data[k]);
   transfer.bind(this)();
   if(index[e.eruption]){update.bind(this)();}
   else{add.bind(this)();};
  };
 };
 this.eruptions.sort(integ.sortOnTime);
};

tephraApp.prototype.extractOptions=function(filt_typ,filt,typ)
{
 var ar=[];
 if(!this.eruptions){this.findEruptions();};
 for(i=0;i<this.eruptions.length;i++)
 {
  if(this.eruptions[i][filt_typ]==filt)
  {
   integ.addUnique(ar,this.eruptions[i][typ]);
  };
 };
 return ar;
};

tephraApp.prototype.extractData=function(typ,data)
{
 var i,j,line,r,s,ar=[],e=false;
 for(i=0;i<data.length;i++)
 {
  switch(typ)
  {
  case "Majors":
   if(data[i].series.series_type!="Tephra_Sample_Majors"){continue;};
   break;
  case "Trace":
   if(data[i].series.series_type!="Tephra_Sample_Trace"){continue;};
   break;
  case "Profile":
   if(data[i].series.series_type!="Tephra_Samples"){continue;};
   break;
  };
  r=data[i].record;
  s=data[i].series;
  e=this.eruption_details(s.volcano,s.eruption); // could be used for animation
  integ.plotIndex(r,s);
  for(j=0;j<s.data.length;j++)
  {
   line=duplItem(s.data[j]);
   line.record=r.header.record;
   line.site=r.header.site;
   line.site_type=r.header.site_type;
   if(typ=="Profile")
   {
   }
   else
   {
    if(!line.ok){continue;};
    if(this.normalise && (typ=="Majors"))
    {
     if(!line.total){continue;};
    };
    line.sample=s.sample;
    line.series=s.series;
    line.context=s.context;
    line.sector=s.sector;
    line.tephra_tye=s.tephra_tye;
    line.tephra_deposit=s.tephra_deposit;
    line.material=s.material;
    line.volc_region=s.volc_region;
    line.volcano=s.volcano;
    line.eruption=s.eruption;
/*    if(e)
    {
     line.t=e.t;
     line.id="tephr"+i+"_"+j;
     line.t_sigma=e.t_sigma;
    };*/
   };
   ar.push(line);
  };
 };
 return ar;
};

tephraApp.prototype.findDatasets=function(mode)
{
 var r,i,j,ar=[],res,rec="",ser="",obj;
 obj={"data":ar,"Majors":false,"Trace":false,"Profile":false};
 function test(type)
 {
  switch(type)
  {
  case "Tephra_Sample_Majors":
   obj.Majors=true;
   break;
  case "Tephra_Sample_Trace":
   obj.Trace=true;
   break;
  case "Tephra_Samples":
   obj.Profile=true;
   break;
  };
 };
 switch(mode)
 {
 case 'Record':
  obj.tephra_search="record";
  obj.tephra_group=integ.record.header.site;
  r=integ.record;
  for(i=0;i<r.series_list.length;i++)
  {
   if(!r.series_list[i].selected){continue;};
   switch(r.series_list[i].series_type)
   {
   case "Tephra_Sample_Majors":
   case "Tephra_Sample_Trace":
   case "Tephra_Samples":
    ar.push({"record":r,"series":r.series_list[i]});
    test(r.series_list[i].series_type);
    break;
   };
  };
  break;
 case 'Series':
  obj.tephra_search="series";
  obj.tephra_group=integ.series.sample;
  ar.push({"record":integ.record,"series":integ.series});
  test(integ.series.series_type);
  break;
 case 'Search':
  res=integ.searchResults;
  obj.tephra_search=res.query.tephra_search;
  obj.tephra_group=res.query.tephra_group;
  for(i=0;i<res.data.length;i++)
  {
   if((rec!=res.data[i].record)&&res.data[i].record)
   {
    rec=res.data[i].record;
    ser="";
    r=integ.findRecord(rec);
    if(!r.file_data){rec="";continue;};
    r=r.file_data;
   };
   if((ser!=res.data[i].series)&&res.data[i].series)
   {
    ser=res.data[i].series;
    s=integ.findSeries(ser,r);
    switch(s.series_type)
    {
    case "Tephra_Sample_Majors":
    case "Tephra_Sample_Trace":
     ar.push({"record":r,"series":s});
     test(s.series_type);
     break;
    };
   };
  };
  break;
 };
 return obj;
};

tephraApp.prototype.showEruptions=function()
{
 var spec,s;
 spec=new itemSpec("data","Eruptions","Array");
 spec.readonly=true;
 spec.transparent=true;
 spec.database=true;
 ss=integ.genSpec(spec,"volcano");
 ss=integ.genSpec(spec,"volc_region");
 ss=integ.genSpec(spec,"eruption");
 ss=integ.genSpec(spec,"eruption_type");
 ss=integ.genSpec(spec,"t");
 ss=integ.genSpec(spec,"t_sigma");
 ss=integ.genSpec(spec,"t_source");
 ss=integ.genSpec(spec,"ref");
 return app.prompt("Eruptions",this.eruptions,spec,{"id":"Tephra"});
};

tephraApp.prototype.volcano_eruptions=function(volc)
{
 var i,erupt=[];
 if(!this.eruptions){return false;};
 if(!volc){return this.eruption_options;};
 for(i=0;i<this.eruptions.length;i++)
 {
  if(this.eruptions[i].volcano==volc)
  {
   erupt.push(this.eruptions[i].eruption);
  };
 };
 if(erupt.length==0){return false;};
 erupt.sort();
 return erupt;
};

tephraApp.prototype.eruption_volcano=function(erupt)
{
 var i;
 if(!this.eruptions){return false;};
 if(!erupt){return false;};
 for(i=0;i<this.eruptions.length;i++)
 {
  if(this.eruptions[i].eruption==erupt)
  {
   return this.eruptions[i].volcano;
  };
 };
 return false;
};

tephraApp.prototype.eruption_details=function(volc,erupt)
{
 if(!volc || !erupt){return false;};
 for(i=0;i<this.eruptions.length;i++)
 {
  if((this.eruptions[i].eruption==erupt)&&(this.eruptions[i].volcano==volc))
  {
   return this.eruptions[i];
  };
 };
 return false;
};

tephraApp.prototype.search=function(type,value)
{
 switch(type)
 {
 case "volc_region":
  return integ.doSearch("Data",{"tephra_search":"volc_region","tephra_group":value,"parameter_list":"record,site,site_type,latitude,longitude,series","where":"((region=='"+value+"')&&(site_type=='Volcano'))||(volc_region=='"+value+"')","order":"record","distinct":true,"search_title":"Region: "+value});
 case "volcano":
  return integ.doSearch("Data",{"tephra_search":"volcano","tephra_group":value,"parameter_list":"record,site,site_type,latitude,longitude,series","where":"(record=='"+value+"')||(volcano=='"+value+"')","order":"record","distinct":true,"search_title":"Volcano: "+value});
 case "eruption":
  return integ.doSearch("Data",{"tephra_search":"eruption","tephra_group":value,"parameter_list":"record,site,site_type,latitude,longitude,series","where":"eruption=='"+value+"'","order":"record","distinct":true,"search_title":"Eruption: "+value}); 
 };
};

tephraApp.prototype.tephraMenu=async function(mode)
{
 var obj,opt=false,opts=[null],men;
 try
 {
  switch(mode)
  {
  case "Project":
   opt=await app.menu("Show|Region|Volcano|Eruption|Eruptions...",{"id":"Tephra"});
   this.findEruptions();
   switch(opt)
   {
   case 1:
    opt=await app.menu("Region|"+this.volc_region_options.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("volc_region",this.volc_region_options[opt-1]);
    integ.showSearchResults();
    break;
   case 2:
    opt=await app.menu("Volcano|"+this.volcano_options.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("volcano",this.volcano_options[opt-1]);
    integ.showSearchResults();
    break;
   case 3:
    opt=await app.menu("Eruption|"+this.eruption_options.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("eruption",this.eruption_options[opt-1]);
    integ.showSearchResults();
    break;
   case 4:
    await this.showEruptions();
    break;
   };
   return;
  case "SearchTephra":
   switch(integ.searchResults.query.tephra_search)
   {
   case "volc_region":
    opt=await app.menu(integ.searchResults.query.tephra_group+"|Volcanos|Eruptions",{"id":"Tephra"});
    break;
   case "volcano":
    opt=2;
    break;
   case "eruption":
    opt=1;
    break;
   };
   switch(opt)
   {
   case 1:opt="volcano";break;
   case 2:opt="eruption";break;
   default:
    app.alert("No tephra functions available");
    return;
   };
   opts=this.extractOptions(integ.searchResults.query.tephra_search,integ.searchResults.query.tephra_group,opt);
   switch(opt)
   {
   case "volcano":
    if(opts.length==1)
    {
     integ.linkRecord(opts[0]);
     break;
    };
    opt=await app.menu("Volcano|"+opts.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("volcano",opts[opt-1]);
    integ.showSearchResults();
    break;
   case "eruption":
    opt=await app.menu("Eruption|"+opts.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("eruption",opts[opt-1]);
    integ.showSearchResults();
    break;
   };
   return;
  case "RecordTephra":
   opt=await app.menu("Search|Tephra|Eruptions");
   switch(opt)
   {
   case 1:
    integ.searchResults=await this.search("volcano",integ.record.header.record);
    integ.showSearchResults();    
    break;
   case 2:
    opts=this.extractOptions("volcano",integ.record.header.record,"eruption");
    opt=await app.menu("Eruption|"+opts.join("|"),{"id":"Tephra"});
    integ.searchResults=await this.search("eruption",opts[opt-1]);
    integ.showSearchResults();    
    break;
   };
   return;
  };
  men="Plot";
  obj=this.findDatasets(mode);
  opt=false;
  if(integ.pl && integ.pl.tephra)
  {
   opt=integ.pl.tephra.type;
   if(!obj[opt]){opt=false;};
  };
  if(!opt)
  {
   if(obj.Majors){men+="|Majors",opts.push("Majors");};
   if(obj.Trace){men+="|Trace",opts.push("Trace");};
   if(obj.Profile){men+="|Profile",opts.push("Profile");};
   if(opts.length<2){app.alert("Nothing to plot");return;};
   if(opts.length==2)
   {
    opt=opts[1];
   }
   else
   {
    opt=opts[await app.menu(men,{"id":"Tephra"})];
   };
  };
  if(opt)
  {
   this.plot(mode,opt,obj);
  };
 }
 catch(e){app.alert(e);};
};


(function () {
 tephra=new tephraApp();
})();

