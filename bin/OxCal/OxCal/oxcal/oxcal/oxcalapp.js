var oxcal,oxcalEnv;

function oxcalApp()
{
 this.action="";
};

oxcalApp.prototype.initialise=function()
{
 var simple=false;
 oxcal.initialise();
 login.icon="OxCalSkyline.png";
 this.timeUnitLabelId=app.appendToMenu("Project","MainMenu","--",this.timeUnitsPanel.bind(this),false);
 if(onAServer())
 {
  login.createLoginMenu();
 }
 else
 {
  app.appendToMenu("ProjectFile","Spacer","",false,false);
  app.appendToMenu("ProjectFile","MenuSub","Server...",function(){window.location.assign("../");},false);
 };
 this.setTimeUnits();
 app.getArgs();
 if(app.getArgs().key && app.getArgs().share)
 {
  login.login().then(function(){
   login.share("createShare",app.getArgs().share,app.getArgs().key).then(function(rpl){
     app.setCookie("OxCalWorkingPath","Shared:/"+app.getArgs().share+"/");
     app.fileManager();
   }.bind(this)).catch(function(error){app.alert(error);});
  }.bind(this)).catch(function(error){app.alert(error);});
  return;
 };
 if(app.args["source"])
 {
  if(app.args["view"] && (app.args["view"]=="status"))
  {
   app.args["source"]=app.args["source"].replace('.js','.work');
  };
  oxcal.projectFile("Open",app.args["source"]);
 }
 else
 {
  if(app.args["Command"])
  {
   oxcal.command=app.args["Command"];
   if(oxcal.command.indexOf("Plot")==-1)
   {
    oxcal.command="Plot(){"+oxcal.command+"};";
    simple=true;
   };
   if(!oxcal.requires_batch(oxcal.command))
   {
    oxcal.filename="quick.oxcal";
   };
   if(!simple)
   {
    oxcal.view();
   };
   if(!app.args["Mode"]||(app.args["Mode"]!="Input"))
   {
    oxcal.run();   
   };
  }
  else
  {
   if(window.opener)
   {
    try
    {
     if(window.opener.oxcalEnv)
     {
      switch(window.opener.oxcalEnv.action)
      {
      case "New":
       oxcal.view();
       break;
      case "Open":
       oxcal.projectFile("Open");
       break;
      case "Quick":
       oxcal.quickCal();
       break;
      };
     };
    }
    catch(e)
    {
     this.flashPage();
    };
   }
   else
   {
    this.flashPage();
   };
  };
 };
 if(app.args["Mode"])
 {
  switch(app.args["Mode"])
  {
  case "Input":
   oxcal.view();
   break;
  case "Output":
   app.showTool("OxCalOutput");
   break;
  };
 };
};

oxcalApp.prototype.flashPage=function()
{
 var p,e,i,d;
 p=document.createElement('div');
 p.className='appVeil';
 p.style="opacity:1;transition: opacity 0.5s ease-in-out";
 e=document.createElement('div');
 e.className="appProgressTitle";
 e.style="top:25%";
 i=document.createElement('img');
 i.src='OxCalRing.png';
 i.alt="OxCal logo";
 e.appendChild(i);
 e.appendChild(document.createElement('br'));
 d=document.createElement('div');
 d.style.height="20px";
 e.appendChild(d);
 e.appendChild(document.createTextNode(header.title+" Interface : "+"version: "+header.version));
 e.appendChild(document.createElement('br'));
 e.appendChild(document.createTextNode("C Bronk Ramsey : "+app.writeDate(header.issued)));
 p.appendChild(e);
 p=document.body.appendChild(p);
 window.setTimeout(function(){p.style.opacity=0;},2500);
 window.setTimeout(function(){
  document.body.removeChild(p);
  login.login().then(async function(){
   var ver,oldver;
   ver=header.title+" ["+header.version+"]";
   oldver=app.getCookie("OxCalVersion");
   if(oldver!=ver)
   {
    if(oldver){oldver="\n\nPrevious version was:\n"+oldver;}else{oldver="";};
    if(onAServer())
    {
     await app.alert("New version of OxCal:\n"+ver+"\n\nPlease clear your browser's cache or\nreload any pages if you encounter problems"+oldver);
    };
   };
   app.setCookie("OxCalVersion",ver);
   app.menu(header.title+" User Interface|New project|Open project\nCalibrate|View curve").then(function(rpl){
    switch(rpl)
    {
    case 1:
     oxcalEnv.projectFile("New");
     break;
    case 2:
     oxcal.projectFile("Open");
     break;
    case 3:
     oxcal.quickCal();
     break;
    case 4:
     oxcal.quickCal("Curve");
     break;
    };
   }).catch(function(){});
  }).catch(function(e){if(e!="overwritten"){app.alert(e);};});
 },3000);
};


oxcalApp.prototype.help=function(sub)
{
 if(sub)
 {
  app.clearTool("Help","../oxcalhelp/hlp_"+sub+".html");
 };
 app.showTool("Help");
};

oxcalApp.prototype.login=function(action)
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

oxcalApp.prototype.setFilename=function()
{
 switch(app.fileMode)
 {
 case "OxCal":
  if(app.filename.indexOf(".oxcal")!=-1)
  {
   oxcal.filename=app.filename;
   app.showFilename(app.filename);
  }
  else
  {
   oxcal.filename="";
   window.setTimeout(function(){oxcal.projectFile("Open",app.filename);},100);
  };
  break;
 };
};

oxcalApp.prototype.getFilename=function()
{
 if((oxcal.filename.indexOf('.oxcal')==-1)||(oxcal.filename.indexOf('ttp:\/')!=-1))
 {
  app.filename="";
  return;
 };
 switch(app.fileMode)
 {
 case "OxCal":
  app.filename=oxcal.filename;
  break;
 case "OxCalTable":
  app.filename=oxcal.filename.replace(".oxcal",".csv");
  break;
 case "OxCalPlot":
  app.filename=oxcal.filename.replace(".oxcal",".svg");
  break;
 case "OxCalPrint":
  app.filename=oxcal.filename.replace(".oxcal",".tex");
  break;
 case "OxCalReport":
  app.filename=oxcal.reportFilename;
  break;
 };
};

oxcalApp.prototype.setFileContent=function()
{
 switch(app.fileMode)
 {
 case "OxCal":
  if(oxcal.filename)
  {
   oxcal.command=app.filecontent;
   oxcal.view();
  };
  break;
 };
};

oxcalApp.prototype.getFileContent=function()
{
 switch(app.fileMode)
 {
 case "OxCal":
  app.filecontent=oxcal.command;
  break;
 case "OxCalTable":
  app.filecontent=oxcal.tableContent;
  break;
 case "OxCalPlot":
  app.filecontent=oxcal.getSVGContent();
  break;
 case "OxCalPrint":
  app.filecontent=oxcal.printContent;
  break;
 case "OxCalReport":
  app.filecontent=oxcal.reportContent;
  break;
 };
};

oxcalApp.prototype.projectFile=function(mode)
{
 if(oxcal.changed||(oxcal.filename && (oxcal.filename!="quick.oxcal")))
 {
  this.action=mode;
  window.open(window.location.href.split(/[?#]/)[0],"_blank");
  return;
 };
 switch(mode)
 {
 case "New":
  oxcal.filename="";
  oxcal.command=oxcal.optionBlock()+"Plot(){}";
  app.hideAllTools();
  oxcal.view();
  break;
 case "Open":
  app.hideAllTools();
  oxcal.command="";
  oxcal.projectFile("Open");
  break;
 case "Quick":
  oxcal.quickCal();
  break;
 };
};

oxcalApp.prototype.addToMenu=function(mode,style,text,action,hidden)
{
 var li,a,l=document.getElementById(mode+"Menu");
 li=document.createElement('LI');
 a=document.createElement('A');
 a.href="#";
 if(action)
 {
  switch(typeof(action))
  {
  case "string":
   a.onmousedown=function(){try{app.safeEval(action);}catch(e){};};
   break;
  case "function":
   a.onmousedown=action;
   break;
  };
 };
 a.id=mode+"Menu__"+l.children.length;
 if(style)
 {
  a.className="app"+style;
  a.ariaLabel=style;
 };
 a.style.display=hidden?'none':'block';
 if(text)
 {
  a.appendChild(document.createTextNode(text));
 };
 li.appendChild(a);
 l.appendChild(li);
 return a.id;
};

oxcalApp.prototype.showTimeUnits=function(t_units)
{
 el=document.getElementById(this.timeUnitLabelId);
 el.removeChild(el.firstChild);
 el.appendChild(document.createTextNode(t_units));
};

oxcalApp.prototype.setTimeUnits=function(t_units)
{
 if(!t_units)
 {
  t_units=oxcal.t_units();
 };
 oxcal.setTimeUnits(t_units);
};


oxcalApp.prototype.timeUnitsPanel=function()
{
 app.menu("Time units|±CE|calBP\nAD|BC\nCE|BCE",{"id":"TimeUnits","resolve":function(rpl){
  switch(rpl)
  {
  case 1:this.setTimeUnits("G");break;
  case 2:this.setTimeUnits("calBP");break;
  case 3:this.setTimeUnits("AD");break;
  case 4:this.setTimeUnits("BC");break;
  case 5:this.setTimeUnits("CE");break;
  case 6:this.setTimeUnits("BCE");break;
  };
 }.bind(this),"reject":function(e){},"multiple":true});
};

(function () {
 oxcal=new oxcalUtils();
 oxcalEnv=new oxcalApp();
})();
