function oxcalUtils()
{
 this.command="Plot(){};";
 this.quickObjs={"R_Date":{},"R_F14C":{},"Curve":{}};
 this.changed=false;
 this.filename="";
 this.reversed=false;
 this.modelView="Model";
 this.modelViewMode="";
 this.clipboard="";
 this.options={};
 this.importObject={"command":"R_Date"};
 this.separatorArray=new Array("\t",",",";",":","|",/\s+/);
 this.separators=["Tab","Comma","Semicolon","Colon","Bar","Space"];
 this.curve={};
 parseCommands();
 this.commandsRef=commandsRef;
 this.commandsIndex=commandsIndex;
 // remove from global scope to be safe
 delete commands;delete commandsRef;delete commandsIndex;
 this.intcalCurves=['IntCal 20','IntCal 13','IntCal 09','IntCal 04','IntCal 98'];
 this.shCurves=['SHCal 20','SHCal 13','SHCal 04'];
 this.marineCurves=['Marine 20','Marine 13','Marine 09','Marine 04','Marine 98'];
 this.bombCurves=['Bomb 21 NH1','Bomb 21 NH2','Bomb 21 NH3','Bomb 21 SH1 2','Bomb 21 SH3',
 				  'Bomb 13 NH1','Bomb 13 NH2','Bomb 13 NH3','Bomb 13 SH1 2','Bomb 13 SH3',
 				  'Bomb 04 NH1','Bomb 04 NH2','Bomb 04 NH3','Bomb 04 SH'];
 this.outlierModels=["","SSimple","RSimple","TSimple","RScaled","General","Charcoal"];
 this.outlierModelSpecs=[];
 this.outlierModelSpecs[0]={name:"",        dist:"",            scale:"",      typ:"" };
 this.outlierModelSpecs[1]={name:"SSimple", dist:"N(0,2)",      scale:"0",     typ:"s"};
 this.outlierModelSpecs[2]={name:"RSimple", dist:"N(0,100)",    scale:"0",     typ:"r"};
 this.outlierModelSpecs[3]={name:"TSimple", dist:"N(0,100)",    scale:"0",     typ:"t"};
 this.outlierModelSpecs[4]={name:"RScaled", dist:"T(5)",        scale:"U(0,4)",typ:"r"};
 this.outlierModelSpecs[5]={name:"General", dist:"T(5)",        scale:"U(0,4)",typ:"t"};
 this.outlierModelSpecs[6]={name:"Charcoal",dist:"Exp(1,-10,0)",scale:"U(0,3)",typ:"t"};
 this.initOptions();
 this.restoreOptions();
 this.ocd=[];this.model=[];this.calib=[];
 this.selectNo=0;
 this.showControls=true;
 this.tableDrawn=false;
 this.statusSpec=this.getStatusSpec();
 this.work={"done":0};
 this.showingSequence=false;
 this.mixed=0;
 this.namesUsed={};
 this.namesChecked=false;
 this.refsUsed={};
 this.curvesUsed={};
};

oxcalUtils.prototype.plotBackground=function(col)
{
 var el=document.getElementById("oxcalPlotArea");
 if(!col)
 {
  el.className="appFrameChess";
  el.style.backgroundColor="";
 }
 else
 {
  el.className="";
  el.style.backgroundColor=col;
 };
};

oxcalUtils.prototype.initialise=function()
{
 document.getElementById("oxcalStatusArea").appendChild(oxcal.statusSpec.createDisplay(oxcal.work));  
 this.plotBackground("rgb(255,255,255)");
 document.getElementById("tableArea").style.backgroundColor="white";
};

oxcalUtils.prototype.edit=function(func)
{
 var code;
 switch(func)
 {
 case "Read":
  this.editWindow.addVersion();
  break;
 case "Undo":
  this.editWindow.undo();
  break;
 case "Redo":
  this.editWindow.redo();
  break;
 case "Cut":
  this.editWindow.cut();
  break;
 case "Copy":
  this.editWindow.copy();
  break;
 case "Paste":
  this.editWindow.paste();
  break;
 case "Delete":
  this.editWindow.deleteCode();
  break;
 default: // Edit
  code=this.editWindow.selectList.extractCode();
  if((code.indexOf("{")==-1)&&(code.indexOf("\/")==-1)&&(code.indexOf("=")==-1)&&(code.split(";").length==2))
  {
   code=code.split(";")[0].replace(')','');
   code=code.split("(");
   if((code.length==2)&&this.commandsRef[code[0].trim()])
   {
    comm=code[0].trim();
    var i,s,obj={},spec=new itemSpec("params",comm,"Object");
    var params=code[1].split(',');
    if((params.length<this.commandsRef[comm].param.length)&&(this.commandsRef[comm].param[0].indexOf('[')==0)&&(params[0].search(/[\'\"]/)==-1))
    {
     params.unshift('');
    };
    for(i=0;i<this.commandsRef[comm].param.length;i++)
    {
     if(i<params.length)
     {
      obj["param"+i]=params[i].trim().replace(/[\'\"]/g,'');
     };
     s=spec.appendChild("param"+i,this.commandsRef[comm].param[i],"Text");
     if(this.commandsRef[comm].param[i].indexOf('[')!=0)
     {
      s.required=true;
     };
    };
    app.prompt(comm,obj,spec,{"resolve":function(command,rpl){
     var i,r=this.commandsRef[command],cmd,pa=[];
     for(i=0;i<r.param.length;i++){pa[i]=rpl["param"+i]};
     if(command=="Comment"){this.addComment(param[0]);return;};
     cmd=this.commandString(command,pa);
     this.editWindow.cut();
     this.addCommand(cmd);
    }.bind(this,comm),"reject":function(e){app.alert(e);},"id":"oxcal_command"});
    break;
   };
  };
  app.prompt("Edit",this.editWindow.selectList.extractCode(),new itemSpec("data","","TextArea"),{"id":"oxcalInput"})
  .then(function(rpl){
   this.editWindow.cut();
   this.editWindow.insert(rpl);
  }.bind(this)).catch(function(){});
  break;
 };
};

oxcalUtils.prototype.addCommand=function(addin)
{
 this.editWindow.insert(addin+";\n");
};
oxcalUtils.prototype.applyCommand=function(addin)
{
 this.editWindow.apply(addin+";");
};
oxcalUtils.prototype.addComment=function(txt)
{
 this.editWindow.cut();
 this.clipboard="\/\/"+txt+"\n"+this.clipboard;
 this.editWindow.paste();
 this.editWindow.writeModel();
};

oxcalUtils.prototype.commandString=function(command,param)
{
 var i,r=this.commandsRef[command],cmd;
 if(r.type=='attribute')
 {
  cmd=r.param[0]+"=";
  switch(r.param[0])
  {
  case "color":cmd+='"'+param[0]+'"';break;
  default: cmd+=param[0];break;
  };
 }
 else
 {
  if(r.param.length && (r.param[0].indexOf('[')==0)&&(r.param.length>param.length)&&(!isNaN(param[0])))
  {
   param.unshift("");
  };
  for(i=0;(i<r.param.length)&&(i<param.length);i++)
  {
   if((r.param[i].indexOf('[')==-1)||(param[i]))
   {
    if(cmd){cmd+=',';}else{cmd=command+"(";};
    switch(r.param[i])
    {
    case "[Name]":
    case "Name":
    case "[Model]":
    case "Model":
    case "Parameter1":
    case "Parameter2":
    case "Curve1":
    case "Curve2":
    case "Text":
    case "[Filename]":
    case "Filename":
     cmd+='"'+param[i]+'"';
     break;
    default:
     cmd+=param[i];
     break;
    };
   };
  };
 };
 if(r.type!='attribute')
 {
  if(cmd){cmd+=')';}else{cmd=command+"()";};
 };
 if(r.type=='group'){cmd+='{}';};
 return cmd;
};

oxcalUtils.prototype.insert=function(comm)
{
 var men;
 if(!comm)
 {
  comm="Events...";
 };
 if(Array.isArray(comm))
 {
  men="Insert|"+comm.join("|");
  this.insert(men);
  return;
 };
 if(typeof(comm)=='string')
 {
  switch(comm)
  {
  case "Events...":
   this.insert("Insert|R_Date|R_Simulate|R_Combine\nC_Date|C_Simulate|C_Combine\nDate|Combine|Prior\n\n|Modifiers...|Plot...\nModels...|Queries...|Others...");
   return;
  case "Modifiers...":
   this.insert("Insert|Outlier|Reservoir\nPosition|Latitude|Longitude\nColor\n\nEvents...||Plot...\nModels...|Queries...|Others...");
   return;
  case "Plot...":
   this.insert("Insert|Plot|Axis\nComment|Label\nLine|Page\n\nEvents...|Modifiers...|\nModels...|Queries...|Others...");
   return;
  case "Models...":
   this.insert("Insert|Phase|Sequence|Boundary\nAfter|Before\nD_Sequence|Gap\nKDE_Model|KDE_Plot\n\nEvents...|Modifiers...|Plot...\n|Queries...|Others...");
   return;
  case "Queries...":
   this.insert("Insert|Outlier\nFirst|Last\nSpan|Interval|Difference\nOrder|Sum|Correlation\n\nEvents...|Modifiers...|Plot...\nModels...||Others...");
   return;
  case "Others...":
   this.insert(this.commandsIndex);
   return;   
  };
  if(comm.indexOf('\n')!=-1)
  {
   men=comm;
   comm=men.replace(/\n/g,'|');
   comm=comm.split('|');
   app.menu(men,{"id":"oxcal_insert","reject":function(){},"resolve":function(ar,rpl){
    this.insert(ar[rpl]);
   }.bind(this,comm),"multiple":true});
   return;
  }
  else
  {
   if(comm.indexOf('|')!=-1)
   {
    men=comm;
    comm=men.split('|');
    app.menu(men,{"id":"oxcal_command"}).then(function(rpl){
     this.insert(comm[rpl]);
    }.bind(this)).catch(function(e){});
    return;
   };
  };
  var i,n,s,spec=new itemSpec("params",comm,"Object");
  for(i=0;i<this.commandsRef[comm].param.length;i++)
  {
   s=spec.appendChild("param"+i,this.commandsRef[comm].param[i],"Text");
   if(this.commandsRef[comm].param[i].indexOf('[')!=0)
   {
    s.required=true;
   };
   if(this.commandsRef[comm].param[i].indexOf('Parameter')==0)
   {
    s.options=[];
    for(n in this.namesUsed)
    {
     if(this.namesUsed[n]){s.options.push(n);};
    };
    if(s.options.length==0){s.options=false;};
   };
   if(this.commandsRef[comm].param[i].indexOf('Curve')==0)
   {
    s.options=[];
    for(n in this.curvesUsed)
    {
     if(this.curvesUsed[n]){s.options.push(n);};
    };
    if(s.options.length==0){s.options=false;};
   };
  };
  app.prompt(comm,{},spec,{"multiple":"Insert","resolve":function(command,rpl){
   var i,r=this.commandsRef[command],cmd,pa=[];
   for(i=0;i<r.param.length;i++){pa[i]=rpl["param"+i]};
   if(command=="Comment"){this.addComment(param[0]);return;};
   if(r.param.length && (r.param[0].indexOf("Name")!=-1)&& pa[0] && pa[0].indexOf)
   {
    if(pa[0].indexOf("=")==0)
    {
     if(this.namesChecked && !this.namesUsed[pa[0].slice(1)])
     {
      app.alert("Reference not found");
      return;
     };
    }
    else
    {
     if(this.namesUsed[pa[0]])
     {
      app.alert("Duplicate name");
      return;
     };
    };
   };
   cmd=this.commandString(command,pa);
   switch(r.type)
   {
   case 'modifier':
   case 'attribute':
    this.applyCommand(cmd);
    break;
   default:
    this.addCommand(cmd);
    break;
   };
  }.bind(this,comm),"reject":function(e){},"id":"oxcal_command"});
 };
};

oxcalUtils.prototype.insertFile=async function()
{
 var rpl;
 try
 {
  rpl=await app.fileOpen("OxCalInsert","*.*","Insert");
  switch(rpl.split('.')[1])
  {
  case "14c":
   this.addCommand(this.commandString("Curve",[rpl.split('.')[0],rpl]));
   break;
  case "prior":
   this.addCommand(this.commandString("Prior",[rpl.split('.')[0],rpl]));
   break;
  };
 }catch(e){app.alert(e);};
};


oxcalUtils.prototype.view=function(mode)
{
 if(mode)
 {
  if((mode=="ModelRev")&&(mode==this.modelView)){mode="Model";};
  this.modelView=mode;
  if(this.editWindow){this.editWindow.addVersion();};
 };
 app.reloadTool("OxCalInput");
 app.showTool('OxCalInput');
};

oxcalUtils.prototype.report=function(mode)
{
 var file;
 switch(mode)
 {
 case "raw":
  file='ocp_raw.html';
  break;
 case "spec":
  file='ocp_param.html';
  break;
 case "outliers":
  file='ocp_outlier.html';
  break;
 case "export":
  file='ocp_export.html';
  break;
 };
 if(file)
 {
  app.clearTool('Report',file);
  app.showTool('Report');
 };
};

oxcalUtils.prototype.optionBlock=function()
{
 function radioOption(param,val)
 {
  switch(val)
  {
  case 1: code+=param+"=TRUE;";return true;
  case 2: code+=param+"=FALSE;";return true;
  };
  return false;
 };
 var code="Options(){";
 if(!this.options.curve){return "";};
 if(this.options.resolution)
 { code+="Resolution="+this.options.resolution+";" };
 if(this.options.curve.curveFile)
 { code+="Curve=\""+this.options.curve.curveFile.toLowerCase()+"\";" };
 radioOption("Cubic",this.options.curve.cubic);
 radioOption("RawData",this.options.curve.raw);
 radioOption("UseF14C",this.options.curve.f14c);
 switch(this.options.report)
 {
 case 1:code+="BCAD=FALSE;";this.setTimeUnits("calBP"); break;
 case 2:code+="BCAD=TRUE;";this.setTimeUnits("BC");break;
 case 3:code+="BCAD=TRUE;";this.setTimeUnits("BCE");break;
 case 4:code+="BCAD=TRUE;PlusMinus=TRUE;";this.plotOptions.BCAxis=true;this.setTimeUnits("CE"); break;
 case 5:code+="BCAD=TRUE;PlusMinus=TRUE;";this.setTimeUnits("G"); break;
 };
 if(this.options.ranges)
 {
  radioOption("Intercept",this.options.ranges.intercept);
  radioOption("Floruit",this.options.ranges.floruit);
  if(radioOption("SD1",this.options.ranges.sigma1)){this.plotOptions.showRange[1]=(this.options.ranges.sigma1==1);};
  if(radioOption("SD2",this.options.ranges.sigma2)){this.plotOptions.showRange[2]=(this.options.ranges.sigma2==1);};;
  if(radioOption("SD3",this.options.ranges.sigma3)){this.plotOptions.showRange[3]=(this.options.ranges.sigma3==1);};;
 };
 if(this.options.advanced)
 {
  radioOption("ConvergenceData",this.options.advanced.convergence);
  radioOption("UniformSpanPrior",this.options.advanced.uniform);
  if(this.options.advanced.iterations)
  { code+="kIterations="+this.options.advanced.iterations+";" };
  if(this.options.advanced.ensembles)
  { code+="Ensembles="+this.options.advanced.ensembles+";" };
 };
 code+="};";
 if(code=="Options(){};"){return "";};
 return code;
};

oxcalUtils.prototype.optionsTool=function(apply)
{
 var s,ss,spec=new itemSpec("options","Options","Object");
 var opt=["","Yes","No"];
 var curves=[''].concat(this.intcalCurves,this.shCurves,this.bombCurves,this.marineCurves);
 s=spec.appendChild("resolution","Resolution","Number");
 s.hint="Resolution of analysis in years";
 s=spec.appendChild("curve","Calibration","Object");
 ss=s.appendChild("curve","Curve","Text");
 ss.hint="Default calibration curve for model";
 ss.options=curves;
 ss.changer=function(spc){
  var cur=spc.object.replace(/ /g,'');
  spc.parent.parent.emptyContainer();
  spc.parent.parent.object.curve.curveFile='';
  if(cur)
  {
   spc.parent.parent.object.curve.curveFile=cur.toLowerCase()+".14c";
  };
  if(spc.object.indexOf('Bomb')==0)
  {
   if(!spc.parent.parent.object.resolution || (spc.parent.parent.object.resolution>=1))
   {
    spc.parent.parent.object.resolution=0.2;
    this.plotOptions.showF14C=true;
   };
  }
  else
  {
   if(spc.parent.parent.object.resolution<1)
   {
    spc.parent.parent.object.resolution=null;
    this.plotOptions.showF14C=false;
   };
  };
  spc.parent.parent.fillContainer();
 }.bind(this);
 ss=s.appendChild("curveFile","Curve file","Text");
 ss.changer=function(spc){
  spc.parent.emptyContainer();
  spc.parent.object.curve="";
  spc.parent.fillContainer();
 }.bind(this);
 ss=s.appendChild("cubic","Cubic interpolation","Number");
 ss.options=opt;
 ss=s.appendChild("raw","Include raw curve","Number");
 ss.options=opt;
 ss=s.appendChild("f14c","Use F14C space","Number");
 ss.options=opt;
 s=spec.appendChild("report","Date reporting","Number");
 s.options=["","calBP (yrs)","BC/AD (yrs)","BCE/CE (yrs)","±CE (ISO-8601 yrs)","G (Gregorian fractional)"];
 s=spec.appendChild("ranges","Ranges","Object");
 s.expand=false;
 ss=s.appendChild("sigma1","68.3%","Number");
 ss.options=opt;
 ss=s.appendChild("sigma2","95.4%","Number");
 ss.options=opt;
 ss=s.appendChild("sigma3","99.7%","Number");
 ss.options=opt;
 ss=s.appendChild("floruit","Whole (floruits)","Number");
 ss.options=opt;
 ss=s.appendChild("intercept","Intercept method","Number");
 ss.options=opt;
 s=spec.appendChild("advanced","Advanced","Object");
 s.expand=false;
 ss=s.appendChild("convergence","Convergence data","Number");
 ss.options=opt;
 ss=s.appendChild("uniform","Uniform span prior","Number");
 ss.options=opt;
 ss=s.appendChild("iterations","MCMC iterations (k)","Number");
 ss.hint="Minimum iterations (thousands)";
 ss=s.appendChild("ensembles","Ensembles","Number");
 ss.hint="Reported number of ensembles";
 return new Promise(function(resolve,reject){
  app.prompt("Options",this.options,spec,{"id":"Options"}).then(function(rpl){
   this.options=rpl;
   if(apply)
   {
    this.editWindow.setOptions(this.optionBlock());
   };
   resolve();
  }.bind(this)).catch(function(e){resolve();});
 }.bind(this));
};

oxcalUtils.prototype.curveCommand=function(crv,optional)
{
 crv=crv.replace(/ /g,'');
 if(this.curvesUsed[crv])
 {
  if(optional){return "";};
  return 'Curve("='+crv+'");';
 }
 else
 {
  return 'Curve("'+crv+'","'+crv.toLowerCase()+'.14c");';
 };
};

oxcalUtils.prototype.curveMenu=function(action)
{
 var n,men='Curve|Atmospheric|Bomb|Marine|Mixed';
 this.refCurves=[];
 for(n in this.curvesUsed){this.refCurves.push("="+n);};
 if(this.refCurves.length)
 {
  this.refCurves.sort();
  men+="|";
  for(n=0;n<this.refCurves.length;n++)
  {
   men+="|"+this.refCurves[n];
  };
 };
 app.menu(men,{"id":"oxcalCurve"}).then(function(rpl){
  var s,ss,spec,ar,men;
  switch(rpl)
  {
  case 1:
   ar=this.intcalCurves.concat(this.shCurves);
   men="Curve|"+ar.join("|");
   app.menu(men).then(function(rpl){
    action(this.curveCommand(ar[rpl-1]));
   }.bind(this)).catch(function(e){app.alert(e)});
   break;
  case 2:
   ar=this.bombCurves;
   men="Curve|"+ar.join("|");
   app.menu(men,{"id":"oxcalCurve"}).then(function(rpl){
    action(this.curveCommand(ar[rpl-1]));
   }.bind(this)).catch(function(e){app.alert(e)});
   break;
  case 3:
   spec=new itemSpec("curve","Marine curve","Object");
   s=spec.appendChild("curve","Curve","Text");
   s.options=this.marineCurves;
   s.required=true;
   s=spec.appendChild("deltaR","ΔR","Number");
   s=spec.appendChild("deltaR_sigma","±","Number");
   app.prompt("Curve",{"curve":this.marineCurves[0]},spec,{"id":"oxcalCurve"}).then(async function(rpl){
    var code=this.curveCommand(rpl.curve),crv=rpl.curve.replace(' ','');
    if(rpl.deltaR!==null)
    {
     if(!rpl.deltaR_sigma){rpl.deltaR_sigma=0;};
     code+="Delta_R("+rpl.deltaR+","+rpl.deltaR_sigma+");";
     if(this.command.indexOf("ed for "+crv)==-1)
     {
      try
      {
       await app.confirm("Check that Delta_R values are\ncorrect for "+crv+"!");
       code="// Delta_R values checked for "+crv+"\n"+code;
      }
      catch(e)
      {
       code="// Warning! Delta_R values not checked for "+crv+"\n"+code;
      };
     };
    };
    action(code);
   }.bind(this)).catch(function(e){app.alert(e)});   
   break;
  case 4:
   spec=new itemSpec("curve","Mixed curve","Object");
   s=spec.appendChild("name","Name","Text");
   s=spec.appendChild("atCurve","Atmospheric curve","Text");
   ar=this.intcalCurves.concat(this.shCurves);
   s.options=ar;
   s.required=true;
   s=spec.appendChild("maCurve","Marine curve","Text");
   s.options=this.marineCurves;
   s.required=true;
   s=spec.appendChild("deltaR","ΔR","Number");
   s=spec.appendChild("deltaR_sigma","±","Number");
   s=spec.appendChild("pcMarine","% marine","Number");
   s.required=true;
   s=spec.appendChild("pcMarine_sigma","±","Number");
   this.mixed++;
   while(this.curvesUsed["LocalMarine"+this.mixed]||this.curvesUsed["Mixed"+this.mixed]){this.mixed++;};
   app.prompt("Curve",{"name":"Mixed"+this.mixed,"maCurve":this.marineCurves[0],"atCurve":this.intcalCurves[0]},spec,{"id":"oxcalCurve"}).then(function(rpl){
    var code=this.curveCommand(rpl.atCurve,true);
    if(!rpl.deltaR_sigma){rpl.deltaR_sigma=0;};
    if(!rpl.pcMarine_sigma){rpl.pcMarine_sigma=0;};
    if(rpl.deltaR!==null)
    {
     code+=this.curveCommand(rpl.maCurve);
     code+='Delta_R("LocalMarine'+this.mixed+'",'+rpl.deltaR+","+rpl.deltaR_sigma+");";
     code+='Mix_Curves("'+rpl.name+'","'+rpl.atCurve.replace(/ /g,'')+'","LocalMarine'+this.mixed+'",'+rpl.pcMarine+','+rpl.pcMarine_sigma+');';
    }
    else
    {
     code+=this.curveCommand(rpl.maCurve,true);
     code+='Mix_Curves("'+rpl.name+'","'+rpl.atCurve.replace(/ /g,'')+'","'+rpl.maCurve.replace(/ /g,'')+'",'+rpl.pcMarine+','+rpl.pcMarine_sigma+');';
    };
    action(code);
   }.bind(this)).catch(function(e){app.alert(e)});   
   break;
  default:
   rpl-=6;
   if((rpl<this.refCurves.length)&&(rpl>-1))
   code='Curve("'+this.refCurves[rpl]+'");';
   action(code);
   break;
  };
 }.bind(this)).catch(function(){});
};

oxcalUtils.prototype.processLines=function(str,sepNo)
{
 var i,j,lines=str.split('\n');
 while((lines.length>0)&&!lines[lines.length-1]){lines.pop();};
 for(i=0;i<lines.length;i++)
 {
  lines[i]=lines[i].split(this.separatorArray[sepNo]);
  for(j=0;j<lines[i].length;j++)
  {
   lines[i][j]=lines[i][j].trim();
  };
 };
 return lines;
};

oxcalUtils.prototype.nullLine=function(a)
{
 var i;
 for(i=0;i<a.length;i++){if(a[i]){return false;};};
 return true;
};

oxcalUtils.prototype.importTool=function()
{
 var s,spec=new itemSpec('import',"Import","Object");
 s=spec.appendChild('command',"Command","Text");
 s.options=this.commandsIndex;
 s.changer=function(spec)
 {
  spec.parent.emptyContainer();
  spec.parent.object.parameters=this.commandsRef[spec.object].param.join(" | ");
  spec.parent.fillContainer(); 
 }.bind(this);
 s=spec.appendChild('parameters',"Parameters","Text");
 s.readonly=true;
 s=spec.appendChild('data','Data','TextArea');
 s=spec.appendChild('separator','Separator','Number');
 s.options=this.separators;
 this.importObject.parameters=this.commandsRef[this.importObject.command].param.join(" | ");
 app.prompt("Import",this.importObject,spec,{"id":"oxcalImport","resolve":function(rpl){
  var i,cmd="";lines=this.processLines(rpl.data,rpl.separator);
  for(i=0;i<lines.length;i++)
  {
   if(!this.nullLine(lines[i]))
   {
    cmd+=this.commandString(rpl.command,lines[i])+";";
   };
  };
  spec.emptyContainer();
  spec.object.data="";
  spec.fillContainer();
  this.editWindow.insert(cmd);
 }.bind(this),"reject":function(){},"multiple":"Insert"});
};

// functions to work with modelTool

oxcalUtils.prototype.trapCode=function(trap,name)
{
 if(!trap){return( ' Boundary("'+name+'");\n');};
 return( ' Boundary("'+name+'"){ Start("Start of '+name+'");Transition("Period of '+name+'");End("End of '+name+'");};\n');
};
oxcalUtils.prototype.createSequence=function(o,str)
{
 var i,code;
 if(!o.no || (o.no<1)){alert("Phase number must be greater than 1");return false;};
 code="";
 switch(o.rel)
 {
 case "contiguous":
  code+='Sequence()\n{\n'+this.trapCode(o.trap,'Start 1');
  for(i=0;i<o.no;i++)
  {
   code+=" "+str+'("'+(i+1)+'")\n {\n };\n';
   if(i==o.no-1)
   {
    code+=this.trapCode(o.trap,'End '+(i+1));
   }
   else
   {
    code+=this.trapCode(o.trap,'Transition '+(i+1)+'/'+(i+2));
   };
  };
  code+='}';
  break;
 case "sequential":
  code+='Sequence()\n{\n';
  for(i=0;i<o.no;i++)
  {
   code+=this.trapCode(o.trap,'Start '+(i+1));
   code+=" "+str+'("'+(i+1)+'")\n {\n };\n';
   code+=this.trapCode(o.trap,'End '+(i+1));
  };
  code+='}';
  break;
 case "overlapping":
  code+='Phase()\n{\n';
  for(i=0;i<o.no;i++)
  {
   code+=' Sequence()\n {\n '+this.trapCode(o.trap,'Start '+(i+1));
   code+="  "+str+'("'+(i+1)+'")\n  {\n  };\n ';
   code+=this.trapCode(o.trap,'End '+(i+1))+' };\n';
  };
  code+='}';
  break;
 };
 return code;
};
oxcalUtils.prototype.createRiseOrFall=function(o)
{
 var type,ordered,i,code,radios;
 code="Sequence()\n{\n ";
 switch(o.direction)
 {
 case "rise":
  code+=o.str+"Boundary();\n ";
  if(o.ordered){code+="Sequence()\n {\n };\n ";}else{code+="Phase()\n {\n };\n ";};
  code+="Boundary();\n";
  break;
 case "fall":
  code+="Boundary();\n ";
  if(o.ordered){code+="Sequence()\n {\n };\n ";}else{code+="Phase()\n {\n };\n ";};
  code+=o.str+"Boundary();\n";
  break;
 };
 code+="}";
 return code;
};
oxcalUtils.prototype.createNormal=function(o)
{
 var ordered,i,code;
 code="Sequence()\n{\n ";
 code+="Sigma_Boundary();\n ";
 if(o.ordered){code+="Sequence()\n {\n };\n ";}else{code+="Phase()\n {\n };\n ";};
 code+="Sigma_Boundary();\n";
 code+="}";
 return code;
};
oxcalUtils.prototype.createOutlierModel=function(o)
{
 code='Outlier_Model("'+o.name+'",'+o.dist+','+o.scale+',"'+o.typ+'")';
 return code;
};
oxcalUtils.prototype.stockOutlierModel=function(s)
{
 var i;
 s.parent.emptyContainer();
 for(i in this.outlierModelSpecs[s.object])
 {
  s.parent.object[i]=this.outlierModelSpecs[s.object][i];
 };
 s.parent.fillContainer();
};
oxcalUtils.prototype.depositionOutlierModel=function()
{
 var om;
 om=document.getElementById("outlierDeposition").selectedIndex;
 if(om>0)
 {
  document.getElementById("outlierStock").selectedIndex=om-1;
  stockOutlierModel();
 };  
};
oxcalUtils.prototype.setupDeposition=function(s)
{
 var o=s.parent.object,lines=this.processLines(o.data,o.separator);
 var i,j,minz,maxz,interp,first;
 s.parent.emptyContainer();
 first=true;
 if(lines.length>1)
 {
  for(i=0;i<lines.length;i++)
  {
   if(lines[i].length<4){continue;};
   if(first)
   {
    minz=Number(lines[i][3]);maxz=Number(lines[i][3]);
    first=false;
    continue;
   };
   if(Number(lines[i][3])>maxz){maxz=Number(lines[i][3]);};
   if(Number(lines[i][3])<minz){minz=Number(lines[i][3]);};
  };
  if((maxz>minz))
  {
   o.interpolation=(100/(maxz-minz)).toPrecision(1);
  };
 }
 else
 {
  o.interpolation=null;
 };
 if(o.poisson)
 {
  switch(o.z_units)
  {
  case "mm": o.k=0.1; break; //mm
  case "cm": o.k=1; break; //cm
  case "m": o.k=100; break; //m
  };
  o.k_dist="U(-2,2)";
 }
 else
 {
  o.k=null;
  o.k_dist=null;
 };
 s.parent.fillContainer();
};
oxcalUtils.prototype.createDeposition=function(o)
{
 var i,j,code="",lines=this.processLines(o.data,o.separator);
 if(o.outlier_model)
 {
  code+=this.createOutlierModel(this.outlierModelSpecs[o.outlier_model])+";\n";
 };
 if(o.poisson && (typeof(o.k)=="number"))
 { 
  if(o.k==0)
  {
   code+="Sequence(\""+o.name+"\")\n{\n ";
  }
  else
  {
   code+="P_Sequence(\""+o.name+"\","+o.k;
   if(o.interpolation || o.k_dist)
   {
    code+=","+o.interpolation;
    if(o.k_dist)
    {
     code+=","+o.k_dist;
    };
   };
   code+=")\n{\n ";
  };
 }
 else
 {
  code+="U_Sequence(\""+o.name+"\"";
  if(o.interpolation)
  {
   code+=","+o.interpolation;
  };
  code+=")\n{\n ";
 };
 if(o.date_type!='14C')
 {
  code+='timescale="'+o.date_type+'";';
 };
 code+=" Boundary();\n ";
 i=lines.length-1;
 // strip off any trailing blank lines
 while(i>0 && ((!(lines[i].length>3))||(lines[i][3]==''))){i--;};
 for(;i>=0;i--)
 {
  if((!(lines[i].length>3))||(lines[i][3]==''))
  {
   if(i>0)
   {
    if(lines[i-1].length>3)
    {
     code+=" Boundary();\n ";
    }
    else
    {
     if((i<lines.length-1)&&(lines[i+1].length>3));
     {
      code+=" Boundary();\n ";
     };
    };
   };
   continue;
  };
  if((i>0) && (Number(lines[i-1][3])==Number(lines[i][3])))
  {
   switch(o.date_type)
   {
   case "14C":
    code+=' R_Combine("'+lines[i][0];
    break;
   default:
    code+=' Combine("'+lines[i][0];
    break;
   };
   for(j=i-1;(j>=0) && (Number(lines[j][3])==Number(lines[i][3]));j--)
   {
    code+="/"+lines[j][0];
   };
   code+='"){';
   if(o.outlier_prob && (this.outlierModelSpecs[o.outlier_model].typ=="r") && (o.date_type=="14C"))
   {
    for(j=i;(j>=0) && (Number(lines[j][3])==Number(lines[i][3]));j--)
    {
     code+='R_Date("'+lines[j][0]+'",'+Number(lines[j][1])+','
      +Number(lines[j][2])+'){Outlier('+o.outlier_prob+');};';
     i=j;
    };
    code+='z='+Number(lines[i][3])+';};\n ';
   }
   else
   {
    for(j=i;(j>=0) && (Number(lines[j][3])==Number(lines[i][3]));j--)
    {
     switch(o.date_type)
     {
     case "14C":
      code+='R_Date("'+lines[j][0]+'",'+Number(lines[j][1])+','+Number(lines[j][2])+');';
      break;
     default:
      code+='Date("'+lines[j][0]+'",N(calBP('+Number(lines[j][1])+'),'+Number(lines[j][2])+'));';
      break;
     };
     i=j;
    };
    if(o.outlier_prob){code+='Outlier('+o.outlier_prob+');';};
    code+='z='+Number(lines[i][3])+';};\n ';
   };
  }
  else
  {
   switch(o.date_type)
   {
   case "14C":
    code+=' R_Date("'+lines[i][0]+'",'+Number(lines[i][1])+','+Number(lines[i][2])+'){';
    break;
   default:
    code+=' Date("'+lines[i][0]+'",N(calBP('+Number(lines[i][1])+'),'+Number(lines[i][2])+')){';
    break;
   };
   if(o.outlier_prob){code+='Outlier('+o.outlier_prob+');';};
   code+='z='+Number(lines[i][3])+';};\n ';
  };
 };
 code+=" Boundary();\n";
 code+="}";
 return code;
};
oxcalUtils.prototype.createRCombine=function(o)
{
 var i,code,lines=this.processLines(o.data,o.separator);
 code='R_Combine("'+o.name+'"';
 if(o.extra){code+=", "+Number(o.extra);};
 code+=")\n{\n";
 for(i=0;i<lines.length;i++)
 {
  if(lines[i].length>=3)
  {
   code+=' R_Date("'+lines[i][0]+'",'+Number(lines[i][1])+','+Number(lines[i][2])+');\n';
  };
 };
 code+="}";
return code;
};
oxcalUtils.prototype.createWiggle=function(o)
{
 var i,code,lines=this.processLines(o.data,o.separator);
 code='D_Sequence("'+o.name+'")\n{\n';
 for(i=0;i<lines.length;i++)
 {
  if((lines[i].length==4)&&(lines[i][3]))
  {
   code+=' R_Date("'+lines[i][0]+'",'+Number(lines[i][1])+','+Number(lines[i][2])+');\n Gap('+Number(lines[i][3])+');\n';
  }
  else
  {
   if(lines[i].length>=3)
   {
    code+=' R_Date("'+lines[i][0]+'",'+Number(lines[i][1])+','+Number(lines[i][2])+');\n';
   };
  };
 };
 code+="}";
 return code;
};


// model tool dialog

oxcalUtils.prototype.modelTool=function()
{
 men="Models|Phases|Sequences||R_Date combination|Tree-ring sequence||Deposition model|Exponential distribution|Ramped distribution|Normal distribution||Outlier model";
 ar=men.split('|');
 app.menu(men,{"id":"oxcalModel"}).then(function(rpl){
  var s,spec=new itemSpec('data',ar[rpl],"Object");
  var obj={"separator":0};
  switch(ar[rpl])
  {
  case "Phases":
   s=spec.appendChild("no","Number","Number");
   s.hint="Number of phases";
   s=spec.appendChild("rel","Relationship","Text");
   s.options=["contiguous","sequential","overlapping"];
   obj.rel="contiguous";
   s=spec.appendChild("trap","Trapezium","Boolean");
   break;
  case "Sequences":
   s=spec.appendChild("no","Number","Number");
   s.hint="Number of sequences";
   s=spec.appendChild("rel","Relationship","Text");
   s.options=["contiguous","sequential","overlapping"];
   obj.rel="contiguous";
   break;
  case "R_Date combination":
   s=spec.appendChild("name","Name","Text");
   s=spec.appendChild("extra","Extra uncertainty","Number");
   s=spec.appendChild('parameters',"Parameters","Text");
   s.readonly=true;
   obj.parameters="[Name] | Date | Error"
   s=spec.appendChild('data','Data','TextArea');
   s=spec.appendChild('separator','Separator','Number');
   s.options=this.separators;
   break;
  case "Tree-ring sequence":
   s=spec.appendChild("name","Name","Text");
   s=spec.appendChild('parameters',"Parameters","Text");
   s.readonly=true;
   obj.parameters="[Name] | Date | Error | Gap"
   s=spec.appendChild('data','Data','TextArea');
   s=spec.appendChild('separator','Separator','Number');
   s.options=this.separators;
   break;
  case "Deposition model":
   s=spec.appendChild("name","Name","Text");
   s=spec.appendChild("date_type","Date type","Text");
   obj.date_type="14C";
   s.options=["14C", "Ar", "OSL", "UTh", "Years"];
   s=spec.appendChild('parameters',"Parameters","Text");
   s.readonly=true;
   obj.parameters="[Name] | Date | Error | Depth";
   s=spec.appendChild('top',"","Text");
   s.readonly=true;
   obj.top="Top of sequence (young)";
   s=spec.appendChild('data','Data','TextArea');
   s.changer=this.setupDeposition.bind(this);
   s=spec.appendChild('bottom',"","Text");
   s.readonly=true;
   obj.bottom="Bottom of sequence (old)";
   s=spec.appendChild('poisson','Poisson deposition','Boolean');
   s.changer=this.setupDeposition.bind(this);
   obj.poisson=true;
   s=spec.appendChild('k','Poisson parameter, k_{0} (depth^{-1})','Number');
   s=spec.appendChild('interpolation','Interpolation rate (depth^{-1})','Number');
   s=spec.appendChild('k_dist','k distribution, log_{10}(k/k_{0})','Number');
   s=spec.appendChild('z_units',"Depth units",'Text');
   s.options=["mm","cm","m"];
   s.changer=this.setupDeposition.bind(this);
   obj.z_units="cm";
   s=spec.appendChild('outlier_prob','Outlier probability','Number');
   s=spec.appendChild('outlier_model','Outlier model','Number');
   s.options=this.outlierModels;
   s=spec.appendChild('separator','Separator','Number');
   s.options=this.separators;
   break;
  case "Exponential distribution":
   s=spec.appendChild('direction','Exponential','Text');
   obj.direction='rise';
   s.options=["rise","fall"];
   s=spec.appendChild('ordered','Ordered','Boolean');
   obj.str="Tau_"
   break;
  case "Ramped distribution":
   s=spec.appendChild('direction','Ramped','Text');
   obj.direction='rise';
   s.options=["rise","fall"];
   s=spec.appendChild('ordered','Ordered','Boolean');
   obj.str="Zero_"
   break;
  case "Normal distribution":
   s=spec.appendChild('ordered','Ordered','Boolean');
   break;
  case "Outlier model":
   s=spec.appendChild("name","Name","Text");
   s=spec.appendChild('dist','Distribution','Text');
   s=spec.appendChild('scale','Scale 10^','Text');
   s=spec.appendChild('typ','Type','Text');
   s.options=["r","s","t"];
   s=spec.appendChild('outlier_prototype','Prototype','Number');
   s.options=this.outlierModels;
   s.changer=this.stockOutlierModel.bind(this);
   break;
  };
  app.prompt(ar[rpl],obj,spec,{"id":"oxcalModel","resolve":function(o){
   var code="";
   switch(ar[rpl])
   {
   case "Phases":
    code=this.createSequence(o,"Phase");
    break;
   case "Sequences":
    code=this.createSequence(o,"Sequence");
    break;
   case "R_Date combination":
    code=this.createRCombine(o);
    break;
   case "Tree-ring sequence":
    code=this.createWiggle(o);
    break;
   case "Deposition model":
    code=this.createDeposition(o);
    break;
   case "Exponential distribution":
    code=this.createRiseOrFall(o,"Tau_");
    break;
   case "Ramped distribution":
    code=this.createRiseOrFall(o,"Zero_");
    break;
   case "Normal distribution":
    code=this.createNormal(o);
    break;
   case "Outlier model":
    code=this.createOutlierModel(o);
    break;
   };
   if(code){this.addCommand(code);};
  }.bind(this),"reject":function(e){app.alert(e);}});
 }.bind(this)).catch(function(e){app.alert(e);});
};

oxcalUtils.prototype.tool=function(tool)
{
 switch(tool)
 {
 case "Options":
  this.optionsTool(true);
  break;
 case "Curves":
  this.curveMenu(function(code){this.editWindow.insert(code)}.bind(this));
  break;
 case "Models":
  this.modelTool();
  break;
 case "Import":
  this.importTool();
  break;
 case "Insert":
  this.insert();
  break;
 };
};

oxcalUtils.prototype.projectFile=async function(func,fn)
{
 var silent=true;
 try{
  switch(func)
  {
  case "Open":
   if(fn)
   {
    if(fn.indexOf('.work')!=-1)
    {
     fn=fn.replace('.work','.oxcal');
     await app.fileOpen("OxCal",fn);
     this.runCheck();
     return;
    };
    if(fn.indexOf('.txt')!=-1)
    {
     fn=fn.replace('.txt','.oxcal');
     await app.fileOpen("OxCal",fn);
     this.readOutput(silent);
     this.showFile('txt');
     return;
    };
    if(fn.indexOf('.log')!=-1)
    {
     fn=fn.replace('.log','.oxcal');
     await app.fileOpen("OxCal",fn);
     this.readOutput(silent);
     this.showFile('log');
     return;
    };
    if(fn.indexOf('.js')!=-1)
    {
     fn=fn.replace('.js','.oxcal');
     silent=false;
    };
    if(fn.indexOf('.oxcal')!=-1)
    {
     await app.fileOpen("OxCal",fn);
     this.readOutput(silent);
    };
   }
   else
   {
    await app.fileOpen("OxCal","*.oxcal");
    this.readOutput(silent);
   };
   break;
  case "Save":
   this.edit("Read");
   await app.fileSave("OxCal");
   this.changed=false;
   break;
  case "SaveAs":
   this.edit("Read");
   await app.fileSaveAs("OxCal");
   this.changed=false;
   break;
  case "Run":
   this.edit("Read");
   this.run();
   this.changed=false;
   break;
  };
 }catch(e){app.alert(e);};
};

oxcalUtils.prototype.readOutput=async function(silent,txt)
{
 var ocd=[{"likelihood":{}}],calib=[],model={},nan="NaN";
 try
 {
  if(!txt)
  {
   if((this.filename.indexOf('.oxcal')==-1)||(this.filename.indexOf('ttp:\/')!=-1))
   {
    if(!silent){app.alert("Cannot read output");};
    return;
   };
   txt=await app.fread(this.filename.replace('.oxcal','.js'));
   if(txt.indexOf("{")==0)//object
   {
    txt=JSON.parse(txt);
    if(!silent && (txt.status==false))
    {
     app.alert(txt.error);
    };
   };
  };
  try{eval(txt);}catch(e){app.alert("Cannot parse OxCal output:\n"+e);return;};
  this.ocd=ocd;
  this.calib=calib;
  this.model=model;
  this.tableDrawn=false;
  this.resetOptions(true);
  this.setupData();
  switch(ocd.length)
  {
  case 0:
   break;
  case 3:
   if(!this.individualPlottable(1) && this.individualPlottable(2))
   {
    if(app.getTool('OxCalOutput').active){this.showOutputTable();};
    this.showOutputPlot('individual');
   }
   else
   {
    this.showOutputTable();
   };
   break;
  case 2:
   if(this.individualPlottable(1))
   {
    if(app.getTool('OxCalOutput').active){this.showOutputTable();};
    this.showOutputPlot('individual');
    break;
   };
  case 1:
   this.showOutputPlot('curve');
   break;
  default:
   this.showOutputTable();
   break;
  };
  if(silent){this.view();};
 }
 catch(e){if(!silent){app.alert(e);};};
};

oxcalUtils.prototype.showFile=function(mode)
{
 var filename=this.filename.replace('.oxcal','.'+mode);
 app.fileOpen("async",filename).then(function(rpl){
  app.prompt(rpl.name,rpl.content,"TextArea");
 }.bind(this)).catch(function(e){app.alert(e);});
};

// running routines

oxcalUtils.prototype.requires_batch=function(command)
{
 if(!command){command=this.command;};
 if(command.split(';')>50){return true;};
 return (command.indexOf('Seq')!=-1)||(command.indexOf('<')!=-1)||(command.indexOf('>')!=-1)||(command.indexOf('Mix_')!=-1)||(command.indexOf('Outlier')!=-1)||(command.indexOf('MCMC')!=-1)||(command.indexOf('KDE_')!=-1)||(command.indexOf('Delta_R')!=-1);
};

oxcalUtils.prototype.OxCalCall=function(filename,command,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.OxCalCall(filename,command,resolve,reject);
  }.bind(this));
 };
 if(!onerror){onerror=function(e){app.alert(e);}};
 this.batch=this.requires_batch(command);
 login.login()
 .then(function(rpl){
  if(rpl)
  {
   oxcalCall(filename,command,this.batch,onfinish,onerror);
  }
  else
  {
   error("Failed to login");
  };
 }.bind(this)).catch(function(e){onerror(e);});
};

oxcalUtils.prototype.run=async function()
{
 var rpl;
 try
 {
  if(!this.filename)
  {
   await app.fileSaveAs("OxCal","oxcal",null,"Run");
  };
  rpl=await this.OxCalCall(this.filename,this.command);
  if(this.batch)
  {
   this.runCheck();
  }
  else
  {
   this.readOutput(false,rpl);
  };
 }
 catch(e){app.alert(e);};
};

oxcalUtils.prototype.progressBar=function(s)
{
 var d,b;
 d=document.createElement('div');
 d.style='border-radius: 4px;box-shadow: inset 0px 0px 8px rgba(0,0,0,0.4);padding: -4px;overflow: hidden;height:8px;width:200px;margin:6px';
 d.style.position="relative";
 b=document.createElement('div');
 b.className='appProgressBar';
  b.style='box-shadow: inset 0px 0px 8px rgba(0,0,0,0.4)';
 if(s.parent.object.ok)
 {
  b.style.backgroundColor="rgb(51,153,255)";
 }
 else
 {
  b.style.backgroundColor="red";
 };
 s.container.appendChild(d);
 d.appendChild(b);
 b.style.width=s.object+"%";
};

oxcalUtils.prototype.colorMessage=function(col,s)
{
 s.appendComplexText(s.container,s.object);
 s.container.style.color=col;
};


oxcalUtils.prototype.getStatusSpec=function()
{
 var spec,s;
 spec=new itemSpec("work","Run status","Object");
 spec.transparent=true;
 spec.readonly=true;
 s=spec.appendChild("program","Program","Text");
 s=spec.appendChild("passes","Passes","Number"); 
 s=spec.appendChild("done","Done","Number");
 s.special=this.progressBar.bind(this);
 s=spec.appendChild("convergence","Convergence","Number");
 s.special=this.progressBar.bind(this);
 s=spec.appendChild("ok","Ok","Number");
 s.special=this.progressBar.bind(this);
 s=spec.appendChild("operation","","Text");
 s.special=this.colorMessage.bind(this,"green");
 s=spec.appendChild("error","","Text");
 s.special=this.colorMessage.bind(this,"red");
 s.readonly=true;
 return spec;
};


oxcalUtils.prototype.cancelRun=async function()
{
 try
 {
  app.createProgress('Closing run',false,20,"OxCalCancel");
  await app.rm(this.filename.replace('.oxcal','.work'));
  await app.delay(4000);
  app.endProgress("OxCalCancel");
 }
 catch(e){app.endProgress("OxCalCancel");app.alert(e);};
};

oxcalUtils.prototype.updateProgress=function(work)
{
 this.statusSpec.emptyContainer();
 this.work=work;
 if(typeof(this.work.ok)=="string")
 {
  this.work.error=this.work.ok;
  this.work.ok=0;
 };
 this.statusSpec.object=this.work;
 this.statusSpec.fillContainer();
};

oxcalUtils.prototype.runCheck=async function()
{
 var a,f,i,j,r;
 if(!this.filename || (this.filename.indexOf('.oxcal')==-1))
 {
  app.alert("No run to check");
  return;
 };
 f=this.filename.replace('.oxcal','.work');
 function checkWork(txt)
 {
  var work={"done":1};
  try{eval(txt);}catch(e){return false;};
  this.updateProgress(work);
  return true;
 };
 this.updateProgress({done:1});
 app.showTool('OxCalStatus');
 do
 {
  await app.delay(3000);
  try
  {
   a=await app.fread(f);
  }
  catch(e)
  {
   try
   {
    await app.delay(1500); // checks a second time
    a=await app.fread(f);
   }
   catch(e)
   {
    break;
   };
  };
  if(a){checkWork.bind(this)(a);};
 }while(true);
 app.hideTool('OxCalStatus');
 app.createProgress('Reading data',false,40,"OxCalRead");
 await app.delay(5000);
 this.readOutput();
 app.endProgress("OxCalRead");
};

oxcalUtils.prototype.showStatus=function()
{
 this.runCheck();
};

oxcalUtils.prototype.quickCal=function(comm)
{
  if(!comm)
  {
   if(this.options && this.options.curve && (this.options.curve.curve.indexOf('Bomb')!=-1))
   {
    comm="R_F14C";
   }
   else
   {
    comm="R_Date";
   };
  };
  var i,s,ss,spec=new itemSpec("params",comm,"Object");
  if(comm!="Curve")
  {
   for(i=0;i<this.commandsRef[comm].param.length;i++)
   {
    s=spec.appendChild("param"+i,this.commandsRef[comm].param[i],"Text");
    if(this.commandsRef[comm].param[i].indexOf('[')!=0)
    {
     s.required=true;
    };
   };
   if(this.options && this.options.curve && (this.options.curve.curve.indexOf('Marine')!=-1))
   {
    s=spec.appendChild("deltaR","Delta_R","Object");
    for(i=0;i<this.commandsRef["Delta_R"].param.length;i++)
    {
     ss=s.appendChild("param"+i,this.commandsRef["Delta_R"].param[i],"Text");
     if(this.commandsRef["Delta_R"].param[i].indexOf('[')!=0)
     {
      ss.required=true;
     };
    };
   };
  }
  else
  {
   s=spec.appendChild("curve","Curve","Text");
   s.options=this.intcalCurves.concat(this.shCurves,this.bombCurves,this.marineCurves);
  };
  s=spec.appendChild("options","Options","Button");
  s.readonly=true;
  s.action=async function(){
   this.quickObjs[comm]=s.parent.object;
   await this.optionsTool();
   this.quickCal();
  }.bind(this);
  if(comm!="Curve")
  {
   s=spec.appendChild("view","View curve","Button");
   s.action=function(){
    this.quickCal("Curve");
   }.bind(this);
   s.readonly=true;
  };
  app.prompt("OxCal",this.quickObjs[comm],spec,{"multiple":(comm!="Curve")?"Run":"View","resolve":function(command,rpl){
   var i,r=this.commandsRef[command],cmd,pa=[],dpa=false;
   this.quickObjs[comm]=s.parent.object;
   for(i=0;i<r.param.length;i++){pa[i]=rpl["param"+i]};
   if(rpl.deltaR)
   {
    r=this.commandsRef["Delta_R"];
    dpa=[];
    for(i=0;i<r.param.length;i++){dpa[i]=rpl.deltaR["param"+i]};
    r=this.commandsRef[command];
   };
   if(command=="Curve")
   {
    if(rpl["curve"])
    {
     if(!this.options.curve){this.options.curve={};};
     this.options.curve.curve=rpl["curve"];
     this.options.curve.curveFile=rpl["curve"].replace(/ /g,'').toLowerCase()+".14c";
    };
    if(this.options.curve.curve.indexOf('Bomb')==0)
    {
     if(!this.options.resolution || (this.options.resolution>=1))
     {
      this.options.resolution=0.2;
      this.plotOptions.showF14C=true;
     };
    }
    else
    {
     if(this.options.resolution<1)
     {
      this.options.resolution=null;
      this.plotOptions.showF14C=false;
     };
    };
    this.command="Plot(){};";
   }
   else
   {
    cmd=this.commandString(command,pa);
    if(dpa){cmd=this.commandString("Delta_R",dpa)+";"+cmd;};
    switch(r.type)
    {
    case 'modifier':
    case 'attribute':
     return;
    default:
     this.command="Plot(){"+cmd+";};";
     break;
    };
   };
   this.filename="quick.oxcal";
   app.hideAllTools();
   this.command=this.optionBlock()+this.command;
   this.run();
  }.bind(this,comm),"reject":function(e){},"id":"oxcal_quick"});
};


// plotting and output routines

oxcalUtils.prototype.showOutputTable=function()
{
  app.clearTool("OxCalOutput","ocp_right.html");
  app.showTool('OxCalOutput');	
};
oxcalUtils.prototype.doRound=function(d,dirn)
{
  if(this.plotOptions.roundBy>1)
  {
   d=d/this.plotOptions.roundBy;
   switch(dirn)
   {
   case -1:
    return Math.floor(d)*this.plotOptions.roundBy;
   case 1:
    return Math.ceil(d)*this.plotOptions.roundBy;
   default:
    return Math.round(d)*this.plotOptions.roundBy;
   };
  };
  return Math.round(d);
};
oxcalUtils.prototype.showDateT=function(d,type,dirn)
{
  switch(type)
  {
  case "date":
   switch(this.plotOptions.reportingStyle)
   {
   case 0:
    return this.doRound(this.plotOptions.BPDatum-d,-dirn);
   case 1: case 2:
    if(d>=1)
    {
     d=this.doRound(d-0.5,dirn);
     if(d==0){return 1;};
     return d;
    };
    d=-this.doRound(1.5-d,-dirn);
    if(d==0){return -1;};
    return d;
   case 3:
    return this.doRound(d-0.5,dirn);
   case 4:
    return d;
   };
   break;
  case "interval":
   switch(this.plotOptions.reportingStyle)
   {
   case 0:
   case 1: case 2:
   case 3:
    return this.doRound(d,dirn);
   case 4:
    return d;
   };
   break;
  };
  return d;
};
oxcalUtils.prototype.showDate=function(d,type,calib,nolabel)
{
  var pre="";
  if(calib){pre="cal";};
  if(nolabel)
  {
   switch(type)
   {
   case "date":
    switch(this.plotOptions.reportingStyle)
    {
    case 1:
    case 2:
     if(d>=1){return d;};
     return -d;
    default:
     return d;
    };
   };
  };
  switch(type)
  {
  case "date":
   switch(this.plotOptions.reportingStyle)
   {
   case 0:
    return d+"calBP";
   case 1:
    if(d>=1)
    {
     if(this.plotOptions.showADFirst)
     {
      return pre+"AD"+d;
     }
     else
     {
      return d+pre+"AD";
     };
    };
    return -d+pre+"BC";
   case 2:
    if(d>=1){return d+pre+"CE";};
    return -d+pre+"BCE";
   case 3:
    return d;
   case 4:
    return "G"+d;
   };
  };
  return d;
};
oxcalUtils.prototype.getDateT=function(d,typ)
{
   if(typ!="date"){return d;};
   d=Number(d);
   switch(this.plotOptions.reportingStyle)
   {
   case 0:
    return this.doRound(this.plotOptions.BPDatum-d);
   case 1: case 2:
    if(d>0){return d;};
    if(d<0){return d+1;};
    return 1;
   case 3: case 4:
    return d;
   };
   return d;
};
oxcalUtils.prototype.readDate=function(d)
{
   d=Number(d);
   switch(this.t_units())
   {
   case "calBP":
    return 1950-d;
   case "AD": case "CE":
    if(d>=1){return d;}else{return d+1;};
   case "BC": case "BCE":
    if(d>=1){return 1-d;}else{return -d;};
   case "CE":
    return d;
   case "G":
    return d;
   };
};
oxcalUtils.prototype.writeDate=function(d)  // used for axes - based on starts of year
{
   switch(this.t_units())
   {
   case "calBP":
    return 1950-Math.floor(d);
   case "AD": case "CE":
    if(d>=1){return Math.floor(d);}else{return Math.floor(d-1);};
   case "BC": case "BCE":
    if(d>=1){return -Math.floor(d);}else{return 1-Math.floor(d);};
   case "CE":
    return Math.floor(d);
   case "G":
    return d;
   };
};
oxcalUtils.prototype.displayDate=function(s)
{
 s.appendComplexText(s.container,this.writeDate(s.object).toString());
};
oxcalUtils.prototype.goPlotData=function(ind)
{
 this.defaultPaging(ind);
 this.showOutputPlot("individual");
};

oxcalUtils.prototype.rawData=function(ind)
{
 this.defaultPaging(ind);
 this.report("raw");
};
oxcalUtils.prototype.t_units=function()
{
 switch(this.plotOptions.reportingStyle)
 {
 case 0:return "calBP";
 case 1:return this.plotOptions.BCAxis?"BC":"AD";
 case 2:return this.plotOptions.BCAxis?"BCE":"CE";
 case 3:return "CE";
 case 4:return "G";
 };
};
oxcalUtils.prototype.setTimeUnits=function(t_units)
{
 this.plotOptions.t_units=t_units;
 switch(t_units)
 {
 case "G":this.plotOptions.reportingStyle=4;break;
 case "calBP":this.plotOptions.reportingStyle=0;break;
 case "AD":this.plotOptions.reportingStyle=1;break;
 case "BC":this.plotOptions.reportingStyle=1;this.plotOptions.BCAxis=true;break;
 case "CE":this.plotOptions.reportingStyle=this.plotOptions.BCAxis?3:2;break;
 case "BCE":this.plotOptions.reportingStyle=2;this.plotOptions.BCAxis=true;break;
 };
 this.updateFormat("both");
 if(oxcalEnv){oxcalEnv.showTimeUnits(t_units);};
 this.saveOptions();
};
oxcalUtils.prototype.updateFormat=function(mode,s)
{
 function setHoriz()
 {
  var o=s.parent.object;
  o.frameWidth=o.plotWidth+o.plotPosX+o.right;
  opt.plotPosX=o.plotPosX;
  opt.plotWidth=o.plotWidth;
  opt.frameWidth=o.frameWidth;
  switch(opt.viewType)
  {
  case "individual":
   opt.plotPosX=o.plotPosX;
   opt.plotWidth=o.plotWidth;
   opt.frameWidth=o.frameWidth;
   break;
  case "multiple":case "select":case "stack":
   if(opt.showData)
   {
    opt.plotPosXData=o.plotPosX;
    opt.plotWidthData=o.plotWidth;
    opt.frameWidthData=o.frameWidth;
   }
   else
   {
    opt.plotPosXMulti=o.plotPosX;
    opt.plotWidthMulti=o.plotWidth;
    opt.frameWidthMulti=o.frameWidth;
   };
   break;
  case "x":case "y":case "z":
   opt.plotPosXDepth=o.plotPosX;
   opt.plotWidthDepth=o.plotWidth;
   opt.frameWidthDepth=o.frameWidth;
   break;
  case "correlation":
   opt.plotPosXCorrel=o.plotPosX;
   opt.plotWidthCorrel=o.plotWidth;
   opt.frameWidthCorrel=o.frameWidth;
   break;
  case "curve":
   opt.plotPosXCurve=o.plotPosX;
   opt.plotWidthCurve=o.plotWidth;
   opt.frameWidthCurve=o.frameWidth;
   break;
  };
 };
 function setVert()
 {
  var o=s.parent.object,mP,shF;
  o.frameHeight=o.plotHeight+o.plotPosY+o.top;
  mP=o.plotHeight/opt.plotHeight;
  opt.plotPosY=o.plotPosY;
  opt.plotHeight=o.plotHeight;
  opt.frameHeight=o.plotHeight+o.plotPosY+o.top;
  switch(opt.viewType)
  {
  case "individual":
   opt.plotPosYSingle=o.plotPosY;
   opt.plotHeightSingle=o.plotHeight;
   opt.frameHeightSingle=o.frameHeight;
   break;
  case "multiple":case "select":case "stack":
   opt.plotPosYMulti=o.plotPosY;
   opt.frameHeightMulti=Number((opt.plotHeightMulti*mP+o.plotPosY+o.top).toPrecision(2));
   if(opt.showData)
   {
    opt.plotHeightMulti=Number((opt.plotHeightMulti*mP+plotOptions.plotHeightData).toPrecision(2));
   }
   else
   {
    opt.plotHeightMulti=Number((opt.plotHeightMulti*mP).toPrecision(2));
   };
   break;
  case "x":case "y":case "z":
   opt.plotPosYDepth=o.plotPosY;
   opt.plotHeightDepth=o.plotHeight;
   opt.frameHeightDepth=o.frameHeight;
   if(opt.showData)
   {
    opt.frameHeightDepth-=o.plotHeightData;
   };
   break;
  case "correlation":
   opt.plotPosYCorrel=o.plotPosY;
   opt.plotHeightCorrel=o.plotHeight;
   opt.frameHeightCorrel=o.frameHeight;
   break;
  case "curve":
   opt.plotPosYCurve=o.plotPosY;
   opt.plotHeightCurve=o.plotHeight;
   opt.frameHeightCurve=o.frameHeight;
   if(opt.showData)
   {
    opt.frameHeightCurve-=o.plotHeightData;
   };
   break;
  };
 };
 function setX()
 {
  var o=s.parent.object,r;
  s.parent.emptyContainer();
  switch(s.name)
  {
  case "minx":
   opt.minx=oxcal.getDateT(o.minx,opt.dataType);
   opt.maxx=opt.minx+o.rangex;
   o.maxx=oxcal.showDateT(opt.maxx,opt.dataType);
   break;
  case "rangex":
   r=(o.rangex-(opt.maxx-opt.minx))/2;
   opt.maxx+=r;
   opt.minx-=r;
   o.minx=oxcal.showDateT(opt.minx,opt.dataType);
   o.maxx=oxcal.showDateT(opt.maxx,opt.dataType);
   break;
  case "maxx":
   opt.maxx=oxcal.getDateT(o.maxx,opt.dataType);
   opt.minx=opt.maxx-o.rangex;
   o.minx=oxcal.showDateT(opt.minx,opt.dataType);
   break;
  };
  s.parent.fillContainer();
 };
 function setY()
 {
  var r,o=s.parent.object;
  s.parent.emptyContainer();
  switch(s.name)
  {
  case "miny":
   r=1;
   opt.miny=o.miny;
   opt.maxy=o.miny+o.rangey;
   o.maxy=opt.maxy;
   break;
  case "rangey":
   r=(o.rangey-0.8)/(o.maxy-o.miny-0.8);
   opt.maxy=opt.miny+o.rangey;
   o.maxy=opt.maxy;
   break;
  case "maxy":
   opt.maxy=o.maxy;
   r=(o.maxy-o.miny-0.8)/(o.rangey-0.8);
   o.rangey=o.maxy-o.miny;
   break;
  };
  if(r!=1)
  {
   switch(opt.viewType)
   {
   case "multiple":case "select":case "stack":
    opt.plotsPerPage=Math.round(r*opt.plotsPerPage);
    break;
   };
  };
  s.parent.fillContainer();
 };
 var i,opt=this.plotOptions;
 if(s)
 {
  if(s.name.indexOf('range_')==0)
  {
   i=Number(s.name.split("_")[1]);
   opt.showRange[i]=s.object;
  }
  else
  {
   switch(s.name)
   {
   case "showControls":
    this.showControls=s.object;
    break;
   case "reportingStyle":
    opt.reportingStyle=s.object;
    this.setTimeUnits(this.t_units());    
    return;
   case "showBandW":
    opt[s.name]=s.object;
    app.clearTool("OxCalPlot",this.getPlotName());
    return;
   case "scale":
    opt[s.name]=s.object/100;
    break;
   case "scaleFont":
    opt[s.name]=s.object/13.75;
    break;
   case "plotPosX":case "plotWidth":case "right":
    setHoriz();
    break;
   case "plotPosY":case "plotHeight":case "top":
    setVert();
    break;
   case "plotsPerPage":
    opt[s.name]=s.object;
    this.updater(true);
    s.parent.emptyContainer();
    s.parent.object.plotHeight=opt.plotHeight;   
    s.parent.fillContainer();
    return;
   case "minx":case "rangex":case "maxx":
    setX();
    break;
   case "miny":case "rangey":case "maxy":
    setY();
    break;
   case "showData":
    opt[s.name]=s.object;
    this.updater(true);
    break;
   default:
    s.parent.emptyContainer();
    opt[s.name]=s.object;
    s.parent.fillContainer();
    break;
   };
  };
 };
 if(mode!="plot")
 {
  app.reloadTool("OxCalOutput");
  app.reloadTool("Report"); 
 };
 if((mode!="table")&&(app.getTool('OxCalPlot').active))
 {
  if(s && (s.name=='labelTitle'))
  {
   this.sortSelection(); 
   this.findSize();
   this.setupPlot();
  };
  app.reloadTool("OxCalPlot");
 };
};

oxcalUtils.prototype.format=function(mode)
{
 var spec,s;
 var opt=app.clone(this.plotOptions);
 var mem=app.clone(this.plotOptions);
 if(mode=="reset")
 {
  this.initOptions();
  this.setTimeUnits(this.t_units());    
  this.plotOptions.viewType=mem.viewType;
  this.plotOptions.dataType=mem.dataType;
  this.updater();
  app.confirm("Reset plot options?").then(function(){}).catch(function(){
   this.plotOptions=mem;
   this.updateFormat('all');
   this.setTimeUnits(this.t_units());    
  }.bind(this));
  return;
 };
 if(mode=="reverse")
 {
  this.plotOptions.showReversed=!this.plotOptions.showReversed;
  this.updateFormat('all');
  return;
 };
 var i;
 for(i=0;i<opt.showRange.length;i++){opt["range_"+i]=opt.showRange[i];};
 opt.scaleFont=Math.round(opt.scaleFont*13.75,1);
 opt.scale=opt.scale*100;
 opt.showControls=this.showControls;
 opt.plotHeight=Number(Number(opt.plotHeight).toPrecision(5));
 opt.frameHeight=Number(Number(opt.frameHeight).toPrecision(5));
 opt.top=opt.frameHeight-opt.plotHeight-opt.plotPosY;
 opt.right=opt.frameWidth-opt.plotWidth-opt.plotPosX;
 opt.rangex=opt.maxx-opt.minx;
 opt.minx=this.showDateT(Number(Number(opt.minx).toPrecision(5)),opt.dataType);
 opt.maxx=this.showDateT(Number(Number(opt.maxx).toPrecision(5)),opt.dataType);
 opt.miny=Number(Number(opt.miny).toPrecision(5));
 opt.maxy=Number(Number(opt.maxy).toPrecision(5));
 opt.minz=Number(Number(opt.minz).toPrecision(5));
 opt.maxz=Number(Number(opt.maxz).toPrecision(5));
 opt.rangey=opt.maxy-opt.miny;
 opt.rangex=Number(Number(opt.rangex).toPrecision(5));
 opt.rangey=Number(Number(opt.rangey).toPrecision(5));
 opt.minx=oxcal.showDateT(opt.minx,plotOptions.dataType);
 opt.maxx=oxcal.showDateT(opt.maxx,plotOptions.dataType);
 switch(mode)
 {
 case "table":case "plot":
  spec=new itemSpec("format","Show","Object");
  s=spec.appendChild("","Output","Label");
  s=spec.appendChild("showLikelihood","Likelihood","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("showPosterior","Posterior","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("showIndices","Indices","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("","Ranges","Label");
  s=spec.appendChild("range_1","Range 68.3%","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("range_2","Range 95.4%","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("range_3","Range 99.7%","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  if((mode=="plot"))
  {
   s=spec.appendChild("showRanges","Show range bars","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");   
   if(this.plotOptions.viewType=="individual")
   {
    s=spec.appendChild("showPropPlace","Proportion place","Number");
    s.options=["none","1st","2nd","3rd"];
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showADFirst","Show AD first","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   };
  };
  s=spec.appendChild("","Summary statistics","Label");
  s=spec.appendChild("showMean","μ","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("showSigma","σ","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("showMedian","Median","Boolean");
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("","Style","Label");
  s=spec.appendChild("reportingStyle","Date reporting","Number");
  s.options=["cal BP (yrs)","BC/AD (yrs)","BCE/CE (yrs)","±CE (ISO-8601 yrs)","G (Gregorian fractional)"];
  s.changer=this.updateFormat.bind(this,"both");
  s=spec.appendChild("roundBy","Round by","Number");
  s.options=[1,5,10,50,100,500,1000];
  s.changer=this.updateFormat.bind(this,"both");
  if(!((mode=="plot")&&(this.plotOptions.viewType=="individual")))
  {
   s=spec.appendChild("showReversed","Reversed","Boolean");
  };
  s.changer=this.updateFormat.bind(this,"both");
  if(mode=="plot")
  {
   s=spec.appendChild("showReference","Show reference","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   s=spec.appendChild("showItalics","Italics for posterior","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   s=spec.appendChild("showBandW","B & W only","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   if(this.plotOptions.viewType!="individual")
   {
    s=spec.appendChild("showGrid","Grid","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showStructure","Structure","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showBrackets","Brackets","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   };
   s=spec.appendChild("","Plot","Label");
   s=spec.appendChild("showTitle","Title","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   s=spec.appendChild("showDistribution","Distributions","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   switch(this.plotOptions.viewType)
   {
   case "individual":
   case "curve":
    s=spec.appendChild("showCurve","Curve","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showCurveRaw","Raw curve points","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showF14C","F^{14}C","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    break;
   };
   if(this.plotOptions.viewType=="curve")
   {
    s=spec.appendChild("showDelta14C","Δ^{14}C","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   };
   if(this.plotOptions.viewType!="individual")
   {
    s=spec.appendChild("showConvergence","Convergence","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showAgreement","Agreement","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showParameters","Parameters","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showOutliers","Outliers","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("colorOutliers","Color outliers","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   };
   s=spec.appendChild("showVerbs","Verbs","Boolean");
   s.changer=this.updateFormat.bind(this,"plot");
   s=spec.appendChild("","Options","Label");
   if(this.plotOptions.viewType!="individual")
   {
    s=spec.appendChild("showData","Plot data","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showNormalised","Normalise areas","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showInterpolation","Show interpolation","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("mergeRanges","Merge ranges","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   }
   else
   {
    s=spec.appendChild("showNormal","Show Gaussian","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
    s=spec.appendChild("showText","Show text","Boolean");
    s.changer=this.updateFormat.bind(this,"plot");
   };
   s=spec.appendChild("showEnsembles","Ensembles","Number");
   s.changer=this.updateFormat.bind(this,"plot");
  }
  else
  {
   s=spec.appendChild("showWhole","Whole range","Boolean");
   s.changer=this.updateFormat.bind(this,"table");
   s=spec.appendChild("showControls","Controls","Boolean");
   s.changer=this.updateFormat.bind(this,"table");
  };
  break;
 case "layout":
  spec=new itemSpec("format","Layout","Object");
  s=spec.appendChild("","Scaling","Label");
  s=spec.appendChild("scale","Zoom (%)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("scaleFont","Font (pt)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("scaleLine","Line spacing","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("","Plot","Label");
  s=spec.appendChild("plotsPerPage","Subplots\/page","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("plotZoom","Subplot height","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("plotWidth","Width (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("plotHeight","Height (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("","Margins","Label");
  s=spec.appendChild("top","Top (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("plotPosY","Bottom (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("plotPosX","Left (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("right","Right (cm)","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  break;
 case "adjust":
  spec=new itemSpec("format","Adjust plot","Object");
  s=spec.appendChild("labelTitle","Plot title","Text");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("","X axis","Label");
  s=spec.appendChild("labelX","Label","Text");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("minx","Minimum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("rangex","Range","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("maxx","Maximum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("majorx","Major divisions","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("minorx","Minor divisions","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("","Y axis","Label");
  s=spec.appendChild("labelY","Label","Text");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("miny","Minimum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("rangey","Range","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("maxy","Maximum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("majory","Major divisions","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("minory","Minor divisions","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("","Z axis","Label");
  s=spec.appendChild("minz","Minimum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  s=spec.appendChild("maxz","Maximum","Number");
  s.changer=this.updateFormat.bind(this,"plot");
  
  break;
 };
 if(mode=='layout')
 {
  this.plotBackground("");
 };
 app.prompt("Format",opt,spec,{"id":"OxCalFormat"})
 .then(function(){
  switch(mode)
  {
  case "layout":case "adjust":case "plot":
   if(this.plotOptions.showData){this.updater(true);};
   break
  };
 }.bind(this)).catch(function(){
  this.plotOptions=mem;
  this.updateFormat('all');
 }.bind(this)).finally(function(){
  this.setTimeUnits(this.t_units());    
  if(mode=='layout')
  {
   this.plotBackground("rgb(255,255,255)");
  };
 }.bind(this));
};

oxcalUtils.prototype.plotKey=function(mode)
{
 var incr=1.044273782427414;
 if(app.keyInput.alt){incr=1.002711275050202;};
 switch(app.keyInput.key)
 {
 case "plus":this.changeZoom(incr);break;
 case "minus":this.changeZoom(1/incr);break;
 case "zero":this.plotOptions.scale=1;break;
 };
 if(app.keyInput.shift && (mode='center')){mode='span';};
 switch(mode)
 {
 case "center":
  switch(app.keyInput.key)
  {
  case "up":this.changeMinY(incr-1);break;
  case "down":this.changeMinY(1-incr);break;
  case "left":this.moveCentre(1-incr);break;
  case "right":this.moveCentre(incr-1);break;
  };
  break;
 case "zoom":
  switch(app.keyInput.key)
  {
  case "down":case "left":this.changeZoom(1/incr);break;
  case "up":case "right":this.changeZoom(incr);break;
  };
  break;
 case "span":
  switch(app.keyInput.key)
  {
  case "up":this.changeYRange(incr);break;
  case "down":this.changeYRange(1/incr);break;
  case "left":this.changeSpan(1/incr);break;
  case "right":this.changeSpan(incr);break;
  };
  break;
 };
 this.updater();
};


oxcalUtils.prototype.table=function(mode)
{
 this.tableWindow[mode]();
};

oxcalUtils.prototype.showOutputPlot=function(opt,redraw)
{
  var changed=this.plotOptions.dataType,ilpl;
  switch(opt)
  {
  case "multiple":
   this.plotOptions.dataType='date';
   break;
  case "intervals":
   this.plotOptions.dataType='interval';
   opt="multiple";
   break;
  case "parameters":
   this.plotOptions.dataType='number';
   opt="multiple";
   break;
  };
  changed=(changed!=this.plotOptions.dataType);
  if(opt && (this.plotOptions.viewType!=opt)){this.plotOptions.viewType=opt;changed=true;};
  this.sortSelection(); 
  if(changed && (opt!="individual")){this.defaultPaging();};
  if(!redraw){this.resetOptions();};
  if((this.plotOptions.dataType!='date')||(this.plotOptions.viewType=="individual"))
  {
   this.plotOptions.showData=false;
  };
  this.findSize();
  this.setupPlot();
  if(this.plotOptions.showData)
  {
   this.saveOptions();
   if(!this.intChronLink || this.intChronLink.closed)
   {
    this.intChronLink=window.open("../integrate/integrate.html?filename=../oxcal/Intchron_Project_NGRIP.json&action=integrate");
   }
   else
   {
    if(ilpl=this.intChronLink.integ.pl)
    {
     ilpl.plotInfo.minx=this.intChronLink.integ.calcT(this.plotOptions.minx);
     ilpl.plotInfo.maxx=this.intChronLink.integ.calcT(this.plotOptions.maxx);
     ilpl.plotOptions.plotWidth=this.plotOptions.plotWidth;
     this.dataGraph=false;
     this.intChronLink.integ.setTimeUnits(this.t_units());
    };
   };
  };
  app.clearTool('OxCalPlot',this.getPlotName());
  app.showTool('OxCalPlot');	
};

oxcalUtils.prototype.includeGraph=function(doc)
{
 this.dataGraph=false;
 try
 {
  var ilpl=this.intChronLink.integ.pl;
  if(!ilpl.frame.contentWindow.plotOptions.multiPlot)
  {
   this.dataGraph=doc.getElementById("mainviewport");
   ilpl.frame.contentWindow.finishPlot=false;
  };
 }catch(e){};
 app.clearTool('OxCalPlot',this.getPlotName());
 app.showTool('OxCalPlot');	
};


oxcalUtils.prototype.tidyText=function(str)
{
  str=str.replace(/\x2b\x2f\x2d/g,String.fromCharCode(0x00b1));
  str=str.replace(/\</g,"&lt;");
  return str;
};
oxcalUtils.prototype.resetOptions=function(toStart)
{
 var plotOptions=this.plotOptions;
    plotOptions.minx=undefined;
    plotOptions.maxx=undefined;
    plotOptions.minorx=0;
    plotOptions.majorx=0;
    plotOptions.miny=undefined;
    plotOptions.maxy=undefined;
    plotOptions.minory=0;
    plotOptions.majory=0;
    plotOptions.minz=0;
    plotOptions.maxz=1;
    plotOptions.labelX="";
    plotOptions.labelY="";
    plotOptions.labelTitle="";
    if(toStart)
    {
     plotOptions.plotFrom=0;
     plotOptions.plotLast=0;
     plotOptions.plotPrev=0;
     plotOptions.plotTo=0;
    };
};
oxcalUtils.prototype.initOptions=function()
{
   var plotOptions=new Object();
   this.plotOptions=plotOptions;
   this.resetOptions();
   plotOptions.scale=1.0; // zoom scaling
   plotOptions.scaleFont=0.8; // font scaling
   plotOptions.scaleLine=1.0; // line scaling
   plotOptions.pxPerCm=35; // px per cm
   plotOptions.rcConst=8033.0;
   plotOptions.frameWidth=18.0; // cm
   plotOptions.frameWidthSingle=15.5; //cm
   plotOptions.frameWidthMulti=18.0; // cm
   plotOptions.frameWidthData=18.0; // cm
   plotOptions.frameWidthDepth=18.0; // cm
   plotOptions.frameWidthCurve=18.0; // cm
   plotOptions.frameWidthCorrel=18.0; // cm
   plotOptions.frameHeight=10.0; // cm
   plotOptions.frameHeightSingle=10.0; // cm
   plotOptions.frameHeightMulti=24.0; // cm
   plotOptions.frameHeightDepth=24.0; // cm
   plotOptions.frameHeightCurve=16.5; // cm
   plotOptions.frameHeightCorrel=13.5; // cm
   plotOptions.plotWidth=11.5; // cm
   plotOptions.plotWidthSingle=11.5; // cm
   plotOptions.plotWidthDepth=14.5; // cm
   plotOptions.plotWidthData=14.5; // cm
   plotOptions.plotWidthMulti=17.0; // cm
   plotOptions.plotWidthCurve=14.5; // cm
   plotOptions.plotWidthCorrel=11.5; // cm
   plotOptions.plotHeight=8.0; // cm
   plotOptions.plotHeightSingle=8.0; // cm
   plotOptions.plotHeightMulti=22.0; // cm
   plotOptions.plotHeightDepth=22.0; // cm
   plotOptions.plotHeightCurve=14.5; // cm
   plotOptions.plotHeightCorrel=11.5; // cm
   plotOptions.plotHeightData=4.0; //cm
   plotOptions.plotHeightModel=0.5; //cm
   
   plotOptions.plotHeightTitle=1.0; //cm
   plotOptions.plotPosX=3.0; // cm
   plotOptions.plotPosXSingle=3.0; // cm
   plotOptions.plotPosXDepth=3.0; // cm
   plotOptions.plotPosXCurve=3.0; // cm
   plotOptions.plotPosXCorrel=3.0; // cm
   plotOptions.plotPosXData=3.0; // cm
   plotOptions.plotPosXMulti=0.5; // cm
   plotOptions.plotPosY=1.5;  // cm
   plotOptions.plotPosYSingle=1.5; // cm
   plotOptions.plotPosYDepth=1.5; // cm
   plotOptions.plotPosYCurve=1.5; // cm
   plotOptions.plotPosYCorrel=1.5; // cm
   plotOptions.plotPosYMulti=1.5; // cm
   plotOptions.plotsPerPage=20;
   plotOptions.plotZoom=1;
   plotOptions.levelMargin=0.01; // proportion of plot width
   plotOptions.rangeMargin=0.16; // proportion of plot height
   plotOptions.distHeight=0.33; // proportion of plot height
   plotOptions.showNormalised=false; // normalise plot areas
   plotOptions.showCurve=true;
   plotOptions.showF14C=false;
   plotOptions.showDelta14C=false;
   plotOptions.showCurveRaw=false;
   plotOptions.showDistribution=true;
   plotOptions.showRanges=true;
   plotOptions.showNormal=true;
   plotOptions.showReference=true;
   plotOptions.showTitle=true;
   plotOptions.showText=true;
   plotOptions.showParameters=false;
   plotOptions.showVerbs=true;
   plotOptions.showAgreement=false;
   plotOptions.showConvergence=false;
   plotOptions.showEnsembles=0;
   plotOptions.showOutliers=false;
   plotOptions.colorOutliers=false;
   plotOptions.mergeRanges=false;
   plotOptions.showInterpolation=true;
   plotOptions.show3DEffects=false;
   plotOptions.showItalics=true;
   plotOptions.showGrid=true;
   // options needed for table
   plotOptions.showRange=new Array(false,false,true,false);
   plotOptions.showMean=false;
   plotOptions.showSigma=false;
   plotOptions.showMedian=false;
   plotOptions.showWhole=true;
   plotOptions.showLikelihood=true;
   plotOptions.showPosterior=true;
   plotOptions.showIndices=true;
   plotOptions.showReversed=false;
   plotOptions.BPDatum=1950.5; // half way through the year AD1950
   plotOptions.reportingStyle=1;
   plotOptions.showADFirst=false;
   plotOptions.showPropPlace=2;
   plotOptions.roundBy=1;
   plotOptions.showStructure=true;
   plotOptions.showBrackets=false;
   plotOptions.showBandW=false;
   plotOptions.viewType="individual";
   plotOptions.dataType="date";
   plotOptions.BCAxis=false;
   plotOptions.radiocarbon=false;
   plotOptions.reflist=new Array();
   plotOptions.radiocarbon=false;
   plotOptions.plotFrom=0;
   plotOptions.plotLast=0;
   plotOptions.plotPrev=0;
   plotOptions.plotTo=0;
   plotOptions.plotColors=new Array("#0000ff","#00ff00","#ff0000","#990099","#009999","#999900","#333333",
      "#000099","#009900","#990000","#330033","#003333","#333300","#999999",
	  "#6666ff","#66ff66","#ff6666","#996699","#669999","#999966","#000000");
   // options associated with data;
   plotOptions.data=new Object();
   plotOptions.data.min=0;
   plotOptions.data.max=1;
   plotOptions.data.label="";
   plotOptions.data.t=new Array();
   plotOptions.data.d=new Array();
   plotOptions.showData=false;
   // options associated with sample data type
   plotOptions.sampleData=new Object();
   // mapping variables
   plotOptions.player_min="NaN";
   plotOptions.player_max="NaN";
   plotOptions.player_proxy="";
   plotOptions.player_proxies=new Array("");
   plotOptions.current=0;
   plotOptions.backwards=false;
   plotOptions.currentMax=100;
   plotOptions.probMax="NaN";
   plotOptions.mapPlotNormalise=true;
   plotOptions.mapPlotCircleZoom=1.0;
   plotOptions.mapColorBy="";
   plotOptions.mapPlotMultiIncr=1;
};
oxcalUtils.prototype.makePlotOptionsString=function()
{
  var obj={};
  function addItem(ind)
  {
   obj[ind]=oxcal.plotOptions[ind];
  };
  addItem("showRange");
  addItem("reportingStyle");
  addItem("showReversed");
  addItem("showWhole");
  addItem("plotsPerPage");
  addItem("plotZoom");
  addItem("scale");
  addItem("scaleFont");
  addItem("scaleLine");
  addItem("showIndices");
  addItem("showPropPlace");
  addItem("showADFirst");
  addItem("showNormalised");
  addItem("showAgreement");
  addItem("showConvergence");
  addItem("showOutliers");
  addItem("colorOutliers");
  addItem("showParameters");
  addItem("showVerbs");
  addItem("showItalics");
  addItem("showGrid");
  addItem("showText");
  addItem("showBandW");
  addItem("showBrackets");
  return obj;
};
oxcalUtils.prototype.saveOptions=function()
{
  if(!this.plotOptions){return;};
  app.setCookie("OxCalOptions",this.makePlotOptionsString());
  app.setCookie("oxCanvas",{"scale":this.plotOptions.scale,
   "scaleFont":this.plotOptions.scaleFont,"scaleLine":this.plotOptions.scaleLine,
   "pxPerCm":this.plotOptions.pxPerCm });
};
oxcalUtils.prototype.restoreOptions=function()
{
  var i,obj;
  obj=app.getCookie("OxCalOptions");
  try
  {
   for(i in obj)
   {
    this.plotOptions[i]=obj[i];
   };
  }
  catch(e){};
  if(obj=app.getCookie("oxCanvas"))
  {
   try
   {
    for(i in obj)
    {
     this.plotOptions[i]=obj[i];
    };
   }
   catch(e){};
  };
};
oxcalUtils.prototype.setupData=function()
{
  var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
  var anyPosterior=false;
  var datacount=0;
  var first="NaN";
  if(ocd.length)
  {
   var i;
   for(i=0;i<ocd.length;i++)
   {
    // select the data
    if(ocd[i])
    {
     ocd[i].selectNo=i+1;
     if(ocd[i].likelihood)
     {
      if(ocd[i].likelihood.prob)
      {
       if(isNaN(first)){first=i;};
       datacount++;
      };
     };
     // check if there is any posterior
     if(ocd[i].posterior)
     {
      if(ocd[i].posterior.prob)
      {
       if(isNaN(first)){first=i;};
       datacount++;anyPosterior=true;
      };
     };
    };
   };
  };
  // if there is any posterior data then show it
  if(anyPosterior)
  {
   plotOptions.showPosterior=true;
   plotOptions.showIndices=true;
  }
  else
  {
   plotOptions.showPosterior=false;
   plotOptions.showIndices=false;
  };
  switch(datacount)
  {
  case 0:
   if(calib && calib.length>0)
   {
    plotOptions.viewType="curve";
   };
   break;
  case 1:
   plotOptions.plotFrom=first;
   plotOptions.viewType="individual";
   break;
  };
  this.sortSelection();
};
oxcalUtils.prototype.sortSelection=function()
{
  var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
  var ocdIndex=this.ocdIndex=new Array;
  var i,j,last;
  j=0;last=0;
  for(i=0;i<ocd.length;i++)
  {
   if(!ocd[i]){continue;};
   if(ocd[i].selectNo>0)
   {
    if(ocd[i].op && (ocd[i].op=="Page") && (last!=0))
    {
     ocd[last].newPage=true;
     ocd[i].selectNo=0;
    }
    else
    {
     ocdIndex[j]=new Object;
     ocdIndex[j].ind=i;
     ocdIndex[j].sel=ocd[i].selectNo;
     ocdIndex[j].rel=ocd[i].relative;
     if(ocd[i].type)
     {
      ocdIndex[j].rel=(ocd[i].type=="interval");
     }
     else
     {
      ocdIndex[j].rel=ocd[i].relative;
     };
     // put page breaks on main distributions, not intervals
     if(!ocd[i].relative)
     {
      last=i;
     };
     j++;
    };
   };
  };
  selectNo=j;
  ocdIndex.sort(function(a,b){if(a.rel && !b.rel){return 1;};if(b.rel && !a.rel){return -1;};return a.sel-b.sel;});
  for(j=0;j<ocdIndex.length;j++)
  {
   ocd[ocdIndex[j].ind].selectNo=j+1;
  };
};
oxcalUtils.prototype.findSize=function()
{
    var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
    if(plotOptions.viewType)
    {
     // sort out size and method
     switch(plotOptions.viewType)
     {
     case "table":
     case "individual":
      if(ocd[plotOptions.plotFrom] && ocd[plotOptions.plotFrom].correlation)
      {
       // use correlation view
       plotOptions.frameHeight=plotOptions.frameHeightCorrel;
       plotOptions.plotHeight=plotOptions.plotHeightCorrel;
       plotOptions.plotWidth=plotOptions.plotWidthCorrel;
       plotOptions.plotPosX=plotOptions.plotPosXCorrel;
       plotOptions.plotPosY=plotOptions.plotPosYCorrel;
       plotOptions.frameWidth=plotOptions.frameWidthCorrel;
      }
      else
      {
       // normal view
       plotOptions.frameHeight=plotOptions.frameHeightSingle;
       plotOptions.frameWidth=plotOptions.frameWidthSingle;
       plotOptions.plotHeight=plotOptions.plotHeightSingle;
       plotOptions.plotWidth=plotOptions.plotWidthSingle;
       plotOptions.plotPosX=plotOptions.plotPosXSingle;
       plotOptions.plotPosY=plotOptions.plotPosYSingle;
       plotOptions.frameWidth=plotOptions.frameWidthSingle;
      };
      break;
	 case "multiple":
	 case "select":
	 case "stack":
      plotOptions.plotPosY=plotOptions.plotPosYMulti;
      plotOptions.frameHeight=plotOptions.frameHeightMulti;
	  if(plotOptions.showData)
	  {
       plotOptions.plotHeight=plotOptions.plotHeightMulti-plotOptions.plotHeightData;
       plotOptions.plotWidth=plotOptions.plotWidthData;
       plotOptions.plotPosX=plotOptions.plotPosXData;
       plotOptions.frameWidth=plotOptions.frameWidthData;
	  }
	  else
	  {
       plotOptions.plotHeight=plotOptions.plotHeightMulti;
       plotOptions.plotWidth=plotOptions.plotWidthMulti;
       plotOptions.plotPosX=plotOptions.plotPosXMulti;
       plotOptions.frameWidth=plotOptions.frameWidthMulti;
      };
      if(plotOptions.labelTitle)
      {
       plotOptions.plotHeight-=plotOptions.plotHeightTitle;
      };
      break;
	 case "curve":
      plotOptions.frameHeight=plotOptions.frameHeightCurve;
	  if(plotOptions.showData)
	  {
       plotOptions.frameHeight+=plotOptions.plotHeightData;
	  };
      plotOptions.plotHeight=plotOptions.plotHeightCurve;
      plotOptions.plotWidth=plotOptions.plotWidthCurve;
      plotOptions.plotPosX=plotOptions.plotPosXCurve;
      plotOptions.plotPosY=plotOptions.plotPosYCurve;
      plotOptions.frameWidth=plotOptions.frameWidthCurve;
      if(plotOptions.labelTitle)
      {
       plotOptions.plotHeight-=plotOptions.plotHeightTitle;
      };
      break;
     case "x":
     case "y":
     case "z":
      plotOptions.frameHeight=plotOptions.frameHeightDepth;
	  if(plotOptions.showData)
	  {
       plotOptions.frameHeight+=plotOptions.plotHeightData;
	  };
      plotOptions.plotHeight=plotOptions.plotHeightDepth;
      plotOptions.plotWidth=plotOptions.plotWidthDepth;
      plotOptions.plotPosX=plotOptions.plotPosXDepth;
       plotOptions.plotPosY=plotOptions.plotPosYDepth;
       plotOptions.frameWidth=plotOptions.frameWidthDepth;
      if(plotOptions.labelTitle)
      {
       plotOptions.plotHeight-=plotOptions.plotHeightTitle;
      };
      break;
     case "correlation":
      break;
	 case "model":
	  plotOptions.frameHeight=plotOptions.frameHeightMulti;
      plotOptions.plotPosY=plotOptions.plotPosYMulti;
      plotOptions.frameWidth=plotOptions.frameWidthMulti;
     };
     return; 
    };
};
oxcalUtils.prototype.setupPlot=function()
{
    var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
    var item;
    var minx,maxx;
    var minxt,maxxt;
    var miny,maxy;
    var minz,maxz;
	var yparam;
	var xmargin,zmargin;
	var pagePassed;
	var i,j;
	var shiftUp,topMargin;
    var indexOcd=new Array;
	var defMinX,defMaxX;
	var thisType;
	var plotter;
	var crv=0,sap=0;
	var start, finish;
    start=1;finish=ocd.length;
	if(plotOptions.plotFrom<1){plotOptions.plotFrom=1;};
	// copy simulated dates to data
	for(i=0;i<ocd.length;i++)
	{
	 if(!ocd[i]){continue;};
	 switch(ocd[i].op)
	 {
	 case "R_Simulate":
	 case "C_Simulate":
	  if(!ocd[i].data){ocd[i].data={};};
	  ocd[i].data.sim_date=Number(ocd[i].param.split(":")[0]);
	  break;
	 };
	};
	// copy outliers to main data
	if(model && model.proportional/* && (plotOptions.showOutliers||plotOptions.colorOutliers)*/)
	{
	 for(i=0;i<model.proportional.length;i++)
	 {
	  if(model.proportional[i].outlier_prior)
	  {
	   j=model.proportional[i].param[0];
	   if(ocd[j].posterior)
	   {
	    ocd[j].posterior.outlier_prior=model.proportional[i].outlier_prior*100;
	    ocd[j].posterior.outlier_possible=model.proportional[i].outlier_possible;
	    ocd[j].posterior.outlier_post=model.proportional[i].outlier_post*100;
	   };
	  };
	 };
	};
    if(plotOptions.viewType)
    {
     // sort out size and method
     switch(plotOptions.viewType)
     {
	 case "model":
	  if(model)
	  {
	   minz="NaN";maxz="NaN";
	   for(i=0;i<model.element.length;i++)
	   {
	    if(model.element[i])
		{
		 if(isNaN(minz)||(model.element[i].timepos<minz)){minz=model.element[i].timepos;};
		 if(isNaN(maxz)||(model.element[i].timepos>maxz)){maxz=model.element[i].timepos;};
		};
	   };
	   plotOptions.plotWidth=plotOptions.plotWidthMulti;
	   plotOptions.plotHeight=(4+maxz-minz)*plotOptions.plotHeightModel;
	   plotOptions.frameHeight=plotOptions.plotHeight+10*plotOptions.plotHeightModel;
	   plotOptions.minz=minz;
	   plotOptions.maxz=maxz;
	  };
	  return;
     case "table":
     case "individual":
      if(ocd[plotOptions.plotFrom] && ocd[plotOptions.plotFrom].correlation)
      {
       // use correlation view
	   item=ocd[plotOptions.plotFrom].correlation;
	   if(!item){return;};
        
       minx=plotOptions.minx;
       maxx=plotOptions.maxx;
       miny=plotOptions.miny;
       maxy=plotOptions.maxy;
       minz=plotOptions.minz;
       maxz=plotOptions.maxz;
       if((!minx) || (!maxx))
       {
        plotOptions.labelX=item.x.name;
        plotOptions.labelY=item.y.name;
        plotOptions.labelTitle=item.name;
        minx=item.x.start;
        maxx=item.x.end;
        miny=item.y.start;
        maxy=item.y.end;
        minz=plotOptions.minz;
        maxz=plotOptions.maxz;
        minz=this.map(0,0);maxz=this.map(0,0);
        for(i=0;i<40;i++)
        {
         for(j=0;j<40;j++)
         {
          v=this.map(i,j);
          if(v<minz){minz=v;};
          if(v>maxz){maxz=v;};
         };
        };
        // save settings
	    plotOptions.minx=minx;
	    plotOptions.maxx=maxx;
	    plotOptions.miny=miny;
	    plotOptions.maxy=maxy;
	    plotOptions.minz=minz;
	    plotOptions.maxz=maxz;
       };
      }
      else
      {
       // individual view
       // adjust paging
	   this.setupYValues();
    
       for(j=plotOptions.plotFrom-1;(j>0)&&(!this.individualPlottable(j));j--){};
       if(this.individualPlottable(j)){plotOptions.plotLast=j;}else{plotOptions.plotLast=plotOptions.plotFrom;};
       for(j=plotOptions.plotFrom-10;(j>0)&&(!this.individualPlottable(j));j--){};
       if(this.individualPlottable(j)){plotOptions.plotPrev=j;}else{plotOptions.plotPrev=plotOptions.plotFrom;};
       for(j=plotOptions.plotFrom+1;(j<ocd.length)&&(!this.individualPlottable(j));j++){};
       if(this.individualPlottable(j)){plotOptions.plotNext=j;}else{plotOptions.plotNext=plotOptions.plotFrom;};
       for(j=plotOptions.plotFrom+10;(j<ocd.length)&&(!this.individualPlottable(j));j++){};
       if(this.individualPlottable(j)){plotOptions.plotTo=j;}else{plotOptions.plotTo=plotOptions.plotFrom;};
 

	   // sort out what to base ranges on
	   item=ocd[plotOptions.plotFrom];
	   if(!item){return;};
       if(!this.individualPlottable(plotOptions.plotFrom)){return;};
       plotOptions.dataType=item.type;
	    
	   // find the range (if needed)
       minx=plotOptions.minx;
       maxx=plotOptions.maxx;
       miny=plotOptions.miny;
       maxy=plotOptions.maxy;
	   if((isNaN(minx))||(isNaN(maxx)))
	   {
	    miny=0;maxy=1;
        if(item.likelihood && item.likelihood.prob && item.likelihood.prob.length &&       (plotOptions.showLikelihood || !plotOptions.showPosterior))
        {
         plotter=item.likelihood;
         minxt=plotter.start;maxxt=minxt+plotter.resolution*(plotter.prob.length-1);
         if((isNaN(minx))||(minxt<minx)){minx=minxt;};
         if((isNaN(maxx))||(maxxt>maxx)){maxx=maxxt;};
        };
        if(item.posterior && item.posterior.prob && item.posterior.prob.length && (plotOptions.showPosterior || !plotOptions.showLikelihood))
        {
         plotter=item.posterior;
  	     minxt=plotter.start;maxxt=minxt+plotter.resolution*(plotter.prob.length-1);
         if((isNaN(minx))||(minxt<minx)){minx=minxt;};
         if((isNaN(maxx))||(maxxt>maxx)){maxx=maxxt;};
        };
        if(!(isNaN(minx) || isNaN(maxx)))
        {
	     xmargin=(maxx-minx)/10;
	     minx-=xmargin;maxx+=xmargin;
  	    }
  	    else
  	    {
  	     minx=0;maxx=1000;
  	    };
	    plotOptions.minx=minx;
	    plotOptions.maxx=maxx;
	    plotOptions.miny=miny;
	    plotOptions.maxy=maxy;
	   };
      };
      break;
	 case "multiple":
	 case "select":
	 case "stack":
	 case "curve":
     case "x":
     case "y":  
	 case "z":
	  // sort out how to plot

	  this.setupYValues();
	  
	  thisType="date";
	   
      // find the ranges of all the data
      minx=plotOptions.minx;
      maxx=plotOptions.maxx;
      miny=plotOptions.miny;
      maxy=plotOptions.maxy;
      minz=plotOptions.minz;
      maxz=plotOptions.maxz;
      plotOptions.reflist=new Array();
      calib[0].showCurve=plotOptions.showCurve;
      calib[0].showCurveRaw=plotOptions.showCurveRaw;
      for(i=start;i<finish;i++)
      {
	   // sort out references and curve colors
       if(!ocd[i]){continue;};
       if((typeof(ocd[i].calib)!="undefined")&&(i))
       {
        if(typeof(ocd[i].date)!="undefined")
        {
         plotOptions.radiocarbon=true;
        };
        for(j=0;j<plotOptions.reflist.length;j++)
        {
         if(plotOptions.reflist[j]==ocd[i].calib){break;};
        };
  	    if((typeof(plotOptions.reflist[j])=="undefined")||(plotOptions.reflist[j]!=ocd[i].calib))
  	    {
  	     if(calib[ocd[i].calib])
  	     {
          plotOptions.reflist[j]=ocd[i].calib;
          if(!plotOptions.showBandW && ocd[ocd[i].calib].data && ocd[ocd[i].calib].data.color)
          {
	       calib[ocd[i].calib].color=ocd[ocd[i].calib].data.color;
          }
          else
          {
           if(crv)
           {
	        calib[ocd[i].calib].color=this.getColor(crv);
	       }
	       else
	       {
	        calib[ocd[i].calib].color=false;
	       };
	      };
	      if(ocd[ocd[i].calib].data)
	      {
	       if(typeof(ocd[ocd[i].calib].data.showCurve)!="undefined")
	       {
	        calib[ocd[i].calib].showCurve=ocd[ocd[i].calib].data.showCurve; 
	       }
	       else
	       {
	        calib[ocd[i].calib].showCurve=true;
	       };
	       if(typeof(ocd[ocd[i].calib].data.showCurveRaw)!="undefined")
	       {
	        calib[ocd[i].calib].showCurveRaw=ocd[ocd[i].calib].data.showCurveRaw; 
	       }
	       else
	       {
	        calib[ocd[i].calib].showCurveRaw=plotOptions.showCurveRaw;
	       };
	       if(typeof(ocd[ocd[i].calib].data.markerSize)!="undefined")
	       {
	        calib[ocd[i].calib].markerSize=ocd[ocd[i].calib].data.markerSize; 
	       }
	       else
	       {
	        calib[ocd[i].calib].markerSize=2.5;
	       };
	       if(typeof(ocd[ocd[i].calib].data.marker)!="undefined")
	       {
	        calib[ocd[i].calib].marker=ocd[ocd[i].calib].data.marker; 
	       }
	       else
	       {
	        calib[ocd[i].calib].marker="circle";
	       };
	       if(typeof(ocd[ocd[i].calib].data.fill)!="undefined")
	       {
	        calib[ocd[i].calib].fill=ocd[ocd[i].calib].data.fill; 
	       }
	       else
	       {
	        calib[ocd[i].calib].fill="white";
	       };
	      }
	      else
	      {
	       calib[ocd[i].calib].showCurve=true;
	       calib[ocd[i].calib].showCurveRaw=plotOptions.showCurveRaw;
	      };
  	      crv++;
  	     };
  	     if(ocd[ocd[i].calib] && ocd[ocd[i].calib].op && ocd[ocd[i].calib].op=="Sapwood_Model")
  	     {
          plotOptions.reflist[j]=ocd[i].calib;
  	      if(sap)
  	      {
  	       ocd[ocd[i].calib].color=this.getColor(sap);
  	      }
  	      else
  	      {
  	       ocd[ocd[i].calib].color=false;
  	      };
  	      sap++;
  	     };
  	    };
       };
      };
      if(plotOptions.viewType=="curve")
      {
       if(calib[0])
       {
        for(j=0;j<plotOptions.reflist.length;j++)
        {
         if(plotOptions.reflist[j]==0){break;};
        };
  	    // add to list and work out the colours of the curves
  	    if(plotOptions.reflist[j]!=0)
  	    {
         plotOptions.reflist[j]=0;
	     calib[0].color=this.getColor(crv);
         crv++;
	    };
       };
      };
      if((isNaN(minx)) || (isNaN(maxx)))
      {
       maxz=undefined;
       pagePassed=false;
       for(i=start;i<finish;i++)
       {
        if(!ocd[i]){continue;};
		if(ocd[i].axis && (ocd[i].selectNo>0))
		{
		 if((plotOptions.viewType=="multiple")&&(ocd[i].yParam<plotOptions.plotFrom)){continue;};
		 if(!pagePassed && (plotOptions.dataType=="date"))
		 {
		  defMinX=ocd[i].axis.min;
		  defMaxX=ocd[i].axis.max;
		 };
		};
        if(ocd[i].newPage && ocd[i].yParam>=plotOptions.plotTo)
        {
         pagePassed=true;
        };
        if(ocd[i].axis)
        {
/*         if(plotOptions.viewType=="curve")
         {
 		  defMinX=ocd[i].axis.min;
		  defMaxX=ocd[i].axis.max;
         };*/
         continue;
        };
        if(ocd[i].type!="date")
        {
         if((plotOptions.viewType!="multiple")&&(plotOptions.viewType!="select")&&(plotOptions.viewType!="stack")){continue;};
        };
        item=ocd[i];
        if(!isNaN(item.yParam) && item.selectNo)
        {
		 if((plotOptions.viewType=="multiple")||(plotOptions.viewType=="select")||(plotOptions.viewType=="stack"))
		 {
          if(item.yParam < plotOptions.plotFrom){continue;};
          if(item.yParam > plotOptions.plotTo){continue;};
          if((plotOptions.viewType=="multiple")&&(plotOptions.dataType!=item.type)){continue;};
          if(((plotOptions.viewType=="select")||(plotOptions.viewType=="stack"))&&item.type)
          {
 		   thisType=item.type;
 		  };
		 };
         if((isNaN(miny))||(item.yParam<miny)){miny=item.yParam;};
         if((isNaN(maxy))||(item.yParam>maxy)){maxy=item.yParam;};
         if(item.likelihood && item.likelihood.prob)
         {
          plotter=item.likelihood;
          minxt=plotter.start;maxxt=minxt+plotter.resolution*(plotter.prob.length-1);
          if((isNaN(minx))||(minxt<minx)){minx=minxt;};
          if((isNaN(maxx))||(maxxt>maxx)){maxx=maxxt;};
          if((isNaN(maxz))||(plotter.probNorm>maxz)){maxz=plotter.probNorm;};
         };
         if(item.posterior && item.posterior.prob)
         {
          plotter=item.posterior;
  	      minxt=plotter.start;maxxt=minxt+plotter.resolution*(plotter.prob.length-1);
          if((isNaN(minx))||(minxt<minx)){minx=minxt;};
          if((isNaN(maxx))||(maxxt>maxx)){maxx=maxxt;};
          if((isNaN(maxz))||(plotter.probNorm>maxz)){maxz=plotter.probNorm;};
         };
        };
       };
       // extend ranges to give a little margin
       if((isNaN(minx))||(isNaN(maxx)))
       {
        if(plotOptions.showF14C)
        {
         minx=1950;maxx=2020;
        }
        else
        {
         minx=950;maxx=1950;
        };
       }
       else
       {
        if(minx==maxx){maxx=minx+1;};
        xmargin=(maxx-minx)/10;
        minx-=xmargin*3;maxx+=xmargin;
       };
       if((isNaN(miny))||(isNaN(maxy)))
       {
        if(plotOptions.showF14C)
        {
         miny=0;maxy=2;
        }
        else
        {
         miny=0;maxy=2000;
        };
       };
	   if(!(isNaN(defMinX)||isNaN(defMaxX)||(thisType!="date")))
	   {
	    switch(plotOptions.viewType)
		{
	    case "x":
	    case "y":
		case "z":
		case "curve":
		case "select":
		case "stack":
		case "multiple":
	     minx=defMinX;maxx=defMaxX;
		 break;
		};
	   };
       switch(plotOptions.viewType)
       {
	   case "x":
	   case "y":
	   case "z":
	   case "curve":
        zmargin=(maxy-miny)/10;
        miny-=zmargin;maxy+=zmargin;
        break;
	   case "multiple":
	   case "select":
	   case "stack":
	    miny=plotOptions.plotFrom;
		maxy=plotOptions.plotTo;
	    zmargin=0.4;
	    miny-=0.5;
	    maxy+=0.5;
	    miny-=zmargin;
	    maxy+=zmargin;
	    break;
       };
       // save settings
	   plotOptions.minx=minx;
	   plotOptions.maxx=maxx;
	   plotOptions.miny=miny;
	   plotOptions.maxy=maxy;
	   plotOptions.minz=minz;
	   plotOptions.maxz=maxz;
      };
    
      // scale multiple plots for number of plots shown
      switch(plotOptions.viewType)
      {
	  case "multiple":
	  case "select":
	  case "stack":
	   zmargin=0.4;
	   topMargin=0.0;
	   if(plotOptions.showData){topMargin+=plotOptions.plotHeightData;};
	   if(plotOptions.labelTitle){topMargin+=plotOptions.plotHeightTitle;};
	   plotOptions.plotHeight=
	     (plotOptions.plotHeightMulti-topMargin)*(maxy-miny)
	     /(plotOptions.plotsPerPage+2*zmargin);
       plotOptions.plotPosY=plotOptions.plotPosYMulti
         +plotOptions.plotHeightMulti-plotOptions.plotHeight-topMargin;
	   // reduce the frame height to scale
	   shiftUp=(plotOptions.plotHeightMulti-plotOptions.plotHeight);
       shiftUp-=topMargin;
	   plotOptions.frameHeight=plotOptions.frameHeightMulti-shiftUp;
	   plotOptions.plotPosY-=shiftUp;
      };
      break;
     case "correlation":
      break;
     };
    };
};
oxcalUtils.prototype.typePlottable=function(i)
{
  var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
  if(!ocd[i]){return false;};
  if(!(ocd[i].selectNo>0)){return false;};
  if(!ocd[i].type){return false;};
  if(ocd[i].type==plotOptions.dataType){return true;};
  if(ocd[i].op=="P_Sequence"){return true;};
  if(ocd[i].type=="model")
  {
   switch(ocd[i].op)
   {
   case "Sapwood_Model":
    return false;
   };
   return true;
  };
  return false;
};
oxcalUtils.prototype.individualPlottable=function(j)
{
  var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
  var plotter;
  if(!ocd[j]){return false;};
  switch(ocd[j].type)
  {
  case "correlation":
   return true; 
  case "date": case "number": case "interval":
   break;
  default:
   return false;
  };
  if(ocd[j].likelihood)
  {
   plotter=ocd[j].likelihood;
   if((plotter.range && plotter.range.length>0) || plotter.prob){return true;};
  };
  if(ocd[j].posterior)
  {
   plotter=ocd[j].posterior;
   if((plotter.range && plotter.range.length>0) || plotter.prob){return true;};
  };
  return false;
};
oxcalUtils.prototype.setupYValues=function()
{
      var plotOptions=this.plotOptions,ocd=this.ocd,calib=this.calib,model=this.model;
	  var i;
	  var indexOcd=new Array;
	  var type="";
	  var yparm;
	  var newPage;
	  var forceNewPage;
      plotOptions.plotTo=undefined;
      plotOptions.plotPrev=0;
	  for(i=0;i<ocd.length;i++)
	  {
	   if(ocd[i])
	   {
	    ocd[i].yParam="NaN";
	    ocd[i].xParam="NaN";
	    if(ocd[i].data)
	    {
	     if(ocd[i].data.date){ocd[i].date=ocd[i].data.date;};
	     if(ocd[i].data.error){ocd[i].error=ocd[i].data.error ;};
	    };
	   };
	  };
	  switch(plotOptions.viewType)
	  {
	  case "individual":
	   i=plotOptions.plotFrom;
	   while(!this.individualPlottable(i)&&(i<ocd.length))
	   {
	    i++;
	   };
	   if(this.individualPlottable(i))
	   {
	    plotOptions.plotFrom=i;
	   }
	   else
	   {
		while(!this.individualPlottable(i)&&(i>0))
	    {
	     i--;
	    };
		plotOptions.plotFrom=i;
	   };
	   plotOptions.plotPrev=plotOptions.plotFrom-10;
	   plotOptions.plotTo=plotOptions.plotFrom+9;
	   break;
	  case "multiple":
	   yparm=0;
	   for(i=0;i<ocd.length;i++)
	   {
	    if(this.typePlottable(i))
	    {
	     yparm++;
	     ocd[i].yParam=yparm;
	     if((yparm>plotOptions.plotFrom) && !plotOptions.plotTo && ocd[i].newPage)
	     {
	      plotOptions.plotTo=yparm;
	     };
	     if((yparm+1<plotOptions.plotFrom) && (yparm+1>plotOptions.plotPrev) && ocd[i].newPage)
	     {
	      plotOptions.plotPrev=yparm+1;
	     };
	    };
		if(ocd[i] && ocd[i].axis)
		{
		 ocd[i].yParam=yparm;
		};
	   };
	   if(!plotOptions.plotTo){plotOptions.plotTo=yparm;};
	   if(plotOptions.plotTo>(plotOptions.plotFrom+plotOptions.plotsPerPage-1))
	   {
	    plotOptions.plotTo=plotOptions.plotFrom+plotOptions.plotsPerPage-1;
	   };
	   if(plotOptions.plotPrev<(plotOptions.plotFrom-plotOptions.plotsPerPage))
	   {
	    plotOptions.plotPrev=plotOptions.plotFrom-plotOptions.plotsPerPage;
	   };
	   break;
	  case "curve":
	   plotOptions.dataType="date";
	   for(i=0;i<ocd.length;i++)
	   {
	    if(this.typePlottable(i))
		{
		 ocd[i].yParam=ocd[i].date;
		 if(plotOptions.showLikelihood && ocd[i].likelihood)
		 {
		  ocd[i].xParam=ocd[i].likelihood.mean;
		 };
		 if(plotOptions.showPosterior && ocd[i].posterior)
		 {
		  ocd[i].xParam=ocd[i].posterior.mean;
		 };
		};
	   };
	   break;	
	  case "z":
	   plotOptions.dataType="date";
	   for(i=0;i<ocd.length;i++)
	   {
	    if(this.typePlottable(i) && ocd[i].data && !isNaN(ocd[i].data.z))
		{
		 ocd[i].yParam=ocd[i].data.z;
		};
	   };
	   break;
	  case "select":
	  case "stack":
	   for(i=0;i<ocd.length;i++)
	   {
	    if(ocd[i] && ocd[i].selectNo)
		{
		 indexOcd[ocd[i].selectNo]=i;
		};
	   };
	   yparm=0;
	   for(i=0;i<indexOcd.length;i++)
	   {
	    if(!indexOcd[i]){continue;};
		if(!ocd[indexOcd[i]]){continue;};
		switch(ocd[indexOcd[i]].type)
		{
		case "interval": case "number": case "date":case "model":
		 break;
		default:
		 continue;
		};
		if(plotOptions.viewType=="select")
		{
		 yparm++;
//		 yparm=ocd[indexOcd[i]].selectNo;
	     ocd[indexOcd[i]].yParam=yparm;
	     newPage=ocd[indexOcd[i]].newPage;
	    }
	    else  //stack
	    {
	     if(yparm==0){yparm++;};
	     ocd[indexOcd[i]].yParam=yparm;
	     if(ocd[indexOcd[i]].newPage){yparm++;};
	    };
		forceNewPage=false;
	    // set new page if type is changing
	    if(ocd[indexOcd[i]].type!="model")
	    {
		 if((type!="") && (type!=ocd[indexOcd[i]].type))
		 {
	      forceNewPage=true;
		 };
		 type=ocd[indexOcd[i]].type;
		};
	    if((yparm>plotOptions.plotFrom) && (!plotOptions.plotTo||(yparm<plotOptions.plotTo)) && newPage)
	    {
	     plotOptions.plotTo=yparm;
	    };
	    if((yparm+1<plotOptions.plotFrom) && (yparm+1>plotOptions.plotPrev) && newPage)
	    {
	     plotOptions.plotPrev=yparm+1;
	    };
	    if((yparm>plotOptions.plotFrom) && (!plotOptions.plotTo||(yparm<plotOptions.plotTo)) && forceNewPage)
	    {
	     plotOptions.plotTo=yparm-1;
	    };
	    if((yparm<plotOptions.plotFrom) && (yparm>plotOptions.plotPrev) && forceNewPage)
	    {
	     plotOptions.plotPrev=yparm;
	    };
		if(yparm==plotOptions.plotFrom)
		{
		 plotOptions.dataType=type;
		};
	   };
	   if(!plotOptions.plotTo){plotOptions.plotTo=yparm;};
	   if(plotOptions.plotTo>(plotOptions.plotFrom+plotOptions.plotsPerPage-1))
	   {
	    plotOptions.plotTo=plotOptions.plotFrom+plotOptions.plotsPerPage-1;
	   };
	   if(plotOptions.plotPrev<(plotOptions.plotFrom-plotOptions.plotsPerPage))
	   {
	    plotOptions.plotPrev=plotOptions.plotFrom-plotOptions.plotsPerPage;
	   };
	   break;
	  };
}; 
oxcalUtils.prototype.editPlotItem=function(i)
{
 var spec,s,v={},selected=false;
 if(!i)
 {
  selected=true;
  for(i=0;i<this.ocd.length;i++){if(this.ocd[i].selectNo){break;};};
 };
 if(!this.ocd[i]){return;};
 v.name=this.ocd[i].name;v.color="";
 if(this.ocd[i].data && this.ocd[i].data.color){v.color=this.ocd[i].data.color;};
 spec=new itemSpec("data","Properties","Object");
 if(!selected)
 {
  s=spec.appendChild("name","Name","Text");
 };
 if(v.color.indexOf("(")!=-1)
 {
  s=spec.appendChild("color","Color","Color");
 }
 else
 {
  s=spec.appendChild("color","Color","Text");
 };
 app.prompt("Edit item",v,spec,{"id":"OxCalEditItem"}).then(function(rpl){
  if(selected)
  {
   for(i=1;i<this.ocd.length;i++)
   {
    if(this.ocd[i] && this.ocd[i].selectNo)
    {
     if(!this.ocd[i].data){this.ocd[i].data={};};
     this.ocd[i].data.color=rpl.color;
    };
   };
  }
  else
  {
   if(rpl.color){if(!this.ocd[i].data){this.ocd[i].data={};};this.ocd[i].data.color=rpl.color;}
   else{if(this.ocd[i].data && this.ocd[i].data.color){this.ocd[i].data.color="";};};
   this.ocd[i].name=rpl.name;
  };
  this.showOutputTable();
  if(app.getTool('OxCalPlot').active){this.updater();};
 }.bind(this)).catch(function(e){});
};

// routines for correlation plots
oxcalUtils.prototype.map=function(i,j)
{
   return this.ocd[this.plotOptions.plotFrom].correlation.prob[i+j*this.ocd[this.plotOptions.plotFrom].correlation.x.divisions];
};
oxcalUtils.prototype.normmap=function(i,j)
{
   return (this.map(i,j)-this.plotOptions.minz)/(this.plotOptions.maxz-this.plotOptions.minz);
};

oxcalUtils.prototype.getColor=function(ind)
{
   if(plotOptions.showBandW)
   {
    return "#000000";
   };
   return this.plotOptions.plotColors[ind % this.plotOptions.plotColors.length];
};

// rountines for changing views
oxcalUtils.prototype.defaultPaging=function(no)
{
  var plotOptions=this.plotOptions;
  var old=plotOptions.plotFrom;
  if(!no){no=1;};
  if(no > (this.ocd.length-1)){return false;};
  if(no < 1){no=1;};
  plotOptions.plotFrom=no;
  plotOptions.plotLast=no-1;
  plotOptions.plotNext=no+1;
  plotOptions.plotPrev=no-plotOptions.plotsPerPage;
  plotOptions.plotTo=no+plotOptions.plotsPerPage;
  if(plotOptions.plotPrev<0){plotOptions.plotPrev=0;};
  if(plotOptions.plotLast<0){plotOptions.plotLast=0;};
  return old!=plotOptions.plotFrom;
};
oxcalUtils.prototype.updater=function(reConfigure)
{
  if(!reConfigure)
  {
   this.showOutputPlot(false,true);  
  }
  else
  {
   this.showOutputPlot(false,false);
  };
};
oxcalUtils.prototype.changeZoom=function(val)
{
  this.plotOptions.scale*=val;
  if(this.plotOptions.scale>8){this.plotOptions.scale=8;};
  if(this.plotOptions.scale==0){this.plotOptions.scale=1;};
  if(this.plotOptions.scale<(1/8)){this.plotOptions.scale=1/8;};
};
oxcalUtils.prototype.changeSpan=function(val)
{
  var cen;
  this.plotOptions=this.plotOptions;
  cen=(this.plotOptions.maxx+this.plotOptions.minx)/2;
  val*=(this.plotOptions.maxx-this.plotOptions.minx)/2;
  this.plotOptions.minx=cen-val;
  this.plotOptions.maxx=cen+val;
};
oxcalUtils.prototype.changeYRange=function(val)
{
  val*=this.plotOptions.maxy-this.plotOptions.miny;
  this.plotOptions.maxy=this.plotOptions.miny+val;
};
oxcalUtils.prototype.moveCentre=function(val)
{
  var cen;
  cen=(this.plotOptions.maxx+this.plotOptions.minx)/2;
  val*=this.plotOptions.maxx-this.plotOptions.minx;
  this.plotOptions.minx+=val;
  this.plotOptions.maxx+=val;
};
oxcalUtils.prototype.changeMinY=function(val)
{
  val*=this.plotOptions.maxy-this.plotOptions.miny;
  this.plotOptions.miny+=val;
  this.plotOptions.maxy+=val;
};
oxcalUtils.prototype.setPlotsPerPage=function(no)
{
  if(!no){no=10;};
  if(no<1){no=1;};
  this.plotOptions.plotsPerPage=no;
};
oxcalUtils.prototype.setPlotFrom=function(no)
{
  this.defaultPaging(no);
  this.updater(true);
};
oxcalUtils.prototype.setPage=function(no)
{
 switch(no)
 {
 case -2: this.setPlotFrom(this.plotOptions.plotPrev);break;
 case -1: this.setPlotFrom(this.plotOptions.plotLast);break;
 case 1: this.setPlotFrom(this.plotOptions.plotNext);break;
 case 2: this.setPlotFrom(this.plotOptions.plotTo+1);break;
 };
};
oxcalUtils.prototype.getPlotName=function()
{
  if(this.plotOptions.showBandW)
  {
   return "ocp_plot_bw_svg.html";
  };
  return "ocp_plot_svg.html";
};
oxcalUtils.prototype.getSVGContent=function()
{
  var plt=document.getElementById("oxcalPlotArea");
  var printPossible=plt.src.toString().match(this.getPlotName());
  var cont;
  if(printPossible)
  {
   cont=app.xml2Str(plt.contentDocument.getElementById("top"));
   // get rid of duplicate header (Opera)
   cont=cont.replace('\<\?xml version="1.0"\?\>\<\?xml version="1.0" \?\>','\<\?xml version="1.0" \?\>');
   // add header if not there at all (Safari)
   if(cont.indexOf("\<\?xml")==-1)
   {
    cont="\<\?xml version=\"1.0\" encoding=\"UTF-8\"\?\>"+cont;
   };
   // get rid of any non-ascii characters
//   cont=cont.replace(/[^\u000A\u000D\u0020-\u007F]/g,"_");
   // remove problem parts of IE9 header
   if(cont.indexOf("xmlns:NS1=")!=-1)
   {
    cont=cont.replace(' xmlns:NS1=""','');
    cont=cont.replace(' NS1:xmlns:ev="http://www.w3.org/2001/xml-events"','');
    cont=cont.replace(' version="1.1"','');
   };
   // correct problems with Safari symbol links
   cont=cont.replace(/ xlink\=/g,' xmlns:xlink=');
   cont=cont.replace(/use href\=/g,'use xlink:href=');
   return cont;
  };
  return false;
 };

// printing

oxcalUtils.prototype.startPrint=function(single)
{
  this.printContent="\\documentclass[a4paper]{article}\n"
   +"\\usepackage{graphicx}\n"
   +"\\pagestyle{empty}\n"
   +"\\parindent=0pt\n"
   +"\\parskip=0pt\n"
   +"\\oddsidemargin  0cm\n"
   +"\\evensidemargin 0cm\n"
   +"\\textwidth      16.35cm\n"
   +"\\headheight     0cm\n"
   +"\\topmargin     -1cm\n"
   +"\\textheight  28cm\n"
   +"\\headsep  0cm\n";
  this.printContent+="\\newcommand{\\oxcalfig}[1]{\\includegraphics[width=";
  if((this.plotOptions.viewType=="individual")&&(!single))
  {
   this.printContent+="8";
  }
  else
  {
   this.printContent+="16";
  };
  this.printContent+="cm]{#1.pdf}}\n";
  this.printContent+="\\begin{document}\n";
  this.svgContent="";
  this.page=0;
};
oxcalUtils.prototype.pagePrint=function()
{
  var cont;
  if(this.plotOptions.plotFrom > this.plotOptions.plotTo){return;};
  cont=this.getSVGContent();
  if(cont)
  {
   this.printFilename=this.filename;
   this.svgContent+=cont;
   this.page++;
   this.printContent+="\\oxcalfig{temp_"+this.page+"}\n";
   if(this.plotOptions.viewType=="individual")
   {
    if(!(this.page%2)){this.printContent+="\n";};
   }
   else
   {
    this.printContent+="\n";
   };
  };
};
oxcalUtils.prototype.endPrint=function()
{
   this.printContent+="\\end{document}\n";
   this.printContent+=this.svgContent;
   this.svgContent="";
   this.showingSequence=false;
   this.defaultPaging(0);
   this.showOutputPlot();
   app.fileSaveAs("OxCalPrint","tex");
};
oxcalUtils.prototype.nextSlide=function()
{
  var changed=false;
  this.pagePrint();
  switch(this.plotOptions.viewType)
  {
  case "individual":
   do
   {
    changed=this.defaultPaging(this.plotOptions.plotNext);
   }
   while(!this.ocd[this.plotOptions.plotFrom].selectNo && changed);
   break;
  case "select":
  case "stack":
  case "multiple":
   changed=this.defaultPaging(this.plotOptions.plotTo+1);
   break;
  };
  if(changed)
  {
   this.showOutputPlot();
  }
  else
  {
   this.endPrint();
  };
};
oxcalUtils.prototype.printPages=function()
{
  switch(this.plotOptions.viewType)
  {
  case "individual":
  case "multiple":
  case "select":
  case "stack":
   app.confirm("Print all pages?\n(this will lose any adjustments on this page)").then(function(){
    try
    {
     this.startPrint(false);
     this.showingSequence=true;
     this.defaultPaging(0);
     this.showOutputPlot(false,true);
    }catch(e){app.alert(e);};
   }.bind(this)).catch(function(){
    app.confirm("Print just this page?").then(function(){
     this.startPrint(true);
     this.pagePrint();
     this.endPrint();
    }.bind(this)).catch(function(e){app.alert(e)});
   }.bind(this));
   break;
  case "curve":
  case "z":
   this.startPrint(true);
   this.pagePrint();
   this.endPrint();
   break;
  default:
   document.getElementById("oxcalPlotArea").contentWindow.print();
   break;
  };
};

// Oxplot plotting routines
// function associated with mapping

oxcalUtils.prototype.mapPlot=async function(findValues)
{
  this.pl=new plotLink(document.getElementById('plotArea'));
  this.pl.multiPlots.columns=3;
  if(findValues){this.findMapMinMax(true);};
  this.plotOptions=(await this.getMapParams());
  this.setMapParams();
  if(!findValues){this.pl.plotData=this.plotData;};
  this.plotOnMap();
  app.showTool("Plot");
};
oxcalUtils.prototype.getMapRows=function(s)
{
 var po;
 if(s){po=s.parent.object;}else{po=this.plotOptions;};
 var r=Math.ceil(
  	(1+Math.round((po.player_max-po.player_min)
  	/po.mapPlotMultiIncr))/po.mapPlotColumns);
 if(s)
 {
  s.parent.emptyContainer();
  s.parent.object.mapPlotRows=r;
  s.parent.fillContainer();
 };
 return r;
};
oxcalUtils.prototype.getMapParams=function()
{
  var spec,s,i;
  this.plotOptions.mapPlotMin=Math.round(this.showDateT(this.plotOptions.player_min,this.plotOptions.dataType));
  this.plotOptions.mapPlotMax=Math.round(this.showDateT(this.plotOptions.player_max,this.plotOptions.dataType));
  this.plotOptions.mapPlotIncr=Math.round(Math.abs((this.plotOptions.player_max-this.plotOptions.player_min)/this.plotOptions.currentMax));
  this.plotOptions.mapPlotColumns=this.pl.multiPlots.columns;
  this.plotOptions.mapPlotRows=this.getMapRows();
  this.plotOptions.mapPlotProxy=this.plotOptions.player_proxy;
  this.plotOptions.mapColorBy="";
  
  spec=new itemSpec("options","Mapping options","Object");
  s=spec.appendChild("mapPlotMin","Min","Number");
  s=spec.appendChild("mapPlotMax","Max","Number");
  s=spec.appendChild("mapPlotIncr","Increment","Number");
  s=spec.appendChild("mapPlotNormalise","Normalise circles","Boolean");
  s=spec.appendChild("mapPlotCircleZoom","Circle zoom","Number");
  s=spec.appendChild("mapColorBy","Color by","Text");
  s.options=["","median","mean"];
  for(i=0;this.plotOptions.parameters&&(i<this.plotOptions.parameters.length);i++)
  {
   s.options.push(this.plotOptions.parameters[i]);
  };
  s=spec.appendChild("category","Split by","Text");
  s.options=[];
  for(i=0;this.plotOptions.categories&&(i<this.plotOptions.categories.length);i++)
  {
   s.options.push(this.plotOptions.categories[i]);
  };
  s=spec.appendChild("","Multimaps","Label");
  s=spec.appendChild("mapPlotColumns","Columns","Number");
  s.changer=this.getMapRows.bind(this);
  s=spec.appendChild("mapPlotRows","Rows","Number");
  s.readonly=true;
  s=spec.appendChild("mapPlotMultiIncr","Increment","Number");
  s.changer=this.getMapRows.bind(this);
  
  s=spec.appendChild("","Proxy mapping","Label");
  s=spec.appendChild("mapPlotProxy","Proxy","Text");
  s.options=[];
  for(i=0;this.plotOptions.player_proxies&&(i<this.plotOptions.player_proxies.length);i++)
  {
   s.options.push(this.plotOptions.player_proxies[i]);
  };
  return app.prompt("Map plot",this.plotOptions,spec);
};
oxcalUtils.prototype.setMapParams=function()
{
  var i,sel;
  this.pl.plotColor.z_calc=this.plotOptions.mapColorBy;
  sel=document.getElementById('mapColorBy');
  this.findMapMinMax(false);
  this.pl.plotColor.showKey=false;
  this.plotOptions.player_min=this.getDateT(this.plotOptions.mapPlotMin,this.plotOptions.dataType);
  this.plotOptions.player_max=this.getDateT(this.plotOptions.mapPlotMax,this.plotOptions.dataType);
  this.plotOptions.currentMax=1+Math.round((this.plotOptions.player_max-this.plotOptions.player_min)/
   this.plotOptions.mapPlotIncr);
  this.plotOptions.player_max=this.plotOptions.player_min+
  	this.plotOptions.currentMax*this.plotOptions.mapPlotIncr;
  this.plotOptions.mapPlotCircleZoom=Math.round(this.plotOptions.mapPlotCircleZoom*10)/10;
  this.plotOptions.mapPlotMultiIncr=Math.round(this.plotOptions.mapPlotMultiIncr);
  this.pl.multiPlots.columns=Number(this.plotOptions.mapPlotColumns);
  this.plotOptions.player_proxy=false;
  if(this.pl.plotColor.z_calc)
  {
   this.pl.plotColor.autoz=1;
   switch(this.pl.plotColor.z_calc)
   {
   case "mean":
    this.pl.plotColor.dz_calc="sigma";
    break;
   case "median":
    this.pl.plotColor.dz_calc="";
    break;
   };
   switch(this.pl.plotColor.z_calc)
   {
   case "mean":
   case "median":
    this.pl.plotColor.zlabel=
   		this.pl.plotColor.z_calc.slice(0,1).toUpperCase()+this.pl.plotColor.z_calc.slice(1);
    if(this.plotOptions.showPosterior)
    {
     this.pl.plotColor.zlabel+=" modelled ";
    }
    else
    {
     this.pl.plotColor.zlabel+=" unmodelled ";
    };
    switch(this.plotOptions.reportingStyle)
    {
     case 0: 
      this.pl.plotColor.autoz=2;
      this.pl.plotColor.z_calc="calBP("+this.pl.plotColor.z_calc+")";
      this.pl.plotColor.zlabel+="age (calBP)";
      break;
     case 1:
      if((this.plotOptions.player_min+this.plotOptions.player_max)/2>0)
      {
       this.pl.plotColor.z_calc="AD("+this.pl.plotColor.z_calc+")";
       this.pl.plotColor.zlabel+="date (AD)";
      }
      else
      {
       this.pl.plotColor.autoz=2;
       this.pl.plotColor.z_calc="BC("+this.pl.plotColor.z_calc+")";
       this.pl.plotColor.zlabel+="date (BC)";
      };
      break;
     case 2:
      if((this.plotOptions.player_min+this.plotOptions.player_max)/2>0)
      {
       this.pl.plotColor.z_calc="CE("+this.pl.plotColor.z_calc+")";
       this.pl.plotColor.zlabel+="date (CE)";
      }
      else
      {
      this.pl.plotColor.autoz=2;
       this.pl.plotColor.z_calc="BCE("+this.pl.plotColor.z_calc+")";
       this.pl.plotColor.zlabel+="date (BCE)";
      };
      break;
     default:
      this.pl.plotColor.zlabel+="date (+/-CE)";
      break;
    };
    break;
   default:
    this.pl.plotColor.zlabel=this.pl.plotColor.z_calc;
    break;
   };
   this.pl.plotColor.showKey=true;
  }
  else
  {
   this.pl.plotColor.dz_calc="";
   this.pl.plotColor.z_calc=this.plotOptions.mapPlotProxy;
   if(this.pl.plotColor.z_calc){this.plotOptions.player_proxy=true;};
  };
};
oxcalUtils.prototype.ocdObj=function(i)
{
  if(this.plotOptions.showPosterior && this.ocd[i].posterior){return this.ocd[i].posterior;};
  if(this.plotOptions.showLikelihood && this.ocd[i].likelihood){return this.ocd[i].likelihood;};
  return false;
};
oxcalUtils.prototype.ocdMin=function(i)
{
  var obj=this.ocdObj(i);
  if(!obj){return "NaN";};
  return obj.start;
};
oxcalUtils.prototype.ocdMax=function(i)
{
  var obj=this.ocdObj(i);
  if(!obj){return "NaN";};
  if(!obj.prob){return "NaN";};
  return obj.start+obj.prob.length*obj.resolution;
};
oxcalUtils.prototype.ocdValMax=function(i)
{
  var j,obj=this.ocdObj(i);
  if(!obj){return "NaN";};
  if(!obj.prob){return "NaN";};
//  if(!plotOptions.mapPlotNormalise){return 1;};
  return obj.probNorm;
};
oxcalUtils.prototype.ocdVal=function(i,v,forceNorm)
{
  var j,obj=this.ocdObj(i);
  if(!obj){return "NaN";};
  if(!obj.prob){return "NaN";};
  j=Math.round((v-obj.start)/obj.resolution);
  if((j<0) || (j>=obj.prob.length)){return 0;};
  if(!this.plotOptions.mapPlotNormalise && !forceNorm){return obj.prob[j];};
  if(!obj.probNorm){return 0;};
  return obj.prob[j]*obj.probNorm;
};
oxcalUtils.prototype.findMapMinMax=function(findIncr)
{
  var sumMax,i,j,sm;
  var categoryIndex={"":true},cat,categoryData={"":0},parameterIndex={"mean":true,"median":true,"sigma":true};
  var symb=["circle","square","diamond","triangle","cross","x"];
  var plotOptions=this.plotOptions,plotData;
  var ocd=this.ocd;
  plotOptions.player_proxy=false; // not using proxies
  plotOptions.player_min="NaN";plotOptions.player_max="NaN";sumMax="NaN";plotOptions.probMax="NaN";

  plotData=this.pl.plotData=[{name:"",line:"",markerColor:"rgb(255,0,0)",
    markerFill:"rgba(255,0,0,0.5)",marker:"circle",selected:true,
    include_id:true,include_url:true,include_color:true,include_marker:true}];
  plotOptions.categories=[""];
  plotOptions.parameters=[];
  
  plotData[0].data=new Array();
   
  for(i=0;i<ocd.length;i++)
  {
   if(ocd[i])
   {
    if(ocd[i].data && ocd[i].selectNo)
    {
     if(ocd[i].data.longitude || ocd[i].data.latitude)
     {
      if(!ocd[i].data.id){ocd[i].data.id='ocd'+i;};
      j=0;
      for(cat in ocd[i].data)
      {
       if(cat=='id'){continue;};
       if(typeof(ocd[i].data[cat])!="string")
       {
        if(typeof(ocd[i].data[cat])=="number")
        {
         if(typeof(parameterIndex[cat])=='undefined')
         {
          parameterIndex[cat]=true;
          plotOptions.parameters.push(cat);
         };
        };
        continue;
       };
       if(typeof(categoryIndex[cat])=='undefined')
       {
        categoryIndex[cat]=true;
        plotOptions.categories.push(cat);
       };
       if(cat==plotOptions.category)
       {
        if((typeof(categoryData[ocd[i].data[cat]])=='undefined')&&(ocd[i].data[cat]))
        {
         j=plotData.length;
         categoryData[ocd[i].data[cat]]=j;
         plotData.push(JSON.parse(JSON.stringify(plotData[0])));
         plotData[j].data=new Array();
         plotData[j].name=ocd[i].data[cat];         
        }
        else
        {
         j=categoryData[ocd[i].data[cat]];
        };
       };
      };
      if(plotOptions.showPosterior)
      {
       if(ocd[i].posterior && typeof(ocd[i].posterior.mean)!='undefined')
       {
        ocd[i].data.mean=ocd[i].posterior.mean;
        ocd[i].data.median=ocd[i].posterior.median;
        ocd[i].data.sigma=ocd[i].posterior.sigma;
       }
       else
       {
        ocd[i].data.mean=null;ocd[i].data.median=null;ocd[i].data.sigma=null;
       };
      }
      else
      {
       if(plotOptions.showLikelihood)
       {
        if(ocd[i].likelihood && typeof(ocd[i].likelihood.mean)!='undefined')
        {
         ocd[i].data.mean=ocd[i].likelihood.mean;
         ocd[i].data.median=ocd[i].likelihood.median;
         ocd[i].data.sigma=ocd[i].likelihood.sigma;
        }
        else
        {
         ocd[i].data.mean=null;ocd[i].data.median=null;ocd[i].data.sigma=null;
        };
       };
      };
      if(plotOptions.category && !ocd[i].data[plotOptions.category])
      {
       continue;
      }
      else
      {
       plotData[j].data.push(ocd[i].data);
      };
      if(isNaN(plotOptions.player_min)||(this.ocdMin(i)<plotOptions.player_min))
      {
       plotOptions.player_min=this.ocdMin(i);
      };
      if(isNaN(plotOptions.player_max)||(this.ocdMax(i)>plotOptions.player_max))
      {
       plotOptions.player_max=this.ocdMax(i);
      };
      if(ocd[i].op=='Sum')
      {
       if(isNaN(sumMax)||(this.ocdValMax(i)>sumMax))
       {
        sumMax=this.ocdValMax(i);
       };
      }
      else
      {
       if(isNaN(plotOptions.probMax)||(this.ocdValMax(i)>plotOptions.probMax))
       {
        plotOptions.probMax=this.ocdValMax(i);
       };
      };
     };
    };
   };
  };
  for(j=0;j<plotData.length;j++)
  {
   if(plotData[j].data.length==0){plotData.splice(j,1);j--;continue;};
   if(plotOptions.mapColorBy)
   {
    plotData[j].markerFill=this.pl.hsvaToRgba(360*j/plotData.length,100,0,0.2);
    plotData[j].markerColor=this.pl.hsvaToRgba(360*j/plotData.length,100,0,1);
    if(plotData.length<=symb.length)
    {
     plotData[j].marker=symb[j];
    }
    else
    {
     if(plotData.length<=26)
     {
      plotData[j].marker=String.fromCharCode((j)+("A").charCodeAt(0));
     }
     else
     {
      plotData[j].marker=(j+1).toFixed(0);
     };
    };
   }
   else
   {
    plotData[j].markerFill=this.pl.hsvaToRgba(360*j/plotData.length,100,100,0.2);
    plotData[j].markerColor=this.pl.hsvaToRgba(360*j/plotData.length,100,100,1);
   };
  };
  if(isNaN(plotOptions.probMax))
  {
   if(!isNaN(sumMax))
   {
    plotOptions.probMax=SumMax/100;
   };
  }
  else
  {
   if(!isNaN(sumMax))
   {
    if(sumMax>100*plotOptions.probMax){plotOptions.probMax=sumMax/100;};
   };
  };
  if(((plotOptions.player_max-plotOptions.player_min)>0)&&findIncr)
  {
   plotOptions.mapPlotMultiIncr=Math.round((plotOptions.player_max-plotOptions.player_min)/12.5);
  };
  sumMax=0;
  for(plotOptions.current=0;plotOptions.current<plotOptions.currentMax;plotOptions.current++)
  {
   sm=0;
   for(i=0;i<plotData[0].data.length;i++)
   {
    sm+=playerWeight(plotData[0].data[i].id);
   };
   if(sm>sumMax){sumMax=sm;};
  };
  plotOptions.contourProbMax=sumMax;
  plotOptions.current=0;
};
 

oxcalUtils.prototype.plotOnMap=function()
{
   var k,plt;
   playerDisable=false;
   var canvas=this.pl.canvas,plotInfo=this.pl.plotInfo,plotOptions=this.pl.plotOptions,
    multiPlots=this.pl.multiPlots,plotData=this.pl.plotData;
   canvas.scale=1.0; // zoom scaling
   canvas.scaleFont=0.8; // font scaling
   canvas.scaleLine=1.3; // line scaling
   canvas.pxPerCm=35; // px per cm
   canvas.frameWidth=18.0; // cm
   canvas.frameHeight=13.5; // cm
   
   plotInfo.minx=0;
   plotInfo.maxx=100;
   plotInfo.autox=true;
   plotInfo.miny=0;
   plotInfo.maxy=100;
   plotInfo.autoy=true;
   plotInfo.x_calc="longitude";
   plotInfo.y_calc="latitude";
   plotInfo.dx_calc="";
   plotInfo.dy_calc="";
   plotInfo.xlabel="";
   plotInfo.ylabel="";
   plotInfo.weight="playerWeight(id)";
   plotInfo.title="";
   plotInfo.category="";
   plotInfo.table="";
   plotInfo.keyTitle="Key";
   plotInfo.pcaVariables="longitude,latitude";
   plotInfo.nonlinx="";
   plotInfo.nonliny="mercator";
   plotInfo.mapPlot=true;
      
   plotOptions.background="rgb(255,255,255)";
   plotOptions.plotBackground="rgba(255,255,255,0)";
   plotOptions.multiPlot=false; // gives number of columns if multi
   plotOptions.plotPosX=3.0; // cm
   plotOptions.plotPosY=1.5;  // cm
   plotOptions.plotWidth=13.5; // cm
   plotOptions.plotHeight=13.5; // cm
   plotOptions.showKey=false;
   if(this.plotOptions.category){plotOptions.showKey=1;};
   plotOptions.BandW=false;
   plotOptions.contours="95%";
   plotOptions.contourFactor=1;
      
  playerMin=this.showDate(this.showDateT(this.plotOptions.player_min,"date"),"date");
  playerMax=this.showDate(this.showDateT(this.plotOptions.player_max,"date"),"date");
   
   if(this.plotOptions.player_proxy)
   {
    findProxyLevels(plotColor,plotData);
   };
   multiPlots.tiedXAxes=3;
   multiPlots.tiedYAxes=3;
   multiPlots.plots=[];
   for(k=0;(k<1+Math.round((this.plotOptions.player_max-this.plotOptions.player_min)
  	/this.plotOptions.mapPlotMultiIncr))&&(k<100);k++)
   {
    plt=duplItem(plotInfo);
    plt.selected=true;
    plt.row=Math.floor(k / multiPlots.columns);
    plt.column=k % multiPlots.columns;
    plt.weight="playerWeight(id,"+k+")";
    multiPlots.plots.push(plt);
   };
   plotOptions.current=0;
   this.pl.render();
   ocMapWindow=this.pl.frame.contentWindow;
};

oxcalUtils.prototype.plotOnPlot=function(dta,items,this_name,this_id,ts_id)
{
   var k,plt,col,crv,nm;
   this.pl=new plotLink(document.getElementById('plotArea'));
   var canvas=this.pl.canvas,plotInfo=this.pl.plotInfo,plotOptions=this.pl.plotOptions,
   multiPlots=this.pl.multiPlots,plotData=this.pl.plotData;
   playerDisable=true;
   canvas.scale=1.0; // zoom scaling
   canvas.scaleFont=0.8; // font scaling
   canvas.scaleLine=1.3; // line scaling
   canvas.pxPerCm=35; // px per cm
   canvas.frameWidth=18.0; // cm
   canvas.frameHeight=13.5; // cm
   
   plotInfo.minx=0;
   plotInfo.maxx=100;
   plotInfo.miny=0;
   plotInfo.maxy=100;
 
   plotColor.z_calc="";
   plotColor.dz_calc="";
   plotColor.showKey=false;


   nm=ts_id.slice(0,1).toUpperCase()+ts_id.slice(1);
   switch(this.plotOptions.reportingStyle)
   {
   case 0:
    plotInfo.x_calc="calBP("+ts_id+"_t)";
    plotInfo.xlabel=nm+" Age (cal BP)";
    plotInfo.autox=2;
    break;
   case 1:
    plotInfo.x_calc=(this.plotOptions.BCAxis?"BC(":"AD(")+ts_id+"_t)";
    plotInfo.xlabel=nm+(this.plotOptions.BCAxis?" Date (BC)":" Date (AD)");
    plotInfo.autox=1;
    break;
   case 2:
    plotInfo.x_calc=(this.plotOptions.BCAxis?"BCE(":"CE(")+ts_id+"_t)";
    plotInfo.xlabel=nm+(this.plotOptions.BCAxis?" Date (BCE)":" Date (CE)");
    plotInfo.autox=1;
    break;
   default:
    plotInfo.x_calc=ts_id+"_t";
    plotInfo.xlabel=nm+" Date (+/- CE)";
    plotInfo.autox=1;
    break;
   };
   plotInfo.y_calc="z";
   plotInfo.dx_calc=ts_id+"_dt";
   plotInfo.dy_calc="";
   if(this_id.slice(0,3)!="ocd")
   {
    plotInfo.ylabel=this_id.slice(0,1).toUpperCase()+this_id.slice(1)+" Depth";
   }
   else
   {
    plotInfo.ylabel="Depth";
   };
   plotInfo.autoy=2;
   plotInfo.title="";
   plotInfo.category="";
   plotInfo.table="";
   plotInfo.keyTitle="Key";
   plotInfo.pcaVariables="";
   plotInfo.nonlinx="";
   plotInfo.nonliny="";
   plotInfo.mapPlot=false;
      
   plotOptions.background="rgb(255,255,255)";
   plotOptions.plotBackground=false;
   plotOptions.multiPlot=(items.length>0); // gives number of columns if multi
   plotOptions.plotPosX=3.0; // cm
   plotOptions.plotPosY=1.5;  // cm
   plotOptions.plotWidth=13.5; // cm
   if(plotOptions.plotWidth<2){plotOptions.plotWidth=2;};
   plotOptions.plotHeight=13.5; // cm
   if(items.length>0)
   {
    plotOptions.plotHeight=3; // cm
   };
   plotOptions.showKey=1;
   plotOptions.BandW=false;
   plotOptions.contours="95%";
   plotOptions.current=0;
   
   multiPlots.columns=1;
   multiPlots.showKey=false;
   multiPlots.plots=[];
   multiPlots.tiedXAxes=3;
   multiPlots.tiedYAxes=0;
   for(k=0;k<items.length;k++)
   {
    plt=duplItem(plotInfo);
    plt.selected=true;
    plt.x_calc=plotInfo.x_calc;
    plt.y_calc=items[k];
    plt.dx_calc=plotInfo.dx_calc;
    plt.dy_calc="";
    plt.autox=plotInfo.autox;
    plt.autoy=1;
    plt.xlabel=plotInfo.xlabel;
    plt.ylabel=items[k].replace("_"," ");
    plt.row=k;
    plt.column=0;
    multiPlots.plots.push(plt);
   };
   plotData=this.pl.plotData=[{name:this_name,line:"solid",lineColor:"rgba(255,0,0,1.0)",markerColor:"",
   markerFill:"rgba(255,0,0,0.2)",marker:"",selected:true,id:this_id}];
  
   plotData[0].data=app.clone(dta);
   this.pl.render();
   app.showTool("Plot");
};

