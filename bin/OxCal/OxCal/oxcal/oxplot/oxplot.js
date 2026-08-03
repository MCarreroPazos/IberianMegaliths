var canvas,plotInfo,plotOptions,plotData,editOptions,multiPlots,memInfo,tables,fileOptions,filename="",dataContent="";
var plotCalc,plotMultiCalc,plotColor,memCalc;
var dataIndex={};
var editSpec,adjustSpec,formatSpec,canvasSpec,multiSpec,dataSpec,fileSpec,colorSpec,playerSpec;
var autofill=false;
var plotPg="";
var dataCount=0;
var eventHandler=false;
var multiPos=0,xorg,yorg,worg,horg,yoffs;
var ticker=false;
var playerSlider=false;
var fileinclude=false;
var markers=new Array("","circle","square","diamond","triangle","cross","x","label","histogram","rectangle","image");
var colors=new Array("rgb(255,0,0)","rgb(0,255,0)","rgb(0,0,255)","rgb(204,204,0)", "rgb(204,0,204)","rgb(0,204,204)","rgb(127,127,127)");
var SQRT2PI=Math.sqrt(2*Math.PI);
   canvas=new Object;
   canvas.scale=1.0; // zoom scaling
   canvas.scaleFont=0.8; // font scaling
   canvas.scaleLine=1.3; // line scaling
   canvas.pxPerCm=35; // px per cm
   canvas.frameWidth=18.0; // cm
   canvas.frameHeight=13.5; // cm
   
   fileOptions=new Object;
   fileOptions.canvas=true; // covers canvas
   fileOptions.view=true; //covers plotInfo and multiPlots
   fileOptions.format=true; // covers plotOptions
   fileOptions.data=true;
   
   plotInfo=new Object;
   plotInfo.minx=-1;
   plotInfo.maxx=1;
   plotInfo.autox=0;
   plotInfo.miny=-1;
   plotInfo.nonliny="";
   plotInfo.mapPlot=false;
   plotInfo.maxy=1;
   plotInfo.autoy=0;
   plotInfo.x_calc="x";
   plotInfo.y_calc="y";
   plotInfo.dx_calc="";
   plotInfo.dy_calc="";
   plotInfo.xlabel="X";
   plotInfo.ylabel="Y";
   plotInfo.title="";
   plotInfo.category="";
   plotInfo.table="";
   plotInfo.keyTitle="Key";
   plotInfo.pcaVariables="";
   
   plotColor=new Object;
   plotColor.showKey=false;
   plotColor.z_calc="";
   plotColor.dz_calc="";
   plotColor.zlabel="";
   plotColor.minz=0;
   plotColor.maxz=100;
   plotColor.autoz=0;
   plotColor.min_col="rgb(0,0,255)";
   plotColor.max_col="rgb(255,0,0)";

   plotPlayer=new Object;
   plotPlayer.showPlayer=false;
   plotPlayer.t_calc="t";  // allows for other timescales
   plotPlayer.t_units="calBP";
   plotPlayer.mint=null;
   plotPlayer.maxt=null;
   plotPlayer.autot=1;
   plotPlayer.color=false;
   plotPlayer.normalise=true;
   plotPlayer.circleZoom=1.0;
           
      
   
   plotData=new Array;
   
   plotOptions=new Object;
   plotOptions.background="rgb(255,255,255)";
   plotOptions.plotBackground="rgba(255,255,255,0)";
   plotOptions.mapForeground="#cccccc";
   plotOptions.multiPlot=false; 
   plotOptions.plotPosX=3.0; // cm
   plotOptions.plotPosY=1.5;  // cm
   plotOptions.plotWidth=11.5; // cm
   plotOptions.plotHeight=11.5; // cm
   plotOptions.mapPlot="Open TopoMap";
   plotOptions.showKey=1;
   plotOptions.showGrid=false;
   plotOptions.BandW=false;
   plotOptions.contours="95%";
   
//temporary player variables
   plotOptions.current=0;
   plotOptions.backwards=false;
   plotOptions.currentMax=100;
   plotOptions.probMax="NaN";
   plotOptions.mapPlotMultiIncr=1;
   plotOptions.suppressCircles=false;
   plotOptions.contourProbMax=false;

   //mapPlotMultiIncr should come from multiplot number
   //currentMax - max value (depending on multiplot or not) - integer
   //current- actual value on slider (integer)
   //backwards - going backwards
   
   editOptions=new Object;
   editOptions.window=window.opener;
   try
   {
    if(editOptions.window && editOptions.window.app && (editOptions.window.app.header.id=="OxPlot"))
    {
     editOptions.window=false;
    };
    if(window.parent && (window.parent!=window))
    {
     editOptions.window=window.parent;
     if(window.parent.opener && (window.parent.opener!=window.parent) && (!window.parent.app))
     {
      editOptions.window=window.parent.opener;
     };
    };
   }
   catch(e)
   {
    editOptions.window=false;
   };
   editOptions.table=0;
   editOptions.division="";
   editOptions.text="";
   
   multiPlots=new Object;
   multiPlots.plots=[];
   memInfo=new Object;
   
   plotCalc=new Array;
var plotCalcMulti=new Array; 
var plotFrame=false;
var plotIFrame=false;
var playerFooter=false;
   
   
 var s,ss;
tables=new Array;
var divisions=new Array;
var divisionsDisplay=new Array;
editSpec=new itemSpec("data","Import","Object");
editSpec.noheader=true;
s=editSpec.appendChild("title","Title","Text");
s=editSpec.appendChild("text","Text","TextArea");
s.changer="changeEditOptions()";
s=editSpec.appendChild("table","Table","Number");
s.options=tables;
s.changer="changeEditOptions()";
s=editSpec.appendChild("division","Split using","Text");
s.options=divisions;
s.optionsDisplay=divisionsDisplay;

fileSpec=new itemSpec("file","Include","Object");
s=fileSpec.appendChild("data","Data","Boolean");
s=fileSpec.appendChild("canvas","File options","Boolean");
s=fileSpec.appendChild("view","View details","Boolean");
s=fileSpec.appendChild("format","Format","Boolean");

adjustSpec=new itemSpec("data","View","Object");
s=adjustSpec.appendChild("title","Title","Text");
s=adjustSpec.appendChild("xlabel","X axis label","Text");
s=adjustSpec.appendChild("x_calc","X value","Text");
s=adjustSpec.appendChild("dx_calc","X error","Text");
s=adjustSpec.appendChild("minx","Min X","Number");
s=adjustSpec.appendChild("maxx","Max X","Number");
s=adjustSpec.appendChild("autox","Auto X","Number");
s.options=["off","ascending","descending"];
s=adjustSpec.appendChild("nonlinx","Non linear X","Text");
s.options=["","log"];
s=adjustSpec.appendChild("ylabel","Y axis label","Text");
s=adjustSpec.appendChild("y_calc","Y value","Text");
s=adjustSpec.appendChild("dy_calc","Y error","Text");
s=adjustSpec.appendChild("miny","Min Y","Number");
s=adjustSpec.appendChild("maxy","Max Y","Number");
s=adjustSpec.appendChild("autoy","Auto Y","Number");
s.options=["off","ascending","descending"];
s=adjustSpec.appendChild("nonliny","Non linear Y","Text");
s.options=["","log","mercator"];
s=adjustSpec.appendChild("mapPlot","Map underlay","Boolean");
s=adjustSpec.appendChild("weight","Weight","Text");
s=adjustSpec.appendChild("keyTitle","Key title","Text");

colorSpec=new itemSpec("data","Color scale","Object");
s=colorSpec.appendChild("showKey","Show scale","Boolean");
s=colorSpec.appendChild("zlabel","Label","Text");
s=colorSpec.appendChild("z_calc","Z value","Text");
s=colorSpec.appendChild("dz_calc","Z error","Text");
s=colorSpec.appendChild("minz","Min Z","Number");
s=colorSpec.appendChild("maxz","Max Z","Number");
s=colorSpec.appendChild("autoz","Auto Z","Number");
s.options=["off","ascending","descending"];
s=colorSpec.appendChild("min_col","Min color","Color");
s=colorSpec.appendChild("max_col","Max color","Color");

playerSpec=new itemSpec("data","Player options","Object");
s=playerSpec.appendChild("showPlayer","Show player","Boolean");
s=playerSpec.appendChild("t_calc","T value","Text");
s=playerSpec.appendChild("t_units","Units","Text");
s.changer=function(spec)
{
 spec.parent.emptyContainer();
 plotPlayer.t_units=spec.object;
 spec.parent.fillContainer();
};
s.options=["±CE","calBP","b2k","AD","BC","CE","BCE"];
s=playerSpec.appendChild("mint","Min T","Number");
s.special=playerValueShow;
s.editor={"read":playerValueRead,"write":playerValueWrite};
s=playerSpec.appendChild("maxt","Max T","Number");
s.special=playerValueShow;
s.editor={"read":playerValueRead,"write":playerValueWrite};
s=playerSpec.appendChild("autot","Auto T","Number");
s.options=["off","forward","backward"];
s=playerSpec.appendChild("color","Mode","Number");
s.options=["Probability","Color scale"];
s=playerSpec.appendChild("normalise","Normalise","Boolean");
s=playerSpec.appendChild("circleZoom","Circle zoom","Number");


formatSpec=new itemSpec("data","Format","Object");
s=formatSpec.appendChild("multiPlot","Multi plot","Boolean");
s=formatSpec.appendChild("background","Background","Color");
s=formatSpec.appendChild("plotBackground","Plot background","Color");
s=formatSpec.appendChild("mapPlot","Map underlay","Text");
s.options=["svg","ESRI Imagery","ESRI Physical_Map","ESRI Topo_Map"];
ss=getCookie('googleMapAPI');
if(ss&&(ss!='undefined')){
s.options=s.options.concat(["Google hybrid","Google roadmap","Google satellite","Google terrain"]);
};
s.options=s.options.concat(["Open TopoMap","USGS Topo","USGS ImageryOnly","USGS ImageryTopo","USGS HydroCached","USGS ShadedReliefOnly"]);
s=formatSpec.appendChild("mapForeground","SVG map foreground","Color");
s=formatSpec.appendChild("plotPosX","Left margin (cm)","Number");
s=formatSpec.appendChild("plotPosY","Bottom margin (cm)","Number");
s=formatSpec.appendChild("plotWidth","Width (cm)","Number");
s=formatSpec.appendChild("plotHeight","Height (cm)","Number");
s=formatSpec.appendChild("showKey","Show key","Number");
s.options=new Array("No key","Key with plot","Key only");
s=formatSpec.appendChild("showGrid","Show grid","Boolean");
s=formatSpec.appendChild("contours","Contours","Text");
s.options=new Array("95%","5","10","20");
s=formatSpec.appendChild("BandW","BandW","Boolean");
s=formatSpec.appendChild("ok","OK","Button");
s.action="setValues(this.parent)";
s.readonly=true;

canvasSpec=new itemSpec("data","View","Object");
s=canvasSpec.appendChild("scale","Scale","Number");
s=canvasSpec.appendChild("scaleFont","Font scale","Number");
s=canvasSpec.appendChild("scaleLine","Line spacing","Number");
s=canvasSpec.appendChild("frameWidth","Canvas Width (cm)","Number");
s.readonly=true;
s=canvasSpec.appendChild("frameHeight","Canvas Height (cm)","Number");
s.readonly=true;
s=canvasSpec.appendChild("pxPerCm","Pixels/cm","Number");
s=canvasSpec.appendChild("ok","OK","Button");
s.action="document.getElementById('canvasOptions').style.display='none';setValues(this.parent)";
s.readonly=true;

dataSpec=new itemSpec("data","Data","Array");
dataSpec.database=true;
s=dataSpec.appendChild("name","Name","Text");
s=dataSpec.appendChild("line","Line","Text");
s.options=new Array("","solid","dashed","dotted");
s=dataSpec.appendChild("lineColor","Line color","Color");
s.popup=true;
s=dataSpec.appendChild("marker","Marker","Text");
s.options=markers;
s=dataSpec.appendChild("markerColor","Marker color","Color");
s.popup=true;
s=dataSpec.appendChild("markerFill","Marker fill","Color");
s.popup=true;
s=dataSpec.appendChild("contour","Contour","Text");
s.options=new Array("","Ellipse","KDE");
s=dataSpec.appendChild("singleOnly","Single plots only","Boolean");
s.popup=true;
s=dataSpec.appendChild("dataEdit","Data","Button");
s.readonly=true;
s.action="startEditData(this)";
s=dataSpec.appendChild("id","ID","Text");
s.popup=true;
s=dataSpec.appendChild("include_label","Include labels","Boolean");
s.popup=true;
s=dataSpec.appendChild("include_id","Include IDs","Boolean");
s.popup=true;
s=dataSpec.appendChild("include_url","Include URLs","Boolean");
s.popup=true;

multiSpec=new itemSpec("data","Multiplots","Object");
s=multiSpec.appendChild("plots","Plots","Array");
s.database=true;
ss=s.appendChild("plot","Plot","Button");
ss.readonly=true;
ss.action="choosePlot(this)";
ss=s.appendChild("title","Title","Text");
ss=s.appendChild("xlabel","X axis label","Text");
ss=s.appendChild("x_calc","X value","Text");
ss.popup=true;
ss=s.appendChild("dx_calc","X error","Text");
ss.popup=true;
ss=s.appendChild("minx","Min X","Number");
ss.popup=true;
ss=s.appendChild("maxx","Max X","Number");
ss.popup=true;
ss=s.appendChild("autox","Auto X","Number");
ss.options=["off","ascending","descending"];
ss.popup=true;
ss=s.appendChild("nonlinx","Non linear X","Text");
ss.options=["","log"];
ss.popup=true;
ss=s.appendChild("ylabel","Y axis label","Text");
ss=s.appendChild("y_calc","Y value","Text");
ss.popup=true;
ss=s.appendChild("dy_calc","Y error","Text");
ss.popup=true;
ss=s.appendChild("miny","Min Y","Number");
ss.popup=true;
ss=s.appendChild("maxy","Max Y","Number");
ss.popup=true;
ss=s.appendChild("autoy","Auto Y","Number");
ss.options=["off","ascending","descending"];
ss.popup=true;
ss=s.appendChild("nonliny","Non linear Y","Text");
ss.options=["","log","mercator"];
ss.popup=true;
ss=s.appendChild("yright","yright","Boolean");
ss.popup=true;
ss=s.appendChild("hideRectangle","No border","Boolean");
ss.popup=true;
ss=s.appendChild("mapPlot","Map underlay","Boolean");
ss.popup=true;
ss=s.appendChild("weight","Weight","Text");
ss.popup=true;
ss=s.appendChild("row","Row","Number");
ss=s.appendChild("column","Column","Number");
s=multiSpec.appendChild("columns","Columns","Number");
s.options=new Array("Single plot","1 column","2 column","3 column","4 column","5 column","6 column","7 column","8 column");
s=multiSpec.appendChild("tiedXAxes","Tied x-axes","Number");
s.options=new Array("Not tied","Tied","Without label","Without numbers","Without axis");
s=multiSpec.appendChild("tiedYAxes","Tied y-axes","Number");
s.options=new Array("Not tied","Tied","Without label","Without numbers","Without axis");
s=multiSpec.appendChild("interXPlot","Horizontal spacing (cm)","Number");
s=multiSpec.appendChild("interYPlot","Vertical spacing (cm)","Number");
s=multiSpec.appendChild("showKey","Show key","Boolean");
s=multiSpec.appendChild("keyRow","Key row","Number");
s=multiSpec.appendChild("keyColumn","Key column","Number");
s=multiSpec.appendChild("arrange","Auto arrange","Button");
s.action="arrangePlots()";
s.readonly=true;

 function parseColor(col)
 {
  var rtn=new Array,i;
  if(col.indexOf("#")==0)
  {
   rtn[0]=Math.round(parseInt(col.substring(1,3),16));
   rtn[1]=Math.round(parseInt(col.substring(3,5),16));
   rtn[2]=Math.round(parseInt(col.substring(5,7),16));
   return rtn;
  }
  else
  {
   rtn=col.replace("a(","(").replace("rgb(","").replace(")","").split(",");
   for(i=0;i<rtn.length;i++)
   {
    if(i>2)
    {
     rtn[i]=parseFloat(rtn[i]);
    }
    else
    {
     rtn[i]=parseInt(rtn[i]);
    };
   };
  };
  return rtn;
 };
 function saveDefaults()
 {
  var obj={"canvas":canvas,"plotOptions":plotOptions};
  app.setCookie("oxPlot",obj);
  app.setCookie("oxCanvas",{"scale":canvas.scale,
   "scaleFont":canvas.scaleFont,"scaleLine":canvas.scaleLine,
   "pxPerCm":canvas.pxPerCm });
 };
 function restoreDefaults()
 {
  var obj,i;
  obj=app.getCookie("oxPlot");
  if(obj)
  {
   try
   {
    plotOptions=obj.plotOptions;
    canvas=obj.canvas;
   }catch(e){app.alert(e);};
  };
  if(obj=app.getCookie("oxCanvas"))
  {
   try
   {
    for(i in obj)
    {
     canvas[i]=obj[i];
    };
   }
   catch(e){};
  };
  plotOptions.plotPosX=3.0; // cm
  plotOptions.plotPosY=1.5;  // cm
  plotOptions.plotWidth=11.5; // cm
  plotOptions.plotHeight=11.5; // cm
  plotOptions.current=0;
  plotOptions.backwards=false;
  plotOptions.currentMax=100;
  plotOptions.probMax="NaN";
  plotOptions.mapPlotMultiIncr=1;
  plotOptions.contourProbMax=false;
 };
 function resetDefaults()
 {
  setCookie("oxPlot","");
  window.location.reload();
 };
 function opSetFilename()
 {
  switch(app.fileMode)
  {
  case "OxPlot":
   if(fullFileOptions())
   {
    filename=app.filename;
    app.showFilename(filename);
   };
   break;
  };
 };
 function opGetFilename()
 {
  switch(app.fileMode)
  {
  case "Data":
   return filename.replace('.plot','.csv');
  case "OxPlot":
   return filename;
  };
  return filename;
 };
 function fullFileOptions()
 {
  return fileOptions.canvas 
    && fileOptions.view 
    && fileOptions.format 
    && fileOptions.data;
 };
 function opGetFileContent()
 {
  switch(app.fileMode)
  {
  case "Data":
   app.filecontent=dataContent;
   break;
  case "OxPlot":
   if(filename.indexOf(".plot")!=-1)
   {
    filecontent="";
    if(fileOptions.canvas)
    {
     filecontent+=displayItem(canvas,"canvas");
    };
    if(fileOptions.view)
    {
     filecontent+=displayItem(plotInfo,"plotInfo");
     filecontent+=displayItem(plotColor,"plotColor");
     filecontent+=displayItem(multiPlots,"multiPlots");
    };
    if(fileOptions.format)
    {
     filecontent+=displayItem(plotOptions,"plotOptions");
    };
    if(fileOptions.data)
    {
     filecontent+=displayItem(plotData,"plotData");
    };
   };
   app.filecontent=filecontent;
   break;
  default:
   app.filecontent=false;
  };
 };
 function opSetFileContent()
 {
  var canvas,plotInfo,plotColor,multiPlots,plotOptions,plotData;
  switch(app.fileMode)
  {
  case "Data":
   break;
  case "OxPlot":
   eval(app.filecontent);
   if(fileOptions.canvas && canvas)
   {
    window.canvas=canvas;
   };
   if(fileOptions.view)
   {
    if(plotInfo){window.plotInfo=plotInfo;};
    if(plotColor){window.plotColor=plotColor;};
    if(multiPlots){window.multiPlots=multiPlots;};
   };
   if(fileOptions.format && plotOptions)
   {
    window.plotOptions=plotOptions;
   };
   if(fileOptions.data && plotData)
   {
    window.plotData=plotData;
   };
   setValues();
   break;
  };
 };
 function darkBackground()
 {
  var rgb;
  rgb=parseColor(plotOptions.background);
  return (rgb[0]+rgb[1]+rgb[2]) < 384;
 };
 function cleanDatabaseArray(ar)
 {
  var i,j;
  for(i=0;i<ar.length;i++)
  {
   ar[i].changed=false;
   while((i<ar.length)&&(typeof(ar[i].deleted)!="undefined")&&(ar[i].deleted))
   {
    for(j=i+1;j<ar.length;j++)
    {
     ar[j-1]=ar[j];
    };
    ar.length--;
   };
  };
  return ar;
 };
 function keyItems()
 {
  var i,items=0;
  for(i=0;i<plotData.length;i++)
  {
   if(plotData[i].selected && plotData[i].name)
   {
    items++;
   };
  };
  return items;
 };
 function keyWidth()
 {
  var i,width=0;
  for(i=0;i<plotData.length;i++)
  {
   if(plotData[i].selected && plotData[i].name)
   {
    if(plotData[i].name.length > width)
    {
     width=plotData[i].name.length;
    };
   };
  };
  return width;
 };
 function setCanvasSize()
 {
  var i,scltst;
  yoffs=0;
  canvas.frameWidth=plotOptions.plotPosX+plotOptions.plotWidth+0.5;
  canvas.frameHeight=1.0+plotOptions.plotPosY+plotOptions.plotHeight;
  plotOptions.plotPosYOffs=0.5;
  if(plotOptions.showKey && keyItems() && !plotOptions.multiPlot)
  {
   plotOptions.key=true;
   plotOptions.keyWidth=3+keyWidth()*canvas.scaleFont*0.3;
   plotOptions.keyHeight=0.5*(keyItems()+2)*canvas.scaleLine*canvas.scaleFont;
   if(plotOptions.keyHeight > plotOptions.plotHeight)
   {
    plotOptions.plotPosYOffs=plotOptions.keyHeight-plotOptions.plotHeight;
    canvas.frameHeight+=plotOptions.plotPosYOffs;
   };
   switch(plotOptions.showKey)
   {
   case 1:
    plotOptions.keyPosX=plotOptions.plotPosX+plotOptions.plotWidth+0.5;
    canvas.frameWidth+=plotOptions.keyWidth+0.5;
    break;
   case 2:
    plotOptions.keyPosX=0.5;
    canvas.frameWidth=plotOptions.keyWidth;
    break;
   };
   plotOptions.keyPosY=plotOptions.plotPosY+plotOptions.plotHeight-plotOptions.keyHeight;
   plotOptions.keyCount=keyItems();
  }
  else
  {
   plotOptions.key=false;
  };
  if(plotOptions.multiPlot)
  {
   if(multiPlots.columns==0)
   {
    plotOptions.cellWidth=0;
    plotOptions.cellHeight=0;
   }
   else
   {
    plotOptions.cellWidth=canvas.frameWidth;
    if(multiPlots.tiedYAxes)
    {
     switch(multiPlots.tiedYAxes)
     {
     case 2: plotOptions.cellWidth-=(plotOptions.plotPosX/2); break;
     case 3: case 4: plotOptions.cellWidth-=plotOptions.plotPosX; break;
     };
    };
    if(multiPlots.interXPlot){plotOptions.cellWidth+=multiPlots.interXPlot;};
    plotOptions.cellHeight=canvas.frameHeight;
    if(multiPlots.tiedXAxes)
    {
     switch(multiPlots.tiedXAxes)
     {
     case 2: plotOptions.cellHeight-=(plotOptions.plotPosY/2); break;
     case 3: case 4: plotOptions.cellHeight-=plotOptions.plotPosY; break;
     };
    };
    if(multiPlots.interYPlot){plotOptions.cellHeight+=multiPlots.interYPlot;};
   };
   plotOptions.maxrow=0;
   if(multiPlots.plots)
   {
    for(i=0;i<multiPlots.plots.length;i++)
    {
     if(multiPlots.plots[i].selected && (multiPlots.plots[i].row>plotOptions.maxrow))
     {
      plotOptions.maxrow=multiPlots.plots[i].row;
     };
    };
   };
   if(multiPlots.columns>1)
   {
    canvas.frameWidth+=(multiPlots.columns-1)*plotOptions.cellWidth;
   };
   plotOptions.columns=multiPlots.columns;
   if(plotOptions.maxrow>0)
   {
    canvas.frameHeight+=(plotOptions.maxrow)*plotOptions.cellHeight;
   };
   if(multiPlots.showKey)
   {
    plotOptions.keyWidth=3+keyWidth()*canvas.scaleFont*0.3;
    plotOptions.keyHeight=0.5*(keyItems()+2)*canvas.scaleLine*canvas.scaleFont;
    plotOptions.keyPosX=0.5;
    plotOptions.keyPosY=plotOptions.plotPosY+plotOptions.plotHeight-plotOptions.keyHeight;
    plotOptions.keyCount=keyItems();
    tst=multiPlots.keyRow+(plotOptions.keyHeight+1)/plotOptions.cellHeight;
    if(tst>plotOptions.maxrow+1)
    {
     canvas.frameHeight+=(tst-1-plotOptions.maxrow)*plotOptions.cellHeight;
     yoffs=(tst-1-plotOptions.maxrow)*plotOptions.cellHeight;
    };
    tst=multiPlots.keyColumn+(plotOptions.keyWidth+1)/plotOptions.cellWidth;
    if(tst>multiPlots.columns)
    {
     canvas.frameWidth+=(tst-multiPlots.columns)*plotOptions.cellWidth;
    };
   };
   canvas.frameWidth+=plotOptions.plotPosX;
   canvas.frameHeight+=plotOptions.plotPosY;
  };
  if(plotColor.showKey)
  {
   plotOptions.colPosX=canvas.frameWidth+plotOptions.plotPosX;
   plotOptions.colPosY= plotOptions.plotPosY;
   if(plotOptions.multiPlot)
   {
    plotOptions.colPosY+=plotOptions.maxrow*plotOptions.cellHeight;
   };
   canvas.frameWidth+=plotOptions.plotPosX+2;
  };
 };
 function setValues(spec,leaveValues)
 {
  var pg;
  if(!multiPlots.plots||(multiPlots.plots.length==0))
  {
   plotOptions.multiPlot=false;
  };
  setCanvasSize();
  if(!window.frames[0] || !window.frames[0].mover || !window.frames[0].mover.active)
  {
   calcData(false);
  };
  if(!spec||(spec==dataSpec))
  {
   if(plotOptions.background.indexOf("rgba")==-1)
   {
    plotIFrame.style.backgroundColor=plotOptions.background;
   }
   else
   {
    plotIFrame.style.backgroundColor="";
   };
  };
  if(darkBackground())
  {
   if(plotInfo.mapPlot && (plotOptions.mapPlot=="svg"))
   {
    pg="xy_plot_map_rev_svg.html";
   }
   else
   {
    pg="xy_plot_rev_svg.html";
   };
  }
  else
  {
   if(plotInfo.mapPlot && (plotOptions.mapPlot=="svg"))
   {
    pg="xy_plot_map_svg.html";
   }
   else
   {
    pg="xy_plot_svg.html";
   };
  };
  if(plotPg!=pg)
  {
   plotIFrame.src=pg;
   plotPg=pg;
  }
  else
  {
   if(typeof(window.frames[0].createPlot)!='undefined')
   {
    window.frames[0].createPlot();
   }
   else
   {
    plotIFrame.src=pg;
   };
  };
  if(parent.onShowPlot){parent.onShowPlot();};
 };
 function changeEditOptions(tryPlot)
 {
  var i,j,chld,hed,frst,lines;
  divisions[0]="";divisionsDisplay[0]="";tables[0]="[Text]";
  divisions[1]="selected";divisionsDisplay[1]="Selected";
  divisions.length=2;divisionsDisplay.length=2;tables.length=1;
//  if(!tryPlot){editSpec.emptyContainer();};
  if(editOptions.window)
  {
   if(!editOptions.window.closed && editOptions.window.dbDataSpec)
   {
    for(i=0;i<editOptions.window.dbDataSpec.length;i++)
    {
     if(!editOptions.window.dbDataSpec[i]){continue;};
     tables[i]=editOptions.window.dbDataSpec[i].prompt;
     if(tables[i]==plotInfo.category && tryPlot)
     {
      editOptions.table=i;
      autofill=true;
     };
     if((autofill && (editOptions.table==i)))
     {
      for(j=0;j<editOptions.window.dbDataSpec[i].children.length;j++)
      {
       chld=editOptions.window.dbDataSpec[i].children[j];
       if((chld.type!="Number")&&(chld.type!="Date"))
       {
        divisions.push(chld.name);
        divisionsDisplay.push(chld.prompt);
       };
      };
     };
    };
    tables[i]="[Text]";
   };
  };
  if(tables[editOptions.table]=="[Text]")
  {
   editSpec.children[0].hidden=false;
   editSpec.children[1].hidden=false;
   if(tryPlot)
   {
    lines=editOptions.text.split("\n");
   }
   else
   {
    lines=editSpec.object.text.split("\n");
   };
   if(lines.length>1)
   {
    hed=lines[0].split("\t");
    frst=lines[1].split("\t");
    for(i=0;i<hed.length;i++)
    {
     if(isNaN(frst[i]))
     {
      divisions.push(hed[i]);
      divisionsDisplay.push(hed[i]);
     };
    };
   };
  }
  else
  {
   editSpec.children[0].hidden=true;
   editSpec.children[1].hidden=true;
  };
//  if(!tryPlot){editSpec.fillContainer();};
 };
 function setDataTables(firstTime)
 {
  tables.length=0;
  autofill=false;
  changeEditOptions(true);
  if(!firstTime)
  {
   suckPlotInformation();
  };
  if(editOptions.window && editOptions.window.rawPlotData)
  {
   suckData(app.clone(editOptions.window.rawPlotData));
  };
  if(autofill)
  {
   suckData();
  }
  else
  {
   if(firstTime/* && plotData.length*/)
   {
    setValues(dataSpec);
   };
  };
 };
 function xml2Str(xmlNode)
 {
  try {
    return (new XMLSerializer()).serializeToString(xmlNode);
  }
  catch (e) {
    try {
      // Internet Explorer.
      return xmlNode.xml;
    }
    catch (e)
    {
     alert('Xmlserializer not supported');
    };
  };
  return false;
 };
 function getSVGContent()
 {
   var cont;
   cont=xml2Str(window.frames[0].document.getElementById("top"));
   if(cont)
   {
    // get rid of duplicate header (Opera)
    cont=cont.replace('\<\?xml version="1.0"\?\>\<\?xml version="1.0" \?\>','\<\?xml version="1.0" \?\>');
    // add header if not there at all (Safari)
    if(cont.indexOf("\<\?xml")==-1)
    {
     cont="\<\?xml version=\"1.0\" encoding=\"UTF-8\"\?\>"+cont;
    };
    // get rid of any non-ascii characters
//    cont=cont.replace(/[^\u000A\u000D\u0020-\u007F]/g,"_");
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
 function checkCanSave()
 {
  var i,ok=true;
  for(i=0;i<plotData.length;i++)
  {
   if(plotData[i].include_url)
   {
    plotData[i].include_url=false;
    ok=false;
   };
  };
  if(plotInfo.mapPlot)
  {
   if(plotOptions.mapPlot!='svg')
   {
    ok=false;
   };
  };
  return ok;
 };
 function fileClick(op)
 {
  switch(op)
  {
  case "Open":
   app.prompt("File options",fileOptions,fileSpec).then(function(rpl){
    fileOptions=rpl;
    app.fileOpen("OxPlot");
   }).catch(function(){});
   break;
  case "SaveAs":
   app.prompt("File options",fileOptions,fileSpec).then(function(rpl){
    fileOptions=rpl;
    app.fileSaveAs("OxPlot");
   }).catch(function(){});
   break;
  case "Save":
   if(filename && (filename!="/Untitled.plot") && fullFileOptions())
   {
    app.fileSave("OxPlot");
   }
   else
   {
    fileClick("SaveAs");
   };
   break;
  case "New":
   window.open('OxPlot.html',"_blank");
   break;
  case "Save plot":
   if(!checkCanSave())
   {
    fileClick("Print");
    break;
   };
   dataContent=getSVGContent();
   app.fileSaveAs("Data","svg");
   break;
  case "Export data":
   saveAllData();
   break;
  case "Print":
   window.frames[0].print();
   break;
  case "Reset":
   resetDefaults();
   break;
  };
 };
 var currentTool=false;memSettings={};
 var pcaSettings={"x_calc":"PC1","y_calc":"PC2","xlabel":"PC1","ylabel":"PC2","title":"PCA"};
 function toolClick(op)
 {
  var spec,s,el,i;
  spec=new itemSpec("options","Options","Object");
  s=spec.appendChild("variables","Variables","Text");
  s=spec.appendChild("bivariate","Bivariate","Boolean");
  s.changer=function(ss){
   ss.parent.emptyContainer();
   if(ss.object)
   {
    ss.parent.object.variables=bivariateList();
   }
   else
   {
    ss.parent.object.variables=plotInfo.pcaVariables;
   };
   ss.parent.fillContainer();
  };
  switch(op)
  {
  case 'Run':
   toolClick(currentTool);
   currentTool=false;
   app.hideTool("Tool");
   break;
  case 'Save':
   switch(currentTool)
   {
   case "PCA": exportCovMatrix();break
   case "KDE matrix": exportKDEMatrix();break;
   case "Ellipsoid matrix": exportEllipsoidMatrix();break;
   };
   break;
  case 'Ok':
   if(currentTool=='PCA')
   {
    if(plotInfo.title!="PCA")
    {
     for(i in pcaSettings){memSettings[i]=plotInfo[i];};
    };
    plotInfo.autox=1;plotInfo.autoy=1;
    for(i in pcaSettings){plotInfo[i]=pcaSettings[i];};
    setValues(adjustSpec,true);
   };
   currentTool=false;
   app.hideTool("Tool");
   break;
  case 'Cancel':
   if(currentTool=='PCA')
   {
    if(plotInfo.title=="PCA")
    {
     for(i in memSettings){plotInfo[i]=memSettings[i];};
     plotInfo.autox=1;plotInfo.autoy=1;
     setValues(adjustSpec,true);
    };
   };
   currentTool=false;
   app.hideTool("Tool");
   break;
  case "PCA":
   app.prompt("PCA variables",plotInfo.pcaVariables).then(function(rpl){
    try
    {
     if(!plotInfo.pcaVariable)
     {
      plotInfo.pcaVariables=rpl;
     };
     currentTool=op;
     app.toolTitle("Tool",op);
     doPCA(rpl);
    }
    catch(e){app.alert(e);};
   }).catch(function(){currentTool=op;toolClick('Cancel');});
   break;
  case "KDE matrix":
   app.prompt("KDE matrix",{"variables":plotInfo.pcaVariables},spec).then(function(rpl){
    try
    {
     currentTool=op;
     app.toolTitle("Tool",op);
     findKDEMatrix(rpl.variables);
    }
    catch(e){app.alert(e);};
   }).catch(function(){currentTool=op;toolClick('Cancel');});
   break;
  case "Ellipsoid matrix":
   app.prompt("Ellipsoid matrix",{"variables":plotInfo.pcaVariables},spec).then(function(rpl){
    try
    {
     currentTool=op;
     app.toolTitle("Tool",op);
     findEllipsoidMatrix(rpl.variables);
    }
    catch(e){app.alert(e);};
   }).catch(function(){currentTool=op;toolClick('Cancel');});
   break;
  };
 };
 function editClick(op)
 {
  switch(op)
  {
  case "Data":
   app.prompt("Data",plotData,dataSpec,{"id":"editData"}).then(function(rpl){
    plotData=rpl;
    cleanDatabaseArray(plotData);
    setValues(dataSpec);
   }).catch(function(rpl){});
   break;
  case "Import":
   app.prompt("Import",{"title":editOptions.title,"text":editOptions.text,
    "table":editOptions.table,"division":editOptions.division},editSpec,{"id":"importData"}).then(function(rpl){
    var i;
    for(i in rpl){editOptions[i]=rpl[i];};
    suckData();
   }).catch(function(rpl){});
   break;
  };
 };
 function viewClick(op)
 {
  switch(op)
  {
  case "Toggle markers":
   toggleMarkers();
   break;
  case "Toggle lines":
   toggleLines();
   break;
  case "Toggle ellipses":
   toggleEllipses();
   break;
  case "Toggle KDE":
   toggleKDEContours();
   break;
  case "Single plot":
   plotOptions.multiPlot=false;     
   setValues(adjustSpec);
   break;
  case "Multiplot":
   if(multiPlots.plots.length==0){format("Multiplot");return;};
   plotOptions.multiPlot=true;     
   setValues(adjustSpec);
   break;
  case "Color scale":
   showArea("viewColor");
   break;
  default:
   showArea("view"+op);
   break;
  };
 };
 function innerMenu(lev)
 {
  switch(lev)
  {
  case 0:
   clickmenu("file","Open...|Save...|Save plot|Export data|Print||Options|Reset",true);
   break;
  case 1:
   clickmenu("edit","Data|Import",true);
   break;
  case 2:
   clickmenu("view","Single plot|Multiplot|Color scale||Toggle markers|Toggle lines|Toggle ellipses|Toggle KDE",true);
   break;
  case 3:
   document.writeln("<div id='formatArea' class='toolbar' style='left:0px'><\/div>");
   break;
  case 4:
   clickmenu("tool","PCA|Ellipsoid matrix|KDE matrix",true);
   break;
  };
 };
 function setMPvalues(from_obj,to_obj,firstTrial,nolabel)
 {
  to_obj.title=from_obj.title;
  if(!nolabel)
  {
   to_obj.xlabel=from_obj.xlabel;
   to_obj.ylabel=from_obj.ylabel;
  };
  if(multiPlots.tiedXAxes && (!firstTrial))
  {
   from_obj.minx=to_obj.minx;
   from_obj.maxx=to_obj.maxx;
   to_obj.autox=0;
   from_obj.autox=to_obj.autox;
  }
  else
  {
   to_obj.minx=from_obj.minx;
   to_obj.maxx=from_obj.maxx;
   to_obj.autox=from_obj.autox;
  };
  to_obj.x_calc=from_obj.x_calc;
  to_obj.dx_calc=from_obj.dx_calc;
  if(multiPlots.tiedYAxes && (!firstTrial))
  {
   from_obj.miny=to_obj.miny;
   from_obj.maxy=to_obj.maxy;
   to_obj.autoy=0;
   from_obj.autoy=to_obj.autoy;
  }
  else
  {
   to_obj.miny=from_obj.miny;
   to_obj.maxy=from_obj.maxy;
   to_obj.autoy=from_obj.autoy;
  };
  to_obj.y_calc=from_obj.y_calc;
  to_obj.dy_calc=from_obj.dy_calc;
  to_obj.xtop=from_obj.xtop;
  to_obj.yright=from_obj.yright;
  to_obj.weight=from_obj.weight;
  to_obj.hideRectangle=from_obj.hideRectangle;
 };
 function choosePlot(spec)
 {
  setMPvalues(spec.parent.object,plotInfo);
  plotOptions.multiPlot=false;
  plotInfo.xtop=false;
  plotInfo.yright=false;
  plotInfo.autox=1;
  plotInfo.autoy=1;
  plotInfo.hideRectangle=false;
  setValues(adjustSpec);
 };
 function firstPlot(active,ps)
 {
  multiPos=-1;
  multiPlots.firstPlot=0;
  setMPvalues(plotInfo,memInfo,true);
  memCalc=plotCalc;
  xorg=plotOptions.plotPosX;
  yorg=plotOptions.plotPosY+yoffs;
  worg=plotOptions.plotWidth;
  horg=plotOptions.plotHeight;
  plotOptions.key=false;
  return nextPlot(active,ps,true);
 };
 function finalPlot()
 {
  if(plotOptions.key || (!multiPlots.showKey))
  {
   setMPvalues(memInfo,plotInfo,true);
   plotCalc=memCalc;
   plotOptions.plotPosX=xorg;
   plotOptions.plotPosY=yorg-yoffs;
   plotOptions.plotWidth=worg;
   plotOptions.plotHeight=horg;
   return false;
  }
  else
  {
   plotOptions.keyPosX=xorg+multiPlots.keyColumn*plotOptions.cellWidth;
   plotOptions.keyPosY+=yoffs+(plotOptions.maxrow-multiPlots.keyRow)*
    plotOptions.cellHeight;
   plotOptions.key=true;
  };
  return true;
 };
 function nextPlot(active,ps,firstTrial)
 {
  if((multiPos>-1)&&(multiPos<multiPlots.plots.length))
  {
   setMPvalues(plotInfo,multiPlots.plots[multiPos],true,true);
  };
  multiPos++;
  if(multiPos>multiPlots.plots.length-1){return finalPlot();};
  while((multiPos<multiPlots.plots.length-1) && (!multiPlots.plots[multiPos].selected))
  {
   multiPos++;
  };
  if(!multiPlots.plots[multiPos].selected){return finalPlot();};
  if(firstTrial)
  {
   multiPlots.firstPlot=multiPos;
  };
  setMPvalues(multiPlots.plots[multiPos],plotInfo,firstTrial);
  if((multiPlots.tiedXAxes>1)&&(multiPlots.plots[multiPos].row!=plotOptions.maxrow))
  {
   if(multiPlots.plots[multiPos].row==0)
   {
    plotInfo.xtop=true;
   }
   else
   {
    plotInfo.xlabel="";
    if(multiPlots.tiedXAxes==3){plotInfo.xlabel="nonumbers";};
    if((multiPlots.tiedXAxes==4)||((multiPlots.tiedXAxes==3) && multiPlots.plots[multiPos].hideRectangle)){plotInfo.xlabel="noaxis";};
   };
  };
  if((multiPlots.tiedYAxes>1)&&(multiPlots.plots[multiPos].column>0))
  {
   plotInfo.ylabel="";
   if(multiPlots.tiedYAxes==3){plotInfo.ylabel="nonumbers";};
   if((multiPlots.tiedYAxes==4)||((multiPlots.tiedYAxes==3) && multiPlots.plots[multiPos].hideRectangle)){plotInfo.ylabel="noaxis";};
  };
  plotOptions.plotPosX=xorg+multiPlots.plots[multiPos].column*plotOptions.cellWidth;
  plotOptions.plotPosY=yorg+
   (plotOptions.maxrow-multiPlots.plots[multiPos].row)*
   plotOptions.cellHeight;
  if(multiPlots.plots[multiPos].colspan)
  {
   plotOptions.plotWidth=worg+(multiPlots.plots[multiPos].colspan-1)*plotOptions.cellWidth;
  }
  else
  {
   plotOptions.plotWidth=worg;
  };
  if(multiPlots.plots[multiPos].rowspan)
  {
   plotOptions.plotHeight=horg+(multiPlots.plots[multiPos].rowspan-1)*plotOptions.cellHeight;
   plotOptions.plotPosY-=(multiPlots.plots[multiPos].rowspan-1)*plotOptions.cellHeight;
  }
  else
  {
   plotOptions.plotHeight=horg;
  };
  if(!active)
  {
   calcData(true);
   plotCalcMulti[multiPos]=plotCalc;
  }
  else
  {
   plotCalc=plotCalcMulti[multiPos];
  };
  return true;
 };
 function arrangePlots()
 {
  var i,j;
//  multiSpec.emptyContainer();
  j=0;
  if(multiPlots.columns==0){return;};
  for(i=0;i<multiPlots.plots.length;i++)
  {
   if(multiPlots.plots[i].selected)
   {
    multiPlots.plots[i].row=Math.floor(j/multiPlots.columns);
    multiPlots.plots[i].column=j % multiPlots.columns;
    j++;
   }
   else
   {
    multiPlots.plots[i].row=0;
    multiPlots.plots[i].column=0;
   };
  };
  multiPlots.keyRow=Math.floor(j/multiPlots.columns);
  multiPlots.keyColumn=j % multiPlots.columns;
//  multiSpec.fillContainer();
 };
 function rangeFinder(obj)
 {
  obj.autox=0;obj.autoy=0;
  return "("+obj.x_calc+" BETWEEN "+obj.minx+" AND "+obj.maxx+") AND ("+
   obj.y_calc+" BETWEEN "+obj.miny+" AND "+obj.maxy+")";
 };
 function findInRange(spec)
 {
  var i,tbl;
  var str="";
  spec.parent.emptyContainer();
  if(spec.parent.object.x_calc)
  {
   str=rangeFinder(spec.parent.object);
  }
  else
  {
   if(spec.parent.object.plots)
   {
    for(i=0;i<spec.parent.object.plots.length;i++)
    {
     if(spec.parent.object.plots[i].selected)
     {
      if(str){str+=" AND ";};
      str+=rangeFinder(spec.parent.object.plots[i]);
     };
    };
    str="("+str+")";
   };
  };
  spec.parent.fillContainer();
  if(editOptions.window)
  {
   if(!editOptions.window.closed)
   {
    tbl=-1;
    for(i=0;i<editOptions.window.database.views.length;i++)
    {
     if(plotInfo.table==editOptions.window.database.views[i].view)
     {
      tbl=i;
     };
    };
    if(tbl>-1)
    {
     str=editOptions.window.location.href.split("?")[0]+
       "?page=search&auto=true&view="+tbl+"&where="+str;
     editOptions.window.location.assign(str);
     editOptions.window.focus();
    };
   };
  };
 };
 function opKeyHandler(t)
 {
  var e=app.keyInput;
  var incr=1.044273782427414;
  if(e.alt){incr=1.002711275050202;};
  switch(t)
  {
  case "zoomMap":
   switch(e.key)
   {
   case "down":
   case "left":
   case "minus":
    zoom(1/incr);break;
   case "up": 
   case "right":
   case "plus":
    zoom(incr);break;
   case "zero": 
    zoom(0);break;
   };
   return true;
  case "spanMap":
   switch(e.key)
   {
   case "left":
    changeXRange(1/incr);break;
   case "up":
    changeYRange(incr);break;
   case "right":
    changeXRange(incr);break;
   case "down":
    changeYRange(1/incr);break;
   case "minus":
    changeXRange(incr);if(!plotInfo.mapPlot){changeYRange(incr);};
    break;
   case "plus":
    changeXRange(1/incr);if(!plotInfo.mapPlot){changeYRange(1/incr);};
    break;
   };
   return true;
  case "centerMap":
   switch(e.key)
   {
   case "left":
    if(e.shift){changeXRange(1/incr);}else{changeMinX(1-incr);};break;
   case "up": 
    if(e.shift){changeYRange(incr);}else{changeMinY(incr-1);};break;
   case "right":
    if(e.shift){changeXRange(incr);}else{changeMinX(incr-1);};break;
   case "down":
    if(e.shift){changeYRange(1/incr);}else{changeMinY(1-incr);};break;
   case "minus":
    if(e.shift){zoom(1/incr);}else{changeXRange(incr);if(!plotInfo.mapPlot){changeYRange(incr);};};break;
   case "plus":
    if(e.shift){zoom(incr);}else{changeXRange(1/incr);if(!plotInfo.mapPlot){changeYRange(1/incr);};};break;
   case "zero": 
    if(e.shift){zoom(0);};break;
   };
   return true;
  };
 };
 function flashPage()
 {
  var p,e,i,d;
  if(typeof(login)!="object"){return;};
  p=document.createElement('div');
  p.className='appVeil';
  p.style="opacity:1;transition: opacity 0.5s ease-in-out";
  e=document.createElement('div');
  e.className="appProgressTitle";
  e.style="top:25%";
  i=document.createElement('img');
  i.src='EuclidRaph.png';
  i.alt="OxPlot logo";
  e.appendChild(i);
  e.appendChild(document.createElement('br'));
  d=document.createElement('div');
  d.style.height="20px";
  e.appendChild(d);
  e.appendChild(document.createTextNode(header.title+" : "+"version: "+header.version));
  e.appendChild(document.createElement('br'));
  e.appendChild(document.createTextNode("C Bronk Ramsey : "+app.writeDate(header.issued)));
  p.appendChild(e);
  p=document.body.appendChild(p);
  window.setTimeout(function(){p.style.opacity=0;},2500);
  window.setTimeout(function(){
   document.body.removeChild(p);
   login.login().then(async function(){
   }).catch(function(e){app.alert(e);});
  },3000);
 };
 function initDataArea(noincl)
 {
   var incl,el,i;
   if((incl=app.getArgs().incl)&&!noincl)
   {
    switch(incl)  // only accept known includes - for old interfaces
    {
    case "../intimate/GICC05_d18O.js":
    case "../resetdb/tas.js":
     app.getFrom(incl).then(function(rpl){
      eval(rpl);
      initDataArea(true);
     }).catch(function(e){app.alert(e);});
     return;
     break;
    };
   };
   if(onAServer())
   {
    if(typeof(login)=="object")
    {
     login.createLoginMenu();
    };
   }
   else
   {
    app.appendToMenu("ProjectFile","Spacer","",false,false);
    app.appendToMenu("ProjectFile","MenuSub","Server...",function(){window.location.assign("../");},false);
   };
   restoreDefaults();
   plotIFrame=document.getElementById("mainArea");
   plotFrame=plotIFrame.parentNode;
   plotFrame.className="appFrameChess";
   playerFooter=document.getElementById("PlayerMenu").parentNode.parentNode;
   playerFooter.style.display="none";
   plotFrame.style.bottom="0px";
   if(editOptions.window)
   {
    if(!editOptions.window.closed)
    {
     if(editOptions.window.plotInfo)
     {
      plotInfo=app.clone(editOptions.window.plotInfo);
     };
     if(editOptions.window.plotColor)
     {
      plotColor=app.clone(editOptions.window.plotColor);
     };
     if(editOptions.window.plotOptions)
     {
      plotOptions.eventHandler=editOptions.window.plotOptions.eventHandler;
      if(editOptions.window.plotPlayer)
      {
       plotPlayer.showPlayer=editOptions.window.plotPlayer.showPlayer;
       plotPlayer.mint=editOptions.window.plotPlayer.mint;
       plotPlayer.maxt=editOptions.window.plotPlayer.maxt;
       plotPlayer.autot=editOptions.window.plotPlayer.autot;
       plotPlayer.t_units=editOptions.window.plotPlayer.t_units;
       plotPlayer.color=editOptions.window.plotPlayer.color;
       plotPlayer.normalise=editOptions.window.plotPlayer.normalise;
       plotPlayer.circleZoom=editOptions.window.plotPlayer.circleZoom;
       plotOptions.mapPlotMultiIncr=editOptions.window.plotOptions.mapPlotMultiIncr;
      };
     };
     if(editOptions.window.plotOptions && editOptions.window.plotOptions.plotPosX)
     {
      plotOptions.plotPosX=editOptions.window.plotOptions.plotPosX;
      plotOptions.plotPosY=editOptions.window.plotOptions.plotPosY;
      plotOptions.plotWidth=editOptions.window.plotOptions.plotWidth;
      plotOptions.plotHeight=editOptions.window.plotOptions.plotHeight;
      plotOptions.multiPlot=editOptions.window.plotOptions.multiPlot;
      if(typeof(editOptions.window.plotOptions.showKey)!='undefined')
      {
       plotOptions.showKey=editOptions.window.plotOptions.showKey;
      };
      if(typeof(editOptions.window.plotOptions.contourProbMax)!='undefined')
      {
       plotOptions.contourProbMax=editOptions.window.plotOptions.contourProbMax;
      };
     };
     if(editOptions.window.plotData)
     {
      plotData=app.clone(editOptions.window.plotData);
     };
     if(editOptions.window.multiPlots)
     {
      multiPlots=app.clone(editOptions.window.multiPlots);
      if(multiPlots.plots)
      {
       for(i=0;i<multiPlots.plots.length;i++)
       {
        if(!multiPlots.plots[i].row){multiPlots.plots[i].row=0;};
        if(!multiPlots.plots[i].column){multiPlots.plots[i].column=0;};
       };
      };
     };
     playerSetup((editOptions.window.player && !editOptions.window.playerDisable)||plotPlayer.showPlayer);
     if(editOptions.window.player && !editOptions.window.playerDisable)
     {
      if(editOptions.window.playerMin)
      {
       el=document.getElementById("PlayerMenu__7");
       el.removeChild(el.firstChild);
       el.appendChild(document.createTextNode(editOptions.window.playerMin));
      };
      if(editOptions.window.playerMax)
      {
       el=document.getElementById("PlayerMenu__9");
       el.removeChild(el.firstChild);
       el.appendChild(document.createTextNode(editOptions.window.playerMax));
      };
     };
    }
    else
    {
     editOptions.window=false;
    };
   }
   else
   {
    editOptions.window=false;
   };
   canvas=decodeObject(canvas);
   plotInfo=decodeObject(plotInfo);
   plotOptions=decodeObject(plotOptions);
   plotData=decodeObject(plotData);
   multiPlots=decodeObject(multiPlots);
   plotColor=decodeObject(plotColor);

   document.getElementById("dataEditArea").appendChild(editSpec.createDisplay(editOptions));   
   document.getElementById("dataEditArea").appendChild(adjustSpec.createDisplay(plotInfo));   
   document.getElementById("dataEditArea").appendChild(colorSpec.createDisplay(plotColor));   
   document.getElementById("dataEditArea").appendChild(formatSpec.createDisplay(plotOptions));   
   document.getElementById("dataEditArea").appendChild(canvasSpec.createDisplay(canvas));   
   document.getElementById("dataEditArea").appendChild(fileSpec.createDisplay(fileOptions));   
   document.getElementById("dataEditArea").appendChild(multiSpec.createDisplay(multiPlots));   
   document.getElementById("dataEditArea").appendChild(dataSpec.createDisplay(plotData));
   
   editSpec.refillContainer();
   adjustSpec.refillContainer();
   colorSpec.refillContainer();
   formatSpec.refillContainer();
   canvasSpec.refillContainer();
   fileSpec.refillContainer();
   multiSpec.refillContainer();
   dataSpec.refillContainer();
   
   while(document.getElementById("dataEditArea").firstChild)
   {
    document.getElementById("dataEditArea").removeChild( document.getElementById("dataEditArea").firstChild);
   };
   
   setDataTables(true);
   window.onfocus=changeEditOptions.bind(null,true);
   if(app.getArgs().source)
   {
    app.fileOpen("OxPlot",app.getArgs().source);
   }
   else
   {
    filename="/Untitled.plot";
    app.showFilename(filename);
    if(!editOptions.window){flashPage();};
   };
   if(plotOptions.eventHandler)
   {
    window.eventHandler=function(obj)
    {
     if(parent.plotEventHandler)
     {
     switch(obj.graph)
     {
     case "colorScale":
      return parent.plotEventHandler(obj,plotColor,plotData,setValues);
     case -1:
      return parent.plotEventHandler(obj,plotInfo,plotData,setValues);
     default:
      return parent.plotEventHandler(obj,multiPlots.plots[obj.graph],plotData,setValues);
     };
    }
    else
    {
     return false;
    };
   };
  };
 };
 function goSearch()
 {
  editOptions.window.focus();
 };
 function datSort(a,b)
 {
  if(a[editOptions.division]>b[editOptions.division]){return 1;};
  if(a[editOptions.division]<b[editOptions.division]){return -1;};
  return 0;
 };
 function parseTabData(txt,div)
 {
  var dat,lines,items,headers,i,j,txts,nos,k;
  dat=new Array();
  k=0;
  lines=txt.split("\n");
  for(i=0;i<lines.length;i++)
  {
   items=lines[i].split("\t");
   txts=0;nos=0;
   for(j=0;j<items.length;j++)
   {
    if(items[j]!="")
    {
     if(isNaN(items[j])){txts++;}else{nos++;};
    };
   };
   if(((nos==0)&&(txts>1))||(i==0))
   {
    headers=items;
   }
   else
   {
    if(nos==0){continue;};
    dat[k]=new Object();
    for(j=0;j<items.length;j++)
    {
     if(!headers[j]){continue;};
     if((items[j]=="")||isNaN(items[j]))
     {
      switch(items[j])
      {
      case "true":
       dat[k][headers[j]]=true;
       break;
      case "false":
       dat[k][headers[j]]=false;
       break;
      default:
       dat[k][headers[j]]=items[j];
       break;
      };
     }
     else
     {
      dat[k][headers[j]]=Number(items[j]);
     };
    };
    k++;
   };
  };
  if(div)
  {
   dat.sort(datSort);
  };
  return dat;
 };
 function suckData(dta)
 {
  var i,j,newData;
  if(dta)
  {
   newData=dta;
  }
  else
  {
   if(tables[editOptions.table]=="[Text]")
   {
    newData=parseTabData(editOptions.text,editOptions.division);
   }
   else
   {
    if(editOptions.window.thisPage.search.views)
    {
     if(editOptions.window.thisPage.search.views[editOptions.table])
     {
      plotInfo.table=editOptions.window.thisPage.search.views[editOptions.table].view;
     };
     plotInfo.category=editOptions.window.dbDataSpec[editOptions.table].prompt;
     if(!editOptions.division)
     {
      for(i=0;i<editOptions.window.dbData[editOptions.table].length;i++)
      {
       if(editOptions.window,editOptions.window.dbData[editOptions.table][i].selected)
       {
        editOptions.division='selected';
       };
      };
     };
    };
    if(editOptions.division)
    {
     editOptions.window.dbDataSpec[editOptions.table].sortArray(editOptions.division,true);
    };
    newData=app.clone(editOptions.window.dbData[editOptions.table]);
   };
   if(editOptions.division)
   {
    j=0;
    for(i=1;i<newData.length;i++)
    {
     if(newData[i][editOptions.division]!=newData[i-1][editOptions.division])
     {
      if(!((editOptions.division=='selected')&&(!newData[j][editOptions.division])))
      {
       suckData(newData.slice(j,i));
      };
      j=i;
     };
    };
    if(!((editOptions.division=='selected')&&(!newData[j][editOptions.division])))
    {
     suckData(newData.slice(j));
    };
    return;
   };
  };
  i=plotData.push(new Object())-1;
  plotData[i].data=newData;
  if(plotData[i].data && plotData[i].data.length)
  {
   if(plotData[i].data[0].url)
   {
    plotData[i].include_url=true;
   };
   if(plotData[i].data[0].id)
   {
    plotData[i].include_id=true;
   };
   if(plotData[i].data[0].marker)
   {
    plotData[i].include_marker=true;
   };
   if(plotData[i].data[0].color)
   {
    plotData[i].include_color=true;
   };
  };
  plotData[i].name="";
  if(tables[editOptions.table]=="[Text]")
  {
   plotData[i].name=editOptions.title;
  }
  else
  {
   if(editOptions.window.dbPlotKey)
   {
    plotData[i].name=editOptions.window.dbPlotKey;
   }
   else
   {
    for(j=0;j<editOptions.window.args.length;j++)
    {
     switch(editOptions.window.args[j].name)
     {
     case "auto":case "page": break;
     default:
      if(plotData[i].name){plotData[i].name+="/"};
      plotData[i].name+=editOptions.window.args[j].value;
     };
    };
   };
  };
  if(dta && editOptions.division)
  {
   if(plotData[i].name){plotData[i].name+=", ";};
   switch(typeof(dta[0][editOptions.division]))
   {
   case "undefined":
   case "boolean":
    if(dta[0][editOptions.division])
    {
     plotData[i].name+=editOptions.division;
    }
    else
    {
     plotData[i].name+="NOT "+editOptions.division;
    };
    break;
   default:
    plotData[i].name+=dta[0][editOptions.division];
    break;
   };
  };
  plotData[i].marker=markers[(dataCount % 6)+1];
  if(plotOptions.BandW)
  {
   if(darkBackground())
   {
    plotData[i].markerColor="rgb(255,255,255)";
   }
   else
   {
    plotData[i].markerColor="rgb(0,0,0)";
   };
   switch(Math.floor(dataCount / 6))
   {
   case 0:
    plotData[i].markerFill=plotData[i].markerColor.replace( "rgb","rgba").replace(")",",0)");
    break;
   case 1:
    plotData[i].markerFill=plotData[i].markerColor.replace( "rgb","rgba").replace(")",",0.5)");
    break;
   default:
    plotData[i].markerFill=plotData[i].markerColor.replace( "rgb","rgba").replace(")",",1)");
    break;
   };
   plotData[i].line="";
   plotData[i].lineColor=plotData[i].markerColor;
  }
  else
  {
   plotData[i].markerColor=colors[(dataCount % (colors.length))];
   plotData[i].markerFill=plotData[i].markerColor.replace( "rgb","rgba").replace(")",",0.5)");
   plotData[i].line="";
   plotData[i].lineColor=colors[(dataCount % (colors.length))];
  };
  plotData[i].selected=true;
  dataCount++;
  setValues(dataSpec);
 };
 function suckPlotInformation()
 {
  var i,j,dta,skip,thisId;
  if(editOptions.window)
  {
   if(!editOptions.window.closed)
   {
    if(editOptions.window.plotData)
    {
//     dataSpec.emptyContainer();
     for(i=0;i<editOptions.window.plotData.length;i++)
     {
      autofill=false; // don't also import data
      skip=false;
      thisId=editOptions.window.plotData[i].id;
      if(thisId)
      {
       for(j=0;j<plotData.length;j++)
       {
        if(plotData[j].id==thisId){skip=true;};
       };
      };
      if(!skip)
      {
       plotData.push(app.clone(editOptions.window.plotData[i]));
      };
     };
 //    dataSpec.fillContainer();
     setValues(dataSpec);
    };
    if(editOptions.window.plotInfo)
    {
     plotInfo=app.clone(editOptions.window.plotInfo);
    };
    plotOptions.eventHandler=editOptions.window.plotOptions.eventHandler;
    if(editOptions.window.plotOptions)
    {
     plotOptions.plotPosX=editOptions.window.plotOptions.plotPosX;
     plotOptions.plotPosY=editOptions.window.plotOptions.plotPosY;
     plotOptions.plotWidth=editOptions.window.plotOptions.plotWidth;
     plotOptions.plotHeight=editOptions.window.plotOptions.plotHeight;
     plotOptions.multiPlot=editOptions.window.plotOptions.multiPlot;
    };
    if(editOptions.window.multiPlots)
    {
     multiPlots.showKey=editOptions.window.multiPlots.showKey;
     multiPlots.keyRow=editOptions.window.multiPlots.keyRow;
     multiPlots.keyColumn=editOptions.window.multiPlots.keyColumn;
     multiPlots.columns=editOptions.window.multiPlots.columns;
     multiPlots.plots=app.clone(editOptions.window.multiPlots.plots);
    };
   };
  };
 };
 function out_of_range(v,dv,min,max,auto)
 {
  if(!dv){dv=0;};
  if(auto!=0){return false;};
  if(max>min)
  {
   if((v-dv>1.05*max-0.05*min)||(v+dv<1.05*min-0.05*max)){return true;};
  }
  else
  {
   if((v-dv>1.05*min-0.05*max)||(v+dv<1.05*max-0.05*min)){return true;};
  };
  return false;
 };
 function nullTest(a,res){if((a==null)||isNaN(a)){return null;};return res;};
 function BC(t){return nullTest(t,1-t);};
 function BCE(t){return nullTest(t,1-t);};
 function AD(t){return t;};
 function CE(t){return t;};
 function b2k(t){return nullTest(t,2000-t);};
 function calBP(t){return nullTest(t,1950.5-t);};
 function G(t){return t;};
 function m(z){return z;};
 function cm(z){return nullTest(z,z*100);};
 function mm(z){return nullTest(z,z*1000);};
 function pointCalculator(data_set,multi)
 {
  var str;var id="";var url="";
  var obj={fault:false,dx_fault:false,dy_fault:false,z_fault:false,
   x_val:false,y_val:false,dx_val:false,dy_val:false,z_val:false};
  var divider=true;var c,cno,itemname,data_point;
  plotCalc[data_set]=new Object();
  plotCalc[data_set].x=new Array;
  plotCalc[data_set].y=new Array;
  plotCalc[data_set].dx=new Array;
  plotCalc[data_set].dy=new Array;
  plotCalc[data_set].xc=new Array;
  plotCalc[data_set].yc=new Array;
  plotCalc[data_set].w=new Array;
  plotCalc[data_set].dm=new matrix(0,2);
  if(plotData[data_set].include_id || plotData[data_set].include_url || plotData[data_set].include_marker || plotData[data_set].include_color  || plotData[data_set].include_label || (plotData[data_set].marker.indexOf('label')!=-1) || plotData[data_set].marker=='image')
  {
   plotCalc[data_set].index=new Array;
  }
  else
  {
   plotCalc[data_set].index=false;
  };
  if(plotColor.z_calc)
  {
   plotCalc[data_set].z=new Array;
   if(plotColor.dz_calc)
   {
    plotCalc[data_set].dz=new Array;
   };
  };
  if(multi && plotData[data_set].singleOnly){return;};
  if(!plotData[data_set].selected){return;};
  if(plotData[data_set].noauto){plotCalc[data_set].noauto=true;};
  function valVal(item)
  {
   switch(item.constructor)
   {
   case Number: return item; break;
   case String: return item.replace(/'/g,"\\'"); break;
   };
   return false;
  };
  str="function getVals(obj,data_set,data_point){";
  for(itemname in plotData[data_set].data[0])
  {
   str+="try{var "+itemname.replace(/[^A-Za-z0-9]/g,"_")+
    "=valVal(plotData[data_set].data[data_point]['"+itemname+"']);}catch(err){};";
  };
  if(plotInfo.x_calc)
  {
   str+="try{";
   str+="obj.x_val="+plotInfo.x_calc+";";
   str+="}catch(err){obj.fault=true;};";
  };
  if(plotInfo.dx_calc)
  {
   str+="try{";
   str+="obj.dx_val="+plotInfo.dx_calc+";";
   str+="}catch(err){obj.dx_fault=true;};";
  };
  if(plotInfo.y_calc)
  {
   str+="try{";
   str+="obj.y_val="+plotInfo.y_calc+";";
   str+="}catch(err){obj.fault=true;};";
  };
  if(plotInfo.dy_calc)
  {
   str+="try{";
   str+="obj.dy_val="+plotInfo.dy_calc+";";
   str+="}catch(err){obj.dy_fault=true;};";
  };
  if(plotColor.z_calc)
  {
   str+="try{";
   str+="obj.z_val="+plotColor.z_calc+";";
   str+="}catch(err){obj.z_fault=true;};";
  };
  if(plotColor.dz_calc)
  {
   str+="try{";
   str+="obj.dz_val="+plotColor.dz_calc+";";
   str+="}catch(err){obj.dz_fault=true;};";
  };
  if(plotInfo.weight)
  {
   str+="try{";
   str+="obj.w_val="+plotInfo.weight+";";
   str+="}catch(err){obj.dz_fault=true;};";
  };
  str+="};";
  try
  {
   eval(str);
  }
  catch(err)
  {
   alert("Problem with using item names:\n\n"+str);
  };
  for(data_point=0;data_point<plotData[data_set].data.length;data_point++)
  {
   obj.fault=false;obj.dx_fault=false;obj.dy_fault=false;obj.z_fault=false;obj.dz_fault=false;
   try
   {
    getVals(obj,data_set,data_point);
   }
   catch(err)
   {
    obj.fault=true;
   };
   if(!obj.fault)
   {
    if(plotInfo.x_calc && (plotData[data_set].marker!="ylabel"))
    {
     if(plotInfo.nonliny=="mercator")
     {
      if(obj.x_val<plotInfo.minx){obj.x_val+=360;};
      if(obj.x_val>plotInfo.maxx){obj.x_val-=360;};
     };
     if(out_of_range(obj.x_val,obj.dx_val,plotInfo.minx,plotInfo.maxx,plotInfo.autox) &&  !plotInfo.weight)
     {
      obj.fault=true;
     };
     if(isNaN(obj.x_val)){obj.fault=true;};
    };
    if(plotInfo.y_calc && (plotData[data_set].marker!="xlabel"))
    {
     if(out_of_range(obj.y_val,obj.dy_val,plotInfo.miny,plotInfo.maxy,plotInfo.autoy) &&  !plotInfo.weight){obj.fault=true;};
     if(isNaN(obj.y_val)){obj.fault=true;};
    };
    if(plotColor.z_calc)
    {
     if(isNaN(obj.z_val)){obj.z_fault=true;};
    };
    if(plotInfo.weight)
    {
     if(isNaN(obj.w_val)){obj.w_fault=true;};
    };
   };
   if(!obj.fault)
   {
    if(plotCalc[data_set].index)
    {
     plotCalc[data_set].index.push(data_point);
    };
    if(plotInfo.x_calc)
    {
     plotCalc[data_set].x.push(obj.x_val);
     if(plotInfo.y_calc)
     {
      plotCalc[data_set].dm.rows++;
      plotCalc[data_set].dm.m.push([obj.x_val,obj.y_val]);
     };
    };
    if(plotInfo.dx_calc)
    {
     if(obj.dx_fault)
     {
      plotCalc[data_set].dx.push(0);
     }
     else
     {
      plotCalc[data_set].dx.push(obj.dx_val);
     };
    };
    if(plotInfo.y_calc)
    {
     plotCalc[data_set].y.push(obj.y_val);
    };
    if(plotInfo.dy_calc)
    {
     if(obj.dy_fault)
     {
      plotCalc[data_set].dy.push(0);
     }
     else
     {
      plotCalc[data_set].dy.push(obj.dy_val);
     };
    };
    if(plotColor.z_calc)
    {
     if(obj.z_fault)
     {
      plotCalc[data_set].z.push('NaN');
     }
     else
     {
      plotCalc[data_set].z.push(obj.z_val);
     };
    };
    if(plotColor.dz_calc)
    {
     if(obj.dz_fault)
     {
      plotCalc[data_set].dz.push('NaN');
     }
     else
     {
      plotCalc[data_set].dz.push(obj.dz_val);
     };
    };
    if(plotInfo.weight)
    {
     if(obj.w_fault)
     {
      plotCalc[data_set].w.push('NaN');
     }
     else
     {
      plotCalc[data_set].w.push(obj.w_val);
     };
    };
    divider=false;
   }
   else
   {
    if(!divider && !(plotInfo.weight && plotData[data_set].contour)) // don't put in divider for kde type data
    {
     if(plotCalc[data_set].index)
     {
      plotCalc[data_set].index.push(data_point);
     };
     if(plotInfo.x_calc)
     {
      plotCalc[data_set].x.push('NaN');
     };
     if(plotInfo.dx_calc)
     {
      plotCalc[data_set].dx.push('NaN');
     };
     if(plotInfo.y_calc)
     {
      plotCalc[data_set].y.push('NaN');
     };
     if(plotInfo.dy_calc)
     {
      plotCalc[data_set].dy.push('NaN');
     };
     if(plotColor.z_calc)
     {
      plotCalc[data_set].z.push('NaN');
     };
     if(plotColor.dz_calc)
     {
      plotCalc[data_set].dz.push('NaN');
     };
     if(plotInfo.weight)
     {
      plotCalc[data_set].w.push('NaN');
     };
     divider=true;
    };
   };
  };
  if(plotCalc[data_set].dm.rows<2){return;};
  if(plotData[data_set].contour)
  {
   plotCalc[data_set].kde=new kde(plotCalc[data_set].dm.rows,
   plotCalc[data_set].dm.columns,
   plotCalc[data_set].dm.m,plotCalc[data_set].w);
   if(plotOptions.contours=="95%")
   {
    cno=0;
   }
   else
   {
    if(plotOptions.contourProbMax)
    {
     cno=2*Number(plotOptions.contours)*plotCalc[data_set].kde.data.sumWeights
     	/plotOptions.contourProbMax;
     if(cno<1){cno=0.5;}; // no contours rather than 95%
    }
    else
    {
     cno=Number(plotOptions.contours);
    };
   };
  };
  switch(plotData[data_set].contour)
  {
  case "Ellipse":
   plotCalc[data_set].kde.ellipse_2d_setup(0,1);
   c=plotCalc[data_set].kde.ellipse_2d(0,1,cno,100);
   plotCalc[data_set].xc=c.m[0];
   plotCalc[data_set].yc=c.m[1];
   break;
  case "KDE":
   plotCalc[data_set].kde.kde_2d_setup(0,1);
   c=plotCalc[data_set].kde.kde_contour_2d(0,1,cno,100);
   plotCalc[data_set].xc=c.m[0];
   plotCalc[data_set].yc=c.m[1];
   break;
  default:
   break;
  };
 };
 function calcData(multi)
 {
  var i;
  plotCalc=new Array();
  for(i=0;i<plotData.length;i++)
  {
   pointCalculator(i,multi);
  };
 };
 function finishPlot(doc)
 {
  if(editOptions.window)
  {
   if(!editOptions.window.closed)
   {
    if(editOptions.window.finishPlot)
    {
     editOptions.window.finishPlot(doc);
    };
   }
  };
 };
 var dataEditSpec;
 function makeArraySpec(ar)
 {
  var el,spec=new itemSpec("data","Data","Array"),ind=[],i,j;
  spec.database=true;
  if(ar.length && ar.length>0)
  {
   for(el in ar[0])
   {
    switch(el)
    {
    case "deleted":
    case "selected":
    case "changed":
    case "created":
    case "db_sort_line":
     break;
    default:
     ind.push(el);
    };
   };
   for(i=0;(i<ar.length) && ind.length;i++)
   {
    for(j=0;j<ind.length;j++)
    {
     el=ind[j];
     switch(typeof(ar[i][el]))
     {
     case "boolean":
      spec.appendChild(el,el,"Boolean");
      ind.splice(j,1);j--;
      break;
     case "number":
      ind.splice(j,1);j--;
      spec.appendChild(el,el,"Number");
      break;
     case "string":
      ind.splice(j,1);j--;
      spec.appendChild(el,el,"Text");
      break;
     };
    };
   };
  };
  return spec;
 };
 function startEditData(spec)
 {
  app.prompt("Data",spec.parent.object["data"],makeArraySpec(spec.parent.object["data"]),{"id":"editDataSub"}).then(function(rpl){
   spec.parent.object["data"]=cleanDatabaseArray(rpl);
  }).catch(function(){});
 };
 function putEditArray(ar)
 {
  dataEditSpec=makeArraySpec(ar);
  while(document.getElementById("dataEditArea").firstChild)
  {
   document.getElementById("dataEditArea").removeChild( document.getElementById("dataEditArea").firstChild);
  };
  document.getElementById("dataEditArea").appendChild(dataEditSpec.createDisplay(ar));   
 };
 function saveAllData()
 {
  var i;
  dataContent="";
  for(i=0;i<plotData.length;i++)
  {
   if(plotData[i].selected)
   {
    putEditArray(plotData[i].data);
    dataContent+=dataEditSpec.exportData(true,"csv")+"\n";
   };
  };
  app.fileSaveAs("Data","csv");
};
 
 var covMatrix=new matrix();
 var evMatrix=new matrix();

 function doPCA()
 {
  var i,j,k,ok;
  var index=new Array;
  var row,indrow;
  var items=plotInfo.pcaVariables.split(",");
  var dta=new matrix(0,items.length);
  // grab all of the data and index it
  for(i=0;i<plotData.length;i++)
  {
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   for(j=0;j<plotData[i].data.length;j++)
   {
    row=new Array();
    indrow=new Array(i,j);
    ok=true;
    for(k=0;k<items.length;k++)
    {
     if(isNaN(plotData[i].data[j][items[k]]))
     {
      ok=false;
     }
     else
     {
      row[k]=Number(plotData[i].data[j][items[k]]);
     };
    };
    if(ok)
    {
     dta.m.push(row);
     dta.rows++;
     index.push(indrow);
    };
   };
  };
  // now do the PCA
  var dn=dta.normalise();
  covMatrix=dn.covariance();
  evMatrix=covMatrix.eigenvectors().sort_eigenvalues();
  var tr=evMatrix.transpose();
  var pcadta=dn.transpose().times(tr).transpose().normalise();
  for(i=0;i<pcadta.rows;i++)
  {
   for(j=0;j<pcadta.columns;j++)
   {
    plotData[index[i][0]].data[index[i][1]]["PC"+(j+1)]=pcadta.m[i][j];
   };
  };
  covMatrix.rowNames=items;
  covMatrix.colNames=items;
  evMatrix.rowNames=items;
  evMatrix.colNames=new Array();
  for(i=0;i<items.length;i++)
  {
   evMatrix.colNames[i]="PC"+(i+1);
  };
  var el=document.getElementById("toolArea");
  while(el.firstChild)
  {
   el.removeChild(el.firstChild);
  };
  el.appendChild(covMatrix.display(5,'object'));
  el.appendChild(evMatrix.display(5,'object'));
  app.showTool("Tool");
 };
 function exportCovMatrix()
 {
  dataContent=covMatrix.output(5,true);
  dataContent+=evMatrix.output(5,true);
  app.fileSaveAs("Data","csv");
 };
 // formatting funcitons
 
 //end of formatting functions
 function updateFormat(obj,s)
 {
  var v=s.name;
  switch(s.name)
  {
  case "scale":
   obj[v]=s.object/100;
   break;
  case "scaleFont":
   obj[v]=s.object/13.75;
   break;
  default:
   obj[v]=s.object;
   break;
  };
  setValues(s.parent);
 };
 
 function format(mode)
 {
  var spec,s,ss,memO=false,memC=false,memI=false,obj,i;
  switch(mode)
  {
  case "Show":
   app.menu("Show|Lines|Markers\nEllipses|KDE",{"resolve":function(rpl){
    switch(rpl)
    {
    case 1:
     toggleLines();
     break;
    case 2:
     toggleMarkers();
     break;
    case 3:
     toggleEllipses();
     break;
    case 4:
     toggleKDEContours();
     break;
    };
   },"reject":function(){},"multiple":"Done"});
   return;
  case "Color":
   app.prompt("Color scale",plotColor,colorSpec,{"id":"Color"}).then(function(rpl){
    plotColor=rpl;
    setValues(colorSpec);
   }).catch(function(){});
   return;
  case "Player":
   app.prompt("Player",plotPlayer,playerSpec,{"id":"Player"}).then(function(rpl){
    playerPause();
    plotPlayer=rpl;
    playerSetup(plotPlayer.showPlayer);
    plotOptions.probMax="NaN";
    plotOptions.contourProbMax=false;
    if(plotPlayer.showPlayer)
    {
     if(plotPlayer.autot){plotPlayer.mint=null;plotPlayer.maxt=null;};
     plotInfo.weight="playerWeight(id)";
     setValues();
     playerSetPlace(0);
    }
    else
    {
     plotInfo.weight=false;
     setValues();
    };
   }).catch(function(e){app.alert(e);});
   return;
  case "Format":
   memO=app.clone(plotOptions);
   obj=app.clone(plotOptions);
   spec=new itemSpec("data","Format","Object");
   s=spec.appendChild("","Show","Label");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("showKey","Key","Number");
   s.changer=updateFormat.bind(null,plotOptions);
   s.options=new Array("No key","Key with plot","Key only");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("showGrid","Grid","Boolean");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("contours","Contours","Text");
   s.changer=updateFormat.bind(null,plotOptions);
   s.options=new Array("95%","5","10","20");
   s=spec.appendChild("","Mapping","Label");
   s=spec.appendChild("mapPlot","Map underlay","Text");
   s.changer=updateFormat.bind(null,plotOptions);
   s.options=["svg","ESRI Imagery","ESRI Physical_Map","ESRI Topo_Map"];
   ss=app.getCookie('googleMapAPI');
   if(ss&&(ss!='undefined')){
    s.options=s.options.concat(["Google hybrid","Google roadmap","Google satellite","Google terrain"]);
   };
   s.options=s.options.concat(["Open TopoMap","USGS Topo","USGS ImageryOnly","USGS ImageryTopo","USGS HydroCached","USGS ShadedReliefOnly"]);
   s=spec.appendChild("mapForeground","SVG map foreground","Color");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("","Colors","Label");
   s=spec.appendChild("background","Background","Color");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("plotBackground","Plot background","Color");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("BandW","B and W","Boolean");
   s.changer=updateFormat.bind(null,plotOptions);
   break;
  case "Layout":
   memO=app.clone(plotOptions);
   memC=app.clone(canvas);
   obj=app.clone(plotOptions);
   spec=new itemSpec("data","Format","Object");
   s=spec.appendChild("","Scaling","Label");
   s=spec.appendChild("scale","Zoom (%)","Number");
   s.changer=updateFormat.bind(null,canvas);
   s=spec.appendChild("scaleFont","Font (pt)","Number");
   s.changer=updateFormat.bind(null,canvas);
   s=spec.appendChild("scaleLine","Line spacing","Number");
   s.changer=updateFormat.bind(null,canvas);
   s=spec.appendChild("","Plot","Label");
   s=spec.appendChild("plotWidth","Width (cm)","Number");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("plotHeight","Height (cm)","Number");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("","Margins","Label");
   s=spec.appendChild("plotPosX","Left (cm)","Number");
   s.changer=updateFormat.bind(null,plotOptions);
   s=spec.appendChild("plotPosY","Bottom (cm)","Number");
   s.changer=updateFormat.bind(null,plotOptions);
   for(i in canvas){obj[i]=canvas[i];};
   obj.scale*=100;
   obj.scaleFont=Math.round(obj.scaleFont*13.75,1);
   break;
  case "Adjust":
   if(plotOptions.multiPlot)
   {
    format("Multiplot");
   }
   else
   {
    format("Single");
   };
   return;
  case "Single":
   app.prompt("Single plot",plotInfo,adjustSpec).then(function(rpl){
    plotOptions.multiPlot=false;     
    plotInfo=rpl;
    setValues(adjustSpec);
   }).catch(function(rpl){});
   return;
  case "Multiplot":
   memI=app.clone(plotInfo);  // used if single plot shown from adjuster
   app.prompt("Multiplot",multiPlots,multiSpec).then(function(rpl){
    multiPlots=rpl;
    setValues(adjustSpec);
   }).catch(function(rpl){plotInfo=memI;plotOptions.multiPlot=true;setValues(adjustSpec);});
   return;
  };
  plotIFrame.style.backgroundColor="";
  app.prompt(mode,obj,spec).then(function(){}).catch(function(){
   if(memC){canvas=memC;};
   plotOptions=memO;
   setValues();
  }).finally(function(){
   saveDefaults();
   if(plotOptions.background.indexOf("rgba")==-1)
   {
    plotIFrame.style.backgroundColor=plotOptions.background;
   }
   else
   {
    plotIFrame.style.backgroundColor="";
   };
  });
 };
 
 
 function zoom(no)
 {
  canvas.scale*=no;
  if(canvas.scale==0){canvas.scale=1;};
  setValues(canvasSpec,true);
 };
 function centrePlotInf(pi)
 {
  if(!pi.autox){pi.autox=1;};
  if(!pi.autoy){pi.autoy=1;};
 };
 function changeMinXInf(pi,no)
 {
  switch(pi.nonlinx)
  {
  case "log":
   pi.minx=Math.log(pi.minx);
   pi.maxx=Math.log(pi.maxx);
   break;
  };
  var ch;
  ch=no*(pi.maxx-pi.minx);
  pi.minx+=ch;
  pi.maxx+=ch;
  pi.autox=0;
  switch(pi.nonlinx)
  {
  case "log":
   pi.minx=Math.exp(pi.minx);
   pi.maxx=Math.exp(pi.maxx);
   break;
  };
  if(pi.mapPlot){pi.autoy=0;};
 };
 function changeMinYInf(pi,no)
 {
  function mercator(lat)
  {
   lat=Math.PI*lat/180;
   return 180*Math.log(1/Math.cos(lat)+Math.tan(lat))/Math.PI;
  };
  function inv_mercator(lat)
  {
   return 360*Math.atan(Math.exp(Math.PI*lat/180))/Math.PI-90;
  };
  switch(pi.nonliny)
  {
  case "log":
   pi.miny=Math.log(pi.miny);
   pi.maxy=Math.log(pi.maxy);
   break;
  case "mercator":
   pi.miny=mercator(pi.miny);
   pi.maxy=mercator(pi.maxy);
   break;
  };
  var ch;
  ch=no*(pi.maxy-pi.miny);
  pi.miny+=ch;
  pi.maxy+=ch;
  pi.autoy=0;
  switch(pi.nonliny)
  {
  case "log":
   pi.miny=Math.exp(pi.miny);
   pi.maxy=Math.exp(pi.maxy);
   break;
  case "mercator":
   pi.miny=inv_mercator(pi.miny);
   pi.maxy=inv_mercator(pi.maxy);
   break;
  };
  if(pi.mapPlot){pi.autox=0;};
 };
 function changeXRangeInf(pi,no,only)
 {
  switch(pi.nonlinx)
  {
  case "log":
   pi.minx=Math.log(pi.minx);
   pi.maxx=Math.log(pi.maxx);
   break;
  };
  var ch;
  ch=(no-1)*(pi.maxx-pi.minx);
  if(pi.minx==0)
  {
   pi.maxx+=ch;
  }
  else
  {
   pi.minx-=ch/2;
   pi.maxx+=ch/2;
  };
  pi.autox=0;
  if(pi.mapPlot){pi.autoy=0;};
  switch(pi.nonlinx)
  {
  case "log":
   pi.minx=Math.exp(pi.minx);
   pi.maxx=Math.exp(pi.maxx);
   break;
  };
  if(pi.mapPlot && !only)
  {
   changeYRangeInf(pi,no,true);
  };
 };
 function changeYRangeInf(pi,no,only)
 {
  function mercator(lat)
  {
   lat=Math.PI*lat/180;
   return 180*Math.log(1/Math.cos(lat)+Math.tan(lat))/Math.PI;
  };
  function inv_mercator(lat)
  {
   return 360*Math.atan(Math.exp(Math.PI*lat/180))/Math.PI-90;
  };
  switch(pi.nonliny)
  {
  case "log":
   pi.miny=Math.log(pi.miny);
   pi.maxy=Math.log(pi.maxy);
   break;
  case "mercator":
   pi.miny=mercator(pi.miny);
   pi.maxy=mercator(pi.maxy);
   break;
  };
  var ch;
  ch=(no-1)*(pi.maxy-pi.miny);
  if(pi.miny==0)
  {
   pi.maxy+=ch;
  }
  else
  {
   pi.miny-=ch/2;
   pi.maxy+=ch/2;
  };
  pi.autoy=0;
  if(pi.mapPlot){pi.autox=0;};
  switch(pi.nonliny)
  {
  case "log":
   pi.miny=Math.exp(pi.miny);
   pi.maxy=Math.exp(pi.maxy);
   break;
  case "mercator":
   pi.miny=inv_mercator(pi.miny);
   pi.maxy=inv_mercator(pi.maxy);
   break;
  };
  if(pi.mapPlot && !only)
  {
   changeXRangeInf(pi,no,true);
  };
 };
 function singlePlotAction(func,gr,no)
 {
  var ch;
  if(gr=="ColorScale")
  {
   switch(func)
   {
   case changeYRangeInf: 
    ch=(no-1)*(plotColor.maxz-plotColor.minz);
    if(plotColor.minz==0)
    {
     plotColor.maxz+=ch;
    }
    else
    {
     plotColor.minz-=ch/2;
     plotColor.maxz+=ch/2;
    };
    plotColor.autoz=0;
    break;
   case changeMinYInf:
    ch=no*(plotColor.maxz-plotColor.minz);
    plotColor.minz+=ch;
    plotColor.maxz+=ch;
    plotColor.autoz=0;
    break;
   };
   setValues(colorSpec,true);
   return;
  };
  switch(func)
  {
  case changeYRangeInf: case changeMinYInf:
   if(multiPlots.tiedYAxes){gr=multiPlots.firstPlot;};break;
  case changeXRangeInf: case changeMinXInf:  
   if(multiPlots.tiedXAxes){gr=multiPlots.firstPlot;};break;
  };
//  multiSpec.emptyContainer();
  func(multiPlots.plots[gr],no);
//  multiSpec.fillContainer();
  setValues(multiSpec,true);
 };
 function plotAction(func,no)
 {
  var i;
  if(plotOptions.multiPlot)
  {
//   multiSpec.emptyContainer();
   for(i=0;i<multiPlots.plots.length;i++)
   {
    func(multiPlots.plots[i],no);
   };
//   multiSpec.fillContainer();
   setValues(multiSpec,true);
  }
  else
  {
   func(plotInfo,no);
   setValues(adjustSpec,true);
  };
 };
 function centrePlot()
 {
  plotAction(centrePlotInf);
 };
 function changeMinX(no)
 {
  plotAction(changeMinXInf,no);
 };
 function changeMinY(no)
 {
  plotAction(changeMinYInf,no);
 };
 function changeXRange(no)
 {
  plotAction(changeXRangeInf,no);
 };
 function changeYRange(no)
 {
  plotAction(changeYRangeInf,no);
 };
 function smallerFont()
 {
  canvas.scaleFont/=1.0443;
  if(!canvas.scaleFont){canvas.scaleFont=0.8;};
  setValues(canvasSpec,true);
 };
 function largerFont()
 {
  canvas.scaleFont*=1.0443;
  if(!canvas.scaleFont){canvas.scaleFont=0.8;};
  setValues(canvasSpec,true);
 };
 function narrowerFont()
 {
  canvas.scaleLine/=1.0443;
  if(!canvas.scaleLine){canvas.scaleLine=1.0;};
  setValues(canvasSpec,true);
 };
 function widerFont()
 {
  canvas.scaleLine*=1.0443;
  if(!canvas.scaleLine){canvas.scaleLine=1.0;};
  setValues(canvasSpec,true);
 };
 function toggleMarkers()
 {
  var i,no,state;
  for(no=0,i=0;i<plotData.length;i++)
  {
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   if(no==0)
   {
    state=(plotData[i].marker=="");
   };
   if(state)
   {
    if(plotData[i].mem_marker)
    {
     plotData[i].marker=plotData[i].mem_marker;
    }
    else
    {
     plotData[i].marker=markers[no % 6 + 1];
    };
   }
   else
   {
    plotData[i].mem_marker=plotData[i].marker;
    plotData[i].marker="";
   };
   no++;
  };
  setValues(dataSpec);
 };
 function toggleLines()
 {
  var i,no,state;
  for(no=0,i=0;i<plotData.length;i++)
  {
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   if(no==0)
   {
    state=(plotData[i].line=="");
   };
   if(state)
   {
    if(plotData[i].mem_line)
    {
     plotData[i].line=plotData[i].mem_line;
    }
    else
    {
     plotData[i].line="solid";
    };
   }
   else
   {
    plotData[i].mem_line=plotData[i].line;
    plotData[i].line="";
   };
   no++;
  };
  setValues(dataSpec);
 };
 function toggleEllipses()
 {
  var i,no,state;
  for(no=0,i=0;i<plotData.length;i++)
  {
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   if(no==0)
   {
    state=(plotData[i].contour!="Ellipse");
   };
   if(state)
   {
    plotData[i].contour="Ellipse";
   }
   else
   {
    plotData[i].contour="";
   };
   no++;
  };
  setValues(dataSpec);
 };
 function toggleKDEContours()
 {
  var i,no,state;
  for(no=0,i=0;i<plotData.length;i++)
  {
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   if(no==0)
   {
    state=(plotData[i].contour!="KDE");
   };
   if(state)
   {
    plotData[i].contour="KDE";
   }
   else
   {
    plotData[i].contour="";
   };
   no++;
  };
  setValues(dataSpec);
 };
 function setUpMatrix(variables)
 {
  var i,j,k,l,ok;
  var row,m;
  var items=variables.split(",");
  var matrixData=new Array();
  var rowNames=new Array();
  var colNames=new Array();
  l=0;
  // grab all of the data and index it
  for(i=0;i<plotData.length;i++)
  {
   var dta=new matrix(0,items.length);
   if(!plotData[i].selected){continue;};
   if(plotData[i].singleOnly){continue;};
   for(j=0;j<plotData[i].data.length;j++)
   {
    row=new Array();
    ok=true;
    for(k=0;k<items.length;k++)
    {
     if(isNaN(plotData[i].data[j][items[k]]))
     {
      ok=false;
     }
     else
     {
      row[k]=Number(plotData[i].data[j][items[k]]);
     };
    };
    if(ok)
    {
     dta.m.push(row);
     dta.rows++;
    };
   };
   if(dta.rows<2){continue;};
   plotCalc[i].fullKDE=new kde(dta.rows,dta.columns,dta.m);
   plotCalc[i].fullKDE.pca_setup();
   matrixData.push(i);
   if(l<26)
   {
    rowNames.push(String.fromCharCode(65+l)+" - "+plotData[i].name);
    colNames.push(String.fromCharCode(65+l));
   }
   else
   {
    rowNames.push(String.fromCharCode(65+Math.floor(l/26),65+l%26)+" - "+plotData[i].name);
    colNames.push(String.fromCharCode(65+Math.floor(l/26),65+l%26));
   };
   l++;
  };
  m=new matrix(matrixData.length,matrixData.length);
  m.matrixData=matrixData;
  m.rowNames=rowNames;
  m.colNames=colNames;
  m.variables=variables;
  return m;
 };
 function bivariateList()
 {
  if(plotInfo.title=="PCA"){return "PC1,PC2";};
  var items=plotInfo.pcaVariables.split(",");
  if(items.length>2){items.length=2;};
  return items.join(",");
 };
 var kdeMatrix;
 function findKDEMatrix(variables)
 {
  var i,j;
  kdeMatrix=setUpMatrix(variables);
  kdeMatrix.colTitle="KDE probability distributions ("+kdeMatrix.variables+")";
  kdeMatrix.rowTitle="Datasets";
  for(i=0;i<kdeMatrix.matrixData.length;i++)
  {
   for(j=0;j<kdeMatrix.matrixData.length;j++)
   {
    kdeMatrix.m[i][j]=
     plotCalc[kdeMatrix.matrixData[j]].fullKDE.kde_rel_prob(
     	plotCalc[kdeMatrix.matrixData[i]].fullKDE.data);
   };
  };
  var el=document.getElementById("toolArea");
  while(el.firstChild)
  {
   el.removeChild(el.firstChild);
  };
  el.appendChild(kdeMatrix.display(5,'object'));
  app.showTool("Tool");
 };
 function exportKDEMatrix()
 {
  dataContent=kdeMatrix.output(5,true);
  app.fileSaveAs("Data","csv");
 };
 var ellipsoidMatrix;
 function findEllipsoidMatrix(variables)
 {
  var i,j;
  ellipsoidMatrix=setUpMatrix(variables);
  ellipsoidMatrix.colTitle="Multivatiate normal probability distributions ("+ellipsoidMatrix.variables+")";
  ellipsoidMatrix.rowTitle="Datasets";
  for(i=0;i<ellipsoidMatrix.matrixData.length;i++)
  {
   for(j=0;j<ellipsoidMatrix.matrixData.length;j++)
   {
    ellipsoidMatrix.m[i][j]=
     plotCalc[ellipsoidMatrix.matrixData[j]].fullKDE.ellipsoid_rel_prob(
     	plotCalc[ellipsoidMatrix.matrixData[i]].fullKDE.data);
   };
  };
  var el=document.getElementById("toolArea");
  while(el.firstChild)
  {
   el.removeChild(el.firstChild);
  };
  el.appendChild(ellipsoidMatrix.display(5,'object'));
  app.showTool("Tool");
 };
 function exportEllipsoidMatrix()
 {
  dataContent=ellipsoidMatrix.output(5,true);
  app.fileSaveAs("Data","csv");
 };
 
 // player functions
 
function playerSetup(live)
{
 el=document.getElementById("PlayerMenu__8");
 playerSlider=el.lastChild;
 if(live)
 {
  playerFooter.style.display="block";
  plotFrame.style.bottom="30px";
 }
 else
 {
  playerFooter.style.display="none";
  plotFrame.style.bottom="0px";
 };
};

function playerValueWrite(t)
{
 if(t==null){return t;};
 switch(plotPlayer.t_units)
 {
 case "AD":case "CE":
  return Math.round(t-0.5);
 case "BCE":case "BC":
  return Math.round(1.5-t);
 case "calBP":
  return Math.round(1950.5-t);
 case "b2k":
  return Math.round(2000-t);
  break;
 };
 return t;
};
function playerValueRead(t)
{
 if(t==null){return t;};
 switch(plotPlayer.t_units)
 {
 case "AD":case "CE":
  return t+0.5;
 case "BCE":case "BC":
  return 1.5-t;
 case "calBP":
  return 1950.5-t;
 case "b2k":
  return 2000-t;
  break;
 };
 return t;
};
function playerLabel(t)
{
 t=playerValueWrite(t);
 if(t==null){return "";};
 if(t<1)
 {
  switch(plotPlayer.t_units)
  {
  case "AD": return((1-t)+"BC");
  case "BC": return((1-t)+"AD");
  case "CE": return((1-t)+"BCE");
  case "BCE": return((1-t)+"CE");
  };
 };
 return t+plotPlayer.t_units;
};
function playerValueShow(spec)
{
 spec.appendComplexText(spec.container,playerLabel(spec.object));
};
function player()
{
 var i,el,v,prob,opac,mx,k,kmin,kmax,cm,j;
 if(plotOptions.probMax=="NaN"){findMaxProbs(plotData,plotPlayer);};
 if(!plotPlayer.normalise){plotOptions.probMax=1;};
 cm=plotOptions.currentMax;
 if(plotOptions.multiPlot)
 {
  kmin=1;
  kmax=1+Math.round((plotPlayer.maxt-plotPlayer.mint)
  	/plotOptions.mapPlotMultiIncr);
  cm=Math.round(cm/kmax);
 }
 else
 {
  kmin=0;kmax=0;
 };
 if(isNaN(plotOptions.current)){plotOptions.current=0;};
 if(plotOptions.current<0){plotOptions.current=0;};
 if(plotOptions.current>cm){plotOptions.current=cm;};
 calcData(false);
 frames[0].plotCalc=plotCalc;
 frames[0].draw();
 for(k=kmin;k<=kmax;k++)
 {
  v=plotPlayer.mint
  	+(plotPlayer.maxt-plotPlayer.mint)
  	*plotOptions.current/plotOptions.currentMax;
  if(k>0){v+=(k-1)*plotOptions.mapPlotMultiIncr;};
  if(k)
  {
   el=frames[0].document.getElementById("title"+k);
  }
  else
  {
   el=frames[0].document.getElementById("title");
  };
  if(el)
  {
   if(el.firstChild){el.removeChild(el.firstChild);};
   el.appendChild(frames[0].document.createTextNode(playerLabel(v)));
   };
  if(plotPlayer.color)
  {
   if(plotColor.autoz)
   {
    findProxyLevels(plotColor,plotData);
    setValues(colorSpec,true);
   };
   for(i=0;i<plotData.length;i++)
   {
    if(k)
    {
     el=frames[0].document.getElementById(
    	plotData[i].id.replace("_proxy","")+"_loc_"+k);
    }
    else
    {
     el=frames[0].document.getElementById(
    	plotData[i].id.replace("_proxy","")+"_loc");
    };
    if(el)
    {
     setProxyColor(el,plotData[i].id,v,k);
    };
   };
   continue;
  };
  setDataProbs(plotData,plotPlayer,v,k);
 };
 frames[0].firstTime=false;
 playerShowPlace(100*plotOptions.current/plotOptions.currentMax,playerLabel(v));
 if(plotOptions.backwards){plotOptions.current-=0.5;}else{plotOptions.current+=0.5;};
 if((plotOptions.current<0)||(plotOptions.current>cm))
 {
  if(ticker)
  {clearInterval(ticker);ticker=false;};
 };
};
 
 function playerRewind()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerRewind)
  {
   editOptions.window.playerRewind();return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=true;
  ticker=setInterval(player,50);
 };
 function playerPause()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerPause)
  {
   editOptions.window.playerPause();return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
 };
 function playerNudgeBack()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerNudgeBack)
  {
   editOptions.window.playerNudgeBack();return;
  };
  if(!plotOptions.backwards){plotOptions.current++;plotOptions.current++;};
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=true;
  player();
 };
 function playerNudgeForward()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerNudgeForward)
  {
   editOptions.window.playerNudgeForward();return;
  };
  if(plotOptions.backwards){plotOptions.current--;plotOptions.current--;};
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=false;
  player();
 };
 function playerBack()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerBack)
  {
   editOptions.window.playerBack();return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=true;
  ticker=setInterval(player,200);
 };
 function playerPlay()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerPlay)
  {
   editOptions.window.playerPlay();return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=false;
  ticker=setInterval(player,200);
 };
 function playerFastForward()
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerFastForward)
  {
   editOptions.window.playerFastForward();return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=false;
  ticker=setInterval(player,50);
 };
 function playerWeight(id,multi)
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerWeight)
  {
   return editOptions.window.playerWeight(id,multi);
  };
  var v,d=dataIndex[id],m,s,pnt;
  if(!d){return 0;};
  pnt=playerVal(plotPlayer,d,v);
  m=pnt.m;s=pnt.s;
  v=plotPlayer.mint
  	+(plotPlayer.maxt-plotPlayer.mint)
  	*plotOptions.current/plotOptions.currentMax;
  if(typeof(multi)!='undefined')
  {
   v+=multi*plotOptions.mapPlotMultiIncr;
  };
  return Math.exp(-(v-m)*(v-m)/(2*s*s))/(s*SQRT2PI);
 };
 var showingPlace=false;
 function playerSetPlace(val)
 {
  if(!plotPlayer.showPlayer && editOptions.window.playerSetPlace)
  {
   editOptions.window.playerSetPlace(val);return;
  };
  if(ticker){clearInterval(ticker);ticker=false;};
  plotOptions.backwards=false;
  plotOptions.current=Math.round(val*plotOptions.currentMax/100);
  player();
 };
 function playerShowPlace(val)
 {
  playerSlider.lastChild.style.left=Math.round(val*(playerSlider.clientWidth-playerSlider.clientHeight)/100)+"px";
 };
 function playerMover()
 {
  var e=app.sliderInput,pos;
  if(e.type=="down"||((e.type=="move")&&(e.which==1)))
  {
   pos=100*(e.x-playerSlider.getBoundingClientRect().left-playerSlider.clientHeight/2)/(playerSlider.clientWidth-playerSlider.clientHeight);
   if(pos<0){pos=0;};if(pos>100){pos=100;};
   playerSetPlace(pos);
  };
  return;
 };

function findMaxProbs(pd,pp)
{
 var i,j,m,s,prob,el,id,pun,pnt,sumMax,sm;
 plotOptions.suppressCircles=false;
 for(i=0;i<pd.length;i++)
 {
  for(j=0;j<pd[i].data.length;j++)
  {
   m=null;
   if(typeof(pd[i].data[j].id)=="undefined"){continue;};
   el=frames[0].document.getElementById(pd[i].data[j].id);
   if(!el){continue;};
   if(el.tagName.toLowerCase()!='circle'){plotOptions.suppressCircles=true;};
   if((typeof(pd[i].data[j][pp.t_calc])=='number')&&(typeof(pd[i].data[j][pp.t_calc+"_sigma"])=='number'))
   {
    m=pd[i].data[j][pp.t_calc];s=pd[i].data[j][pp.t_calc+"_sigma"];
   };
   if((m==null)&&(typeof(pd[i].data[j]["mean"])=='number')&&(typeof(pd[i].data[j]["sigma"])=='number'))
   {
    m=pd[i].data[j]["mean"];s=pd[i].data[j]["sigma"];
   };
   if(m==null){continue;};
   switch(pp.autot)
   {
   case 1:
    if(((m+3*s)>pp.maxt)||(typeof(pp.maxt)!='number')){pp.maxt=m+3*s;};
    if(((m-3*s)<pp.mint)||(typeof(pp.mint)!='number')){pp.mint=m-3*s;};
    break;
   case 2:
    if(((m+3*s)>pp.mint)||(typeof(pp.mint)!='number')){pp.mint=m+3*s;};
    if(((m-3*s)<pp.maxt)||(typeof(pp.maxt)!='number')){pp.maxt=m-3*s;};
    break;
   };
   dataIndex[pd[i].data[j].id]=pd[i].data[j];
   prob=1/(s*SQRT2PI);
   if((plotOptions.probMax=="NaN")||(prob>plotOptions.probMax)){plotOptions.probMax=prob;};
  };
 };
 sumMax=0;
 for(plotOptions.current=0;plotOptions.current<plotOptions.currentMax;plotOptions.current++)
 {
  sm=0;
  for(i in dataIndex)
  {
   sm+=playerWeight(i);
  };
  if(sm>sumMax){sumMax=sm;};
 };
 plotOptions.current=0;
 el=document.getElementById("PlayerMenu__7");
 el.removeChild(el.firstChild);
 el.appendChild(document.createTextNode(this.playerLabel(pp.mint)));
 el=document.getElementById("PlayerMenu__9");
 el.removeChild(el.firstChild);
 el.appendChild(document.createTextNode(this.playerLabel(pp.maxt)));
 plotOptions.contourProbMax=sumMax;
};
 
function playerVal(pp,d,v)
{
 var m=null,s=null;
 if((typeof(d[pp.t_calc])=='number')&&(typeof(d[pp.t_calc+"_sigma"])=='number'))
 {
  m=d[pp.t_calc];s=d[pp.t_calc+"_sigma"];
 };
 if((m==null)&&(typeof(d["mean"])=='number')&&(typeof(d["sigma"])=='number'))
 {
  m=d["mean"];s=d["sigma"];
 };
 return {"m":m,"s":s};
};
function setDataProbs(pd,pp,v,k)
{
 var i,j,m,s,prob,el,el_err,id,pun,pnt;
 var mx=plotOptions.probMax;
 for(i=0;i<pd.length;i++)
 {
  for(j=0;j<pd[i].data.length;j++)
  {
   m=null;
   if(typeof(pd[i].data[j].id)=="undefined"){continue;};
   pnt=playerVal(pp,pd[i].data[j],v);
   m=pnt.m;s=pnt.s;
   id=pd[i].data[j].id;
   if(k){id+-"_"+k;};
   el=frames[0].document.getElementById(id);
   if(el_err=frames[0].document.getElementById(id+"_err"))
   {
    el_err.style.display="none";
   };
   if(!el){continue;};
   if(m==null)
   {
    prob=pun=0;
   }
   else
   {
    prob=pun=Math.exp(-(v-m)*(v-m)/(2*s*s));
    if(pp.normalise){prob=prob/(s*SQRT2PI);};
   };
   if((prob/mx)*plotPlayer.circleZoom > 0.001)
   {
    if(plotColor.dz_calc)
    {
     el.style.opacity=pun;
    }
    else
    {
     if((!plotOptions.suppressCircles) && (el.tagName.toLowerCase()=="circle"))
     {
      el.setAttributeNS(null,"r",Math.sqrt(prob/mx)*10*frames[0].font_scale*plotPlayer.circleZoom);
     }
     else
     {
      el.setAttributeNS(null,"opacity",pun);
     };
    };
    el.style.display="block";
   }
   else
   {
    el.style.display="none";
   };
  };
 };
};
 
function findProxyLevels(pc,pd)
{
 var i,j,r;
 pc.showKey=false;
 pc.zlabel=pc.z_calc;
 pc.showKey=true;
 pc.minz="auto";
 pc.maxz="auto";
 pc.min_col="rgb(0,0,255)";
 pc.max_col="rgb(255,0,0)";
 for(i=0;i<pd.length;i++)
 {
  for(j=0;j<pd[i].data.length;j++)
  {
   if((typeof(pd[i].data[j][pc.z_calc])=='undefined')||
   	isNaN(pd[i].data[j][pc.z_calc])){continue;};
   if((pc.minz=="auto")||(pd[i].data[j][pc.z_calc]<pc.minz))
   {
    pc.minz=pd[i].data[j][pc.z_calc];
   };
   if((pc.maxz=="auto")||(pd[i].data[j][pc.z_calc]>pc.maxz))
   {
    pc.maxz=pd[i].data[j][pc.z_calc];
   };
  };
 };
 if(pc.autoz==2)
 {
  r=pc.minz;
  pc.minz=pc.maxz;
  pc.maxz=r;
 };
 pc.autoz=0;
};

function setProxyColor(el,id,v,k)
{
 var i,min,max,mid,incr,val,tst,rev;
 for(i=0;i<plotData.length;i++)
 {
  if(plotData[i].id==id)
  {
   if(!plotData[i].data.length){continue;};
   if(typeof(plotData[i].data[0][plotColor.z_calc])=='undefined')
   {continue;};
   min=0;max=plotData[i].data.length;
   while(isNaN(plotData[i].data[min][plotPlayer.t_calc])&&(min<max-1))
   {min++;};
   while(isNaN(plotData[i].data[max-1][plotPlayer.t_calc])&&(min<max-1))
   {max--;};
   rev=plotData[i].data[min][plotPlayer.t_calc] >  
   		plotData[i].data[max-1][plotPlayer.t_calc];
   while(max>min+1)
   {
    mid=Math.floor((max+min)/2);
    tst=plotData[i].data[mid][plotPlayer.t_calc];
    if(rev)
    {
     if(tst<v){max=mid;}else{if(tst>v){min=mid;}else{break;};};
    }
    else
    {
     if(tst>v){max=mid;}else{if(tst<v){min=mid;}else{break;};};
    };
   };
   mid=Math.floor((max+min)/2);
   val=plotData[i].data[mid][plotColor.z_calc];
   if((mid+1)<plotData[i].data.length)
   {
    val+=(plotData[i].data[mid+1][plotColor.z_calc]-val)*
     (v-plotData[i].data[mid][plotPlayer.t_calc])/
     (plotData[i].data[mid+1][plotPlayer.t_calc]- plotData[i].data[mid][plotPlayer.t_calc]);
   }
   else
   {
    val="NaN";
   };
   if((mid==0)||isNaN(plotData[i].data[mid-1][plotColor.z_calc]))
   {
    val="NaN";
   };
   if(k)
   {
    el=frames[0].document.getElementById(id.replace("_proxy","")+"_loc_"+k);
    if(!el){return;};
   };
   val=frames[0].colorValue(val);
   el.setAttributeNS(null,"style","fill:"+val+";fill-opacity:1;stroke:"
       +val+";stroke-opacity:1;display:block");  
   el.setAttributeNS(null,"r",4*frames[0].font_scale*
   		plotPlayer.circleZoom);
  };
 };
};

 
 // movement controls
 var move_p_switch=false;
 function move_p(event)
 {
  if (event.preventDefault){event.preventDefault();};
  switch(event.type)
  {
  case "mousedown": move_p_switch=true;break;
  case "mouseout": move_p_switch=false;return;
  case "mouseup": move_p_switch=false;break;
  case "mousemove":if(!move_p_switch){return;};break;
  };
  playerSetPlace(Math.round((event.clientX-470)/3));
 };
 
 // Google maps api key
 function googleMapsKey()
 {
  var str;
  str=getCookie('googleMapAPI');
  if(str&&(str!='undefined')){return '&key='+str;};
  str=prompt("Google Map API key");
  if(str)
  {
   setCookie('googleMapAPI',str);
   return '&key='+str;
  };
  return '';
 };
