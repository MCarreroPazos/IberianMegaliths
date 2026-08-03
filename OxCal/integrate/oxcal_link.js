integrateApp.prototype.importFromOxCal=function(txt,rec)
{
  function z_conv(z)
  {
   switch(integ.record.header.z_units)
   {
   case "mm":
    return z/1000;
   case "cm":
    return z/100;
   default:
    return z;
   };
  };
  function norm_sigma(r,rsd,dz)
  {
   return rsd*Math.sqrt(Math.abs(z_conv(dz)))/(r*r);
  };
  var i,j,o,m,used=false;
  var ocd=[],calib=[],model={},nan="NaN",name;
  try{eval(txt);}catch(e){alert("Cannot parse OxCal output:\n"+e);return;};
  this.recordSpec.emptyContainer();
  try
  {
  for(i=0;i<model.element.length;i++)
  {
   if(!model.element[i]){continue;};
   if(model.element[i].age_depth_z && model.element[i].age_depth_mean && model.element[i].age_depth_sd)
   {
    used=true;
    name="";
    if(model.element[i].name){name==model.element[i].name+"_";};
    m={series:this.autoUniqueName(name+"AgeDepth"),series_type:"AgeDepth",parameter_list:"",data:[],created:true,selected:true};
    for(j=0;j<model.element[i].age_depth_z.length;j++)
    {
     o={z:z_conv(model.element[i].age_depth_z[j]),
     	t:model.element[i].age_depth_mean[j],
     	t_sigma:model.element[i].age_depth_sd[j]};
     m.data.push(o);
    };
    m.t_source=model.element[ocd[0].calib].name.replace(/[^a-zA-Z0-9]/g,"_");
    m.t_source=m.t_source.replace("intcal","IntCal").replace("marine","Marine");
    this.record.series_list.push(m);
   };
   if(model.element[i].age_depth_rate && model.element[i].age_depth_mean && model.element[i].age_depth_sd)
   {
    used=true;
    m={"series":this.autoUniqueName(name+"Sedimentation"),"series_type":"Proxies","parameter_list":"sed","data":[],"created":true,"selected":true};
    for(j=0;j<model.element[i].age_depth_z.length-1;j++)
    {
     if(model.element[i].age_depth_rate[j]==0){continue;};
     o={z:z_conv((model.element[i].age_depth_z[j]+model.element[i].age_depth_z[j+1])/2),
        z_range:0,
     	t:(model.element[i].age_depth_mean[j]+model.element[i].age_depth_mean[j+1])/2,
     	t_sigma:(model.element[i].age_depth_sd[j]+model.element[i].age_depth_sd[j+1])/2,
     	sed:z_conv(1/model.element[i].age_depth_rate[j])};
     m.data.push(o);
    };
    this.record.series_list.push(m);
   };
  };
  if(!used) // for older versions
  {
   for(i=0;i<model.group.length;i++)
   {
    if(model.group[i].depth_list) // older version
    {
     used=true;
     m={"series":"OxCal_AgeDepth","series_type":"AgeDepth","parameter_list":"","data":[],"created":true,"selected":true};
     for(j=0;j<model.group[i].depth_list.length;j++)
     {
      o={z:z_conv(ocd[model.group[i].depth_list[j]].data.z),
    	t:ocd[model.group[i].depth_list[j]].posterior.mean,
    	t_sigma:ocd[model.group[i].depth_list[j]].posterior.sigma};
      m.data.push(o);
     };
     m.t_source=model.element[ocd[0].calib].name.replace(/[^a-zA-Z0-9]/g,"_");
     m.t_source=m.t_source.replace("intcal","IntCal").replace("marine","Marine");
     this.record.series_list.push(m);
    };
   };
  };
  }
  catch(e)
  {
   app.alert(e);
  };
  this.recordSpec.fillContainer();
  this.onRecordChange();
  this.viewRecord(rec);
};
integrateApp.prototype.importOxCalCode=function(txt)
{
  var m,i,fn,done=false;
  fn=this.filenames['OxCalCode'];
  this.recordSpec.emptyContainer();
  this.seriesSpec.emptyContainer();
  for(i=0;i<this.record.series_list.length;i++)
  {
   if(this.record.series_list[i].file==fn)
   {
    this.record.series_list[i].code=txt;
    this.record.series_list[i].changed=true;
    done=true;
   };
  };
  if(!done)
  {
   m={series:this.autoUniqueName(fn.split('/').pop().replace(".oxcal","")),
    file:fn,series_type:"Model",model_type:"OxCal",code:txt,parameter_list:"",data:[],created:true};
   this.record.series_list.push(m);
   app.showTool("Record");
  };
  this.seriesSpec.fillContainer();
  this.recordSpec.fillContainer();
  this.onRecordChange();
};
integrateApp.prototype.oxcalParse=function(txt)
{
 var ocd=[],calib=[],model={},nan="NaN";
 var i;
 try{eval(txt);}catch(e){alert("Cannot parse OxCal output:\n"+e);return;};
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 this.recordSpec.emptyContainer();
 this.seriesSpec.emptyContainer();
 this.projectSeriesSpec.emptyContainer();
 for(i=0;i<ocd.length;i++)
 {
  if(!ocd[i]['name']){continue;};
  nm=ocd[i]['name'];
  if(this.oxcal.index[nm])
  {
   this.oxcal.index[nm]["t"]=ocd[i].likelihood['mean'];
   this.oxcal.index[nm]["t_sigma"]=ocd[i].likelihood['sigma'];
   this.oxcal.index[nm]["t_median"]=ocd[i].likelihood['median'];
   this.oxcal.index[nm]["__updated"]=Date.now();
  };
 };
 if(this.oxcal.sampleBasis)
 {
  this.indexSamples(false,"write");
 };
 this.recordsSpec.fillContainer();
 this.seriesListSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.seriesSpec.fillContainer();
 this.projectSeriesSpec.fillContainer();
};
integrateApp.prototype.oxcalParseModel=function(txt)
{
 var ocd=[],calib=[],model={},nan="NaN";
 var index={};
 var i,o;
 function look(data)
 {
  if((typeof(data)!='object')||(data==null)){return;};
  if((typeof(data['labcode'])=='string') && data['labcode'])
  {
   if(index[data['labcode']])
   {
    data["t"]=index[data['labcode']]["t"];
    data["t_sigma"]=index[data['labcode']]["t_sigma"];
    data["t_median"]=index[data['labcode']]["t_median"];
    data["__updated"]=Date.now();
   };
   return;
  };
  for(i in data)
  {
   look(data[i]);
  };
 };
 try{eval(txt);}catch(e){alert("Cannot parse OxCal output:\n"+e);return;};
 for(i=0;i<ocd.length;i++)
 {
  if(!ocd[i]){continue;};
  if(!ocd[i]['name']){continue;};
  o=ocd[i].likelihood;
  if(ocd[i].posterior){o=ocd[i].posterior;};
  if(!o || !o["mean"]){continue;};
  nm=ocd[i]['name'];
  index[nm]={};
  index[nm]["t"]=o['mean'];
  index[nm]["t_sigma"]=o['sigma'];
  index[nm]["t_median"]=o['median'];
 };
 this.recordsSpec.emptyContainer();
 this.seriesListSpec.emptyContainer();
 this.recordSpec.emptyContainer();
 this.seriesSpec.emptyContainer();
 this.projectSeriesSpec.emptyContainer();
 look(this.project);
 this.recordsSpec.fillContainer();
 this.seriesListSpec.fillContainer();
 this.recordSpec.fillContainer();
 this.seriesSpec.fillContainer(); 
 this.projectSeriesSpec.fillContainer();
};
integrateApp.prototype.oxcalOptions=async function()
{
 var curves=['IntCal 20','IntCal 13','IntCal 09','IntCal 04','IntCal 98','SHCal 20','SHCal 13','SHCal 04'];
 var codes=this.oxcalPreAndPost(),code="",crv,res;
 code=codes.join("");
 try
 {
  if(code=="")
  {
   code="Options()\n{\n";
   crv=await app.menu("Curve|default|"+curves.join("|"));
   if(crv>1){code+=' Curve="'+curves[crv-2].replace(/ /g,'').toLowerCase()+'.14c";\n';};
   res=await app.menu("Resolution|default|1|5|10|50|100");
   if(res>1)
   {
    code+=" Resolution=";
    switch(res){case 2:code+="1";break;case 3:code+="5";break;case 4:code+="10";break;case 5:code+="50";break;case 6:code+="100";break; };
    code+=";\n";
   };
   code+="};\nPlot()\n{\n};"
  };
  code=await app.prompt("Calibration code",code,"TextArea");
  obj={"json_application":"INTCHRON.Series:4","series":"Calibrate","project_series_type":"Model","notes":"","header_list":"",
   "parameter_list":"","refs":[],"data":{},"model_type":"OxCal","file":"","code":code};
  this.seriesListSpec.emptyContainer();
  this.project.project_series_list.push({ "project_series_type": "Model", "series": "Calibrate", "created": true, "selected":true, "file_data":obj});
  this.seriesListSpec.fillContainer();
  this.checkDuplicates("ProjectSeries",true);
 }catch(e){app.alert(e);};
};
integrateApp.prototype.oxcalPreAndPost=function(forcePlot,write)
{
 var i,rtn=["",""],psl=this.project.project_series_list,code;
 for(i in psl)
 {
  if((psl[i].project_series_type=="Model") 
   && psl[i].file_data
   && (psl[i].file_data.model_type=="OxCal") 
   && (psl[i].series=="Calibrate"))
  {
   code=psl[i].file_data.code;
   if(code.lastIndexOf("};")!=-1)
   {
    if(code.lastIndexOf("Options(")!=-1)
    {
     if(code.lastIndexOf("Plot(")==-1) // options only
     {
      rtn[0]=code+"\n";
      rtn[1]="";
      if(forcePlot){rtn[0]+="\nPlot()\n{\n";rtn[1]="};"};
      return rtn;
     };
    };
    rtn[0]=psl[i].file_data.code.slice(0,psl[i].file_data.code.lastIndexOf("};"));
    rtn[1]="};";
    return rtn;
   };
  };
 };
 if(forcePlot){rtn[0]+="Plot()\n{";rtn[1]="\n};"};
 return rtn;
};
integrateApp.prototype.oxcalCalibrate=async function(context,all)
{
 var oPandP=this.oxcalPreAndPost();
 samStruct={"record":{},"series":{}};
 try
 {
  await login.login();
 }
 catch(e){return;};
 this.oxcal={"index":{},"cmd":oPandP[0],"sampleBasis":false};
 var oxcal=this.oxcal;
 function look(data,name,orig)
 {
  var i,r,dr;
  if((typeof(data)!='object')||(data==null)){return;};
  if(Array.isArray(data['r_date'])){look(integ.processSample(data),name,data)};
  if((typeof(data['r_date'])=='number') && (typeof(data['r_date_sigma'])=='number'))
  {
   if(!all)
   {
    if(data['t_sigma']){return;};
   };
   if(data['qual']){return;};
   if(data['r_date']<0){return;};
   r=data['r_date'];dr=data['r_date_sigma'];
   if((typeof(data['delta_r'])=='number') && (typeof(data['delta_r_sigma'])=='number'))
   {
    r-=data['delta_r'];dr=Math.sqrt(dr*dr+data['delta_r_sigma']*data['delta_r_sigma']);
   };
   r=Math.round(r);dr=Math.round(dr);
   oxcal.index[name]=orig?orig:data;
   oxcal.cmd+='R_Date("'+name+'",'+r+","+dr+');';
   return;
  };
  for(i in data)
  {
   look(data[i],name+"_"+i);
  };
 };
 switch(context)
 {
 case 'Project': 
  this.indexSamples(false,"read");
  if(this.sample_index)
  {
   for(i in this.sample_index.record)
   {
    samStruct.record[i]=this.sample_index.record[i].sample;
   };
/*   for(i in this.sample_index.series)
   {
    samStruct.series[i]=this.sample_index.series[i].sample;
   };*/
   this.oxcal.sampleBasis=true;
   look(samStruct,"id");   
  }
  else
  {
   look(this.project,"id");
  };
  break;
 case 'Record': 
  if(this.sample_index && this.sample_index.record[this.record.header.record])
  {
   this.oxcal.sampleBasis=true;
   look(this.sample_index.record[this.record.header.record].sample,"id");
  }
  else
  {
   look(this.record,"id");
  };
  break;
 case 'Series': 
  look(this.series,"id");
  break;
 case 'ProjectSeries': 
  look(this.projectSeries,"id");
  break;
/*  if(this.sample_index && this.sample_index.series && this.sample_index.series[this.projectSeries.series])
  {
   this.oxcal.sampleBasis=true;
   look(this.sample_index.series[this.projectSeries.series].sample);
  }
  else
  {
   look(this.projectSeries,"id");
  };
  break;*/
 };
 this.oxcal.cmd+=oPandP[1];
 app.createProgress('Calibrating',false,20);
 oxcalCall(this.oxcalTemp+'.oxcal',this.oxcal.cmd,true,function(txt){
  this.oxcalCheck({"file":this.oxcalTemp+'.oxcal',"noModel":true});
 }.bind(this),function(err){alert(err);});
};
integrateApp.prototype.oxcalCreateModel=async function(typ,context)
{
 if(!typ){typ="Plot";};
 var obj={"created":true};
 var i;
 var cmd="";
 var out=false;
 var index={};
 var ca=[];
 var ptCmd,ptCnt,allR;
 var date_datum=1950.5;
 var test,ser,rec;
 var splitby=[],splitter=false,splitterIndex={};
 var splitIndex={};
 var oPandP=this.oxcalPreAndPost(typ!="Plot");
 var phaseType=false,phaseTypes=["contiguous","sequential","overlapping","trapezium"];
 cmd=oPandP[0];
 function z_conv(z)
 {
  switch(integ.record.header.z_units)
  {
   case "mm":
    return (z*1000).toFixed(3);
   case "cm":
    return (z*100).toFixed(3);
   default:
    return z.toFixed(3);
  };
 };
 function dataCode(o)
 {
  var i,cmd="";
  for(i in o)
  {
   switch(i)
   {
   case "__cmd":case "__r": case "z": case "z_range": continue;
   };
   switch(typeof(o[i]))
   {
   case "number":
    cmd+=i+'='+o[i]+';';
    break;
   case "string":
    cmd+=i+'="'+o[i]+'";';
    break;
   };
  };
  return cmd;
 };
 function look(data)
 {
  var mem=date_datum,obj,str;
  var i;
  var this_cmd="",extra="";
  if((typeof(data)!='object')||(data==null)){return;};
  if(data["file_data"]&&(!data["selected"])){return;}; // ignore records and project series not selected
  if(data["series_type"]&&(!data["selected"])){return;}; // ignore record series not selected
  if(typeof(data['date_datum'])=='number'){date_datum=data['date_datum'];};
  if((typeof(data['r_date'])=='number') && (typeof(data['r_date_sigma'])=='number') && (typeof(data['labcode'])=='string') && data['labcode'])
  {
   if(!index[data['labcode']]&&(!data['qual'])&&(data['r_date']>0))
   {
    this_cmd='R_Date("'+data['labcode']+'",'+data['r_date']+","+data['r_date_sigma']+')';
    index[data['labcode']]=true;
   };
  };
  if((typeof(data['date'])=='number') && (typeof(data['date_sigma'])=='number') && (typeof(data['labcode'])=='string') && data['labcode'])
  {
   if(!index[data['labcode']])
   {
    if(date_datum>1700)  // treat as an age measured from this date
    {
     this_cmd='Date("'+data['labcode']+'",N('+date_datum+'-'+data['date']+","+data['date_sigma']+'))';
    }
    else
    {
     if((date_datum>=1)&&(date_datum<2))  // treat as a season offset for an integer year - typically 1.5
     {
      this_cmd='Date("'+data['labcode']+'",N('+(data['date']+date_datum-1)+","+data['date_sigma']+'))';
     }
     else  // treat as a calendar date already converted (works with 0 or 1)
     {
      this_cmd='Date("'+data['labcode']+'",N('+data['date']+","+data['date_sigma']+'))';
     };
    };
    index[data['labcode']]=true;
   };
  };
  if(this_cmd)
  {
   obj={"__cmd":this_cmd,"__r":(this_cmd.indexOf('R_')==0)};
   for(i in data)
   {
    switch(i)
    {
    case 'labcode':case 'delta_r':case "t":break;
    case 'z':
     if(typeof(data[i])=='number'){extra+=i+'='+z_conv(data[i])+';';obj.z=data['z'];};
     break;
    case 'longitude':case 'latitude':
     if(!(data['longitude'] || data['longitude'])){break;};
     if(typeof(data[i])=='number'){extra+=i+'='+data[i]+';';};
     break;
    default:
     switch(i.slice(0,2))
     {
     case "t_":case "__":case "r_":continue;break;
     };
     switch(typeof(data[i]))
     {
     case "string":
      if(str=data[i])
      {
       if(str.length>200) // limit oxcal string length
       {
        str=str.slice(0,200)+"...";
       };
       extra+=i+'='+JSON.stringify(str)+';';
       if(!splitIndex[i]){splitby.push(i);splitIndex[i]=[str];}
       else{integ.addUnique(splitIndex[i],data[i]);};
       obj[i]=data[i];
      };
      break;
     case "number":
      extra+=i+'='+data[i]+';';
      obj[i]=data[i];
      break;
     };
     break;
    };
   };
   if(extra && out){extra+="Outlier("+out+");";obj["__r"]=false;};
   if(extra){obj["__cmd"]+="{"+extra+"}";};
   obj["__cmd"]+=';\n';
   ca.push(obj);
   return;
  };
  for(i in data)
  {
   look(data[i]);
  };
  date_datum=mem;
 };
 if(typ=="P_Sequence")
 {
  this.outlierModels=["None","SSimple","RSimple","TSimple","RScaled","General","Charcoal"];
  this.outlierModelSpecs=[];
  this.outlierModelSpecs[0]={name:"",        dist:"",            scale:"",      typ:"" };
  this.outlierModelSpecs[1]={name:"SSimple", dist:"N(0,2)",      scale:"0",     typ:"s"};
  this.outlierModelSpecs[2]={name:"RSimple", dist:"N(0,100)",    scale:"0",     typ:"r"};
  this.outlierModelSpecs[3]={name:"TSimple", dist:"N(0,100)",    scale:"0",     typ:"t"};
  this.outlierModelSpecs[4]={name:"RScaled", dist:"T(5)",        scale:"U(0,4)",typ:"r"};
  this.outlierModelSpecs[5]={name:"General", dist:"T(5)",        scale:"U(0,4)",typ:"t"};
  this.outlierModelSpecs[6]={name:"Charcoal",dist:"Exp(1,-10,0)",scale:"U(0,3)",typ:"t"};
  try
  {
   out=(await app.menu("Outlier analysis|"+this.outlierModels.join("|")))-1;
  }catch(e){app.alert(e);return;};
  if(out)
  {
   cmd+='\nOutlier_Model("'+this.outlierModelSpecs[out].name+'",'
    +this.outlierModelSpecs[out].dist+','
    +this.outlierModelSpecs[out].scale+',"'
    +this.outlierModelSpecs[out].typ+'");\n';
   if(out==6){out=1;}else{out=0.05;};
   try
   {
    out=await app.prompt("Outlier probability",out,"Number");
   }catch(e){app.alert(e);return;};
  };
 };
 switch(context)
 {
 case 'Search':
  if(!this.searchResults||!this.searchResults.parameter_list){return;};
  test={};
  for(i in this.searchResults.parameter_list){test[this.searchResults.parameter_list[i]]=true;};
  if(test["r_date"]||test["r_f14c"])
  {
   look(this.searchResults);
  }
  else
  {
   if(test["series"])
   {
    for(i=0;i<this.searchResults.data.length;i++)
    {
     if(!this.searchResults.data[i].record && this.searchResults.data[i].series)
     {
      if(ser=this.findProjectSeries(this.searchResults.data[i].series)){look(ser);};
     };
    };
    if(test["record"])
    {
     for(i=0;i<this.searchResults.data.length;i++)
     {
      if(this.searchResults.data[i].record && this.searchResults.data[i].series)
      {
       if(rec=this.findRecord(this.searchResults.data[i].record))
       {
        if(rec.file_data && (ser=this.findSeries(this.searchResults.data[i].series,rec.file_data)))
        {
         look(ser);
        };
       };
      };
     };
    };
   }
   else
   {
    if(test["record"])
    {
     for(i=0;i<this.searchResults.data.length;i++)
     {
      if(rec=this.findRecord(this.searchResults.data[i].record)){look(rec);}; 
     };
    };
   };
  };
  break;
 case 'Project': look(this.project);break;
 case 'Record': look(this.record);break;
 case 'Series': look(this.series);break;
 case 'ProjectSeries': look(this.projectSeries);break;
 };
 switch(typ)
 {
 case "P_Sequence":case "D_Sequence":case "Sequence":
  if((this.record && this.record.header && this.record.header.z_type && (this.record.header.z_type!="depth"))||(typ=="D_Sequence"))
  {
   ca.sort(function(a,b){return a.z-b.z;});
  }
  else
  {
   ca.sort(function(a,b){return b.z-a.z;});
  };
  break;
 case "Phase": 
 case 'KDE_Model':
 case 'KDE_Plot':
 case 'Plot':
  if(splitby.length)
  {
   splitby.sort();
   try
   {
    splitter=await app.menu("Split by|"+splitby.join("|"));
    splitter=splitby[splitter-1];
   }
   catch(e){splitter=false;};
   try
   {
    if(splitter)
    {
     splitIndex[splitter]=await app.prompt("Order",splitIndex[splitter]);
     splitterIndex={};
     for(i=0;i<splitIndex[splitter].length;i++){splitterIndex[splitIndex[splitter][i]]=i;};
     if(typ=="Phase")
     {
      phaseType=phaseTypes[(await app.menu("Phase type|"+phaseTypes.join("|")))-1];
     };
    }
   }
   catch(e){alert(e);splitter=false;phaseType=false;};
  };
 default:
  ca.sort(function(a,b)
  {
   if(splitter)
   {
    if(!a[splitter]){if(b[splitter]){return -1;};return 0;};
    if(!b[splitter]){return 1;};
    if(a[splitter]!=b[splitter])
    {
     return splitterIndex[a[splitter]]>splitterIndex[b[splitter]]?1:-1;
    };
   };
   if(!a.sample){if(b.sample){return -1;};return 0;};
   if(!b.sample){return 1;};
   if(a.sample==b.sample){return 0;};
   return a.sample>b.sample?1:-1;
  });
  break;
 };
 switch(typ)
 {
 case 'KDE_Model':
 case 'KDE_Plot':
  if(splitter && ca.length)
  {
   cmd+=typ+'("'+ca[0][splitter]+'"){\n';
  }
  else
  {
   cmd+=typ+'(){\n';
  };
  break;
 case 'Phase':
  cmd+='Sequence(){\n';
  if(splitter && phaseType && ca.length)
  {
   cmd+='Boundary("Start '+ca[0][splitter]+'")';
   if(phaseType=="trapezium")
   {
    cmd+='\n{Start("Start of Start '+ca[0][splitter]+'");Transition("Period of Start '+ca[0][splitter]+'");End("End of Start '+ca[0][splitter]+'");}';
   };
   cmd+=';\nPhase("'+ca[0][splitter]+'"){\n';
  }
  else
  {
   cmd+='Boundary("Start");\nPhase(){\n';
  };
  break;
 case 'D_Sequence':
  cmd+='D_Sequence(){\n';
  break;
 case 'P_Sequence':
  cmd+='P_Sequence("",';
  switch(this.record.header.z_units)
  {
  case "mm":cmd+="0.1,0.01";break;
  case "cm":cmd+="1,0.1";break;
  default: cmd+="100,10";break;
  }
  cmd+=',U(-2,2)){Boundary();\n';
  break;
 default:
  if(splitter && ca.length)
  {
   cmd+='Label("'+ca[0][splitter]+'");\n'
  };
 };
 for(i=0;i<ca.length;i++)
 {
  ptCmd=ca[i]['__cmd'];
  allR=ca[i]['__r'];
  ptCnt=1;
  switch(typ)
  {
  case "P_Sequence":case "D_Sequence":case "Sequence":
   while(i+1<ca.length && (ca[i+1]['z']==ca[i]['z']))
   {
    i++;ptCnt++;
    ptCmd+=ca[i]['__cmd'];
    allR=allR && ca[i]['__r'];
   };
   if(ptCnt==1)
   {
    cmd+=ptCmd;
   }
   else
   {
    if(allR)
    {
     cmd+='R_Combine("'+z_conv(ca[i]['z'])+'"){'+ptCmd+'z='+z_conv(ca[i]['z'])+';';
    }
    else
    {
     cmd+='Combine("'+z_conv(ca[i]['z'])+'"){'+ptCmd+'z='+z_conv(ca[i]['z'])+';';
    };
    cmd+=dataCode(ca[i])+"};\n";
   };
   break;
  default:
   while(i+1<ca.length && (ca[i+1]['sample']==ca[i]['sample']) && ca[i]['sample'])
   {
    if(splitter && ((ca[i+1][splitter]==ca[i][splitter]))){break;};
    i++;ptCnt++;
    ptCmd+=ca[i]['__cmd'];
    allR=allR && ca[i]['__r'];
   };
   if(ptCnt==1)
   {
    cmd+=ptCmd;
   }
   else
   {
    if(allR)
    {
     cmd+='R_Combine("'+ca[i]['sample']+'"){'+ptCmd;
    }
    else
    {
     cmd+='Combine("'+ca[i]['sample']+'"){'+ptCmd;
    };
    cmd+=dataCode(ca[i])+"};\n";
   };
   break;
  };
  if((typ=="D_Sequence") && (i<ca.length-1))
  {
   cmd+='Gap('+(ca[i+1]['z']-ca[i]['z'])+');\n'
  };
  if(splitter && (i<ca.length-1) && ((ca[i+1][splitter]!=ca[i][splitter])))
  {
   switch(typ)
   {
   case 'KDE_Model':
   case 'KDE_Plot':
    cmd+='};'+typ+'("'+ca[i+1][splitter]+'"){\n'
    break;
   case 'Phase':
    switch(phaseType)
    {
    case "contiguous":
     cmd+='};\nBoundary("Transition '+ca[i][splitter]+'/'+ca[i+1][splitter]+'");\n';
     break;
    case "trapezium":
     cmd+='};\nBoundary("Transition '+ca[i][splitter]+'/'+ca[i+1][splitter]+'")\n';
     cmd+='{Start("Start of Transition '+ca[i][splitter]+'/'+ca[i+1][splitter]+'");Transition("Period of Transition '+ca[i][splitter]+'/'+ca[i+1][splitter]+'");End("End of Transition '+ca[i][splitter]+'/'+ca[i+1][splitter]+'");};\n';
     break;
    case "sequential":
     cmd+='};\nBoundary("End '+ca[i][splitter]+'");\n';
     cmd+='Boundary("Start '+ca[i+1][splitter]+'");\n';
     break;
    case "overlapping":
     cmd+='};\nBoundary("End '+ca[i][splitter]+'");\n';
     cmd+='};Sequence(){\n';
     cmd+='Boundary("Start '+ca[i+1][splitter]+'");\n';
     break;
    };
    cmd+='Phase("'+ca[i+1][splitter]+'"){\n';
    break;
   default:
    cmd+='Line();Label("'+ca[i+1][splitter]+'");\n'
    break;
   };
  };
 };
 switch(typ)
 {
 case 'KDE_Model':
 case 'KDE_Plot':
  cmd+="};\n";
  break;
 case 'Phase':
  if(splitter && phaseType && ca.length)
  {
   cmd+='};\nBoundary("End '+ca[ca.length-1][splitter]+'")';
   if(phaseType=="trapezium")
   {
    cmd+='\n{Start("Start of End '+ca[ca.length-1][splitter]+'");Transition("Period of End '+ca[ca.length-1][splitter]+'");End("End of End '+ca[ca.length-1][splitter]+'");}';
   };
   cmd+=';\n};\n';
  }
  else
  {
   cmd+='};Boundary("End");};\n';
  };
  break;
 case 'P_Sequence':
  cmd+='Boundary();};\n';
  break;
 };
 cmd+=oPandP[1];
 switch(context)
 {
 case 'Search':
 case 'Project': 
 case 'ProjectSeries': 
  this.setProjectSeriesContent(obj,{"project_series_type":"Model","series":this.autoUniqueName("Project_"+typ),
  	"model_type":"OxCal","code":cmd});
  this.seriesListSpec.emptyContainer();
  obj.selected=true;
  this.project.project_series_list.push(obj);
  this.seriesListSpec.fillContainer();
  app.showTool("SeriesList");
  break;
 case 'Record': 
 case 'Series': 
  obj={"series_type":"Model","series":this.autoUniqueName("Record_"+typ),
  	"model_type":"OxCal","code":cmd,"selected":true,"created":true};
  this.recordSpec.emptyContainer();
  this.record.series_list.push(obj);
  this.recordSpec.fillContainer();
  this.onRecordChange();
  app.showTool("Record");
  if(context=='Series')
  {
   this.viewSeries(obj);
  };
  break;
 };
};
integrateApp.prototype.oxcalCheck=async function(obj)
{
 var a,f,i,j,r,len=-1;
 if(!obj.file){obj.file="";};
 f=this.drivePath(obj.file.replace('.oxcal','.work'));
 if(!f){return;};
 if(obj.done && obj.lastchecked) //only check if no recent updates
 {
  if(obj.lastchecked && (Date.now()<(obj.lastchecked+10000))){return;};
 };
 function checkWork(txt)
 {
  var work={done:1};
  try{eval(txt);}catch(e){return false;};
  if(obj==this.projectSeries){this.projectSeriesSpec.emptyContainer();};
  if(obj==this.series){this.seriesSpec.emptyContainer();};
  if(work.done){obj.done=work.done;obj.lastchecked=Date.now();};
  if(obj==this.projectSeries){this.projectSeriesSpec.fillContainer();};
  if(obj==this.series){this.seriesSpec.fillContainer();};
  return true;
 };
 do
 {
  await app.delay(3000);
  try
  {
   a=await app.fileOpen('async',f);
  }
  catch(e){a=false;};
  if(a && a.content){if(!checkWork.bind(this)(a.content)){break;};};
 }while(a && a.content);
 obj.done=undefined;
 obj.lastchecked=undefined;
 if(obj.tempOxCal && this.activeOxCal){this.activeOxCal[obj.tempOxCal]=false;};
 obj.tempOxCal=undefined;
 if(obj.noModel)
 {
  app.endProgress();
 };
 app.createProgress('Reading data',false,20);
 try
 {
  f=this.drivePath(obj.file.replace('.oxcal','.js'));
  if(obj==this.projectSeries){this.projectSeriesSpec.emptyContainer();};
  if(obj==this.series){this.seriesSpec.emptyContainer();};
  if(obj.file.indexOf(this.oxcalTemp)==0){obj.file="";};
  if(obj==this.projectSeries){this.projectSeriesSpec.fillContainer();};
  if(obj==this.series){this.seriesSpec.fillContainer();};
  this.seriesListSpec.refillContainer();
  a=" ";
  while(a && (len!=a.length))
  {
   len=a.length;
   app.updateProgress(100-8000000/(len+100000));
   await app.delay(3000);
   a=await app.fread(f);
  };
  if(obj.noModel)
  {
   this.oxcalParse(a);
  }
  else
  {
   this.oxcalParseModel(a);
  };
  for(i=0;i<this.project.records.length;i++)
  {
   if(!(r=this.project.records[i].file_data)){continue;};
   for(j=0;j<r.series_list.length;j++)
   {
    if(r.series_list[j]==obj)
    {
     this.viewRecord(this.project.records[i]);
     this.importFromOxCal(a,this.project.records[i]);
    };
   };
  };
 }
 catch(e)
 {
  app.alert(e);
 };
 app.endProgress();
};
integrateApp.prototype.askToOpen=async function(file)
{
 if(file.indexOf(this.oxcalTemp)==-1){return;};
 try
 {
  if(await app.confirm("Open in OxCal",5000))
  {
   window.open(this.oxcalURL+this.drivePath(file.replace(".oxcal",".work")));
   return;
  };
 }catch(e){};
};
integrateApp.prototype.findNextOxCal=function()
{
 var j;
 if(!this.activeOxCal){this.activeOxCal={};};
 for(j=1;j<1000;j++)
 {
  if(!this.activeOxCal[j]){this.activeOxCal[j]=true;return j;};
 };
 return 0;
};
integrateApp.prototype.oxcalRun=async function(context)
{
 var s,i=0,j;
 if(!this.activeOxCal){this.activeOxCal={};};
 try
 {
  await login.login();
 }
 catch(e){return;};
 app.createProgress('Starting runs',false,0);
 switch(context)
 {
 case "Project":
  for(i=0;i<this.project.project_series_list.length;i++)
  {
   app.updateProgress(100*i/this.project.project_series_list.length);
   await app.delay(700);
   if(!this.project.project_series_list[i].selected){continue;};
   s=this.project.project_series_list[i].file_data;
   if(s && s.project_series_type=='Model' && s.model_type=="OxCal")
   {
    j=this.findNextOxCal();
    this.projectSeriesSpec.emptyContainer();
    if((!s.file)||(!this.drivePath(s.file))){s.file=this.oxcalTemp+'_'+j+'.oxcal';s.tempOxCal=j;};
    oxcalCall(this.drivePath(s.file),s.code,true,
  	function(txt){this.oxcalCheck(s);}.bind(this),function(err){alert(err);});
    this.projectSeriesSpec.fillContainer();
   };
  };
  break;
 case "Record":
  for(i=0;i<this.record.series_list.length;i++)
  {
   app.updateProgress(100*i/this.record.series_list.length);
   await app.delay(700);
   if(!this.record.series_list[i].selected){continue;};
   s=this.record.series_list[i];
   if(s && s.series_type=='Model' && s.model_type=="OxCal")
   {
    j=this.findNextOxCal();
    this.seriesSpec.emptyContainer();
    if(s && s.series_type=='Model' && s.model_type=="OxCal")
    if((!s.file)||(!this.drivePath(s.file))){s.file=this.oxcalTemp+'_'+j+'.oxcal';s.tempOxCal=j;};
    oxcalCall(this.drivePath(s.file),s.code,true,
 	 function(txt){this.oxcalCheck(s);}.bind(this),function(err){alert(err);});
    this.seriesSpec.fillContainer();
   };
  };
  break;
 case "ProjectSeries":
  this.projectSeriesSpec.emptyContainer();
  this.projectSeriesSpec.edit=false;
  if(this.projectSeries && this.projectSeries.project_series_type && 
 	(this.projectSeries.project_series_type=="Model") &&(this.projectSeries.model_type=="OxCal"))
  {
   j=this.findNextOxCal();
   s=this.projectSeries;
   if((!s.file)||(!this.drivePath(s.file))){s.file=this.oxcalTemp+'_'+j+'.oxcal';s.tempOxCal=j;};
   oxcalCall(this.drivePath(s.file),s.code,true,
    function(txt){this.oxcalCheck(s);}.bind(this),function(err){alert(err);});
   this.askToOpen(s.file);
  };
  this.projectSeriesSpec.fillContainer();
  break;
 case "Series":
  this.seriesSpec.emptyContainer();
  this.seriesSpec.edit=false;
  if(this.series && this.series.series_type && 
 	(this.series.series_type=="Model") &&(this.series.model_type=="OxCal"))
  {
   j=this.findNextOxCal();   
   s=this.series;
   if((!s.file)||(!this.drivePath(s.file))){s.file=this.oxcalTemp+'_'+j+'.oxcal';s.tempOxCal=j;};
   oxcalCall(this.drivePath(s.file),s.code,true,
    function(txt){this.oxcalCheck(s);}.bind(this),function(err){alert(err);});
   this.askToOpen(s.file);
  };
  this.seriesSpec.fillContainer();
  break;
 };
 app.endProgress();
};

integrateApp.prototype.oxcalMenu=function(context)
{
 var s,a,t,params,extras,men;
 switch(context)
 {
 case "Search":
  app.menu("OxCal|Plot model|Phase model|KDE_Plot model|KDE_Model model",{"id":"OxCal"})
  .then(function(rpl){
   switch(rpl)
   {
   case 1:this.oxcalCreateModel("Plot",context);break;
   case 2:this.oxcalCreateModel("Phase",context);break;
   case 3:this.oxcalCreateModel("KDE_Plot",context);break;
   case 4:this.oxcalCreateModel("KDE_Model",context);break;
   };
  }.bind(this));
  break;
 case "Project":
  app.menu("OxCal|Calibrate|Calibrate all||Plot model|Phase model|KDE_Plot model|KDE_Model model||Run||Options",{"id":"OxCal"})
  .then(function(rpl){
   switch(rpl)
   {
   case 1:this.oxcalCalibrate(context,false);break;
   case 2:this.oxcalCalibrate(context,true);break;
   case 4:this.oxcalCreateModel("Plot",context);break;
   case 5:this.oxcalCreateModel("Phase",context);break;
   case 6:this.oxcalCreateModel("KDE_Plot",context);break;
   case 7:this.oxcalCreateModel("KDE_Model",context);break;
   case 9:this.oxcalRun(context);break;
   case 11:this.oxcalOptions();break;
   };
  }.bind(this));
  break;
 case "ProjectSeries":
  t=this.projectSeries.project_series_type;
  params=this.itemList(t,false,true,this.projectSeries.parameter_list).join(",");
  if(params.indexOf("r_date")!=-1)
  {
   app.menu("OxCal|Calibrate|Calibrate all||Plot model|Phase model|KDE_Plot model|KDE_Model model",{"id":"OxCal"})
   .then(function(rpl){
    switch(rpl)
    {
    case 1:this.oxcalCalibrate(context,false);break;
    case 2:this.oxcalCalibrate(context,true);break;
    case 4:this.oxcalCreateModel("Plot",context);break;
    case 5:this.oxcalCreateModel("Phase",context);break;
    case 6:this.oxcalCreateModel("KDE_Plot",context);break;
    case 7:this.oxcalCreateModel("KDE_Model",context);break;
    };
   }.bind(this));
   break;
  }
  else
  {
   if((this.projectSeries.project_series_type=="Model") &&(this.projectSeries.model_type=="OxCal"))
   {
    men="OxCal|Open|Save|Save as|";
    if(this.projectSeries.done){men+="Quit";}else{men+="Run";};
    app.menu(men,{"id":"OxCal"})
    .then(function(rpl){
     this.oxcalSource=this.projectSeries;
     switch(rpl)
     {
     case 1:this.openModel(this.oxcalSource,this.projectSeries.done?".js":".oxcal");
      break;
     case 2:
      if(!this.drivePath(this.projectSeriesRoot()))
      {
       app.alert("Project not saved");
       break;
      };
      if(!this.localPath(this.projectSeries.path))
      {
       app.alert("Project readonly");
       break;
      };
      if(!this.oxcalSource.file)
      {
       this.projectSeriesSpec.emptyContainer();
       this.oxcalSource.file=this.projectSeriesRoot()+"/oxcal/"+this.projectSeries.series+".oxcal";
       app.mkDir(this.drivePath(this.projectSeriesRoot()+"/oxcal"),function(){
        app.fileSave('OxCalCode','oxcal');
        }.bind(this),function(error){app.alert(error);});
       this.projectSeriesSpec.fillContainer();
      }
      else
      {
       app.fileSave('OxCalCode','oxcal');
      };
      break;
     case 3:app.fileSaveAs('OxCalCode','oxcal');break;
     case 4:this.oxcalRun(context);break;
     };
    }.bind(this));
    break;
   };
  };
  app.alert("No OxCal actions");
  break;
 case "Record":
  app.menu("OxCal|Calibrate|Calibrate all|Import||Plot model|Phase model|KDE_Plot model|KDE_Model model|D_Sequence model|P_Sequence model||Run",{"id":"OxCal"})
  .then(function(rpl){
   switch(rpl)
   {
   case 1:this.oxcalCalibrate(context,false);break;
   case 2:this.oxcalCalibrate(context,true);break;
   case 3:app.fileOpen('OxCal','*.js');break;
   case 5:this.oxcalCreateModel("Plot",context);break;
   case 6:this.oxcalCreateModel("Phase",context);break;
   case 7:this.oxcalCreateModel("KDE_Plot",context);break;
   case 8:this.oxcalCreateModel("KDE_Model",context);break;
   case 9:this.oxcalCreateModel("D_Sequence",context);break;
   case 10:this.oxcalCreateModel("P_Sequence",context);break;
   case 12:this.oxcalRun(context);break;
   };
  }.bind(this));
  break;
 case "Series":
  t=this.series.series_type;
  params=this.itemList(t,false,true,this.series.parameter_list).join(",");
  if(params.indexOf("r_date")!=-1)
  {
   app.menu("OxCal|Calibrate|Calibrate all||Plot model|Phase model|KDE_Plot model|KDE_Model model",{"id":"OxCal"})
   .then(function(rpl){
    switch(rpl)
    {
    case 1:this.oxcalCalibrate(context,false);break;
    case 2:this.oxcalCalibrate(context,true);break;
    case 4:this.oxcalCreateModel("Plot",context);break;
    case 5:this.oxcalCreateModel("Phase",context);break;
    case 6:this.oxcalCreateModel("KDE_Plot",context);break;
    case 7:this.oxcalCreateModel("KDE_Model",context);break;
    };
   }.bind(this));
   break;
  }
  else
  {
   if((this.series.series_type=="Model") &&(this.series.model_type=="OxCal"))
   {
    men="OxCal|Open|Save|Save as|";
    if(this.series.done){men+="Quit";}else{men+="Run";};
    app.menu(men,{"id":"OxCal"})
    .then(function(rpl){
     this.oxcalSource=this.series;
     switch(rpl)
     {
     case 1:this.openModel(this.oxcalSource,this.series.done?".js":".oxcal");
      break;
     case 2:
      if(!this.drivePath(this.projectSeriesRoot()))
      {
       app.alert("Project not saved");
       break;
      };
      if(!this.localPath(this.projectSeries.path))
      {
       app.alert("Project readonly");
       break;
      };
      if(!this.oxcalSource.file)
      {
       this.seriesSpec.emptyContainer();
       this.oxcalSource.file=this.seriesRecordPath(this.series)+"/oxcal/"+this.series.series+".oxcal";
       app.mkDir(this.drivePath(this.seriesRecordPath(this.series)+"/oxcal"),function(){
        app.fileSave('OxCalCode','oxcal');
        }.bind(this),function(error){app.alert(error);});
       this.seriesSpec.fillContainer();
      }
      else
      {
       app.fileSave('OxCalCode','oxcal');
      };
      break;
     case 3:app.fileSaveAs('OxCalCode','oxcal');break;
     case 4:this.oxcalRun(context);break;
     };
    }.bind(this));
    break;
   };
  };
  app.alert("No OxCal actions");
  break;
 };
};

