var dendro;

function dendroApp()
{
/* this.project={masters:[],samples:[]};
 this.project.header={name:"",ring_width:true,d13C:false,d18O:false};*/
 this.master={};
 this.console="";
 this.data={};
 this.fits=[];
 this.masterData=[];
 this.dataData=[];
 this.masterPlot=[];
 this.dataPlot=[];
 this.analysisCache={};
 this.useCache=true;
 this.selected=0;
 this.report='';
 this.plotRaw=false;
 this.fq=new app.queue();
 this.aq=new app.queue();
 this.options=this.defaultOptions();
 this.optionsSpec=this.genOptionsSpec();
 this.invLabel="Investigators: ";
};

dendroApp.prototype.genOptionsSpec=function()
{
 var spec,s,ss,sss;
 var i,filt=[""],filt_wrap=["","none","reflect","mean","null"];
 for(i=0;i<this.options.filters.length;i++)
 {
  filt.push(this.options.filters[i].filter);
 };
 spec=new itemSpec("options","Options","Object");
 spec.inline=true;
 spec.tabbed=true;
 spec.transparent=true;
 s=spec.appendChild("analysis","Analysis","Object");
 s.appendChild("wrap","Wrap filters","Boolean");
 s.appendChild("filter_combine","Combine filtered data","Boolean");
 ss=s.appendChild("trimStart","Trim start","Number");
 ss.hidden=true;
 ss=s.appendChild("trimEnd","Trim end","Number");
 ss.hidden=true;
 s.appendChild("p_priority","P priority","Boolean");
 s.appendChild("mixed","T/P mixed method","Boolean"); 
 s.appendChild("t_threshold","T threshold (dating)","Number");
 s.appendChild("t_x_threshold","T threshold (cross matching)","Number");
 s.appendChild("t_single","T for single tree","Number");
 s.appendChild("threshold","P Threshold","Number");
 s.appendChild("thresholdPower","^1/sqrt(n)","Boolean");
 s.appendChild("n_min","Minimum overlap (dating)","Number");
 s.appendChild("n_x_min","Minimum overlap (cross matching)","Number");
 s.appendChild("d_max_km","Maximum distance (km)","Number");
 ss=s.appendChild("testTrials","Test trials","Number");
 ss.hidden=true;
 ss=s.appendChild("parameters","Parameters","Array");
 sss=ss.appendChild("parameter","Parameter","Text");
 sss.readonly=true;
 sss=ss.appendChild("log","Log","Boolean");
 sss=ss.appendChild("filter","Filter","Text");
 sss.options=filt;
 sss=ss.appendChild("filter_wrap","Wrap","Text");
 sss.options=filt_wrap;
 sss=ss.appendChild("t","T","Boolean");
// sss=ss.appendChild("filter_df","Filter DF","Boolean");
 sss=ss.appendChild("auto_df","AutoC DF","Boolean");
 s=spec.appendChild("plot","Plot","Object");
 s.appendChild("fullMaster","Full master","Boolean");
 ss=s.appendChild("parameters","Parameters","Array");
 sss=ss.appendChild("parameter","Parameter","Text");
 sss.readonly=true;
 sss=ss.appendChild("log","Log","Boolean");
 sss=ss.appendChild("filter","Filter","Text");
 sss.options=filt;
 sss=ss.appendChild("filter_wrap","Wrap","Text");
 sss.options=filt_wrap;
 sss=ss.appendChild("t","T","Boolean");
 s=spec.appendChild("filters","Filters","Array");
 ss=s.appendChild("filter","Filter","Text");
 ss=s.appendChild("weights","Weights","Array");
 ss.inline=true;
 sss=ss.appendChild("weight","Weight","Number");
 sss.special="%.4f";
 return spec;
};

dendroApp.prototype.getFitSpec=function()
{
 var spec,s,ss;
 spec=new itemSpec("fit","Fit output","Object");
 spec.transparent=true;
 spec.inline=true;
 spec.tabbed=true;
 spec.readonly=false;
 s=spec.appendChild("best","Best fit","Array");
 s.appendChild("parm","Parameter","Text");
 if(this.master.dated || (this.master.project_series_type=="Dendro_Master"))
 {
  integ.genSpec(s,"t_from");
  integ.genSpec(s,"t_to");
 }
 else
 {
  ss=s.appendChild("t_from","From","Number");
  ss=s.appendChild("t_to","To","Number");
 };
 ss=s.appendChild("c","r","Number");
 ss.special="%.3f";
 ss=s.appendChild("t","t","Number");
 ss.special="%.3f";
 ss=s.appendChild("p","p","Number");
 ss.special="%.5f";
 ss=s.appendChild("n","n","Number");
/* ss=s.appendChild("apply","Apply","Button");
 ss.readonly=true;
 ss.action="dendro.applyFit(this.parent.object)";*/
 if(this.fitData.comb)
 {
  s=spec.appendChild("comb","Combination","Array");
  if(this.master.dated || (this.master.project_series_type=="Dendro_Master"))
  {
   integ.genSpec(s,"t_from");
   integ.genSpec(s,"t_to");
  }
  else
  {
   ss=s.appendChild("t_from","From","Number");
   ss=s.appendChild("t_to","To","Number");
  };
  ss=s.appendChild("p","P","Number");
  ss.special="%.5f";
 };
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  parm=this.options.analysis.parameters[i].parameter;
  if(!this.fitData[parm]){continue;};
  s=spec.appendChild(parm,this.parameterName(parm),"Array");
  if(this.master.dated || (this.master.project_series_type=="Dendro_Master"))
  {
   integ.genSpec(s,"t_from");
   integ.genSpec(s,"t_to");
  }
  else
  {
   ss=s.appendChild("t_from","From","Number");
   ss=s.appendChild("t_to","To","Number");
  };
  ss=s.appendChild("c","r","Number");
  ss.special="%.3f";
  ss=s.appendChild("t","t","Number");
  ss.special="%.3f";
  ss=s.appendChild("p","p","Number");
  ss.special="%.5f";
  ss=s.appendChild("n","n","Number");
 };
 if(this.fitData.applied && this.fitData.applied.length)
 {
  s=spec.appendChild("applied","Applied fit","Array");
  s.appendChild("parm","Parameter","Text");
  if(this.master.dated || (this.master.project_series_type=="Dendro_Master"))
  {
   integ.genSpec(s,"t_from");
   integ.genSpec(s,"t_to");
  }
  else
  {
   ss=s.appendChild("t_from","From","Number");
   ss=s.appendChild("t_to","To","Number");
  };
  ss=s.appendChild("c","r","Number");
  ss.special="%.3f";
  ss=s.appendChild("t","t","Number");
  ss.special="%.3f";
  ss=s.appendChild("p","p","Number");
  ss.special="%.5f";
 };
 return spec;
};

dendroApp.prototype.parameterName=function(name)
{
 var p=integ.findParameter(name);
 if(p){return p.label;};
 return name;
};

dendroApp.prototype.genFilteredSpec=function(name)
{
 var spec,i;
 spec=new itemSpec("data",name,"Array");
 spec.transparent=true;
 spec.appendChild("t","Year","Number");
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  spec.appendChild(this.options.analysis.parameters[i].parameter,
  	this.parameterName(this.options.analysis.parameters[i].parameter),"Number");
 };
 spec.appendChild("sample_depth","No","Number");
 return spec;
};

dendroApp.prototype.defaultOptions=function()
{
 var o=new Object();
 o.analysis={"wrap":true,"filter_combine":true,"trimStart":0,"trimEnd":0,"p_priority":false,"mixed":false,"t_threshold":5,"t_x_threshold":5,"t_single":10,
 	"threshold":0.85,"p_single":0.99,"thresholdPower":true,"testTrials":20};
 o.analysis.parameters=[];
 o.plot={"fullMaster":false};
 o.plot.parameters=[];
 o.analysis.parameters.push({"parameter":"ring_width","log":true,"filter":"Avg5","t":true});
 o.plot.parameters.push({"parameter":"ring_width","log":true,"filter":"Avg5","t":true});
/*  o.analysis.parameters.push({"parameter":"d13C","log":false,"filter":"","t":true});
  o.plot.parameters.push({"parameter":"d13C","log":false,"filter":"","t":true});
  o.analysis.parameters.push({"parameter":"d18O","log":false,"filter":"","t":true});
  o.plot.parameters.push({"parameter":"d18O","log":false,"filter":"","t":true});*/
o.filters=[{"filter":"Avg5","weights":[0.2,0.2,0.2]},{"filter":"Avg3","weights":[0.33,0.33]},{"filter":"Avg7","weights":[0.1428,0.1428,0.1428,0.1428]},{"filter":"Avg9","weights":[0.1111,0.1111,0.1111,0.1111,0.1111]},{"filter":"Munro","weights":[0.2,0.183152,0.138929,0.083054,0.032927,0.0,-0.013667,-0.013569,-0.007808,-0.002515,0.0,0.000340]},{"filter":"Lanczos1_5","weights":[0.2215,0.1939,0.1269,0.0564,0.0121]},{"filter":"Lanczos2_5","weights":[0.1981,0.1823,0.1402,0.0858,0.0351,0,-0.0156,-0.0158,-0.0088,-0.0023]},{"filter":"Lanczos3_5","weights":[0.2006,0.1863,0.1474,0.0947,0.0416,0,-0.0237,-0.0294,-0.0225,-0.0105,0,0.0055,0.0059,0.0035,0.0010]},{"filter":"Lanczos4_5","weights":[0.1997,0.1861,0.1487,0.0971,0.0437,0,-0.0267,-0.0350,-0.0286,-0.0145,0,0.0097,0.0127,0.0101,0.0049,0,-0.0027,-0.0030,-0.0018,-0.0005]},{"filter":"Lanczos1_3","weights":[0.3690,0.2524,0.0631]},{"filter":"Lanczos2_3","weights":[0.3301,0.2607,0.1129,0.0000,-0.0282,-0.0104]},{"filter":"Lanczos3_3","weights":[0.3343,0.2709,0.1273,0.0000,-0.0488,-0.0312,0.0000,0.0104,0.0042]},{"filter":"Lanczos4_3","weights":[0.3329,0.2722,0.1315,0.0000,-0.0569,-0.0406,0.0000,0.0207,0.0142,0.0000,-0.0053,-0.0022]},{"filter":"Lanczos3_7","weights":[0.1433,0.1380,0.1229,0.1003,0.0733,0.0454,0.0201,0.0000,-0.0135,-0.0201,-0.0207,-0.0171,-0.0113,-0.0051,0.0000,0.0032,0.0044,0.0041,0.0028,0.0014,0.0003]}];
 return o;
};

dendroApp.prototype.showOptions=function(spec)
{
 var opt,sp;
 try
 {
  opt=JSON.parse(spec.object);
 }
 catch(e)
 {
  opt=this.defaultOptions();
  spec.object=JSON.stringify(opt);
 };
 sp=this.genOptionsSpec();
 sp.readonly=true;
 spec.container.appendChild(sp.createDisplay(opt));
};
dendroApp.prototype.globalOptions=function()
{
 var s,opt=this.defaultOptions();
 if(s=integ.findProjectSeries("Dendro_Options"));
 try
 {
  return JSON.parse(s.file_data.code);
 }
 catch(e){return this.defaultOptions();};
};
dendroApp.prototype.showStats=function(spec)
{
 var extr="",nm,p;
 if(!spec.object){return;};
 switch(spec.name)
 {
 case "dated_against":
  nm='dated';
  break;
 case "combines":
  nm='combine';
  break;
 };
 p=spec.parent.object;
 spec.container.appendChild(document.createTextNode(spec.object));
 spec.specialTeX=spec.object;
 if(p[nm+"_n"])
 {
  extr=" (t:"+p[nm+"_t"].toFixed(2);
  if(p[nm+"_p"]){extr+=" p:"+p[nm+"_p"].toFixed(5);};
  extr+=" n:"+p[nm+"_n"]+")";
  spec.container.appendChild(document.createElement('br'));
  spec.container.appendChild(document.createTextNode(extr));
 };
 spec.specialTeX+=" "+extr;
};

dendroApp.prototype.setProject=function()
{
 var s;
 this.project=integ.record;
 this.options=this.globalOptions();
 if(s=integ.findSeries("Dendro_Options"))
 {
  try
  {
   this.options=JSON.parse(s.code);
  }
  catch(e){this.options=this.globalOptions();};
 };
};
/* Dataset manipulations */

dendroApp.prototype.setStart=function(obj,val,dated,fit_stats)
{
 var i,comb,s,shift;
 integ.seriesSpec.emptyContainer();
 shift=val-obj.t_from;
 obj.t_from=val;
 obj.ring_count=obj.data.length;
 obj.t_to=obj.t_from+obj.data.length-1;
 if(dated)
 {
  obj.dated=true;
  obj.dated_against=dated;
  if(fit_stats)
  {
   obj.dated_t=fit_stats.t;
   obj.dated_c=fit_stats.c;
   obj.dated_p=fit_stats.p;
   obj.dated_n=fit_stats.n;
  };
 }
 else
 {
  if(obj.dated && (dated!==null))
  {
   obj.dated=false;
   obj.dated_against='';
   obj.dated_t=null;
   obj.dated_c=null;
   obj.dated_p=null;
   obj.dated_n=null;
  };
 };
 for(i=0;i<obj.data.length;i++)
 {
  obj.data[i].t=val+i;
 };
 integ.seriesSpec.fillContainer();
 if(obj.combines)
 {
  comb=obj.combines.split(",");
  for(i=0;i<comb.length;i++)
  {
   s=this.findSample(comb[i]);
   if(s!=-1)
   {
    this.shift(this.project.series_list[s],shift,dated);
   };
  };
 };
};

dendroApp.prototype.meanRW=function(obj,hw)
{
 var i,rw=0,n=0,end=obj.data.length;
 if(obj.sapwood && hw){end-=Math.floor(obj.sapwood);};
 for(i=0;i<end;i++)
 {
  if(obj.data[i].ring_width)
  {
   n++;
   rw+=obj.data[i].ring_width;
  };
 };
 return (rw/n).toFixed(2);
};

dendroApp.prototype.setEndDirect=function(obj,val,dated)
{
 var i,comb,s,shift;
 integ.seriesSpec.emptyContainer();
 obj.ring_count=obj.data.length;
 shift=Number(val)-obj.t_to;
 obj.t_to=Number(val);
 if(dated){obj.t_to_orig=obj.t_to;};
 obj.t_from=obj.t_to-obj.data.length+1;
 obj.dated=dated;
 for(i=0;i<obj.data.length;i++)
 {
  obj.data[i].t=obj.t_from+i;
 };
 integ.seriesSpec.fillContainer();
 if(obj.combines)
 {
  comb=obj.combines.split(",");
  for(i=0;i<comb.length;i++)
  {
   s=this.findSample(comb[i]);
   if(s!=-1)
   {
    if(!this.project.series_list[s].selected) // only shifts unselected items
    {
     this.shift(this.project.series_list[s],shift,dated);
    };
   };
  };
 }; 
};

dendroApp.prototype.setEnd=function(obj,val,dated,fit_stats)
{
 this.setStart(obj,val-obj.data.length+1,dated,fit_stats);
};

dendroApp.prototype.resetEnd=function(obj,orig)
{
 if(obj.t_to_orig && orig)
 {
  this.setEndDirect(obj,obj.t_to_orig,true);
 }
 else
 {
  this.setEndDirect(obj,0,false);
 };
 obj.dated_against='';
};


dendroApp.prototype.shift=function(obj,val,dated)
{
 this.setStart(obj,obj.t_from+val,dated);
};

dendroApp.prototype.tsShift=function(obj,val)
{
 var i;
 obj.t_from+=val;
 obj.t_from=Number(obj.t_from.toPrecision(10));
 if(obj.t_to_orig){obj.t_to_orig+=val;};
 obj.ring_count=obj.data.length;
 obj.t_to=obj.t_from+obj.data.length-1;
 for(i=0;i<obj.data.length;i++)
 {
  obj.data[i].t=obj.t_from+i;
 };
};

dendroApp.prototype.editHeader=function(spec)
{
 switch(spec.name)
 {
 case "t_from":
 case "t_to":
  if(typeof(spec.parent.object.dated)!='undefined')
  {
   if(!spec.parent.object.dated)
   {
    app.prompt(spec.prompt,spec.object).then(function(rpl)
    {
     if(isNaN(rpl)){return;};
     rpl=Number(rpl);
     if(spec.name=="t_to")
     {
      this.setEnd(spec.parent.object,rpl,null);
     }
     else
     {
      this.setStart(spec.parent.object,rpl,null);
     };
     spec.changer();
    }.bind(this)).catch(function(e){app.alert(e);})
    break;
   };
  };
 case "t_to_orig":
  this.checkRecordHemisphere(integ.record).then(function(t_source){
   var torig=spec.object;
   if(!isNaN(torig)&&(torig!==null))
   {
    if(t_source=="DendroSH")
    {
     torig+=integ.project.options.t_schulman?(-0.5):(0.5);
    };
   };
   app.prompt(spec.prompt+" ("+integ.project.options.t_units+")",integ.writeDate(torig)).then(function(rpl)
   {
    if(isNaN(rpl)||(rpl===null))
    {
     spec.emptyContainer();
     spec.object=rpl;
     spec.fillContainer();
     return;
    };
    rpl=Number(rpl);
    rpl=integ.readDate(rpl);
    if(t_source=="DendroSH")
    {
     rpl+=integ.project.options.t_schulman?(0.5):(-0.5);
    };
    integ.projectSeriesSpec.emptyContainer();
    switch(spec.name)
    {
    case "t_to":
     this.setEnd(spec.parent.object,rpl,null);
     break;
    case "t_from":
     this.setStart(spec.parent.object,rpl,null);
     break;
    default:
     spec.emptyContainer();
     spec.object=rpl;
     spec.fillContainer();
     break;
    };
    integ.projectSeriesSpec.fillContainer();
    spec.changer();
   }.bind(this)).catch(function(e){app.alert(e);});
  }.bind(this)).catch(function(e){app.alert(e);})
  break;
 case "t_source":
  app.menu("Hemisphere|NH|SH|undefined",{"id":"dendro"}).then(function(rpl){
   this.setHemisphere(spec.parent.object,(['','DendroNH','DendroSH',''])[rpl]);
  }.bind(this)).catch(function(e){app.alert(e);});
  break;
 };
};

dendroApp.prototype.checkImport=function(ser)
{
 var st=null,end=null,i,j;
 for(i=0;i<ser.data.length;i++)
 {
  if(typeof(ser.data[i].t)=='number')
  {
   if((st==null)||(ser.data[i].t<st)){st=ser.data[i].t;};
   if((end==null)||(ser.data[i].t>end)){end=ser.data[i].t;};
  }
  else
  {
   if((st!==null)&&(end!==null))
   {
    ser.data.splice(i);
   };
  };
 };
 if((st!==null)&&(end!==null))
 {
  ser.data.sort(function(a,b){return a.t-b.t;});
  ser.t_from=st;ser.t_to=end;
 };
 ser.ring_count=ser.data.length;
 for(i=0;i<ser.data.length;i++)
 {
  if(typeof(ser.data[i].z)!='number'){ser.data[i].z=i+1;};
  if(typeof(ser.data[i].sample_depth)!='number'){ser.data[i].sample_depth=1;};
  ser.data[i].t=ser.t_from+i;
 };
};

dendroApp.prototype.switchHemisphere=function(obj,from,to)
{
 switch(to)
 {
 case "DendroNH":
  if(!integ.yearBoundary(obj.t_from)){break;};
  switch(from)
  {
  case "DendroSH":
   this.tsShift(obj,-0.5);
   break;
  default:
   this.tsShift(obj,0.5);
   break;
  };
  break;
 case "DendroSH":
  switch(from)
  {
  case "DendroNH":
   this.tsShift(obj,0.5);
   break;
  default:
   if(integ.yearBoundary(obj.t_from+0.5))
   {
    this.tsShift(obj,0.5);
   }
   else
   {
    if(integ.yearBoundary(obj.t_from))
    {
     this.tsShift(obj,1);
    };
   };
   break;
  };
  break;
 default:
  switch(obj.t_source)
  {
  case "DendroSH":
   if(integ.yearBoundary(obj.t_from))
   {
    this.tsShift(obj,-1);
   };
   break;
  case "DendroNH":
   if(integ.yearBoundary(obj.t_from-0.5))
   {
    this.tsShift(obj,-0.5);
   };
   break;
  };
  break;
 };
};

dendroApp.prototype.setHemisphere=function(obj,hem,force)
{
 var i,needed;
 if(obj.header)  // this is a record not a master chronology
 {
  if(obj.header.t_source==hem){return;};
  needed=false;
  for(i=0;i<obj.series_list.length;i++)
  {
   if((obj.series_list[i].series_type=="Dendro_Sample") && obj.series_list[i].dated)
   {
    if(!needed){integ.seriesSpec.emptyContainer();needed=true;};
    this.switchHemisphere(obj.series_list[i],obj.header.t_source,hem);
   };
  };
  if(needed || force)
  {
   integ.recordSpec.emptyContainer();
   obj.header.t_source=hem;
   obj.header.site_type="Dendrochronological";
   integ.recordSpec.fillContainer();
   integ.onRecordChange();
  };
  return;
 };
 if(obj.t_source==hem){return;};
 integ.projectSeriesSpec.emptyContainer();
 this.switchHemisphere(obj,obj.t_source,hem);
 obj.t_source=hem;
 integ.projectSeriesSpec.fillContainer();
 integ.onProjectSeriesChange();
};


dendroApp.prototype.checkRecordHemisphere=function(r)
{
 return new Promise(async function(resolve,reject){
  var hem;
  switch(r.header.t_source)
  {
  case "DendroNH":
  case "DendroSH":
   break;
  default:
   if(r.header.latitude)
   {
    if(r.header.latitude>0){hem=1;}else{hem=2;};
   }
   else
   {
    try
    {
     hem=await app.menu("Hemisphere|NH|SH",{"id":"dendro"});
    }
    catch(e)
    {
     reject(e);
     return;
    };
   };
   this.setHemisphere(r,[r.header.t_source,'DendroNH','DendroSH'][hem],true);
   break;
  };
  resolve(r.header.t_source);
 }.bind(this));
};


dendroApp.prototype.findSample=function(keyCode)
{
 var i;
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].series==keyCode)
  {
   return i;
  };
 };
 return -1;
};

dendroApp.prototype.findData=function(keyCode)
{
 var i;
 for(i=0;i<integ.project.project_series_list.length;i++)
 {
  if(integ.project.project_series_list[i].project_series_type!="Dendro_Master"){continue;};
  if(integ.project.project_series_list[i].series==keyCode)
  {
   return integ.project.project_series_list[i].file_data;
  };
 };
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].series==keyCode)
  {
   return this.project.series_list[i];
  };
 };
 return false;
};

dendroApp.prototype.indexFilters=function()
{
 var i;
 this.filterIndex={};
 for(i=0;i<this.options.filters.length;i++)
 {
  this.filterIndex[this.options.filters[i].filter]=this.options.filters[i].weights;
 };
};

dendroApp.prototype.trimData=function(dat)
{
 var i;
 td=[];
 for(i=this.options.analysis.trimStart;i<dat.length-this.options.analysis.trimEnd;i++)
 {
  td.push(dat[i]);
 };
 return td;
};

dendroApp.prototype.isNaNoN=function(v)
{
 return (isNaN(v)||(typeof(v)!='number'));
};

dendroApp.prototype.rawData=function(dat,filt)
{
 var i,j,k,obj,sm,v,sw,smsq,sd,n,m;
 fd=JSON.parse(JSON.stringify(dat)); // take copy
 for(j=0;j<filt.length;j++)
 {
   sm=0;smsq=0;n=0;
   for(i=0;i<fd.length;i++)
   {
    if(!this.isNaNoN(fd[i][filt[j].parameter]))
    {
     n++;
     sm+=fd[i][filt[j].parameter];
     smsq+=fd[i][filt[j].parameter]*fd[i][filt[j].parameter];
    };
   };
   m=sm/n;
   for(i=0;i<fd.length;i++)
   {
    if(!isNaN(fd[i][filt[j].parameter]))
    {
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=filt[j].toffset-m;
     };
    }
    else
    {
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=null;
     };
    };
   };
 };
 return fd;
};

dendroApp.prototype.offsetIndex=function(i,offs,max)
{
 if(i+offs < 0)
 {
  return this.offsetIndex(-(i+offs),0,max);
 };
 if(i+offs >= max)
 {
  return this.offsetIndex(2*max-i-offs-2,0,max);
 };
 return i+offs;
};

dendroApp.prototype.offsetValue=function(d,i,offs,max,filt,mean)
{
 var ind=i+offs;
 if((ind < 0)||(ind >= max))
 {
  switch(filt.filter_wrap)
  {
  case "null":
   return null;
  case "mean":
   return mean;
  default:
   ind=this.offsetIndex(i,offs,max);
   break;
  };
 };
 if(this.isNaNoN(d[ind][filt.parameter]) && (filt.filter_wrap=="mean")){return mean;};
 return d[ind][filt.parameter];
};

dendroApp.prototype.filterData=function(dat,filt,pre)
{
 var i,j,k,obj,sm,v,sw,smsq,sd,n,m,fd,mean=null;
 var margin=0;
 this.indexFilters();
 for(j=0;j<filt.length;j++)
 {
  if(filt[j].filter)
  {
   if((this.filterIndex[filt[j].filter].length-1>margin)&&(!this.options.analysis.wrap))
   {
    margin=this.filterIndex[filt[j].filter].length-1;
   };
  };
 };
 fd=[];
 for(i=margin;i<dat.length-margin;i++)
 {
  obj={};
  obj.t=dat[i].t;
  obj.sample_depth=dat[i].sample_depth;
  obj.z=dat[i].z;
  for(j=0;j<filt.length;j++)
  {
   obj[filt[j].parameter]=dat[i][filt[j].parameter];
  };
  fd.push(obj);
 };
 for(j=0;j<filt.length;j++)
 {
  mean=null;
  if(filt[j].filter_wrap=="mean")
  {
   mean=0;sw=0;
   for(i=0;i<dat.length;i++)
   {
    if(!this.isNaNoN(dat[i][filt[j].parameter]))
    {
     mean+=dat[i][filt[j].parameter];
     sw++;
    };
   };
   if(sw){mean/=sw;}else{mean=null;};
  };
  for(i=0;i<fd.length;i++)
  {
   // first of all does log
   if(filt[j].log && (fd[i][filt[j].parameter]<=0)){fd[i][filt[j].parameter]=null;};
   if(filt[j].log && !this.isNaNoN(fd[i][filt[j].parameter]))
   {
    fd[i][filt[j].parameter]=Math.log(fd[i][filt[j].parameter]);
   };
   // then does filtration
   if(filt[j].filter && !this.isNaNoN(fd[i][filt[j].parameter]) && !pre)
   {
    sm=0;sw=0;
    /* picks up data from original array */
    for(k=0;k<this.filterIndex[filt[j].filter].length;k++)
    {
     v=this.offsetValue(dat,i+margin,k,fd.length+2*margin,filt[j],mean);
     if(filt[j].log && (v<=0)){v=null;};
     if(!this.isNaNoN(v))
     {
      if(filt[j].log){v=Math.log(v);};
      sm+=v*this.filterIndex[filt[j].filter][k];
      sw+=this.filterIndex[filt[j].filter][k];
     };
     if(k>0)
     {
      v=this.offsetValue(dat,i+margin,-k,fd.length+2*margin,filt[j],mean);
      if(filt[j].log && (v<=0)){v=null;};
      if(!this.isNaNoN(v))
      {
       if(filt[j].log){v=Math.log(v);};
       sm+=v*this.filterIndex[filt[j].filter][k];
       sw+=this.filterIndex[filt[j].filter][k];
      };
     };
    };
    // subtracts smoothed data
    if(this.isNaNoN(sm)||(sw==0))
    {
     fd[i][filt[j].parameter]=null;
    }
    else
    {
     fd[i][filt[j].parameter]-=sm/sw;
    };
   };
  };
 };
 for(j=0;j<filt.length;j++)
 {
  if(filt[j].t)
  {
   sm=0;smsq=0;n=0;
   for(i=0;i<fd.length;i++)
   {
    if(!this.isNaNoN(fd[i][filt[j].parameter]))
    {
     n++;
     sm+=fd[i][filt[j].parameter];
     smsq+=fd[i][filt[j].parameter]*fd[i][filt[j].parameter];
    };
   };
   m=sm/n;
   sd=Math.sqrt(smsq/n-m*m);
   for(i=0;i<fd.length;i++)
   {
    if(!this.isNaNoN(fd[i][filt[j].parameter]))
    {
     fd[i][filt[j].parameter]=(fd[i][filt[j].parameter]-m)/sd;
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=filt[j].toffset;
     };
    }
    else
    {
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=null;
     };
    };
   };
  }
  else
  {
   sm=0;smsq=0;n=0;
   for(i=0;i<fd.length;i++)
   {
    if(!this.isNaNoN(fd[i][filt[j].parameter]))
    {
     n++;
     sm+=fd[i][filt[j].parameter];
     smsq+=fd[i][filt[j].parameter]*fd[i][filt[j].parameter];
    };
   };
   m=sm/n;
   for(i=0;i<fd.length;i++)
   {
    if(!this.isNaNoN(fd[i][filt[j].parameter]))
    {
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=filt[j].toffset-m;
     };
    }
    else
    {
     if(typeof(filt[j].toffset)!='undefined')
     {
      fd[i][filt[j].parameter+"_offset"]=null;
     };
    };
   };
  };
 };
 return fd;
};

dendroApp.prototype.getDataStats=function(d)
{
 var f,i,j,sm,smsq,n,stats=[],v;
 f=this.options.analysis.parameters;
 for(i=0;i<f.length;i++)
 {
  stats[i]={parameter:f[i].parameter,log:f[i].log,mu:0,sigma:1,sample_depth:0};
  sm=0;smsq=0;n=0;
  for(j=0;j<d.length;j++)
  {
   if(!this.isNaNoN(d[j][f[i].parameter]))
   {
    v=d[j][f[i].parameter];
    if(stats[i].log){v=Math.log(v);};
    sm+=v;
    smsq+=v*v;
    n++;
    stats[i].sample_depth+=d[j]['sample_depth'];
   };
  };
  if((n!=0)&&(f[i].filter||f[i].t))
  {
   stats[i].mu=sm/n;
   stats[i].sigma=Math.sqrt(smsq/n-stats[i].mu*stats[i].mu);
  };
 };
 return stats;
};

dendroApp.prototype.mergeData=function(a,b,fit_stats)
{
 var sa,sb,sc,obj,i,ai,bi,fa,fb,obj,dt,n,f;
 f=this.options.analysis.parameters;
 
 sa=this.getDataStats(a.data);
 sb=this.getDataStats(b.data);
 sc=[];
 for(i=0;i<f.length;i++)
 {
  sc[i]={parameter:f[i].parameter,log:f[i].log,mu:0,sigma:1,sample_depth:0};
  sc[i].sample_depth=sa[i].sample_depth+sb[i].sample_depth;
  sc[i].mu=(sa[i].sample_depth*sa[i].mu+sb[i].sample_depth*sb[i].mu)/sc[i].sample_depth;
  sc[i].sigma=(sa[i].sample_depth*sa[i].sigma+sb[i].sample_depth*sb[i].sigma)/sc[i].sample_depth;
 };
 obj={series_type:"Dendro_Sample",series:a.series,sapwood:0,notes:"",data:[]};
 obj.parameter_list=integ.mergeLists(a.parameter_list,b.parameter_list).join(",");
 obj.dated=a.dated && b.dated;
 if(this.options.analysis.filter_combine || a.filtered || b.filtered)
 {
  obj.filtered=true;
  fa=this.filterData(a.data,this.options.analysis.parameters,a.filtered);
  fb=this.filterData(b.data,this.options.analysis.parameters,b.filtered);
 }
 else
 {
  obj.filtered=false;
  fa=a.data;fb=b.data;
 };
 obj.t_from=fa[0].t;obj.t_to=fa[fa.length-1].t;
 if(fb[0].t<obj.t_from){obj.t_from=fb[0].t;};
 if(fb[fb.length-1].t>obj.t_to){obj.t_to=fb[fb.length-1].t;};
 obj.ring_count=obj.t_to-obj.t_from+1;
 for(i=0;(i<b.series.length)&&
  		(i<a.series.length)&&
  		(a.series.charAt(i)==b.series.charAt(i)&&
  		isNaN(a.series.charAt(i)));i++){};
 obj.series+='_';
 for(;(i<b.series.length);i++)
 {
  obj.series+=b.series.charAt(i);
 };
 obj.combines=a.series+","+b.series;
 if(fit_stats)
 {
  obj.combine_t=fit_stats.t;
  obj.combine_c=fit_stats.c;
  obj.combine_p=fit_stats.p;
  obj.combine_n=fit_stats.n;
 };
 for(i=obj.t_from;i<=obj.t_to;i++)
 {
  ai=i-fa[0].t;
  bi=i-fb[0].t;
  dt={t:i,sample_depth:0};
  for(j=0;j<f.length;j++)
  {
   n=0;
   dt[f[j].parameter]=0;
   if(ai>-1 && ai<fa.length)
   {
    if(!this.isNaNoN(fa[ai][f[j].parameter]))
    {
     n+=fa[ai].sample_depth;
     dt[f[j].parameter]+=fa[ai][f[j].parameter]*fa[ai].sample_depth;
    };
   };
   if(bi>-1 && bi<fb.length)
   {
    if(!this.isNaNoN(fb[bi][f[j].parameter]))
    {
     n+=fb[bi].sample_depth;
     dt[f[j].parameter]+=fb[bi][f[j].parameter]*fb[bi].sample_depth;
    };
   };
   if(n==0)
   {
    dt[f[j].parameter]=null;
   }
   else
   {
    dt[f[j].parameter]/=n;
    if(n>dt.sample_depth){dt.sample_depth=n;};
   };
   if(obj.filtered && !this.isNaNoN(dt[f[j].parameter]))
   {
    dt[f[j].parameter]*=sc[j].sigma;
    dt[f[j].parameter]+=sc[j].mu;
    if(sc[j].log){dt[f[j].parameter]=Math.exp(dt[f[j].parameter]);};
   };
  };
  obj.data.push(dt);
 };
 obj.created=true;
 return obj;
};

dendroApp.prototype.readArray=function(ar,typ)
{
 var ra,i,ok=false;
 ra=[];
 for(i=0;i<ar.length;i++)
 {
  ra[i]=ar[i][typ];
  if(ok || !this.isNaNoN(ra[i])){ok=true;};
 };
 if(!ok){return [];};
 return ra;
};

dendroApp.prototype.sqr=function(x){return x*x;};

dendroApp.prototype.correl=function(X,Y,offs)
{
 // ref for equations: http://cybis.se/forfun/dendro/newmath2/index.htm
 // Mx=Sum(X)/n
 // Sx=Sqrt(Sum((X-Mx)*(X-Mx))/n)  and same for Y
 // c=Sum((X-Mx)*(Y-My)/(Sx*Sy))/n
 // t=c*Math.sqrt((n-2)/(1-c*c)) - also given in Baillie and Pilcher 1973
 //
 // ref for chi-squared: https://c14.arch.ox.ac.uk/fs/get_file.php?view=true&filename=PDF:/bronkramsey2001wmr.pdf
 // chi=Sum((X-Y)*(X-Y)/(R*R))  where R is the standard deviation of the residuals
 // prob prop to exp(-chi/2)
  var i,j,n=0,Mx=0,My=0,Sx=0,Sy=0,c=0,r=0,t,res;
  if(!X||!Y)
  {
   return false;
  };
  for(i=offs,j=0;(i<X.length) && (j<Y.length);i++,j++)
  {
   if(i<0){continue;};if(this.isNaNoN(X[i])||this.isNaNoN(Y[j])){continue;};
   n++;
   Mx+=X[i];My+=Y[j];
  };
  if(n==0){return false;};
  Mx/=n;My/=n;
  for(i=offs,j=0;(i<X.length) && (j<Y.length);i++,j++)
  {
   if(i<0){continue;};if(this.isNaNoN(X[i])||this.isNaNoN(Y[j])){continue;};
   Sx+=this.sqr(X[i]-Mx);Sy+=this.sqr(Y[j]-My);
  };
  Sx/=n;Sy/=n;
  Sx=Math.sqrt(Sx);Sy=Math.sqrt(Sy);
  for(i=offs,j=0;(i<X.length) && (j<Y.length);i++,j++)
  {
   if(i<0){continue;};if(this.isNaNoN(X[i])||this.isNaNoN(Y[j])){continue;};
   c+=(X[i]-Mx)*(Y[j]-My);
  };
  c/=Sx*Sy*n;
  t=c*Math.sqrt((n-2)/(1-c*c));
  for(i=offs,j=0;(i<X.length) && (j<Y.length);i++,j++)
  {
   if(i<0){continue;};if(this.isNaNoN(X[i])||this.isNaNoN(Y[j])){continue;};
//   if(c>0)
//   {
    r+=this.sqr((X[i]-Mx)/Sx-(Y[j]-My)/Sy); // assume positive correlation
//   }
//   else
//   {
//    r+=this.sqr((X[i]-Mx)/Sx+(Y[j]-My)/Sy); // assume positive correlation
//   };
  };
  r/=n;
  r=Math.sqrt(r);
  res={};
  res.c=Number(c.toFixed(5));
  res.t=Number(t.toFixed(5));
  res.r=Number(r.toFixed(5));
  res.n=n;
  return res;
 };
 
 dendroApp.prototype.overlapArray=function(X,Y,offs)
 {
  var Z=[];
  var i,j,n=0,space=true;
  if(!X||!Y)
  {
   return false;
  };
  for(i=offs,j=0;(i<X.length) && (j<Y.length);i++,j++)
  {
   if(i<0){continue;};if(this.isNaNoN(X[i])||this.isNaNoN(Y[j]))
   {
    if(!space){Z.push(null);space=true;};
    continue;
   };
   n++;
   space=false;
   Z.push(X[i]);
  };
  if(n==0){return false;};
  return Z;
 };

dendroApp.prototype.autoCorrel=function(X)
{
 return this.correl(X,X,1);
};

dendroApp.prototype.avgSqr=function(ar,typ)
{
 if(ar.length<1){return false;};
 var i,x=0,v;
 for(i=0;i<ar.length;i++)
 {
  if(typ){v=ar[i][typ]*ar[i][typ];}else{v=ar[i]*ar[i];};
  if(this.isNaNoN(v)){continue;};
  x+=v;
 };
 return x/ar.length;
};

dendroApp.prototype.normalise=function(ar,typ)
{
 if(ar.length<1){return false;};
 var i,s=0,v;
 for(i=0;i<ar.length;i++)
 {
  if(typ){v=ar[i][typ];}else{v=ar[i];};
  if(this.isNaNoN(v)){continue;};
  s+=v;
 };
 if(s==0){return ar;};
 for(i=0;i<ar.length;i++)
 {
  if(typ)
  {
   if(this.isNaNoN(ar[i][typ])){ar[i][typ]=null;continue;};
   ar[i][typ]=Number(ar[i][typ]/s);
  }
  else
  {
   if(this.isNaNoN(ar[i])){ar[i]=null;continue;};
   ar[i]=Number(ar[i]/s);
  };
 };
 return ar;
};

dendroApp.prototype.calc_p=function(r,rEst,n) //n degrees of freedom
{
 return Math.exp((n/2)*(1-(r*r)/(rEst*rEst)));
};

dendroApp.prototype.checkFit=function(typ,d,m)
{
 var dat,mas,cobj,aobj,i,r1,r2,ovr,i,ff=false;
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  if(this.options.analysis.parameters[i].parameter==typ)
  {
   ff=this.options.analysis.parameters[i];
   break;
  };
 };
 ar=new Array();
 dat=this.readArray(d,typ);
 mas=this.readArray(m,typ);
 cobj=this.correl(mas,dat,d[0].t-m[0].t);
 if(ff && ff.auto_df && (ovr=this.overlapArray(mas,dat,d[0].t-m[0].t))&&(r2=this.autoCorrel(ovr)))
 {
  r1=this.autoCorrel(dat);
  cobj.df=cobj.n*(1-Math.abs(r1.c*r2.c))/(1+Math.abs(r1.c*r2.c));
  cobj.df-=cobj.n*(this.filterIndex[ff.filter][0])+2;
  cobj.df=Math.floor(cobj.df);
  cobj.t=cobj.c*Math.sqrt((cobj.df)/(1-cobj.c*cobj.c));
 };
 return cobj;
};

dendroApp.prototype.fitOne=function(typ,ff)
{
 var i,j,car,rEst,ar,dat,mas,cobj,aobj,df,r1,r2,ovr;
 var overlap=10;
 rpd=false;
 ar=new Array();
 dat=this.readArray(this.filteredData,typ);
 if(dat.length==0){return ar;};
 mas=this.readArray(this.filteredMaster,typ);
 if(mas.length==0){return ar;};
 if(ff && ff.auto_df)
 {
  r1=this.autoCorrel(dat);
 };
 for(i=-dat.length+overlap;i<mas.length-overlap+1;i++)
 {
  aobj={};
  aobj.index=ar.length;
  aobj.t_from=this.master.data[0].t+i;
  aobj.t_to=aobj.t_from+this.data.data.length-1;
  aobj.offs=(aobj.t_from+this.data.data.length-1)-(this.master.t_from+this.master.data.length-1);
  cobj=this.correl(mas,dat,i);
  aobj.c=cobj.c;
  aobj.t=cobj.t;
  aobj.r=cobj.r;
  aobj.n=cobj.n;
  if(ff && ff.auto_df && r1 && (ovr=this.overlapArray(mas,dat,i))&&(r2=this.autoCorrel(ovr)))
  {
   aobj.df=aobj.n*(1-Math.abs(r1.c*r2.c))/(1+Math.abs(r1.c*r2.c));
   aobj.df-=aobj.n*(this.filterIndex[ff.filter][0])+2;
   aobj.df=Math.floor(aobj.df);
   aobj.t=aobj.c*Math.sqrt((aobj.df)/(1-aobj.c*aobj.c));
  };
  ar.push(aobj);
 };
 rEst=Math.sqrt(this.avgSqr(ar,"r"));
 for(i=0;i<ar.length;i++)
 {
  df=ar[i].n;
  df-=2;
  if(ff){df*=(1-this.filterIndex[ff.filter][0]);};
  ar[i].p=this.calc_p(ar[i].r,rEst,df);
 };
 return this.normalise(ar,"p");
};

dendroApp.prototype.combine=function(ar1,ar2)
{
 var i;
 for(i=0;i<ar2.length;i++)
 {
  if(i>=ar1.length)
  {
   ar1[i]={};
   ar1[i].index=ar2[i].index;
   ar1[i].t_from=ar2[i].t_from;
   ar1[i].t_to=ar2[i].t_to;
   ar1[i].n=ar2[i].n;
   ar1[i].p=ar2[i].p;
  }
  else
  {
   ar1[i].p=ar1[i].p*ar2[i].p;
  };
 };
 return this.normalise(ar1,"p");
};

dendroApp.prototype.showFit=function(parm,i,typ)
{
 var obj;
 obj=duplItem(this.fitData[parm][i]);
 obj.parm=parm;
 if(parm=="comb"){obj.c=null;obj.t=null;obj.r=null;};
 if(!this.isNaNoN(obj.p)){this.fitData[typ].push(obj);};
// this.fitData[typ].push(obj);
};

dendroApp.prototype.parmUsed=function(o,parm)
{
 var i,j;
 if(!o.data || !o.data.length)
 {
  //check if array of data
  if(o.length)
  {
   for(i=0;i<o.length;i++)
   {
    for(j=0;j<o[i].length;j++)
    {
     if(o[i][j][parm]){return true;};
    };
   };
  };
  return false;
 };
 for(i=0;i<o.data.length;i++)
 {
  if(o.data[i][parm]){return true;};
 };
 return false;
};

dendroApp.prototype.fitAll=function()
{
 var parms=0;
 this.fitData={comb:[],best:[],applied:[]};
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  parm=this.options.analysis.parameters[i].parameter;
  if(!this.parmUsed(this.data,parm)||!this.parmUsed(this.master,parm))
  {
   continue;
  };
  if(this.options.analysis.parameters[i].filter)
  {
   this.fitData[parm]=this.fitOne(parm,this.options.analysis.parameters[i]);
  }
  else
  {
   this.fitData[parm]=this.fitOne(parm);
  };
  parms++;
  this.combine(this.fitData.comb,this.fitData[parm]);
  this.showFit(parm,this.findBestFit(parm),"best");
 };
 if(parms<2)
 {
  this.fitData["comb"]=null;
 }
 else
 {
  this.showFit("comb",this.findBestFit("comb"),"best");
 };
};

dendroApp.prototype.fit=function()
{
 var i,parm;
 this.filteredMaster=this.filterData(this.master.data,this.options.analysis.parameters,this.master.filtered);
 this.filteredData=this.filterData(this.trimData(this.data.data),this.options.analysis.parameters,this.data.filtered);
 this.fitAll();
 this.plotFit();
};

dendroApp.prototype.findBestFit=function(mode)
{
 var i,mx,j,md;
 j=0,mx=0;
 if(!this.fitData[mode]){return -1;};
 for(i=0;i<this.fitData[mode].length;i++)
 {
  if(this.fitData[mode][i].p>mx && (this.fitData[mode][i].t || (mode=="comb")))
  {
   j=i;mx=this.fitData[mode][i].p;
  };
 };
 return j;
};

dendroApp.prototype.applyBestFit=function(mode)
{
 var j=this.findBestFit(mode);
 if(j==-1){return;};
 var p=this.fitData[mode][j].p;
 var t=this.fitData[mode][j].t;
 var n=this.fitData[mode][j].n;
 var th=this.options.analysis.threshold;
 if(this.options.analysis.mixed||this.options.analysis.p_priority)
 {
  if(this.options.analysis.thresholdPower)
  {
   th=Math.exp((1/Math.sqrt(n))*Math.log(th));
  };
  if(p<th)
  {
  	alert("Fit below P threshold ("+p.toFixed(3)+" < "+th.toFixed(3)+")");
 	return;
  };
 };
 if(this.options.analysis.mixed||!this.options.analysis.p_priority)
 {
  th=this.options.analysis.t_threshold;
  if(t<th)
  {
 	alert("Fit below T threshold ("+t.toFixed(3)+" < "+th.toFixed(3)+")");
 	return;
  };
 };
 this.applyFit(this.fitData[mode][j]);
};

dendroApp.prototype.applyFit=function(obj,parm)
{
 var i;
 this.dataSpec.emptyContainer();
 this.fitSpec.emptyContainer();
 this.setStart(this.data,obj.t_from-this.options.analysis.trimStart);
 this.fitData.applied=[];
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  this.showFit(this.options.analysis.parameters[i].parameter,obj.index,"applied");
 };
 this.showFit("comb",obj.index,"applied");
 this.fitSpec.fillContainer();
 this.dataSpec.fillContainer();
 this.fitPos=-1;
 for(i=0;i<this.fitData.comb.length;i++)
 {
  if(this.fitData.comb[i].t_to==obj.t_to)
  {
   this.fitPos=i;
  };
 };
 this.updateEnds();
 this.plot("Master|Data");
 app.showTool('FitAdjuster');
};

dendroApp.prototype.fitAdjust=function(right)
{
 if(this.fitPos && (this.fitPos!=-1) && this.fitData && this.fitData.comb)
 {
  if(right)
  {
   if(this.fitPos<this.fitData.comb.length-1){this.fitPos++;}else{return;};
  }
  else
  {
   if(this.fitPos>1){this.fitPos--;}else{return;};
  };
  this.applyFit(this.fitData.comb[this.fitPos]);
 };
 app.showTool('FitAdjuster');
};

dendroApp.prototype.fitLink=function()
{
 var obj,a,b,c,fit={};
 fit.stats=this.fitData.ring_width[this.fitPos];
 fit.aKeyCode=this.master.series;
 fit.bKeyCode=this.data.series;
 fit.a=this.findSample(fit.aKeyCode);
 fit.b=this.findSample(fit.bKeyCode);
 if(fit.a!=-1)
 {
  obj=this.mergeData(this.master,this.data,fit.stats);
  if(fit.stats.t>this.options.analysis.t_single)
  {
    this.makeSingle(obj);
  };
  this.viewData(obj);
  this.addData(obj,'Data');
  fit.c=this.findSample(obj.series);
  integ.recordSpec.emptyContainer();
  this.fits.push({fitType:"Link",a:fit.aKeyCode,b:fit.bKeyCode,c:obj.series,
  	t:fit.stats.t,p:fit.stats.p,n:fit.stats.n,t_to:fit.stats.t_to,offs:fit.stats.offs,"created":true});
  this.project.series_list[fit.a].selected=false;
  if(fit.b!=-1){this.project.series_list[fit.b].selected=false;};
  if(fit.c!=-1){this.project.series_list[fit.c].selected=true;};
 }
 else
 {
  integ.recordSpec.emptyContainer();
  this.fits.push({fitType:"Date",a:fit.aKeyCode,b:fit.bKeyCode,c:"",
  	t:fit.stats.t,p:fit.stats.p,n:fit.stats.n,t_to:fit.stats.t_to,"created":true});
  if(fit.b!=-1){this.project.series_list[fit.b].selected=false;};
  app.showTool("Series");
 };
 app.changed=true;
 app.hideTool('FitAdjuster');
 integ.recordSpec.fillContainer();
 app.showTool("Record");
};

dendroApp.prototype.t_toTest=function()
{
 this.testData.ok=false;
 app.t_toProgress();
 this.plotTest();
};

dendroApp.prototype.testFit=function(mode,res)
{
 var j=this.findBestFit(mode);
 if(j==-1){return;};
 var mx=this.fitData[mode][j].p;
 var n=this.fitData[mode][j].n;
 var th=this.options.analysis.threshold;
 if(this.options.analysis.thresholdPower)
 {
  th=Math.exp((1/Math.sqrt(n))*Math.log(th));
 };
 res[mode].n++;
 if(mx>=th)
 {
  res[mode].fitted++;
  if(this.fitData[mode][j].t_from-this.options.analysis.trimStart==this.data.t_from)
  {
   res[mode].correct++;
  };
 };
};

dendroApp.prototype.testStage=function()
{
 var i,j,offs,gap,results;
 if(!this.testData.ok){return;};
 this.optionsSpec.emptyContainer();
 this.filteredMaster=this.filterData(this.master.data,this.options.analysis.parameters,this.master.filtered);
 gap=this.data.data.length-this.testData.len;
 results={comb:{len:this.testData.len,fitted:0,correct:0,n:0}};
 for(j=0;j<this.options.analysis.parameters.length;j++)
 {
  results[this.options.analysis.parameters[j].parameter]={len:this.testData.len,fitted:0,correct:0,n:0};
 };
 for(i=0;i<this.testData.trials;i++)
 {
  offs=Math.round(i*gap/(this.testData.trials-1));
  this.options.analysis.trimStart=offs;
  this.options.analysis.trimEnd=gap-offs;
  this.filteredData=this.filterData(this.trimData(this.data.data),this.options.analysis.parameters,this.data.filtered);
  this.fitAll();
  this.testFit("comb",results);
  for(j=0;j<this.options.analysis.parameters.length;j++)
  {
   this.testFit(this.options.analysis.parameters[j].parameter,results);
  };
 };
 this.testData.data.comb.push(results.comb);
 for(j=0;j<this.options.analysis.parameters.length;j++)
 {
  this.testData.data[this.options.analysis.parameters[j].parameter]
  	.push(results[this.options.analysis.parameters[j].parameter]);
 };
 this.options.analysis.trimStart=0;
 this.options.analysis.trimEnd=0;
 this.optionsSpec.fillContainer();
 this.testData.len--;
 if((this.testData.len>9)&&this.testData.ok)
 {
  app.updateProgress(100*gap/this.data.data.length);
  window.setTimeout("dendro.testStage()",100);
 }
 else
 {
  this.t_toTest();
 };
};

dendroApp.prototype.test=function()
{
 var j;
 this.testProgress=0;
 this.testData={incr:1,
 	len:this.data.data.length-this.options.analysis.testTrials,
 	trials:this.options.analysis.testTrials,
 	ok:true,
 	data:{comb:[]}};
 for(j=0;j<this.options.analysis.parameters.length;j++)
 {
  this.testData.data[this.options.analysis.parameters[j].parameter]=[];
 };
 app.createProgress("Testing...","dendro.t_toTest()",this.testProgress);
 window.setTimeout("dendro.testStage()",100);
};

dendroApp.prototype.updateEnds=function()
{
 var i;
 integ.recordSpec.emptyContainer();
/* for(i=0;i<this.project.series_list.length;i++)
 {
  // needs somehow to check if something has changed
 }; */
 integ.recordSpec.fillContainer();
};

dendroApp.prototype.clearLinks=function()
{
 var i,j;
 integ.recordSpec.emptyContainer();
 for(i=0;i<this.project.series_list.length;i++)
 {
  switch(this.project.series_list[i].series_type)
  {
  case "Dendro_Sample":
   if(!this.project.series_list[i].combines){continue;};
   for(j=i+1;j<this.project.series_list.length;j++)
   {
    this.project.series_list[j-1]=this.project.series_list[j];
   };
   this.project.series_list.pop();
   i--;
   break;
  };
 };
 this.fits=[];
 integ.recordSpec.fillContainer();
 integ.onRecordChange();
 this.selectSamples(true);
};

dendroApp.prototype.floatEnds=function(undated)
{
 var i,offs_d=null,offs_u=null;
 integ.recordSpec.emptyContainer();
 integ.seriesSpec.emptyContainer();
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   if(this.project.series_list[i].dated)
   {
    if(undated){continue;};
    if((offs_d===null)||(this.project.series_list[i].t_from<offs_d)){offs_d=this.project.series_list[i].t_from;};
   }
   else
   {
    if((offs_u===null)||(this.project.series_list[i].t_from<offs_u)){offs_u=this.project.series_list[i].t_from;};
   };
  };
 };
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   if(this.project.series_list[i].dated)
   {
    if(undated){continue;};
    this.shift(this.project.series_list[i],1-offs_d,false);
   }
   else
   {
    this.shift(this.project.series_list[i],1-offs_u,false);
   };
  };
 };
 integ.seriesSpec.fillContainer();
 integ.recordSpec.fillContainer();
 this.updateEnds();
 integ.onRecordChange();
 if(this.aq.active()){this.aq.step(1);};
};

dendroApp.prototype.resetEnds=function(orig)
{
 var i;
 integ.recordSpec.emptyContainer();
 integ.seriesSpec.emptyContainer();
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   this.resetEnd(this.project.series_list[i],orig);
  };
 };
 integ.seriesSpec.fillContainer();
 integ.recordSpec.fillContainer();
 this.floatEnds(true);
};

dendroApp.prototype.selectSamples=function(force,datedOnly)
{
 var s;
 this.analysisCache={};
 function deselect(a,i,top)
 {
  var aa,j,k;
  if(top){a[i].selected=false;};
  if(a[i].combines)
  {
   aa=a[i].combines.split(",");
   for(j=0;j<aa.length;j++)
   {
    k=dendro.findSample(aa[j]);
    if(k!=-1)
    {
     deselect(a,k,true);
    };
   };
  };
 };
 integ.recordSpec.emptyContainer();
 this.selected=0;
 for(s=0;s<this.project.series_list.length;s++)
 {
  if(this.project.series_list[s].series_type!="Dendro_Sample"){continue;};
  if(datedOnly && !this.project.series_list[s].dated){this.project.series_list[s].selected=false;};
  if(this.project.series_list[s].selected){this.selected++;};
 };
 if(!this.selected || force)
 {
  for(s=0;s<this.project.series_list.length;s++)
  {
   if(this.project.series_list[s].series_type!="Dendro_Sample"){continue;};
   this.project.series_list[s].selected=true;
   if(datedOnly && !this.project.series_list[s].dated){this.project.series_list[s].selected=false;};
  };
 };
 for(s=0;s<this.project.series_list.length;s++)
 {
  if(this.project.series_list[s].series_type!="Dendro_Sample"){continue;};
  deselect(this.project.series_list,s,false);
 };
 this.selected=0;
 for(s=0;s<this.project.series_list.length;s++)
 {
  if(this.project.series_list[s].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[s].selected){this.selected++;};
 };
 integ.recordSpec.fillContainer();
};

dendroApp.prototype.selectMasters=function(force,category)
{
 var m,selected=false;
 if(category=='choose')
 {
    app.menu("Select Masters|Filtered|Unfiltered|Both",{"id":"dendro"})
    .then(function(res){
     this.setProject();
     switch(res)
     {
     case 1: this.selectMasters(true,"filtered");break;
     case 2: this.selectMasters(true,"unfiltered");break;
     case 3: this.selectMasters(true,"both");break;
     };
    }.bind(this)).catch(function(e){app.alert(e);});
    return;
 };
 integ.seriesListSpec.emptyContainer();
 for(m=0;m<integ.project.project_series_list.length;m++)
 {
  if(integ.project.project_series_list[m].project_series_type!='Dendro_Master'){continue;};
  if(integ.project.project_series_list[m].selected){selected=true;};
 };
 if(!selected || force)
 {
  for(m=0;m<integ.project.project_series_list.length;m++)
  {
   if(integ.project.project_series_list[m].project_series_type!='Dendro_Master'){continue;};
   switch(category)
   {
   case "filtered":
    if(integ.project.project_series_list[m].file_data.filtered)
    {
     integ.project.project_series_list[m].selected=true;
    }
    else
    {
     integ.project.project_series_list[m].selected=false;
    };
    break;
   case "unfiltered":
    if(integ.project.project_series_list[m].file_data.filtered)
    {
     integ.project.project_series_list[m].selected=false;
    }
    else
    {
     integ.project.project_series_list[m].selected=true;
    };
    break;
   default:
    integ.project.project_series_list[m].selected=true;
    break;
   };
  };
 };
 integ.seriesListSpec.fillContainer();
};

dendroApp.prototype.locateMasters=function()
{
 var i,m,s,h;
 integ.seriesListSpec.emptyContainer();
 integ.projectSeriesSpec.emptyContainer();
 for(m=0;m<integ.project.project_series_list.length;m++)
 {
  if(integ.project.project_series_list[m].project_series_type!="Dendro_Master"){continue;};
  s=integ.project.project_series_list[m].file_data;
  if(!s){continue;};
  if(s['long']){delete s['long'];};
  if(s['lat']){delete s['lat'];};
  for(i=0;i<integ.project.records.length;i++)
  {
   if(s.series.indexOf(integ.project.records[i].record)==0)
   {
    h=integ.project.records[i].file_data;
    if(!h){continue;};
    h=h.header;
    if(h.longitude && (!s.longitude||s.longitude!=h.longitude))
    {
     s.longitude=h.longitude;integ.project.project_series_list[m].changed=true;
    };
    if(h.latitude && (!s.latitude||s.latitude!=h.latitude))
    {
     s.latitude=h.latitude;integ.project.project_series_list[m].changed=true;
    };
   };
  };
 };
 integ.projectSeriesSpec.fillContainer();
 integ.seriesListSpec.fillContainer(); 
};

dendroApp.prototype.setHemispheres=async function()
{
 var m,hem,s;
 try
 {
  hem=await app.menu("Default|NH|SH|undefined",{"id":"dendro"});
  for(m=0;m<integ.project.project_series_list.length;m++)
  {
   if(integ.project.project_series_list[m].project_series_type!="Dendro_Master"){continue;};
   if(!integ.project.project_series_list[m].selected){continue;};
   integ.viewProjectSeries(integ.project.project_series_list[m]);
   s=integ.projectSeries;
   if(s.t_source){continue;};
   if(s.latitude)
   {
    if(s.latitude>0)
    {
     this.setHemisphere(s,"DendroNH");
    }
    else
    {
     this.setHemisphere(s,"DendroSH");
    };
   }
   else
   {
    switch(hem)
    {
    case 1:
     this.setHemisphere(s,"DendroNH");
     break;
    case 2:
     this.setHemisphere(s,"DendroSH");
     break;
    };
   };
  };
  for(m=0;m<integ.project.records.length;m++)
  {
   if(!integ.project.records[m].selected){continue;};
   integ.viewRecord(integ.project.records[m]);
   s=integ.record;
   if(s.header.latitude)
   {
    if(s.header.latitude>0)
    {
     this.setHemisphere(s,"DendroNH");
    }
    else
    {
     this.setHemisphere(s,"DendroSH");
    };
   }
   else
   {
    switch(hem)
    {
    case 1:
     this.setHemisphere(s,"DendroNH");
     break;
    case 2:
     this.setHemisphere(s,"DendroSH");
     break;
    };
   };
  };
 }
 catch(e)
 {
  app.alert(e);
 };
};

dendroApp.prototype.crossDateStage=function(mode,ar,i)
{
 var j,k,key;
 for(j=1;j<i;j++)
 {
  this.master=ar[j];
  this.data=ar[i];
  key=this.master.series+"&"+this.data.series;
  if(this.analysisCache[key] && this.useCache)
  {
   this.crossReturn[i][j]=this.analysisCache[key];
  }
  else
  {
   this.filteredMaster=
   	this.filterData(ar[j].data,this.options.analysis.parameters,ar[j].filtered);
   this.filteredData=
  	this.filterData(ar[i].data,this.options.analysis.parameters,ar[i].filtered);
   this.fitAll();
   k=this.findBestFit(mode);
   if(k==-1){this.crossReturn[i][j]={};continue;};
   this.crossReturn[i][j]=this.fitData[mode][k];
   this.analysisCache[key]=this.crossReturn[i][j];
  };
 };
 this.aq.step(1);
};

dendroApp.prototype.crossDateEnd=function()
{
 this.cross=this.crossReturn;
 this.aq.step(1);
};

dendroApp.prototype.crossDate=function(mode)
{
 var i,j,k,ar=[false];
 this.crossReturn=[[false]];
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected && this.project.series_list[i].data.length)
  {
   ar.push(this.project.series_list[i]);
   this.crossReturn[0].push(this.project.series_list[i].series);
   this.crossReturn.push([this.project.series_list[i].series]);
  };
 };
 for(i=ar.length-1;i>0;i--)
 {
  this.aq.addNextAction(this.crossDateStage.bind(this,mode,ar,i));
 };
 this.aq.step(1);
};

dendroApp.prototype.crossCheck=function(mode)
{
 var i,j,k,ar=[false],key;
 this.crossReturn=[[false]];
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected && this.project.series_list[i].data.length)
  {
   ar.push(this.project.series_list[i]);
   this.crossReturn[0].push(this.project.series_list[i].series);
   this.crossReturn.push([this.project.series_list[i].series]);
  };
 };
 for(i=ar.length-1;i>0;i--)
 {
  for(j=1;j<i;j++)
  {
   this.master=ar[j];
   this.data=ar[i];
   key=this.master.series+"&"+this.data.series;
   if((this.analysisCache[key]||(this.analysisCache[key]===false)) && this.useCache)
   {
    this.crossReturn[i][j]=this.analysisCache[key];
   }
   else
   {
    this.filteredMaster=
   	 this.filterData(ar[j].data,this.options.analysis.parameters,ar[j].filtered);
    this.filteredData=
  	 this.filterData(ar[i].data,this.options.analysis.parameters,ar[i].filtered);
    this.crossReturn[i][j]=this.correl(
     this.readArray(this.filteredMaster,this.options.analysis.parameters[0].parameter),
     this.readArray(this.filteredData,this.options.analysis.parameters[0].parameter),
     this.filteredData[0].t-this.filteredMaster[0].t
     );
    if(this.crossReturn[i][j])
    {
     this.crossReturn[i][j].offs=this.filteredData[0].t-this.filteredMaster[0].t
      +this.filteredData.length-this.filteredMaster.length;
     this.analysisCache[key]=this.crossReturn[i][j];
    }
    else
    {
     this.analysisCache[key]=false;
    };
   };
  };
 };
 this.aq.step(1);
};

dendroApp.prototype.conditionBest=function(mx,t,p)
{
 if(this.options.analysis.p_priority && (typeof(p)=='number'))
 {
  if(p>mx){return p;};return false;
 }
 else
 {
  if(t>mx){return t;};return false;
 };
};

dendroApp.prototype.conditionMet=function(t,p,n,dating)
{
 var th=this.options.analysis.threshold;
 if((this.options.analysis.p_priority || this.options.analysis.mixed)&&(typeof(p)=='number'))
 {
  if(this.options.analysis.thresholdPower)
  {
   th=Math.exp((1/Math.sqrt(n))*Math.log(th));
  };
  if(p<th){return false;};
 };
 if(!this.options.analysis.p_priority || this.options.analysis.mixed || (typeof(p)!='number'))
 {
  if(dating)
  {
   if(t<this.options.analysis.t_threshold){return false;};
  }
  else
  {
   if(t<this.options.analysis.t_threshold)
   {
    if(!this.options.analysis.t_x_threshold||(t<this.options.analysis.t_x_threshold)){return false;};
   };
  };
 };
 if(dating)
 {
  if(this.options.analysis.n_min && (n<this.options.analysis.n_min)){return false;};
 }
 else
 {
  if(this.options.analysis.n_x_min && (n<this.options.analysis.n_x_min)){return false;};
 };
 return true;
};

dendroApp.prototype.crossBest=function()
{
 var i,j,mx=0;
 this.crossFit=false;
 for(i=1;i<this.crossReturn.length;i++)
 {
  for(j=1;j<i;j++)
  {
   if((typeof(this.crossReturn[i][j].n)!='number')||(this.crossReturn[i][j].n<2)){continue;};
   if(this.conditionBest(mx,this.crossReturn[i][j].t,this.crossReturn[i][j].p)
    &&((this.conditionMet(this.crossReturn[i][j].t,this.crossReturn[i][j].p,this.crossReturn[i][j].n,false))||(this.override)))
   {
    mx=this.conditionBest(mx,this.crossReturn[i][j].t,this.crossReturn[i][j].p);
    this.crossFit={a:-1,b:-1,
    	aKeyCode:this.crossReturn[0][j],bKeyCode:this.crossReturn[i][0],
    	stats:this.crossReturn[i][j]};
    this.crossFit.a=this.findSample(this.crossFit.aKeyCode);
    this.crossFit.b=this.findSample(this.crossFit.bKeyCode);
   };
  };
 };
 this.updateEnds();
 this.aq.step(1);
};

dendroApp.prototype.crossLinkStage=function(mode,master)
{
 var fit=this.crossFit;
 if(fit && (fit.a!=-1) && (fit.b!=-1))
 {
  shift=fit.stats.t_to-this.project.series_list[fit.b].t_to;
  if(shift && !(this.project.series_list[fit.a].dated && this.project.series_list[fit.b].dated))
  {
   if(shift>0)
   {
    this.shift(this.project.series_list[fit.a],-shift);
   }
   else
   {
    this.shift(this.project.series_list[fit.b],shift);
   };
  };
  obj=this.mergeData(this.project.series_list[fit.a],this.project.series_list[fit.b],fit.stats);
  if(fit.stats.t>this.options.analysis.t_single)
  {
   this.makeSingle(obj);
  };
  this.addData(obj,'Data');
  fit.c=this.findSample(obj.series);
  this.fits.push({fitType:"Link",a:fit.aKeyCode,b:fit.bKeyCode,c:obj.series,
  	t:fit.stats.t,p:fit.stats.p,n:fit.stats.n,t_to:fit.stats.t_to,offs:fit.stats.offs,created:true});
  this.project.series_list[fit.a].selected=false;
  this.project.series_list[fit.b].selected=false;
  this.project.series_list[fit.c].selected=true;
  app.changed=true;
 };
 if(fit)
 {
  this.aq.addNextAction(this.crossLinkStage.bind(this,mode,master));
  this.aq.addNextAction(this.crossBest.bind(this,mode));
  if(master)
  {
   this.aq.addNextAction(this.crossCheck.bind(this,mode));
  }
  else
  {
   this.aq.addNextAction(this.crossDate.bind(this,mode));
  };
 }
 else
 {
  app.showTool("Record");
 };
 this.aq.step(1);
};

dendroApp.prototype.crossLink=function(mode,master)
{
 this.aq.addNextAction(this.crossLinkStage.bind(this,mode,master));
 this.aq.addNextAction(this.crossBest.bind(this));
 if(master)
 {
  this.aq.addNextAction(this.crossCheck.bind(this,mode));
 }
 else
 {
  this.aq.addNextAction(this.crossDate.bind(this,mode));
 };
 this.aq.step(1);
};

dendroApp.prototype.masterDateStage=function(mode,i,s)
{
 var j,k,ser,b;
 for(j=1;j<this.crossReturn[0].length;j++)
 {
  ser=integ.findProjectSeries(this.crossReturn[0][j]);
  if(!ser){continue;};
  if(ser.file_data)
  {
   this.master=ser.file_data;
   this.data=this.project.series_list[i];
   this.filteredMaster=
   	this.filterData(this.master.data,this.options.analysis.parameters,this.master.filtered);
   this.filteredData=
   	this.filterData(this.data.data,this.options.analysis.parameters,this.data.filtered);
   this.fitAll();
   k=this.findBestFit(mode);
   if(k!=-1)
   {
    this.crossReturn[s].push(this.fitData[mode][k]);
   };
  };
 };
 this.aq.step(1);
};

dendroApp.prototype.masterDateEnd=function()
{
 this.date=this.crossReturn;
 if((this.masterCount==1)&&(this.sampleCount==1))
 {
  this.plotFit();
 };
 this.aq.step(1);
};

dendroApp.prototype.masterDate=function(mode,additional)
{
 var i,j,k,m,d,param;
 this.masterCount=0;
 this.sampleCount=0;
 if(additional)
 {
  if(param=integ.findParameter(mode))
  {
   this.crossReturn.push([param.label]);
  }
  else
  {
   this.crossReturn.push([mode]);
  };
 }
 else
 {
  this.crossReturn=[[mode],["Distance (km)"]];
  for(j=0;j<integ.project.project_series_list.length;j++)
  {
   if(integ.project.project_series_list[j].project_series_type!='Dendro_Master'){continue;};
   if(integ.project.project_series_list[j].selected)
   {
    this.masterCount++;
    d=integ.distance(integ.project.project_series_list[j].file_data,this.project.header);
    if(this.options.analysis.d_max_km)
    {
     if(d/1000 > this.options.analysis.d_max_km){continue;};
    };
    if(integ.project.project_series_list[j].file_data.series.indexOf(this.project.header.record)==0)
    {
     continue;
    };
    this.crossReturn[0].push(integ.project.project_series_list[j].file_data.series);
    this.crossReturn[1].push(d/1000);
   };
  };
 };
 this.aq.addNextAction(this.masterDateEnd.bind(this));
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   this.crossReturn.push([this.project.series_list[i].series]);
   this.aq.addNextAction(this.masterDateStage.bind(this,mode,i,this.crossReturn.length-1));
   this.sampleCount++;
  };
 };
 this.aq.step(1);
};

dendroApp.prototype.applyBestDates=function()
{
 var i,j,mx,fit,s;
 integ.recordSpec.emptyContainer();
 for(i=2;i<this.date.length;i++)
 {
  mx=0;fit=false;
  s=this.findSample(this.date[i][0]);
  for(j=1;j<this.date[i].length;j++)
  {
   if(!this.date[i][j]){continue;};
   if(this.conditionBest(mx,this.date[i][j].t,this.date[i][j].p)
    && this.conditionMet(this.date[i][j].t,this.date[i][j].p,this.date[i][j].n,true))
   {
    mx=this.conditionBest(mx,this.date[i][j].t,this.date[i][j].p);
    fit={fitType:"Date",a:this.date[0][j],b:this.date[i][0],c:"",
   	t:this.date[i][j].t,p:this.date[i][j].p,n:this.date[i][j].n,d:this.date[1][j],t_to:this.date[i][j].t_to,created:true};
   };
  };
  if(fit && s!=-1)
  {
   this.setEnd(this.project.series_list[s],fit.t_to,fit.a,fit);
   this.fits.push(fit);
   app.changed=true;
  };
 };
 integ.recordSpec.fillContainer();
 this.updateEnds();
 this.aq.step(1);
};

dendroApp.prototype.addMasters=function()
{
 var i,j,obj,k=1,h=this.project.header;
 var cp=['site','region','country','longitude','latitude'];
 integ.seriesListSpec.emptyContainer();
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(!this.project.series_list[i].selected){continue;};
  obj=JSON.parse(JSON.stringify(this.project.series_list[i]));
  for(j in cp){obj[cp[j]]=h[cp[j]];};
  if(obj.filtered)
  {
   obj.series=h.record+"-FM";
  }
  else
  {
   obj.series=h.record+"-M";
  };
  if(k>1){obj.series+=k;};
  delete obj.series_type;
  obj.project_series_type="Dendro_Master";
  for(j=0;j<integ.project.project_series_list.length;j++)
  {
   if(integ.project.project_series_list[j].series==obj.series)
   {
    if(integ.project.project_series_list[j].project_series_type==obj.project_series_type)
    {
     integ.project.project_series_list[j].file_data=obj;
     integ.project.project_series_list[j].changed=true;
    }
    else
    {
     app.alert("Duplicate name "+obj.series);
    };
    j=integ.project.project_series_list.length+1;
   };
  };
  if(j==integ.project.project_series_list.length)  // not found
  {
   this.addDepth(obj);
   integ.project.project_series_list.push({"series":obj.series,"project_series_type":"Dendro_Master","file_data":obj,"created":true,"selected":true});
  };
  k++;
 };
 integ.seriesListSpec.fillContainer();
 this.aq.step(1);
};

dendroApp.prototype.reloadDataViews=function()
{
/* app.clearTool("ProjectSeries");
 this.masterSpec=this.genMasterSpec();
 this.masterSpec.object=this.master;
 document.getElementById("masterArea").appendChild(this.masterSpec.createDisplay(this.master));   
 app.clearTool("Series");
 this.dataSpec=this.genDataSpec();
 this.dataSpec.object=this.data;
 document.getElementById("dataArea").appendChild(this.dataSpec.createDisplay(this.data));   
 this.fitSpec=this.getFitSpec();
 app.clearTool("FitTool");
 document.getElementById("fitArea").appendChild(this.fitSpec.createDisplay(this.fitData));
 if(this.selected==2){app.showTool('FitTool');}; */
// alert(JSON.stringify(this.fitData));
 this.aq.step(1);
};

dendroApp.prototype.checkForceLink=function(sel)
{
 this.selectSamples();
 if((this.selected==2) && (sel==2))
 {
  app.confirm("Force link?")
  .then(function()
  {
   this.override=true;
   this.fitProject('link');
  }.bind(this))
  .catch(function(e){});
 };
 this.override=false;
 this.aq.step(1);
};

dendroApp.prototype.checkPlotFit=function(sel)
{
 if(sel==2)
 {
  this.plotFit();
 };
 this.aq.step(1);
};


dendroApp.prototype.fitProject=function(mode)
{
 var i;
 this.viewData({});// ensure that data is not held in editing buffer
 this.viewMaster({});
 app.minimiseTool("ProjectSeries");
 app.minimiseTool("Series");
 app.showTool("Record");
 switch(mode)
 {
 case 'cross':
  this.selectSamples();
  this.aq.addAction(this.resetEnds.bind(this));
  this.aq.addAction(this.crossDate.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.crossDateEnd.bind(this));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'cross'));
  this.aq.addAction(this.checkPlotFit.bind(this,this.selected));
  this.aq.modal("Cross date...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 case 'link':
  this.selectSamples();
  this.aq.addAction(this.resetEnds.bind(this));
  this.aq.addAction(this.crossDate.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.crossDateEnd.bind(this));
  this.aq.addAction(this.crossLink.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.floatEnds.bind(this));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'link'));
  this.aq.addAction(this.checkPlotFit.bind(this,this.selected));
  this.aq.addAction(this.checkForceLink.bind(this,this.selected));
  this.aq.modal("Link...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 case 'date':
  this.selectMasters();
  this.selectSamples();
  this.aq.addAction(this.masterDate.bind(this,"best"));
  this.aq.addAction(this.applyBestDates.bind(this));
  this.aq.addAction(this.floatEnds.bind(this,true));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'date'));
  this.aq.modal("Date...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 case 'solve':
  this.selectMasters();
  this.selectSamples();
  this.aq.addAction(this.resetEnds.bind(this));
  this.aq.addAction(this.crossDate.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.crossDateEnd.bind(this));
  this.aq.addAction(this.crossLink.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.floatEnds.bind(this));
  this.aq.addAction(this.masterDate.bind(this,"best"));
  this.aq.addAction(this.applyBestDates.bind(this));
  this.aq.addAction(this.floatEnds.bind(this,true));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'solve'));
  this.aq.modal("Link...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 case 'master':
  this.selectSamples(false,true);
  this.aq.addAction(this.crossCheck.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.crossDateEnd.bind(this));
  this.aq.addAction(function(){this.override=true;this.aq.step(1);}.bind(this));
  this.aq.addAction(this.crossLink.bind(this,this.options.analysis.parameters[0].parameter,true));
  this.aq.addAction(function(){this.override=false;this.aq.step(1);}.bind(this));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'link'));
  this.aq.addAction(this.addMasters.bind(this));
  this.aq.modal("Create master...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 case 'check':
  this.selectSamples();
  this.aq.addAction(this.crossCheck.bind(this,this.options.analysis.parameters[0].parameter));
  this.aq.addAction(this.crossDateEnd.bind(this));
  this.aq.addAction(this.reloadDataViews.bind(this));
  this.aq.addAction(this.showReport.bind(this,'link'));
  this.aq.modal("Check matches...","dendro.aq.finish()");
  this.aq.step(1);
  break;
 };
};

dendroApp.prototype.combineData=function()
{
 var i,a=false,obj=false;
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   this.project.series_list[i].selected=false;
   if(a==false)
   {
    a=this.project.series_list[i];
   }
   else
   {
    if(obj==false)
    {
     obj=this.mergeData(a,this.project.series_list[i]);
    }
    else
    {
     obj=this.mergeData(obj,this.project.series_list[i]);
    };
    if(obj)
    {
     this.viewData(obj);
     this.addData(obj,'Data');
    };
   };
  };
 };
 integ.recordSpec.emptyContainer();
 this.project.series_list[this.project.series_list.length-1].selected=true;
 integ.recordSpec.fillContainer();
};

dendroApp.prototype.makeSingle=function(sd,force)
{
 var i,j,sd,ca;
 if(sd)
 {
  if(sd.combines)
  {
   ca=sd.combines.split(",");
   for(i=0;i<ca.length;i++)
   {
    ca[i]=this.project.series_list[this.findSample(ca[i])];
    if(this.sapwoodString(ca[i].sapwood).indexOf('C')!=-1)
    {
     if(sd.t_to!=ca[i].t_to)
     {
      if(sd.notes){sd.notes+="\n\n";};
      sd.notes+="Not a single tree";
      if(force){app.alert(sd.series+" not a single tree");};
      return;
     };
    };
    if(ca[i].combines && !ca[i].single)
    {
     return;
    };
   };
  };
  sd.single=true;
  if(sd.notes){sd.notes+="\n\n";};
  sd.notes+="Single tree";
  for(j=0;j<sd.data.length;j++)
  {
   sd.data[j].sample_depth=1;
  };
  return;
 };
 integ.seriesSpec.emptyContainer();
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].selected)
  {
   sd=this.project.series_list[i];
   this.makeSingle(sd,true);
  };
 };
 integ.seriesSpec.fillContainer();
 if(sd){this.viewData(sd);};
};

dendroApp.prototype.addData=function(obj,mode)
{
// app.fileMode='Data';
// app.setFilename(obj.series.toUpperCase());
 integ.recordSpec.emptyContainer();
 this.addDepth(obj);
 this.project.series_list.push(obj);
/* if(this.fileModeIndex>-1)
 {
  ind_obj=this.project.series_list[this.fileModeIndex];
  ind_obj.data=obj;
  ind_obj.series=obj.series;
  ind_obj.t_from=obj.t_from;
  ind_obj.t_to=obj.t_to;
  ind_obj.length=obj.length;
 };*/
 integ.recordSpec.fillContainer();
 integ.onRecordChange();
};

/* reporting functions */

dendroApp.prototype.sapwoodString=function(sw)
{
 var swi,swr;
 if(!sw){return "";};
 if(sw<1){return "h/s";};
 swi=Math.floor(sw);
 swr=sw-swi;
 if(swr>0.4){return swi+" 1/2C";};
 if(swr>0.2){return swi+" 1/4C";};
 if(swr>0){return swi+"C";};
 return swi+"";
};

dendroApp.prototype.showSapwood=function(spec)
{
 var e;
 spec.specialTeX=this.sapwoodString(spec.object);
 e=document.createTextNode(spec.specialTeX);
 spec.container.appendChild(e);
};

dendroApp.prototype.showReport=function(mode)
{
 this.report=mode;
 if(this.console){alert(this.console);};
 app.clearTool("Report","dendroReport.html");
 app.showTool("Report");
 this.aq.step(1);
};

dendroApp.prototype.writeReport=function(w,d,mode)
{
 var table,tr,th,td,br,done={},orig;
 var dat;
 var i,j,s;
 var title;
 switch(mode)
 {
 default:
  title=d.createElement('h1');
  title.appendChild(d.createTextNode("Project: "+this.project.header.site+" ("+this.project.header.record+")"));
  d.body.appendChild(title);
  switch(this.report)
  {
  case 'table':
   this.writeReport(w,d,'table');
   break;
  case 'date':
   this.writeReport(w,d,'date');
   this.writeReport(w,d,'table');
   break;
  case 'cross':
   this.writeReport(w,d,'cross');
   break;
  case 'link':
   this.writeReport(w,d,'cross');
  case 'linkOnly':
   this.writeReport(w,d,'link');
   break;
  case 'solve':
   this.writeReport(w,d,'cross');
   this.writeReport(w,d,'date');
   this.writeReport(w,d,'link');
   this.writeReport(w,d,'table');
   break;
  };
  break;
 case 'date':
 case 'cross':
  title=d.createElement('h2');
  if(mode=='date')
  {
   title.appendChild(d.createTextNode('Dating against master chronologies'));
   dat=this.date;
  }
  else
  {
   title.appendChild(d.createTextNode('Cross dating'));
   dat=this.cross;
  };
  d.body.appendChild(title);
  table=d.createElement('table');
  tr=d.createElement('tr');
  tr.appendChild(d.createElement('th'));
  for(i=1;i<dat[0].length;i++)
  {
   th=d.createElement('th');
   th.appendChild(d.createTextNode(dat[0][i]));
   tr.appendChild(th);
  };
  table.appendChild(tr);
  if(mode=="date")
  {
   tr=d.createElement('tr');
   th=d.createElement('th');
   th.appendChild(d.createTextNode(dat[1][0]));
   tr.appendChild(th);
   for(i=1;i<dat[0].length;i++)
   {
    td=d.createElement('td');
    if(dat[1][i])
    {
     td.appendChild(d.createTextNode(dat[1][i].toFixed(0)));
    };
    tr.appendChild(td);
   };
   table.appendChild(tr);
   i=2;
  }
  else
  {
   i=1;
  };
  for(true;i<dat.length;i++)
  {
   tr=d.createElement('tr');
   th=d.createElement('th');
   itemSpec.prototype.appendComplexText(th,dat[i][0]);
//   th.appendChild(d.createTextNode(dat[i][0]));
   tr.appendChild(th);
   for(j=1;j<dat[0].length;j++)
   {
    td=d.createElement('td');
    if(mode=='cross')
    {
     if(j>i)
     {
      if((typeof(dat[j][i].n)=='number')&&(dat[j][i].n>1))
      {
       td.appendChild(d.createTextNode(dat[j][i].t.toFixed(4)));
       if(this.options.analysis.t_x_threshold && (dat[j][i].t>this.options.analysis.t_x_threshold))
       {
        td.style.color='blue';
       };
       if(dat[j][i].t>this.options.analysis.t_threshold)
       {
        td.style.color='green';
       };
       if(this.options.analysis.t_single && (dat[j][i].t>this.options.analysis.t_single))
       {
        td.style.color='red';
       };
       td.appendChild(d.createElement('br'));
       if(typeof(dat[j][i].p)=='number')
       {
        td.appendChild(d.createTextNode(dat[j][i].p.toFixed(4)));
       };
      };
     };
     if(j<i)
     {
      if((typeof(dat[i][j].n)=='number')&&(dat[i][j].n>1))
      {
       td.appendChild(d.createTextNode(dat[i][j].offs));
       td.appendChild(d.createElement('br'));
       td.appendChild(d.createTextNode(dat[i][j].n));
      };
     };
    }
    else
 	{
 	 try
 	 {
      td.appendChild(d.createTextNode(dat[i][j].t.toFixed(4)));
      if(dat[i][j].t>this.options.analysis.t_threshold)
      {
       td.style.color='green';
      };
      td.appendChild(d.createElement('br'));
      if(typeof(dat[i][j].p)=='number')
      {
       td.appendChild(d.createTextNode(dat[i][j].p.toFixed(4)));
      };
      td.appendChild(d.createElement('br'));
      if(typeof(dat[i][j].t_to)=='number')
      {
       td.appendChild(d.createTextNode(integ.showTString(dat[i][j].t_to)));
      };
      td.appendChild(d.createElement('br'));
      if(typeof(dat[i][j].n)=='number')
      {
       td.appendChild(d.createTextNode(dat[i][j].n));
      };
      if(dat[i][j].parm && (dat[i][j].parm!="ring_width"))
      {
       td.appendChild(d.createElement('br'));
       itemSpec.prototype.appendComplexText(td,"("+this.parameterName(dat[i][j].parm)+")");
      };
     }
 	 catch(e)
 	 {
 	  if(typeof(dat[i][j])=='string')
 	  {
 	   td=td=d.createElement('th');
 	   itemSpec.prototype.appendComplexText(td,dat[j][i]);
 	  };
	 };     
	};
    tr.appendChild(td);
   };
   table.appendChild(tr);
  };
  d.body.appendChild(table);
  break;
 case 'table':
  function cell(el,txt){var e=d.createElement(el);e.appendChild(d.createTextNode(txt));return e;};
  title=d.createElement('h2');
  orig=false;
  for(i=0;i<this.project.series_list.length;i++)
  {
   s=this.project.series_list[i];
   if(s.series_type!='Dendro_Sample'){continue;};
   if(s.combines){continue;};
   if(s.t_to_orig){orig=true;};
  };
  title.appendChild(d.createTextNode('Summary table'));
  d.body.appendChild(title);
  table=d.createElement('table');
  tr=d.createElement('tr');
  tr.appendChild(cell('th','Sample'));
  tr.appendChild(cell('th','Notes'));
  tr.appendChild(cell('th','Rings'));
  tr.appendChild(cell('th','Sapwood'));
  tr.appendChild(cell('th','MRW'));
  tr.appendChild(cell('th','MHRW'));
  tr.appendChild(cell('th','First'));
  tr.appendChild(cell('th','Last\u00A0HW'));
  tr.appendChild(cell('th','Last'));
  if(orig)
  {
   tr.appendChild(cell('th','Last (orig.)'));
  };
  table.appendChild(tr);
  for(i=0;i<this.project.series_list.length;i++)
  {
   s=this.project.series_list[i];
   if(s.series_type!='Dendro_Sample'){continue;};
   if(s.combines){continue;};
   tr=d.createElement('tr');
   tr.appendChild(cell('th',s.series));
   tr.appendChild(cell('td',s.notes));
   tr.appendChild(cell('td',s.ring_count));
   tr.appendChild(cell('td',this.sapwoodString(s.sapwood)));
   tr.appendChild(cell('td',this.meanRW(s,false)));
   tr.appendChild(cell('td',this.meanRW(s,true)));
   if(s.dated)
   {
    tr.appendChild(cell('td',integ.showTString(s.t_from)));
    tr.appendChild(cell('td',integ.showTString(s.t_to-Math.floor(s.sapwood))));
    tr.appendChild(cell('td',integ.showTString(s.t_to)));
   }
   else
   {
    tr.appendChild(cell('td',s.t_from));
    tr.appendChild(cell('td',s.t_to-Math.floor(s.sapwood)));
    tr.appendChild(cell('td',s.t_to));
   };
   if(orig)
   {
    if(s.t_to_orig)
    {
     tr.appendChild(cell('td',integ.showTString(s.t_to_orig)));
    }
    else
    {
     tr.appendChild(cell('td',''));
    };
   };
   table.appendChild(tr);
  };
  d.body.appendChild(table);
  break;
 case 'link':
  function listLink(f,key)
  {
   var ul,li,i,txt,key_data;
   done[key]=true;
   for(i=0;i<f.length;i++)
   {
    if(f[i].fitType=="Link")
    {
     if(f[i].c==key)
     {
      li=d.createElement('li');
      txt=f[i].c+" [T="+f[i].t.toFixed(3);
      if(f[i].p){txt+=" P="+f[i].p.toFixed(3);};
      txt+=" Offset="+f[i].offs+" Overlap="+f[i].n+"]";
      if(dendro.project.series_list[dendro.findSample(f[i].c)].single)
      {
       txt+=" Single";
      };
      li.appendChild(d.createTextNode(txt));
      ul=d.createElement('ul');
      ul.appendChild(listLink(f,f[i].a));
      ul.appendChild(listLink(f,f[i].b));
      li.appendChild(ul);
      return li;
     };
    };
   };
   li=d.createElement('li');
   key_data=dendro.findData(key);
   li.appendChild(d.createTextNode(key+" [End="+
    (key_data.dated?integ.showTString(key_data.t_to):key_data.t_to)+"]"));
   return li;
  };
  function listDates(f,s)
  {
   var ul,li,ul2,i,txt;
   ul=d.createElement('ul');
   for(i=0;i<f.length;i++)
   {
    if(f[i].fitType=="Date")
    {
     li=d.createElement('li');
     txt=f[i].a+" [T="+f[i].t.toFixed(3)+" P="+f[i].p.toFixed(3)+
      	" End="+integ.showTString(f[i].t_to)+" Overlap="+f[i].n;
     if(f[i].d){txt+=" Distance="+(f[i].d).toFixed(0)+"km";};
     txt+="]";
     li.appendChild(d.createTextNode(txt));
     ul2=d.createElement('ul');
     ul2.appendChild(listLink(f,f[i].b));
     li.appendChild(ul2);
     ul.appendChild(li);
    };
   };
   for(i=0;i<s.length;i++)
   {
    if(s[i].series_type!="Dendro_Sample"){continue;};
    if(!s[i].dated){continue;};
    if(typeof(done[s[i].series])=='undefined')
    {
     ul.appendChild(listLink(f,s[i].series));
    };
   };
   return ul;
  };
  function listUndated(f,s)
  {
   var ul,i;
   ul=d.createElement('ul');
   for(i=0;i<f.length;i++)
   {
    if((f[i].fitType=="Link")&&(typeof(done[f[i].c])=='undefined'))
    {
     ul.appendChild(listLink(f,f[i].c));
    };
   }
   for(i=0;i<s.length;i++)
   {
    if(s[i].series_type!="Dendro_Sample"){continue;};
    if(s[i].dated){continue;};
    if(typeof(done[s[i].series])=='undefined')
    {
     ul.appendChild(listLink(f,s[i].series));
    };
   };
   return ul;
  };
  title=d.createElement('h2');
  title.appendChild(d.createTextNode("Site chronology"));
  d.body.appendChild(title);
  title=d.createElement('h3');
  title.appendChild(d.createTextNode("Dated"));
  d.body.appendChild(title);
  d.body.appendChild(listDates(this.fits,this.project.series_list));
  title=d.createElement('h3');
  title.appendChild(d.createTextNode("Undated"));
  d.body.appendChild(title);
  d.body.appendChild(listUndated(this.fits,this.project.series_list));
  break;
 };
};

/* display functions */

dendroApp.prototype.viewMaster=function(obj)
{
 integ.projectSeriesSpec.emptyContainer();
 integ.projectSeries=obj;
 integ.projectSeriesSpec.object=obj;
 integ.projectSeriesSpec.fillContainer();
 app.showTool("ProjectSeries");
};

dendroApp.prototype.viewData=function(obj)
{
 integ.seriesSpec.emptyContainer();
 integ.series=obj
 integ.seriesSpec.object=obj;
 integ.seriesSpec.fillContainer();
 app.showTool("Series");
};

dendroApp.prototype.datedSamples=function(not)
{
 var a=[],i,j,k,inf=[],aa,pos=0,g,h;
 function mark(i,group)
 {
  var aa,j,k;
  if(inf[i].combines)
  {
   aa=inf[i].combines.split(",");
   for(j=0;j<aa.length;j++)
   {
    k=dendro.findSample(aa[j]);
    if(k!=-1)
    {
     mark(k,group);
    };
   };
  }
  else
  {
   inf[i].group=group;
   if(!inf[i].pos)
   {
    pos++;
    inf[i].pos=pos;
   };
  };
 };
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample")
  {
   inf[i]={"id":i,"plot":false,"pos":0,"group":null,"combines":false,"t":0};
   continue;
  };
  if(!this.project.series_list[i].combines)
  {
   inf[i]={"id":i,"plot":this.project.series_list[i].dated?!not:not,"pos":0,"group":null,
    "combines":false,"t":this.project.series_list[i].t_from};
  };
 };
 for(i=0;i<this.project.series_list.length;i++)
 {
  if(this.project.series_list[i].series_type!="Dendro_Sample"){continue;};
  if(this.project.series_list[i].combines)
  {
   inf[i]={"id":i,"plot":false,"pos":0,"group":null,
    "combines":this.project.series_list[i].combines,"t":0};
   mark(i,i);
  };
  inf[i].hue=210;
 };
 if(pos)
 {
  for(i=0;i<inf.length;i++)
  {
   if(!inf[i].pos)
   {
    pos++;inf[i].pos=pos;inf[i].group=this.project.series_list.length;
   };
  };
  inf.sort(function(a,b){if(a.group==b.group){return a.pos-b.pos;}else{return a.group-b.group;};});
  g=1;
  for(i=0;i<inf.length-1;i++){if(inf[i].group!=inf[i+1].group){g++;};};
  if(g>1)
  {
   h=210;
   for(i=0;i<inf.length-1;i++)
   {
    inf[i].hue=h;
    if(inf[i].group!=inf[i+1].group)
    {
     h+=120/g+60;
     if(h>300){h-=210;};
    };
   };
  };
 }
 else
 {
  inf.sort(function(a,b){return b.t-a.t;});
 };
 for(i=0;i<inf.length;i++){if(inf[i].plot){a.push({"id":inf[i].id,"hue":inf[i].hue})};};
 return a;
};


dendroApp.prototype.viewFit=function(obj)
{
 this.plot("Fit",obj);
};

dendroApp.prototype.hsvaToRgba=function(h,s,v,a)
{
 var r,g,b;
 if((0<=h) && (h<=60)){r=255;g=(255*h/60);b=0;};
 if((60<h) && (h<=120)){r=(255-255*(h-60)/60);g=255;b=0;};
 if((120<h) && (h<=180)){r=0;g=255;b=(255*(h-120)/60);};
 if((180<h) && (h<=240)){r=0;g=(255-255*(h-180)/60);b=255;};
 if((240<h) && (h<=300)){r=(255*(h-240)/60);g=0;b=255;};
 if((300<h) && (h<=360)){r=255;g=0;b=(255-255*(h-300)/60);}; 
 r=255-(s*(255-r)/100);
 g=255-(s*(255-g)/100);
 b=255-(s*(255-b)/100);
 r=Math.round(v*r/100);
 g=Math.round(v*g/100);
 b=Math.round(v*b/100);
 return "rgba("+r+","+g+","+b+","+a+")";
};


dendroApp.prototype.viewFiltered=function(mode)
{
 switch(mode)
 {
 case 'Master':
  this.filteredMasterSpec=this.genFilteredSpec("Filtered Master");
  this.filteredMaster=this.filterData(this.master.data,this.options.analysis.parameters,this.master.filtered);
  app.clearTool("FilteredProjectSeries");
  document.getElementById("FilteredMaster").appendChild(
  	this.filteredMasterSpec.createDisplay(this.filteredMaster));   
  app.showTool("FilteredProjectSeries");
  break;
 case 'Data':
  this.filteredDataSpec=this.genFilteredSpec("Filtered Data");
  this.filteredData=this.filterData(this.trimData(this.data.data),this.options.analysis.parameters,this.data.filtered);
  app.clearTool("FilteredSeries");
  document.getElementById("FilteredData").appendChild(
  	this.filteredDataSpec.createDisplay(this.filteredData));   
  app.showTool("FilteredSeries");
  break;
 };
};

dendroApp.prototype.t_calc=function(inf,dated)
{
 inf.autox=1;
 inf.x_calc="G(t)";
 inf.dx_calc="";
// inf.dx_calc="G(t_sigma)";
 if(dated)
 {
  inf.xlabel=integ.dateLabel();
 }
 else
 {
  inf.xlabel="Rings";
 };
 switch(dated && integ.project.options.t_units)
 {
 case "b2k":
 case "calBP":
 case "BC":
 case "BCE":
  inf.autox=2;
 case "AD":
 case "CE":
  inf.x_calc=integ.project.options.t_units+"(t)";
  break;
 };
};

dendroApp.prototype.plot=function(mode,opt)
{
 var plotInfo,multiPlots,plotOptions,plotData,labels=[];
 var list=[],compdata=[];
 function addData(obj,hue)
 {
  plotData.push({name:obj.series,line:"solid",
  markerColor:dendro.hsvaToRgba(hue,100,100,1),
  markerFill:dendro.hsvaToRgba(hue,100,100,0.25),
  lineColor:dendro.hsvaToRgba(hue,100,100,1),
  marker:"",selected:true,
   data:dendro.plotRaw?
   dendro.rawData(obj.data,dendro.options.plot.parameters):
   dendro.filterData(obj.data,dendro.options.plot.parameters,obj.filtered)});
  compdata.push(dendro.filterData(obj.data,dendro.options.plot.parameters,obj.filtered));
  return plotData[plotData.length-1];
 };
 function correlData(a,b,hue)
 {
  var d,i=0,j=0,k,o;
  c=[];
  if(a.length<2 || b.length<2){return;};
  d=a[1].t-a[0].t;
  while((j<b.length)&&((a[i].t-b[j].t)*d>0)){j++;};
  if(j<b.length)
  {
   while((i<a.length)&&((a[i].t-b[j].t)*d<0)){i++;};
  };
  while((i<a.length) && (j<b.length))
  {
   o={};
   o['t']=a[i].t;
   for(k=0;k<dendro.options.plot.parameters.length;k++)
   {
    o[dendro.options.plot.parameters[k].parameter+"_a"]=
    	a[i][dendro.options.plot.parameters[k].parameter];
    o[dendro.options.plot.parameters[k].parameter+"_b"]=
    	b[j][dendro.options.plot.parameters[k].parameter];
   };
   c.push(o);
   i++;
   j++;
  };
  plotData.push({name:"Correlation",line:"",
  markerColor:dendro.hsvaToRgba(hue,100,100,1),
  markerFill:dendro.hsvaToRgba(hue,100,100,0.25),
  lineColor:dendro.hsvaToRgba(hue,100,100,1),
  marker:"cross",contour:"Ellipse",selected:true,
  data:c});
 };
 function maxNo(data)
 {
  var i,mx=0;
  for(i in data)
  {
   if(data[i].sample_depth && (data[i].sample_depth>mx))
   {
    mx=data[i].sample_depth;
   };
  };
  return mx;
 };
 var i,j,k,obj,count,n,s,h,a,dated=false,ld,rw;
 integ.setupPlot();
 this.setProject();
 integ.pl.refs=this.project.refs;
 integ.pl.z_type="rings";
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.minx=0;
 plotInfo.maxx=1;
 plotInfo.autox=1;
 plotInfo.miny=0;
 plotInfo.maxy=1;
 plotInfo.autoy=1;
 plotInfo.y_calc=this.options.analysis.parameters[0].parameter;
 plotInfo.ylabel=this.parameterName(this.options.analysis.parameters[0].parameter);
 plotInfo.title=this.data.project;
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=5; // cm
 plotOptions.multiPlot=true;

 integ.pl.plotData=[];
 plotData=integ.pl.plotData;
 integ.pl.multiPlots={plots:[],showKey:true,keyColumn:0,
  keyRow:this.options.plot.parameters.length,columns:1,
  tiedXAxes:2};
 switch(mode)
 {
 case 'ProjectDated':
  dated=true;
 case 'ProjectUnDated':
  a=this.datedSamples(mode=='ProjectUnDated');
  plotData.push({"name":"Labels","line":"solid","marker":"ylabel","selected":true,"data":labels});
  for(i=0;i<a.length;i++)
  {
   obj=this.project.series_list[a[i].id];
   for(j=0;j<this.options.plot.parameters.length;j++)
   {
    this.options.plot.parameters[j].toffset=-2*i;
   };
   addData(obj,a[i].hue);
   obj={"label":obj.series,"t":null};
   for(j=0;j<this.options.plot.parameters.length;j++)
   {
    obj[this.options.plot.parameters[j].parameter]=0;
    obj[this.options.plot.parameters[j].parameter+"_offset"]=-2*i;
   };
   labels.push(obj);
  };
  plotOptions.plotHeight=5+a.length*0.5;
  count=a.length;
  integ.pl.multiPlots.showKey=false;
  break;
 case 'ProjectAll':
 case 'ProjectSelected':
  count=0;
  plotData.push({"name":"Labels","line":"solid","marker":"ylabel","selected":true,"data":labels});
  for(i=0;i<this.project.series_list.length;i++)
  {
   if((this.project.series_list[i].selected||mode=='ProjectAll')
    &&(this.project.series_list[i].series_type=="Dendro_Sample"))
   {
    count++;
   }
  };
  n=0;
  for(i=0;i<this.project.series_list.length;i++)
  {
   if((this.project.series_list[i].selected||mode=='ProjectAll')
    &&(this.project.series_list[i].series_type=="Dendro_Sample"))
   {
    obj=this.project.series_list[i];
    if(obj.dated){dated=true;};
    for(j=0;j<this.options.plot.parameters.length;j++)
    {
     this.options.plot.parameters[j].toffset=-2*n;
    };
    addData(obj,210);
    obj={"label":obj.series,"t":null};
    for(j=0;j<this.options.plot.parameters.length;j++)
    {
     obj[this.options.plot.parameters[j].parameter]=0;
     obj[this.options.plot.parameters[j].parameter+"_offset"]=-2*n;
    };
    labels.push(obj)
    n++;
   }
  };
  plotOptions.plotHeight=5+count*0.5;
  integ.pl.multiPlots.showKey=false;
  break;
 case "Fit":
  for(n=0;n<2;n++)
  {
   switch(n)
   {
   case 0: obj=this.findData(opt.a);h=240; break;
   case 1: obj=this.findData(opt.b);h=120; break;
   case 2: obj=this.findData(opt.c);h=0; break;
   };
   if(obj){addData(obj,h);if(obj.dated){dated=true;};};
  };
  break;
 default:
  this.setProject();
  if(mode.indexOf('Data')!=-1)
  {
   obj=this.data;
   if(obj.combines && (mode.indexOf('Master')==-1))
   {
    n=obj.combines.split(",");
    opt={"a":n[0],"b":n[1],"c":obj.series};
    if(this.master=this.findData(n[1]))
    {
     app.menu("Plot|Sample vs Sample|Fit options",{"id":"dendro"}).then(function(rpl){
      switch(rpl)
      {
      case 1: this.plot("Fit",opt);break;
      case 2: this.data=this.findData(n[0]);this.fit();break;
      };
     }.bind(this)).catch(function(){});
     return;
    };
   };
   if(obj){addData(obj,120);};
  };
  if(mode.indexOf('Master')!=-1)
  {
   obj=this.master;dated=true;
   if(obj){ld=addData(obj,240);ld.noauto=(plotData.length>1);};
  };
  if(obj.dated){dated=true;};
 };
 this.t_calc(plotInfo,dated);
 multiPlots=integ.pl.multiPlots;
 if((mode=='Master|Data')||(mode=='Fit') && (plotData.length>1))
 {
  plotOptions.plotWidth=plotOptions.plotHeight;
  multiPlots.columns=4;
  multiPlots.tiedYAxes=this.plotRaw?0:4;
  multiPlots.tiedXAxes=0;
  correlData(plotData[0].data,plotData[1].data,0);
 };
 k=0;rw=-1;
 for(i=0;i<this.options.plot.parameters.length;i++)
 {
  switch(mode)
  {
  case "Master":
   if(!this.parmUsed(this.master,this.options.plot.parameters[i].parameter)){continue;};
   break;
  case "Data":
  case "Master|Data":
  case "Fit":
   if(!this.parmUsed(this.data,this.options.plot.parameters[i].parameter)){continue;};
   break;
  default:
   if(!this.parmUsed(compdata,this.options.plot.parameters[i].parameter)){continue;};
   break;
  };
  rw++;
  multiPlots.keyRow=rw+1;
  multiPlots.plots[k]={};
  m=multiPlots.plots[k];
  k++;
  m.minx=0;
  m.maxx=1;
  m.autox=1;
  if((!this.options.plot.fullMaster)&&(mode=="Master|Data")&&this.data.length)
  {
   m.minx=this.data.t_from-5;m.maxx=this.data.t_to+5;m.autox=0;
  };
  if((!this.options.plot.fullMaster)&&(mode=="Fit")&&plotData.length==3)
  {
   obj=this.findData(opt.b);   
   m.minx=obj.t_from-5;m.maxx=obj.t_to+5;m.autox=0;
  };
  m.miny=0;m.maxy=1;m.autoy=1;
  m.y_calc=this.options.plot.parameters[i].parameter;
  if(this.options.plot.parameters[i].toffset)
  {
   m.y_calc+=" + "+this.options.plot.parameters[i].parameter+"_offset";
  };
  m.ylabel=this.parameterName(this.options.plot.parameters[i].parameter);
  m.title="";
  if(this.options.plot.parameters[i].t)
  {
   if(this.plotRaw)
   {
    m.miny=0;m.maxy=10;m.autoy=1;
   }
   else
   {
    m.miny=-4;m.maxy=4;m.autoy=0;
   };
   if(typeof(this.options.plot.parameters[i].toffset)!='undefined')
   {
    if(!this.plotRaw){m.miny=-2*count-2;m.maxy=5;m.autoy=0;};
    this.options.plot.parameters[i].toffset=undefined;
    m.ylabel='noaxis';
    m.title=this.parameterName(this.options.plot.parameters[i].parameter);
   };
  }
  else
  {
   m.miny=0;m.maxy=1;m.autoy=1;
   if(typeof(this.options.plot.parameters[i].toffset)!='undefined')
   {
    this.options.plot.parameters[i].toffset=undefined;
    m.ylabel='noaxis';
    m.title=this.parameterName(this.options.plot.parameters[i].parameter);
   };
  };
  this.t_calc(m,dated);
  switch(mode)
  {
  case "Master|Data": case "Fit":
   if(compdata.length==2)
   {
    if(opt=this.checkFit(m.y_calc,compdata[0],compdata[1]))
    {
     m.title="t = "+opt.t.toFixed(2);
     m.title+=" r = "+opt.c.toFixed(3);
     m.title+=" n = "+opt.n;
    };
   };
  };
  m.selected=true;
  m.row=rw;
  m.column=0;
  if(((mode=='Master|Data')||(mode=='Fit')) && (plotData.length>1))
  {
   m.colspan=3;
   multiPlots.plots[k]={};
   m=multiPlots.plots[k];
   k++;
   if(this.options.plot.parameters[i].t)
   {
    if(this.plotRaw)
    {
     m.minx=0;m.maxx=10;m.autox=1;
     m.miny=0;m.maxy=10;m.autoy=1;
    }
    else
    {
     m.minx=-4;m.maxx=4;m.autox=0;
     m.miny=-4;m.maxy=4;m.autoy=0;
    };
   }
   else
   {
    m.minx=0;m.maxx=1;m.autox=1;
    m.miny=0;m.maxy=1;m.autoy=1;
   };
   m.x_calc=this.options.plot.parameters[i].parameter+"_a";
   m.y_calc=this.options.plot.parameters[i].parameter+"_b";
   m.xlabel="noaxis";
   m.ylabel="noaxis";
   m.selected=true;
   m.row=rw;
   m.column=3;
  };
 };
 if(!((mode=='Master|Data')||(mode=='Fit')) && (plotData.length==1) && (maxNo(plotData[0].data)>1))
 {
  multiPlots.plots[k]={};
  m=multiPlots.plots[k];
  k++;
  m.minx=0;
  m.maxx=1;
  m.autox=1;
  m.miny=0;m.maxy=maxNo(plotData[0].data)+1;m.autoy=0;
  this.t_calc(m,dated);
  m.y_calc="sample_depth";
  m.ylabel="Depth";
  m.title="";
  m.selected=true;
  rw++;
  m.row=rw;
  m.column=0;
  multiPlots.keyRow++;
 };
 integ.pl.render();
 app.showTool('Plot');
};

dendroApp.prototype.plotFit=function()
{
 var i,j,col,parm;
 var plotInfo,multiPlots,plotOptions,plotData;
 if(!this.fitData){return;};
 app.prompt("Fit options: "+this.data.series+" - "+this.master.series,this.fitData,this.getFitSpec(),{"id":"dendroFit"}).catch(function(){});
 integ.setupPlot();
 this.setProject();
 integ.pl.refs=this.project.refs;
 integ.pl.z_type="rings";
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.minx=0;
 plotInfo.maxx=1;
 plotInfo.autox=1;
 plotInfo.miny=0;
 plotInfo.maxy=1.1;
 plotInfo.autoy=false;
 plotInfo.dx_calc=0.5;
 this.t_calc(plotInfo,this.data.dated);
 plotInfo.x_calc=plotInfo.x_calc.replace("(t)","(t_to)");
 plotInfo.y_calc="p";
 plotInfo.ylabel=this.parameterName("Probability");
 plotInfo.title=this.data.project;
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=5; // cm
 plotOptions.multiPlot=true;

 integ.pl.plotData=[];
 plotData=integ.pl.plotData;
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  parm=this.options.analysis.parameters[i].parameter;
  if(!this.fitData[parm]){continue;};
  switch(parm)
  {
  case "ring_width": col="0,255,0"; break;
  case "d13C": col="0,0,255"; break;
  case "d18O": col="255,0,0"; break;
  };
  plotData.push({name:this.parameterName(parm),line:"",markerColor:"rgb("+col+")",
  markerFill:"rgba("+col+",0.25)",lineColor:"rgb("+col+")",
  marker:"histogram",selected:true,
  data:this.fitData[parm]})
 };
 col="0,0,0";
 if(this.fitData["comb"])
 {
  plotData.push({name:"Combination",line:"",markerColor:"rgb("+col+")",
  markerFill:"rgba("+col+",0.25)",lineColor:"rgb("+col+")",
  marker:"histogram",selected:true,
  data:this.fitData["comb"]})
 };

 integ.pl.multiPlots={plots:[],showKey:true,keyColumn:0,
  keyRow:3,columns:1,
  tiedXAxes:2};
 multiPlots=integ.pl.multiPlots;
 for(i=0;i<3;i++)
 {
  multiPlots.plots[i]={};
  m=multiPlots.plots[i];
  m.minx=0;
  m.maxx=1;
  m.autox=1;
  m.autoy=0;
  m.x_calc=plotInfo.x_calc;
  m.dx_calc=0.5;
  m.xlabel=plotInfo.xlabel;
  switch(i)
  {
   case 0:
    m.y_calc="c";m.miny=-1;m.maxy=1;
    m.ylabel="Correlation";
    m.title="r [max";
    break;
   case 1:
    m.y_calc="t";m.autoy=1;
    m.ylabel="t-value";
    m.title="t [max";
    break;
   case 2:
    m.y_calc="p";m.miny=0;m.maxy=1.1;
    m.ylabel="Probability";
    m.title="p [max";
    break;   
  };
  if(this.fitData)
  {
   for(j=0;j<this.fitData.best.length;j++)
   {
    switch(i)
    {
     case 0:
      if(!this.isNaNoN(this.fitData.best[j].c))
      {
       m.title+=" "+this.fitData.best[j].parm+": "+this.fitData.best[j].c.toFixed(3);
      };
      break;
     case 1:
      if(!this.isNaNoN(this.fitData.best[j].t))
      {
       m.title+=" "+this.fitData.best[j].parm+": "+this.fitData.best[j].t.toFixed(3);
      };
      break;
     case 2:
      if(!this.isNaNoN(this.fitData.best[j].p))
      {
       m.title+=" "+this.fitData.best[j].parm+": "+this.fitData.best[j].p.toFixed(3);
      };
      break;   
    };
   };
  };
  m.title+=" ]"
  m.selected=true;
  m.row=i;
  m.column=0;
 };
 integ.pl.render();
 app.showTool('Plot');
};


dendroApp.prototype.plotTimbers=function()
{
 var plotInfo,multiPlots,plotOptions,plotData;
 var a=this.datedSamples(),d,i,sam,dat,season,e=0.3;
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.minx=0;
 plotInfo.maxx=1;
 plotInfo.autox=1;
 plotInfo.miny=a.length+0.5;
 plotInfo.maxy=-1.5;
 plotInfo.autoy=0;
 this.t_calc(plotInfo,true);
 plotInfo.dx_calc='d_year';
 plotInfo.y_calc="y";
 plotInfo.dy_calc="d_y";
 plotInfo.ylabel=this.parameterName("noaxis");
 plotInfo.title=this.project.header.record;
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=a.length+2; // cm
 plotOptions.multiPlot=false;
 plotOptions.showKey=false;
 

 integ.pl.plotData=[];
 plotData=integ.pl.plotData;
 plotData.push({name:"Sapwood",line:"",markerColor:"rgb(255,255,0)",
  markerFill:"rgba(255,128,0,0.25)",lineColor:"rgb(255,128,0)",
  marker:"rectangle",selected:true,
  data:[]});
 plotData.push({name:"Wood",line:"",markerColor:"rgb(0,0,0)",
  markerFill:"rgba(0,0,0,0.25)",lineColor:"rgb(0,0,0)",
  marker:"rectangle",selected:true,
  data:[]});
 plotData.push({name:"Labels",line:"",markerColor:"rgba(0,0,0,0)",
  markerFill:"rgba(0,0,0)",lineColor:"rgb(0,0,0)",
  marker:"ylabel",selected:true,include_label:true,
  data:[]});
 plotData.push({name:"Samples",line:"",markerColor:"rgba(0,0,0,0)",
  markerFill:"rgba(0,0,0)",lineColor:"rgb(0,0,0)",
  marker:"ylabel",selected:true,include_label:true,
  data:[]});
 for(i=0;i<a.length;i++)
 {
  sam=this.project.series_list[a[i].id];
  plotData[1].data.push({y:i,d_y:e,
  	t:(sam.t_from+sam.t_to)/2,d_year:(sam.t_to-sam.t_from)/2});
  if(sam.sapwood && sam.sapwood>1)
  {
   season=sam.sapwood-Math.floor(sam.sapwood);
   plotData[0].data.push({y:i,d_y:e,
  	 t:(sam.t_to+season/2-sam.sapwood/2),d_year:sam.sapwood/2});
   if(season)
   {
    if(season<=0.101)
    {
     plotData[2].data.push({y:i,
  	   t:sam.t_to+season+1,label:"Winter "+integ.showTString(sam.t_to),label_pos:1});      
    }
    else
    {
     if(season>0.101 && season<0.499)
     {
      plotData[2].data.push({y:i,
  	    t:sam.t_to+season+1,label:"Spring "+integ.showTString(sam.t_to+1),label_pos:1});  
     }
     else
     {
      plotData[2].data.push({y:i,
  	    t:sam.t_to+season+1,label:"Summer "+integ.showTString(sam.t_to+1),label_pos:1});      
     };
    };
   }
   else
   {
    plotData[2].data.push({y:i,
  	   t:sam.t_to+season+1,label:("("+integ.showTString(sam.t_to)+")"),label_pos:1});      
   };
  }
  else
  {
   if(sam.sapwood>0)
   {
    plotData[2].data.push({y:i,
  	   t:sam.t_to+1,label:("H/S "+integ.showTString(sam.t_to)),label_pos:1});      
   }
   else
   {
    plotData[2].data.push({y:i,
  	   t:sam.t_to+1,label:("("+integ.showTString(sam.t_to)+")"),label_pos:1});      
   };
  };
  plotData[3].data.push({y:i,t:(sam.t_from*0.75+sam.t_to*0.25)+2,label:sam.series,label_pos:0});      
 };
 integ.pl.render();
 app.showTool('Plot');
};

dendroApp.prototype.plotTest=function()
{
 var i,col,parm;
 var plotInfo,multiPlots,plotOptions,plotData;
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.minx=0;
 plotInfo.maxx=1;
 plotInfo.autox=1;
 plotInfo.miny=0;
 plotInfo.maxy=1.1;
 plotInfo.autoy=false;
 plotInfo.x_calc="len";
 plotInfo.dx_calc=0.5;
 plotInfo.xlabel="Segment length (Years)";
 plotInfo.y_calc="correct/fitted";
 plotInfo.ylabel=this.parameterName("Correct/Fitted");
 plotInfo.title=this.data.project;
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=5; // cm
 plotOptions.multiPlot=true;

 integ.pl.plotData=[];
 plotData=integ.pl.plotData;
 col="0,0,0";
 plotData.push({name:"Combination",line:"",markerColor:"rgb("+col+")",
 markerFill:"rgba("+col+",0.25)",lineColor:"rgb("+col+")",
 marker:"histogram",selected:true,
 data:this.testData.data["comb"]})
 for(i=0;i<this.options.analysis.parameters.length;i++)
 {
  parm=this.options.analysis.parameters[i].parameter;
  switch(parm)
  {
  case "ring_width": col="0,255,0"; break;
  case "d13C": col="0,0,255"; break;
  case "d18O": col="255,0,0"; break;
  };
  plotData.push({name:this.parameterName(parm),line:"",markerColor:"rgb("+col+")",
  markerFill:"rgba("+col+",0.25)",lineColor:"rgb("+col+")",
  marker:"histogram",selected:true,
  data:this.testData.data[parm]})
 };

 integ.pl.multiPlots={plots:[],showKey:true,keyColumn:0,
  keyRow:4,columns:1,
  tiedXAxes:2};
 multiPlots=integ.pl.multiPlots;
 for(i=0;i<4;i++)
 {
  multiPlots.plots[i]={};
  m=multiPlots.plots[i];
  m.minx=0;
  m.maxx=1;
  m.miny=0;
  m.maxy=1.1;
  m.autox=1;
  m.autoy=0;
  m.x_calc="len";
  m.dx_calc=0.5;
  m.xlabel="Segment length (Years)";
  switch(i)
  {
   case 0:
    m.y_calc="fitted/n";
    m.ylabel="Fitted";
    break;
   case 1:
    m.y_calc="correct/n";
    m.ylabel="Correct";
    break;
   case 2:
    m.y_calc="(fitted-correct)/n";
    m.ylabel="False";
    break;
   case 3:
    m.y_calc="correct/fitted";
    m.ylabel="Success";
    break;
  };
  m.title="";
  m.selected=true;
  m.row=i;
  m.column=0;
 };
 integ.pl.render();
 app.showTool('Plot');
};

dendroApp.prototype.plotFilters=function()
{
 var i,j,obj,h,sw;
 var plotInfo,multiPlots,plotOptions,plotData;
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.minx=-1;
 plotInfo.maxx=1;
 plotInfo.autox=false;
 plotInfo.miny=0;
 plotInfo.maxy=1;
 plotInfo.autoy=1;
 plotInfo.x_calc="t";
 plotInfo.dx_calc=0.5;
 plotInfo.xlabel="Years";
 plotInfo.y_calc="weight";
 plotInfo.ylabel=this.parameterName("Weight");
 plotInfo.title="Filters";
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=3.0; // cm
 plotOptions.plotPosY=1.5;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=5; // cm
 plotOptions.multiPlot=true;

 integ.pl.plotData=[];
 plotData=integ.pl.plotData;
 integ.pl.multiPlots={plots:[],showKey:true,keyColumn:0,keyRow:this.options.filters.length,
 	columns:1,tiedXAxes:2};
 multiPlots=integ.pl.multiPlots;
 for(i=0;i<this.options.filters.length;i++)
 {
  if(this.options.filters[i].weights.length>plotInfo.maxx)
  {
   plotInfo.maxx=this.options.filters[i].weights.length;
   plotInfo.minx=-plotInfo.maxx;
  };
 };
 for(i=0;i<this.options.filters.length;i++)
 {
  h=360*i/this.options.filters.length;
  obj={name:this.options.filters[i].filter,line:"",
  	markerColor:this.hsvaToRgba(h,100,80,1),
  	markerFill:this.hsvaToRgba(h,100,80,0.1),
  	lineColor:this.hsvaToRgba(h,100,80,1),
  	marker:"histogram",selected:true};
  obj.data=[];
  obj.data.push({"t":-this.options.filters[i].weights.length,"weight":0}); 
  for(j=this.options.filters[i].weights.length-1;j>0;j--)
  {
   obj.data.push({"t":-j,"weight":this.options.filters[i].weights[j]});
  };
  for(j=0;j<this.options.filters[i].weights.length;j++)
  {
   obj.data.push({"t":j,"weight":this.options.filters[i].weights[j]});
  };
  obj.data.push({"t":this.options.filters[i].weights.length,"weight":0}); 
  for(j=0;j<obj.data.length;j++)
  {
   obj.data[j]["weight_"+i]=obj.data[j]["weight"];
   obj.data[j]["index"]=i;
  };
  plotData.push(obj);
  multiPlots.plots[i]=duplItem(plotInfo);
  m=multiPlots.plots[i];
  m.y_calc="weight_"+i;
  m.col=0;
  m.selected=true;
  m.row=i;
  m.title=this.options.filters[i].filter;
 };
 plotInfo.x_calc="-0.4+t+0.8*index/"+this.options.filters.length;
 plotInfo.dx_calc="0.4/"+this.options.filters.length;
 integ.pl.render();
 app.showTool('Plot');
};

/* File handling */

dendroApp.prototype.setFilename=function()
{
 if(app.filename.indexOf('.')!=-1)
 {
  this.fileModeExt=app.filename.split('.').pop().toLowerCase();
 }
 else
 {
  this.fileModeExt="";
 };
 switch(app.fileMode)
 {
 case "ProjectMaster":
  if(this.fileModeIndex>-1){return;};
  integ.recordSpec.emptyContainer();
  this.project.masters.push({"file":app.filename});
  this.fileModeIndex=this.project.masters.length-1;
  integ.recordSpec.fillContainer();
  return;
 case "Master":
  integ.recordSpec.emptyContainer();
  this.project.masters.push({"file":app.filename,created:true});
  app.changed=true;
  this.fileModeIndex=this.project.masters.length-1;
  integ.recordSpec.fillContainer();
  return;
 case "ProjectData":
  if(this.fileModeIndex>-1){return;};
  integ.recordSpec.emptyContainer();
  this.project.series_list.push({"file":app.filename});
  this.fileModeIndex=this.project.series_list.length-1;
  integ.recordSpec.fillContainer();
  return;
 case "Data":
  integ.recordSpec.emptyContainer();
  this.project.series_list.push({"file":app.filename,created:true});
  app.changed=true;
  this.fileModeIndex=this.project.series_list.length-1;
  integ.recordSpec.fillContainer();
  return;
 case "Project":
  app.showFilename(app.filename);
 default:
  this.fileModeIndex=-1;
  this.filenames[app.fileMode]=app.filename;
  break;
 };
};

dendroApp.prototype.getFilename=function()
{
 app.filename=this.filenames[app.fileMode];
};

dendroApp.prototype.addDepth=function(obj)
{
 var i;
 if(obj.data && obj.data.length)
 {
  for(i=0;i<obj.data.length;i++)
  {
   obj.data[i].z=i+1;
  };
 };
};

dendroApp.prototype.parseBelfast=function(str)
{
  var lines,i,j,section="DATA",typ="undefined",elements,out,mult=100,max=0,tm=false;
  out={'data':[]};
  outArray=[];
  lines=str.split("\n");
  for(i=0;i<lines.length;i++)
  {
   lines[i]=lines[i].trim();
   if(!lines[i]){continue;};
   if(lines[i].indexOf(":")!=-1) // possible section line
   {
    elements=lines[i].split(/\s*[:]\s*/);
    elements[0]=elements[0].toUpperCase().trim();
    switch(elements[0])
    {
    case "HEADER":
     out={'data':[]};
     outArray.push(out);
    case "DATA":
     section=elements[0];
     typ=elements[1].toLowerCase().trim();
     continue;
    };
   };
   if((lines[i].indexOf("=")!=-1)||((lines[i].indexOf(":")!=-1))) // header information
   {
     if(section=="HEADER")
     {
      elements=lines[i].split(/\s*[\=\:]\s*/);
      switch(elements[0].toLowerCase())
      {
      case "dateend": out.t_to=Number(elements[1]);break;
      case "datebegin": out.t_from=Number(elements[1]);break;
      case "project": out.project=elements[1];break;
      case "keycode": out.series=elements[1];break;
      case "length": out.ring_count=Number(elements[1]);break;
      case "comment":
       out.notes=elements[1]+"\n";
       elements[1]=elements[1].toLowerCase();
       if(elements[1].indexOf("measured in")>0)
       {
        elements[1]=elements[1].slice(elements[1].indexOf("measured in"));
        if(elements[1].indexOf("mm")>0)
        {
         elements[1]=elements[1].slice(0,elements[1].indexOf("mm")+2);
         elements[1]=elements[1].replace("measured in","");
        }
        else
        {
         break;
        };
       }
       else
       {
        break;
       };
      case "unit": tm=Number(elements[1].replace('mm','').replace('1/',''));
       if((tm>1)&&(tm<9999)){mult=tm;};
       break;
      };
     }
     else
     {
      out.notes+=lines[i]+"\n";
     };
   }
   else
   {
     if(section=="DATA")
     {
      elements=lines[i].split(/\s+/);
      if(isNaN(elements[0]))
      {
       if(elements[0].toLowerCase().indexOf("comment")!=0)
       {
        out.notes+=lines[i]+"\n";
       };
       continue;
      };
      if((elements.length==1)&&(out.data.length==0)){continue;};  //ring number line
      switch(typ)
      {
      case "undefined":case "":
       for(j=0;j<elements.length;j++)
       {
        if(elements[j])
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":1});
        };
       };
       break;
      case "tree":
      case "single":
       for(j=0;j<elements.length;j++)
       {
        if(elements[j] && (out.data.length<out.ring_count))
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":1});
        };
       };
       break;
      case "double":
       for(j=0;j<elements.length-1;j++)
       {
        if(elements[j] && elements[j+1] &&(out.data.length<out.ring_count))
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":Number(elements[j+1])});
        };
        j++;
       };
       break;
      };
     };
   };
  };
  for(i=0;i<outArray.length;i++)
  {
   out=outArray[i];
   // Belfast does not have a year zero - convert to astronmical years
   if(out.t_from<0){out.t_from++;};
   if(out.t_to<0){out.t_to++;};
   if(out.t_from){this.setStart(out,out.t_from);out.dated=true;}
   else
   {
    if(out.t_to){this.setEnd(out,out.t_to);out.dated=true;};
   };
  };
  if(outArray.length>1){return outArray;};
  return out;
};

dendroApp.prototype.parseFH=function(str)
{
  var lines,i,j,section="DATA",typ="undefined",elements,out,mult=100,max=0,tm=false;
  out={'data':[]};
  outArray=[];
  lines=str.split("\n");
  for(i=0;i<lines.length;i++)
  {
   lines[i]=lines[i].trim();
   if(lines[i].indexOf(":")!=-1) // section line
   {
    elements=lines[i].split(":");
    section=elements[0].toUpperCase();
    if(section=="HEADER")
    {
     out={'data':[]};
     outArray.push(out);
    };
    typ=elements[1].toLowerCase();
   }
   else
   {
    if(lines[i].indexOf("=")!=-1) // header information
    {
     if(section=="HEADER")
     {
      elements=lines[i].split("=");
      switch(elements[0].toLowerCase())
      {
      case "dateend": out.t_to=Number(elements[1]);break;
      case "datebegin": out.t_from=Number(elements[1]);break;
      case "project": out.project=elements[1];break;
      case "keycode": out.series=elements[1];break;
      case "length": out.ring_count=Number(elements[1]);break;
      case "unit": tm=Number(elements[1].replace('mm','').replace('1/',''));
       switch(tm)
       {
       case 10:
       case 100:
       case 1000:
        mult=tm;
        break;
       };
       break;
      };
     }
     else
     {
      app.alert("Header information out of place");
     };
    }
    else
    {
     if(section=="DATA")
     {
      elements=lines[i].split(/\s+/);
      switch(typ)
      {
      case "undefined":
       for(j=0;j<elements.length;j++)
       {
        if(elements[j])
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":1});
        };
       };
       break;
      case "tree":
      case "single":
       for(j=0;j<elements.length;j++)
       {
        if(elements[j] && (out.data.length<out.ring_count))
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":1});
        };
       };
       break;
      case "double":
       for(j=0;j<elements.length-1;j++)
       {
        if(elements[j] && elements[j+1] &&(out.data.length<out.ring_count))
        {
         out.data.push({"ring_width":Number(elements[j])/mult,"sample_depth":Number(elements[j+1])});
        };
        j++;
       };
       break;
      };
     };
    };
   };
  };
  for(i=0;i<outArray.length;i++)
  {
   out=outArray[i];
   if(out.t_from){this.setStart(out,out.t_from);out.dated=true;}
   else
   {
    if(out.t_to){this.setEnd(out,out.t_to);out.dated=true;};
   };
  };
  if(outArray.length>1){return outArray;};
  return out;
};

dendroApp.prototype.parseOx=function(str)
{
  var lines,str,ar,i,j,k;
  out={};
  out.data=[];
  out.notes="";
  lines=str.replace(/\x1A/g,"").replace(/\r/g,"").split("\n");
  if(lines.length<3)
  {
   alert("No data");return out;
  };
  if(!((lines[0].charAt(0)=="'")&&(lines[0].indexOf(">")!=-1)&&(lines[0].indexOf("<")!=-1)))
  {
   alert("No header found");return out;
  };
  str=lines[0].slice(1,lines[0].indexOf("<"));
  out.series=str.replace(/\s/g,'');
  str=lines[0].slice(lines[0].indexOf("<")+1,lines[0].indexOf(">"));
  ar=str.split("-");
  if(ar.length==2)
  {
   out.t_from=Number(ar[0]);
   out.t_to=Number(ar[1]);
   out.ring_count=out.t_to-out.t_from+1;
  };
  out.project=lines[0].slice(lines[0].indexOf(">")+1).replace(/\s/,'');
  if((out.project.lastIndexOf("'")==out.project.length-1)&&(out.project.indexOf("-")!=-1))
  {
   out.notes+=out.project.slice(out.project.indexOf("-")+1,out.project.lastIndexOf("'"));
   out.project=out.project.slice(0,out.project.indexOf("-"));
  };
  ar=lines[1].split(",");
  if(ar.length==2)
  {
   out.ring_count=Number(ar[0]);
   out.t_from=Number(ar[1]);
   out.t_to=out.t_from+out.ring_count-1;
  };
  for(i=2;(i<lines.length) && (lines[i]!='') && (out.data.length<out.ring_count);i++)
  {
   ar=lines[i].split(/\s+/);
   for(j=0;(j<ar.length)&&(out.data.length<out.ring_count);j++)
   {
    if(ar[j]!=''){out.data.push({"ring_width":Number(ar[j]/100),"sample_depth":1});};
   };
  };
  for(;(i<lines.length) && (lines[i]=='');i++){}; // skip any blank lines
  if(i<lines.length)
  {
   ar=lines[i].split(/\s+/);
   if((lines[i].indexOf('C')!=-1)||isNaN(ar[0])||((ar.length<10)&&(ar.length<out.data.length))) // single sample
   {
    ar[0]=ar[0].replace(/C/,"");
    if(!isNaN(ar[0]))
    {
     out.sapwood=Number(ar[0]);
     if(lines[i].indexOf('C')!=-1)
     {
      str=lines[i].slice(0,lines[i].indexOf('C'));
      ar=str.split(/\s+/);
      if((ar.length>1)&&(ar[1]!=''))
      {
       switch(ar[1])
       {
       case "1/2": out.sapwood+=0.5;break;
       case "1/4": out.sapwood+=0.25;break;
       default: out.sapwood+=0.1;break;
       };
      }
      else
      {
       out.sapwood+=0.1;
      };
     };
     str=lines[i];
     out.notes+=lines[i]+"\n\n";
     i++;
    };
    for(;(i<lines.length) && (lines[i]!='');i++)
    {
     out.notes+=lines[i]+"\n\n";
    }; 
   }
   else
   {
    k=0;
    for(;(i<lines.length) && (lines[i]!='');i++)
    {
     ar=lines[i].split(/\s+/);
     for(j=0;j<ar.length;j++)
     {
      if((ar[j]!='')&&(out.data[k]))
      {
       out.data[k].sample_depth=Number(ar[j]);
       k++;
      };
     };
    };
   };
  };
  if(out.t_from){this.setStart(out,out.t_from);};
  return out;
};

dendroApp.prototype.parseNot=async function(str)
{
 var lines,ar,i,j,out,dt,sw;
 function addRecord(obj)
 {
  if(obj.ring_count!=obj.data.length)
  {
   app.alert("Inconsistent ring count in: "+obj.series+"\n"+obj.ring_count+" vs. "+obj.data.length);
  };
  dendro.addDepth(obj);
  if(obj.dated){dendro.switchHemisphere(obj,'',integ.record.t_source);};
  obj.series_type="Dendro_Sample";
  integ.viewSeries(obj);
  integ.onSeriesChange();
 };
 function metadata(name,date,sap,notes)
 {
  var k;
  var s=0;
  notes+=", "+sap;
  if(sap=='h/s'){s=0.1;}
  else
  {
   s=Number(sap.replace(/C/i,''));
   if(isNaN(s)){s=0;}else{if(sap.indexOf('C')!=-1){s+=0.1;};};
  };
  for(k=0;k<integ.record.series_list.length;k++)
  {
   if(integ.record.series_list[k].series.indexOf(name)==0)
   {
    integ.record.series_list[k].sapwood=s;
    dendro.setEndDirect(integ.record.series_list[k],isNaN(date)?0:date,!isNaN(date));
    integ.record.series_list[k].notes=notes;
   };
  };
 };
 lines=str.replace(/\x1A/g,"").replace(/\r/g,"").split("\n");
 try
 {
  if(lines.length<3)
  {
   if(!(await app.confirm("No data: import metadata"))){return;};
   lines=[];
  };
  await this.checkRecordHemisphere(integ.record);
 }catch(e){};
 integ.recordSpec.emptyContainer();
 for(i=0;i<lines.length;i++)
 {
  ar=lines[i].split(/\s+/);
  if((ar[0].search(/[a-zA-Z]/)!=-1) && (ar.length>1)) // start an new obj
  {
   out={};
   out.data=[];
   out.notes="";
   out.series=ar[0];
   out.ring_count=Number(ar[1]);
  }
  else
  {
   if(lines[i]){await app.alert('Cannot parse line: \n'+lines[i]);};
   break;
  };
  for(i=i+1;i<lines.length;i++)
  {
   ar=lines[i].split(/\s+/);
   if(ar[0].search(/[a-zA-Z]/)!=-1) // start of next entry
   {
    addRecord(out);
    i--;break;
   };
   for(j=0;j<ar.length;j++)
   {
    if(ar[j]!=''){out.data.push({"t":(out.data.length+1-out.ring_count),"ring_width":(Number(ar[j])/100),"sample_depth":1});};
   };
  };
 };
 if(out){addRecord(out);};
 integ.recordSpec.fillContainer();
 str=await app.prompt("Paste metadata table","","paste");
 lines=str.replace(/\x1A/g,"").replace(/\r/g,"").split("\n");
 integ.recordSpec.emptyContainer();
 integ.seriesSpec.emptyContainer();
 for(i=0;i<lines.length;i++)
 {
  ar=lines[i].split(/\s+/);
  if(ar.length<6){continue;};
  dt=ar.pop();ar.pop();ar.pop();sw=ar.pop();ar.pop();
  metadata(ar[0],dt,sw,(ar.shift(),ar.join(" ")));
 };
 integ.seriesSpec.fillContainer();
 integ.recordSpec.fillContainer();
 integ.onRecordChange();
 this.setProject();
 this.showReport("table");
};

dendroApp.prototype.links=function(str)
{
 var rtn=[],i;
 var ar=str.split(/href\s*=\s*"/i);
 for(i=1;i<ar.length;i++)
 {
  rtn.push(ar[i].split(/"/)[0]);
 };
 return rtn;
};

dendroApp.prototype.parseTucson=async function(str,r,filter)
{
 if(!filter){filter={"oncode":true,"code":"","ontime":false,"t_from":null,"t_to":null}};
 var lines,ar,i,j,out,t,dt,sw,thou=false,latlong,species,species_code,period,samp_code='',min=9999,failed=false,start_data=3,hem='',comment,ignored=false;
 if(!r){r={"header":{"record":"","site_type":"Dendrochronological","z_type":"rings","z_units":"rings","record_comment":""},"series_list":[],"refs":[]};};
 app.alert("Parsing Tucson file",2000);
 function addRecord(obj)
 {
  var d;
  if(integ.findSeries(obj.series)){return;}; // no duplicates imported
  for(d=0;d<obj.data.length;d++)
  {
   if(thou)
   {
    if(obj.data[d].ring_width){obj.data[d].ring_width/=10;};
   }
   else
   {
    if(obj.data[d].ring_width==999){obj.data[d].ring_width=null;};
   };
   if(obj.data[d].ring_width==0){obj.data[d].ring_width=null;};
  };
  while(obj.data.length && (obj.data[obj.data.length-1].ring_width==null))
  {
   obj.data.pop();
  };
  if(obj.data.length)
  {
   obj.t_to=obj.data[obj.data.length-1].t;
  }
  else
  {
   return;
  };
  if(out.dated){obj.t_to_orig=obj.t_to;};
  obj.ring_count=obj.t_to-obj.t_from+1;
  if(filter.ontime)
  {
   if((filter.t_from!==null)&&(filter.t_from>obj.t_to)){return;};
   if((filter.t_to!==null)&&(filter.t_to<obj.t_from)){return;};
  }
  else
  {
   if((filter.t_from===null)||(filter.t_from<obj.t_from)){filter.t_from=obj.t_from;};
   if((filter.t_to===null)||(filter.t_to<obj.t_to)){filter.t_to=obj.t_to;};
  };
  if(obj.ring_count!=obj.data.length)
  {
   app.alert("Inconsistent ring count in: "+obj.series+"\n"+obj.ring_count+" vs. "+obj.data.length);
  };
  obj.series_type="Dendro_Sample";
  dendro.addDepth(obj);
  if(obj.dated){dendro.switchHemisphere(obj,'',integ.record.header.t_source);};
  integ.viewSeries(obj);
  integ.onSeriesChange();
 };
 function llToFixed(s)
 {
  var d,m;
  d=Number(s.slice(0,-2));m=Number(s.slice(-2));
  if(d<0){return d-m/60;};
  return d+m/60;
 };
 lines=str.replace(/\x1A/g,"").replace(/\r/g,"").split("\n");
 if(lines.length<3)
 {
  await app.alert("No data: import metadata");
  return;
 };
 for(i=0;i<lines.length;i++)
 {
  if(lines[i].indexOf('#')==0)
  {
   lines.splice(i,1);i--;
  };
 };
 if(r==integ.record){integ.recordSpec.emptyContainer();};
 for(i=0;i<start_data;i++)
 {
  switch(i)
  {
  case 0:
   filter.code=lines[i].slice(0,6).trim();
   if(lines[i].slice(9).search(/[^\d.\s-]/g)==-1) // only numbers no header
   {
    start_data=0;continue;
   };
   if(!r.header.record){r.header.record=filter.code;};
   if(!r.header.site){r.header.site=lines[i].slice(9,61).trim();};
   species_code=lines[i].slice(61).split(/\s+/)[0];
   break;
  case 1:
   if(lines[i].slice(0,6)!=lines[0].slice(0,6)){failed=true;};
   if(!r.header.country){r.header.country=lines[i].slice(9,22).trim();};
   species=lines[i].slice(22,40).trim();
   if(!r.header.species){r.header.species=species;};
   if(!r.header.elevation){r.header.elevation=Number(lines[i].slice(40,45).trim().replace(/m/gi,''));};
   latlong=lines[i].slice(45,57).trim().split(/\s+/);
   if(latlong.length>1)
   {
    if(!r.header.latitude){r.header.latitude=llToFixed(latlong[0]);};
    if(!r.header.longitude){r.header.longitude=llToFixed(latlong[1]);};
   };
   if(r.header.latitude)
   {
    r.header.t_source=(r.header.latitude>0)?'DendroNH':'DendroSH';
   };
   period=lines[i].slice(63).replace(/-/g," -").replace(/_/g," ").trim().split(/\s+/);
   for(j=0;j<period.length;j++)
   {
    period[j]=Number(period[j]);
   };
   break;
  case 2:
   if(lines[i].slice(0,6)!=lines[0].slice(0,6)){failed=true;};
   comment=this.invLabel+lines[i].slice(9,72).trim();
   if(r.header.record_comment)
   {
    if(r.header.record_comment.indexOf(comment)==-1)
    {
     r.header.record_comment+="\n"+comment;
    };
   }
   else
   {
    r.header.record_comment=comment;
   };
   break;
  };
 };
 if(r==integ.record){integ.recordSpec.fillContainer();};
 if(failed){app.alert("File format is wrong");return;};
 if(r!=integ.record)
 {
  integ.viewRecord({"record":r.header.record,"file_data":r});
 };
 integ.onRecordChange(true);
 if(filter.oncode)
 {
  filter.code=await app.prompt("Filter on",filter.code);
 };
 min=9999;
 for(i=start_data;i<lines.length;i++)
 {
  ar=lines[i].split(/\s+/);
  if(ar[0].length>8) // deal with merged code and date info
  {
   switch(j=ar[0].lastIndexOf('-'))
   {
   case 6:case 7:case 8:
    lines[i]=lines[i].slice(0,j)+" "+lines[i].slice(j);
    break;
   default:
    lines[i]=lines[i].slice(0,8)+" "+lines[i].slice(8);
    break;
   };
   ar=lines[i].split(/\s+/);
  };
  if((ar.length<3)&&(lines[i])){continue;};
  if(Number(ar[1])<min){min=ar[1];};
 };
 if(start_data==0)
 {
  period=[9999,9999];
  try
  {
   if((await app.menu("Data fragment|Dated|Undated",{"id":"dendro"}))==1)
   {
    period[0]=min;
   };
  }
  catch(e)
  {
   app.alert(e);
   return;
  };
 };
 await this.checkRecordHemisphere(r);
 for(i=start_data;i<lines.length;i++)
 {
  ar=lines[i].split(/\s+/);
  if((ar.length<3)&&(lines[i])){await app.alert('Cannot parse line: \n'+lines[i]);continue;};
  if(filter.oncode && filter.code)
  {
   if(ar[0].indexOf(filter.code)!=0){ignored=true;continue;};
  };
  if(ar[0]!=samp_code) // start an new obj
  {
   samp_code=ar[0];
   if(out){addRecord(out);}
   out={};
   out.data=[];
   out.notes="";
   out.series=samp_code;
   out.dated=(min==period[0]);
   t=Number(ar[1]);
   thou=false;
   out.t_from=Number(ar[1]);
  }
  else
  {
   if(Number(ar[1])!=t)
   {
    await app.alert('Jump in line: \n'+lines[i]+"\nfrom "+t+" to "+Number(ar[1]));
    while((t>Number(ar[1]))&&(t-Number(ar[1])<11))
    {
     out.data.pop();
     t--;
    };
   };
   t=Number([ar[1]]);
  };
  for(j=2;j<ar.length;j++)
  {
   if(ar[j]!='')
   {
    switch(ar[j])
    {
    case "-9999":
    case "9999":
     out.data.push({"t":t,"ring_width":null,"sample_depth":1});
     thou=true;
     break;
    case "-999":
    case "999":
     out.data.push({"t":t,"ring_width":null,"sample_depth":1});
     thou=false;
     break;
    default:
     out.data.push({"t":t,"ring_width":(Number(ar[j])/100),"sample_depth":1});
     break;
    };
    t++;
   };
  };
 };
 if(out){addRecord(out);};
 try
 {
  if(!filter.ontime && ignored && (await app.confirm("Include overlapping records")))
  {
   filter.ontime=true;filter.oncode=false;
   this.parseTucson(str,r,filter);
   return;
  };
 }catch(e){};
 this.setProject();
 this.showReport("table");
};

dendroApp.prototype.exportTucson=function()
{
 var i,j,s,dsl;
 function findFL(f)
 {
  r=null;
  for(i=0;i<integ.record.series_list.length;i++)
  {
   s=integ.record.series_list[i];
   if(!s.selected){continue;};
   if(s.series_type!="Dendro_Sample"){continue;};
   if(!s.dated){continue;};
   if(f)
   {
    if((r===null)||(s.t_from<r)){r=s.t_from;};
   }
   else
   {
    if((r===null)||(s.t_to>r)){r=s.t_to;};
   };
  };
  return r;
 };
 function findInv()
 {
  var i,str,a;
  if(str=integ.record.header.record_comment)
  {
   a=str.split("\n");
   for(i=0;i<a.length;i++)
   {
    if(a[i].indexOf(dendro.invLabel)!=-1)
    {
     return a[i].replace(dendro.invLabel,"").trim();
    };
   };
  };
  return "";
 };
 function date(t,not_dated)
 {
  if(t===null){return null;};
  if(not_dated){return t;};
  if(integ.record.header.t_source=="DendroSH"){return Math.floor(t-0.5);};
  return Math.floor(t);
 };
 function date_string(t)
 {
  if(t===null){return "    ";};
  return date(t).toString().padStart(4," ");
 };
 function ll_txt(num)
 {
  var v,sec,min,deg,t,permil;
  v=Math.round(Math.abs(num*60));
  min=v % 60;
  v=(v-min)/60;
  deg=v % 360;
  v="";
  v=(deg+"").padStart(2,'0');
  if(num<0){v="-"+v;};
  v=v.padStart(4,' ');
  v+=min.toString().padStart(2,'0');
  return v;
 };
 var txt,site_id=integ.record.header.record.slice(0,6).padEnd(7,' ');
 txt=site_id+"1 ";
 txt+=integ.record.header.site.slice(0,51).padEnd(52,' ');
 if(integ.record.header.species_code)
 {
  txt+=integ.record.header.species_code.slice(0,4);
 };
 txt+='\n'+site_id+"2 ";
 txt+=(integ.record.header.country).slice(0,12).padEnd(13,' ');
 if(integ.record.header.species)
 {
  txt+=integ.record.header.species.slice(0,16).padEnd(18,' ');
 }else{txt+=''.padEnd(18,' ');};
 if(integ.record.header.elevation)
 {
  txt+=(integ.record.header.elevation+"M").trim(0,5).padStart(5," ");
 }else{txt+=''.padEnd(5,' ');};
 if(integ.record.header.latitude || integ.record.header.longitude)
 {
  txt+=ll_txt(integ.record.header.latitude);
  txt+=ll_txt(integ.record.header.longitude);
 }else{txt+=''.padStart(12,' ');};
 txt+="    __"
 txt+=(date_string(date(findFL(true)))+" "+date_string(date(findFL(false)))).padStart(13," ");
 txt+='\n'+site_id+"3 "+findInv();
 for(i=0;i<integ.record.series_list.length;i++)
 {
  s=integ.record.series_list[i];
  if(!s.selected){continue;};
  if(s.series_type!="Dendro_Sample"){continue;};
  permil=false;
  for(j=0;j<s.data.length;j++)
  {
   if(Math.round(s.data[j].ring_width*1000)%10){permil=true;};
  };
  t=date(s.t_from,!s.dated);
  for(j=0;j<s.data.length+1;j++)
  {
   if((j==0)||(t%10==0))
   {
    txt+="\n"+s.series.padEnd(8," ");
    dsl=date_string(t).length;
    if(dsl>4)  // remove end of series for rwl requirements!
    {
     txt=txt.slice(0,4-dsl); 
    };
    txt+=date_string(t);
   };
   t++;
   if(j==s.data.length)
   {
    if(permil){txt+=" -9999";}else{txt+="   999";};
   }
   else
   {
    if(s.data[j].ring_width===null)
    {
     txt+="     0";
    }
    else
    {
     if(permil)
     {
      txt+=Math.round(s.data[j].ring_width*1000).toString().padStart(6," ");
     }
     else
     {
      txt+=Math.round(s.data[j].ring_width*100).toString().padStart(6," ");
     };
    };
   };
  };
 };
 txt+="\n";
 app.fileDownload(integ.record.header.record+".rwl",txt);
};

dendroApp.prototype.dendroMenu=function(mode)
{
 switch(mode)
 {
 case 'Record':
  app.menu('Dendro|Select samples|Select masters||Cross check\nClear links|Reset dates|Float dates|Make single\nCross match|Link|Date|Solve\n\nTable|Export|Create master|Options\n\n',{"id":"dendro","resolve":function(rpl)
  {
   this.setProject();
   switch(rpl)
   {
   case 1:
    this.selectSamples(true);
    break;
   case 2:
    this.selectMasters(true,'choose');
    break;
   case 4:
    this.fitProject("check");
    break;
   case 5:
    this.clearLinks();
    break;
   case 6:
    this.resetEnds(true);
    break;
   case 7:
    this.floatEnds();
    break;
   case 8:
    this.makeSingle();
    break;
   case 9:
    this.fitProject("cross");
    break;
   case 10:
    this.fitProject("link");
    break;
   case 11:
    this.fitProject("date");
    break;
   case 12:
    this.fitProject("solve");
   case 14:
    this.showReport("table");
    break;
   case 15:
    this.exportTucson();
    break;
   case 16:
    this.fitProject("master");
    break;
   case 17:
    app.prompt("Specific dendro options",this.options,this.genOptionsSpec())
    .then(function(opt){
     var s;
     opt=JSON.stringify(opt);
     integ.recordSpec.emptyContainer();
     if(s=integ.findSeries('Dendro_Options'))
     {
      integ.seriesSpec.emptyContainer();
      s.code=opt;
      s.changed=true;
      integ.seriesSpec.fillContainer();
     }
     else
     {
      s={"series":"Dendro_Options","series_type":"Model","model_type":"Dendro","code":opt,
      	"selected":true,"created":true,"data":[],"refs":[]};
      integ.record.series_list.push(s);
     };
     integ.recordSpec.fillContainer();  
     integ.viewSeries(s);    
     integ.onSeriesChange();
    }.bind(this)).catch(function(e){});
    break;
   };
  }.bind(this),"reject":function(){},"multiple":true});
  break;
 case "Project":
  app.menu('Dendro|Options|Select masters|Locate masters|Set hemispheres|'+(this.plotRaw?"Plot filtered data":"Plot raw data"),{"id":"dendro"})
  .then(function(rpl)
  {
   switch(rpl)
   {
   case 1:
    app.prompt("Dendro options",this.globalOptions(),this.genOptionsSpec())
    .then(function(opt){
     var s;
     opt=JSON.stringify(opt);
     integ.seriesListSpec.emptyContainer();
     if(s=integ.findProjectSeries('Dendro_Options'))
     {
      integ.projectSeriesSpec.emptyContainer();
      s.file_data.code=opt;
      s.changed=true;
      integ.projectSeriesSpec.fillContainer();
     }
     else
     {
      s={"series":"Dendro_Options","project_series_type":"Model","selected":true,"created":true,"file_data":
        {"series":"Dendro_Options","project_series_type":"Model","model_type":"Dendro","code":opt,"data":[],"refs":[]}};
      integ.project.project_series_list.push(s);
     };
     integ.seriesListSpec.fillContainer();      
    }.bind(this)).catch(function(e){});
    break;
   case 2:
    this.selectMasters(true,'choose');
    break;
   case 3:
    this.locateMasters();
    break;
   case 4:
    this.setHemispheres();
    break;
   case 5:
    this.plotRaw=!this.plotRaw;
    break;
   };
  }.bind(this));
  break;
 };
};

dendroApp.prototype.dendroImport=function(mode)
{
  app.menu('Dendro format|Belfast|Heidelberg|NOAA ITRDB DOI|NOAA ITRDB study|Nottingham|Oxford|Tucson',{"id":"dendro"})
  .then(async function(rpl)
  {
   var txt,obj,objar;
   var options={"urlDescription":"Raw Measurements"};
   if(mode=="Record"){options.record=integ.record.header.record;};
   try
   {
    switch(rpl)
    {
    case 3:
     txt=await app.prompt("NOAA ITRDB DOI","","Text");
     noaa.parseNoaaDoi(txt,options);
     return;
    case 4:
     txt=await app.prompt("NOAA ITRDB Study No","","Number");
     noaa.parseNoaaStudy(txt,options);
     return;
    };
    
    while(txt=await app.prompt("Paste dendro data","","paste"))
    {
     switch(rpl)
     {
     case 1:
      obj=this.parseBelfast(txt);
      break;
     case 2:
      obj=this.parseFH(txt);
      break;
     case 5:
      if(mode=="Record")
      {
       this.parseNot(txt);
       obj=false; // directly imported
      }
      else
      {
       app.prompt("Unkown master format");
      };
      break;
     case 6:
      obj=this.parseOx(txt);
      break;
     case 7:
      if(mode=="Record")
      {
       this.parseTucson(txt,integ.record);
       obj=false; // directly imported
      }
      else
      {
       this.parseTucson(txt);
       obj=false; // directly imported
      };
      break;
     };
     if(!obj){break;};
     if(Array.isArray(obj)){objar=obj;}else{
      // deal with no header issue for single data file
      if(!obj.series)
      {
       obj.series=await app.prompt("Series name");
      };
      objar=[obj];
     };
     for(i=0;i<objar.length;i++)
     {
      obj=objar[i];
      this.addDepth(obj);
      switch(mode)
      {
      case 'Record':
       obj.series_type="Dendro_Sample";
       await this.checkRecordHemisphere(integ.record);
       if(obj.dated){this.switchHemisphere(obj,'',integ.record.header.t_source);};
       integ.viewSeries(obj);
       integ.onSeriesChange();
       break;
      case 'Project':
       obj.project_series_type="Dendro_Master";
       integ.viewProjectSeries({"file_data":obj});
       integ.onProjectSeriesChange(true);
       if(obj.latitude)
       {
        this.setHemisphere(obj,"");
       }
       else
       {
        this.setHemisphere(obj,['',"DendroNH","DendroSH"][await app.menu("Hemisphere|NH|SH",{"id":"dendro"})]);
       };
       break;
      };
     };
    };
   }catch(e){};
  }.bind(this));
};

dendroApp.prototype.dendroPlot=function(mode)
{
 this.setProject();
 switch(mode)
 {
 case 'Record':
  app.menu('Dendro plot|Selected|Dated|Undated|Diagram',{"id":"dendro"})
  .then(function(rpl)
  {
   this.setProject();
   switch(rpl)
   {
   case 1:
    this.plot("ProjectSelected");
    break;
   case 2:
    this.plot("ProjectDated");
    break;
   case 3:
    this.plot("ProjectUnDated");
    break;
   case 4:
    this.plotTimbers();
    break;
   };
  }.bind(this));
  break;
 case "Series":
  this.data=integ.series;
  if((integ.projectSeries.project_series_type=='Dendro_Master')&& app.getTool('ProjectSeries').active && integ.series.dated)
  {
   this.master=integ.projectSeries;
   app.menu("Plot|Versus master|Fit options").then(function(rpl){
    switch(rpl)
    {
    case 1: this.plot('Master|Data');break;
    case 2: this.fit();break;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }
  else
  {
   if(this.data.dated_against && (this.master=this.findData(this.data.dated_against)))
   {
    app.menu("Plot|Sample(s)|Versus master|Fit options",{"id":"dendro"}).then(function(rpl){
     switch(rpl)
     {
     case 1: this.plot('Data');break;
     case 2: this.plot('Master|Data');break;
     case 3: this.fit();break;
     };
    }.bind(this)).catch(function(e){app.alert(e);});
   }
   else
   {
    this.plot('Data');
   };
  };
  break;
 case "ProjectSeries":
  this.master=integ.projectSeries;
  if((integ.series.series_type=='Dendro_Sample')&& app.getTool('Series').active && integ.series.dated)
  {
   this.data=integ.series;
   app.menu("Plot|Versus sample|Fit options").then(function(rpl){
    switch(rpl)
    {
    case 1: this.plot('Master|Data');break;
    case 2: this.fit();break;
    };
   }.bind(this)).catch(function(e){app.alert(e);});
  }
  else
  {
   this.plot('Master');
  };
  break;
 };
};

// initialisation code
/*dendroApp.prototype.initialise=function()
{
 document.getElementById("projectArea").appendChild(integ.recordSpec.createDisplay(this.project));   
 document.getElementById("dataArea").appendChild(this.dataSpec.createDisplay(this.data));   
 document.getElementById("masterArea").appendChild(this.masterSpec.createDisplay(this.master));   
 document.getElementById("optionArea").appendChild(this.optionsSpec.createDisplay(this.options));
 this.args=app.getArgs();
 if(this.args.file)
 {
  this.fileOpen("Project",this.args.file);
 };
};*/


// Functions for viewing cores

dendroApp.prototype.addCorePoint=function(d,c,mode,redraw)
{
 var st=1,mu,mu1,mu2,p,i,r;
 function prec(v){return Number(v.toFixed(3));};
 function muf(a,b)
 {
  return(b.x*Math.cos(a.theta)+b.y*Math.sin(a.theta)-a.x*Math.cos(a.theta)-a.y*Math.sin(a.theta))/
       (Math.cos(b.theta)*Math.cos(a.theta)+Math.sin(b.theta)*Math.sin(a.theta));
 };
 if(mode=="cursor"){st=4;d[st].data=[];d[st+1].data=[];};
 if((mode!="cursor") && d[st].data.length)
 {
  p=d[st].data[d[st].data.length-1];
  m={"x":(p.x+c.x)/2,"y":(p.y+c.y)/2,"theta":(p.theta+c.theta)/2};
  mu1=muf(p,m);
  mu2=muf(c,m);
  mu=mu1-mu2;
  if(mode=="measure")
  {
   if(((c.x>c.max)||(c.x<0))&&(mode=="measure"))
   {
    app.confirm("Finish measuring?").then(async function(){
      var ser,i,nw=false;
      integ.seriesSpec.emptyContainer();
      this.viewingCore.data=JSON.parse(JSON.stringify(d[st].data));
      integ.seriesSpec.fillContainer();
      if(this.viewingCore.series_sample && (this.viewingCore.data.length>1))
      {
       if(!(ser=integ.findSeries(this.viewingCore.series_sample)))
       {
        try{await app.confirm("Create series "+this.viewingCore.series_sample+"?");}catch(e){return;};
        ser={"series":this.viewingCore.series_sample,"series_type":"Dendro_Sample","created":true};
        nw=true;
       }
       else
       {
        try{await app.confirm("Update series "+this.viewingCore.series_sample+"?");}catch(e){return;};
       };
       integ.seriesSpec.emptyContainer();
       integ.recordSpec.emptyContainer();
       if(nw){integ.record.series_list.push(ser);};
       ser.ring_count=this.viewingCore.data.length-1;
       ser.t_from=1;ser.t_to=ser.ring_count;ser.dated=false;
       ser.selected=true;ser.sapwood=null;ser.notes="";ser.filtered=false;
       ser.data=[];
       for(i=1;i<this.viewingCore.data.length;i++)
       {
        ser.data.push({"t":i,"ring_width":this.viewingCore.data[i].ring_width,"sample_depth":1});
       };
       integ.seriesSpec.fillContainer();
       integ.recordSpec.fillContainer();
       integ.onRecordChange();
      };
    }.bind(this)).catch(function(e){});
    return;
   };
   if(mu<0)
   {
    app.confirm("Remove points?").then(function(){
     if(d[st].data.length==1){d[st].data=[];d[st+1].data=[];}
     else
     {
      while(d[st].data.length && (d[st].data[d[st].data.length-1].x>c.x))
      {
       d[st].data.pop();
       for(i=0;i<6;i++){d[st+1].data.pop();};
       for(i=0;i<2;i++){d[st+2].data.pop();};
      };
     };
     if(redraw){redraw();app.showTool('Plot');};
    }.bind(this)).catch(function(e){});
    return;
   };
   if(mu<0.2)
   {
    app.confirm("Add ring of "+mu.toFixed(3)+" mm?").then(function(){
     this.addCorePoint(d,c,"confirm",redraw);
    }.bind(this)).catch(function(e){});
    return
   };
  };
  d[st+1].data.push({"x":c.x-c.r*Math.sin(c.theta),"y":c.y+c.r*Math.cos(c.theta)},{"x":c.x,"y":c.y},{"x":c.x+c.r*Math.sin(c.theta),"y":c.y-c.r*Math.cos(c.theta)});
  d[st+1].data.push({"x":m.x-mu2*Math.cos(m.theta),"y":m.y-mu2*Math.sin(m.theta)});
  d[st+1].data.push({"x":m.x-mu1*Math.cos(m.theta),"y":m.y-mu1*Math.sin(m.theta)});
  d[st+1].data.push({"x":null,"y":null});
  d[st+2].data.push({"x":c.x-0.5*mu*Math.cos(c.theta),"y":4*c.r,"marker":d[st].data.length.toString()});
  d[st+2].data.push({"x":c.x-0.5*mu*Math.cos(c.theta),"y":c.r,"marker":Math.round(prec(mu)*1000,0).toString()});
  d[st].data.push({"x":prec(c.x),"y":prec(c.y),"theta":prec(c.theta),"ring_width":prec(mu)});
 }
 else
 {
  d[st+1].data.push({"x":c.x-c.r*Math.sin(c.theta),"y":c.y+c.r*Math.cos(c.theta)},{"x":c.x,"y":c.y},{"x":c.x+c.r*Math.sin(c.theta),"y":c.y-c.r*Math.cos(c.theta)});
  d[st+1].data.push({"x":null,"y":null});
  if(mode=="cursor")
  {
   d[st].data.push({"x":prec(c.x),"y":prec(c.y),"xx":prec(c.x),"yy":prec(c.y),"theta":prec(c.theta),"ring_width":null});
  }
  else
  {
   d[st].data.push({"x":prec(c.x),"y":prec(c.y),"theta":prec(c.theta),"ring_width":null});
  };
 };
 if(redraw){redraw();};
};

dendroApp.prototype.restoreCorePoints=function(d,data)
{
 var i;
 for(i=0;i<data.length;i++)
 {
  this.addCorePoint(d,{"x":data[i].x,"y":data[i].y,"theta":data[i].theta,"ring_width":data[i].ring_width,"r":this.cursor.r},"restore");
 };
};

dendroApp.prototype.viewCoreCursor=function(d,redraw)
{
 var c=this.cursor;
 if(c.theta>Math.PI/2){c.theta=Math.PI/2;};
 if(c.theta<-Math.PI/2){c.theta=-Math.PI/2;};
 this.addCorePoint(d,c,"cursor",redraw);
};

dendroApp.prototype.viewCore=function(record,details,image)
{
 var plotInfo,multiPlots,plotOptions,plotData,labels=[],mp;
 integ.setupPlot();
 integ.pl.plotInfo=new Object;
 plotInfo=integ.pl.plotInfo;
 plotInfo.x_calc="x";
 plotInfo.dx_calc="(x_range/2)";
 plotInfo.xlabel=""
 plotInfo.minx=0;
 plotInfo.maxx=40;
 plotInfo.autox=0;
 plotInfo.miny=0;
 plotInfo.maxy=details.height;
 plotInfo.autoy=0;
 plotInfo.y_calc="y";
 plotInfo.dy_calc="(y_range/2)";
 plotInfo.ylabel="";
 plotInfo.title=details.series_sample;
 
 integ.pl.plotOptions=new Object;
 plotOptions=integ.pl.plotOptions;
 plotOptions.plotPosX=1; // cm
 plotOptions.plotPosY=1;  // cm
 plotOptions.plotWidth=20; // cm
 plotOptions.plotHeight=details.height*0.5; // cm
 plotOptions.multiPlot=false;
 plotOptions.eventHandler=true;
 
 this.cursor={"x":20,"y":details.height/2,"theta":0,"r":details.height/5,"max":details.width};
 this.viewingCore=details;
 
 dt=integ.pl.appendData({id:"",line:"",markerColor:"",
   markerFill:"",lineColor:"",
   marker:"image",include_url:false,selected:true});
   dt.data=[{"src":integ.urlPath(image),"x":details.width/2,"y":details.height/2,"x_range":details.width,"y_range":details.height,
    "xx":details.width/2,"yy":details.height/2}];
 dt=integ.pl.appendData({id:"",line:"",markerColor:"lightBlue",
   markerFill:"",lineColor:"",
   marker:"cross",include_url:false,selected:true,data:[]});
 dt=integ.pl.appendData({id:"",line:"solid",markerColor:"",
   markerFill:"",lineColor:"lightBlue",
   marker:"",include_url:false,selected:true,data:[]});
 dt=integ.pl.appendData({id:"",line:"",markerColor:"",
   markerFill:"white",lineColor:"",include_marker:true,
   marker:"circle",include_url:false,selected:true,data:[]});
 dt=integ.pl.appendData({id:"",line:"",markerColor:"lightGreen",
   markerFill:"",lineColor:"",
   marker:"cross",include_url:false,selected:true,data:[]});
 dt=integ.pl.appendData({id:"",line:"solid",markerColor:"",
   markerFill:"",lineColor:"lightGreen",
   marker:"",include_url:false,selected:true,data:[]});
   
 integ.pl.multiPlots={plots:[],showKey:false,keyColumn:0,
  keyRow:0,columns:1,
  tiedXAxes:0};
 mp=duplItem(plotInfo);
 mp.row=0;mp.column=0;mp.selected=true;
 integ.pl.multiPlots.plots[0]=mp;
 mp=duplItem(plotInfo);
 mp.row=1;mp.column=0;mp.selected=true;
 mp.minx=0,mp.maxx=details.width;
 mp.miny=-details.height*2;
 mp.maxy=details.height*3;
 mp.x_calc="xx";mp.y_calc="yy";
 integ.pl.multiPlots.plots[1]=mp;

 if(details.data)
 {
  this.restoreCorePoints(integ.pl.plotData,details.data);
 };
 this.viewCoreCursor(integ.pl.plotData);
 integ.pl.render();
 app.showTool('Plot');
 dendro.plotEventHandler=function(obj,graph,data,redraw)
 {
  var shft;
  if(graph.x_calc!="x"){return false;};
  switch(obj.type)
  {
  case "wheel":
   if(obj.altKey || obj.shiftKey)
   {
    this.cursor.theta+=(obj.to_clientX-obj.frm_clientX)/500;
    this.cursor.y-=(obj.to_clientY-obj.frm_clientY)/70;
   }
   else
   {
    shft=(obj.to_clientX-obj.frm_clientX)/70;
    graph.minx+=shft;
    graph.maxx+=shft;
    this.cursor.x=(graph.minx+graph.maxx)/2;
    this.cursor.y+=(obj.to_clientY-obj.frm_clientY)/70;
   };
   if(this.cursor.y<graph.miny+this.cursor.r){this.cursor.y=graph.miny+this.cursor.r;};
   if(this.cursor.y>graph.maxy-this.cursor.r){this.cursor.y=graph.maxy-this.cursor.r;};
   obj.frm_clientX=obj.to_clientX;
   obj.frm_clientY=obj.to_clientY;
   obj.active=false;
   this.viewCoreCursor(data,redraw);
   return true;
  case "mouseup":
  case "mousemove":
   if(obj.shiftKey)
   {
    if((obj.frm_clientX==obj.to_clientX) && (obj.frm_clientY==obj.to_clientY) && obj.type=="mouseup")
    {
     obj.active=false;
     this.addCorePoint(data,this.cursor,"measure",redraw);
     return true;
    }
    else
    {
     obj.active=false;
     return true;
    };
   }
   else
   {
    if(obj.altKey)
    {
     this.cursor.theta+=(obj.to_clientX-obj.frm_clientX)/500;
     this.cursor.y-=(obj.to_clientY-obj.frm_clientY)/70;
    }
    else
    {
     this.cursor.y-=(obj.to_clientY-obj.frm_clientY)/70;
     if(this.cursor.y<graph.miny+this.cursor.r){this.cursor.y=graph.miny+this.cursor.r;};
     if(this.cursor.y>graph.maxy-this.cursor.r){this.cursor.y=graph.maxy-this.cursor.r;};
     shft=-(obj.to_clientX-obj.frm_clientX)/70;
     graph.minx+=shft;
     graph.maxx+=shft;
     this.cursor.x=(graph.minx+graph.maxx)/2;
    };
   };
   obj.frm_clientX=obj.to_clientX;
   obj.frm_clientY=obj.to_clientY;
   obj.active=false;
   this.viewCoreCursor(data,redraw);
   if(obj.type=="mousemove"){obj.active=true;};
   return true;
  default:
   app.log(obj);
  };
  return false;
 }.bind(this);
};

(function () {
 dendro=new dendroApp();
})();

