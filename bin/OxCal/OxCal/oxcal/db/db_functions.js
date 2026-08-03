// Database system - generic functions for database access
// (c) Christopher Bronk Ramsey 2007

// global variables
var args;
var thisPage;
var isSearch=false;
var dbData=new Array;
var dbDataSpec=new Array;
var dbPlotKey="";
var dbPlotWindow;
var dbMapWindow;
var emailAction="databaseAction('Save')";
var spec,s; //used by db_functions.php for temporary storage

function initialise()
{
 var i,j,spc,area,obj;
 if(typeof(specialViews) != "undefined")
 {
  specialViews();
 };
 checkViews();
 if(typeof(specialInitialise) != "undefined")
 {
  specialInitialise();
 };
 toolbarMenu();
 for(i=0;i<dbData.length;i++)
 {
  if(thisPage && thisPage.search.views.length)
  {
   if(!thisPage.search.views[i].view){continue;};
   // index them
   if(thisPage.search.views[i].tab)
   {
    obj={};
    spc=new itemSpec('disp_',"","Object");
    spc.tabbed=true;spc.inline=true;
    for(j=i;(j<dbData.length) && (thisPage.search.views[j].tab);j++)
    {
     obj[dbDataSpec[j].name]=dbData[j];
     spc.appendChildSpec(dbDataSpec[j]);
    };
    document.getElementById("data"+i).appendChild(spc.createDisplay(obj))
    i=j;
/*    for(j=i;(j<dbData.length) && (thisPage.search.views[j].tab);j++)
    {
     if(!thisPage.search.views[i].view){continue;};     document.getElementById("data_"+i+"_"+(j-i)).appendChild(dbDataSpec[j].createDisplay(dbData[j]));
    };
    makeActive("data_"+i+"_",0,true);
    i=j;*/
   };
  };
  if(i<dbData.length)
  {
   if(thisPage && thisPage.search.views.length)
   {
    if(!dbDataSpec[i]){continue;};
   };
   area=document.getElementById("data"+i);
   if(area)
   {
    document.getElementById("data"+i).appendChild(dbDataSpec[i].createDisplay(dbData[i]));
   };
  };
 };
 if((args.auto) && (!isSearch) && (dbData.length==0))
 {
  databaseAction("search");
  return;
 };
 if((!dbData.length)&&thisPage)
 {
  if((thisPage.search.views.length)||(thisPage.page=='search'))
  {
   showSearch();
  };
 };
};

function getCookie(name)
{
 var str;
 var cookies
 var i;
 var cookie;
 var re;
 str=document.cookie+"";
 if(str!="")
 {
  re=/\s*;\s*/;
  cookies=str.split(re);
  for(i=0;i<cookies.length;i++)
  {
   re=/\s*=\s*/;
   cookie=cookies[i].split(re);
   if(cookie.length==2)
   {
    if(name==cookie[0])
    {
     return decodeURIComponent(cookie[1]);
    };
   };
  };
  return "undefined";
 };
 return "undefined";
};
function setCookie(name,value)
{
 var expireDate = new Date();
 expireDate.setFullYear(expireDate.getFullYear()+1);
 document.cookie=name+"="+encodeURIComponent(value)+";expires="+expireDate.toGMTString()+";path=/";
};

function openPlotter(incl)
{
 dbPlotWindow=window.open("","Plotter");
 if(dbPlotWindow.editOptions)
 {
  dbPlotWindow.focus();
  dbPlotWindow.editOptions.window=window;
  dbPlotWindow.setDataTables();
 }
 else
 {
  if(incl)
  {
   dbPlotWindow=window.open("../oxplot/OxPlot.html?incl="+incl,"Plotter");
  }
  else
  {
   dbPlotWindow=window.open("../oxplot/OxPlot.html","Plotter");
  };
 };
};

function openMapper(incl)
{
 dbMapWindow=window.open("","Mapper");
 if(dbMapWindow.editOptions)
 {
  dbMapWindow.focus();
  dbMapWindow.editOptions.window=window;
  dbMapWindow.setDataTables();
 }
 else
 {
  if(incl)
  {
   dbMapWindow=window.open("../oxplot/OxPlot.html?incl="+incl,"Mapper");
  }
  else
  {
   dbMapWindow=window.open("../oxplot/OxPlot.html","Mapper");
  };
 };
};

function getWeek(year,month,day){
    //lets calc weeknumber the cruel and hard way :D
    //Find JulianDay 
    month += 1; //use 1-12
    var a = Math.floor((14-(month))/12);
    var y = year+4800-a;
    var m = (month)+(12*a)-3;
    var jd = day + Math.floor(((153*m)+2)/5) + 
                 (365*y) + Math.floor(y/4) - Math.floor(y/100) + 
                 Math.floor(y/400) - 32045;      // (gregorian calendar)    
    //now calc weeknumber according to JD
    var d4 = (jd+31741-(jd%7))%146097%36524%1461;
    var L = Math.floor(d4/1460);
    var d1 = ((d4-L)%365)+L;
    NumberOfWeek = Math.floor(d1/7) + 1;
    return NumberOfWeek;        
}

function fieldCheck(spc)
{
 // note: does not check items with a non-null drop-down
 if(spc.object){return;};
 if(!spc.parent){return;};
 if(!spc.parent.object){return;};
 if(!spc.parent.object.created){return;};
 if(typeof(toolbar.options[spc.name])!="undefined")
 {
  spc.object=toolbar.options[spc.name];
  return;
 };
 if(typeof(args[spc.name])!="undefined")
 {
  spc.object=dbRead(args[spc.name],spc.type);
  return;
 };
 if(typeof(dbData[0][spc.name])!="undefined")
 {
  spc.object=dbData[0][spc.name];
  return;
 };
 if(database.fields[spc.name])
 {
  if(database.fields[spc.name].defaultValue)
  {
   spc.object=database.fields[spc.name].defaultValue;
   return;
  };
 };
};

function hideMenus()
{
 if((!thisPage)||(dbData.length))
 {
  makeActive('main',-1);
 };
};

function unwrapObject(spec)
{
 var data;
 if((typeof(spec.object)!="string")||(spec.object=='')){return;};
 if(spec.object.indexOf('data')==0)
 {
  eval(decode(spec.object));
 }
 else
 {
  data=myParseJSON(spec.object.replace(/\n/g,'\\n'));
 };
 if(!data)
 {
  switch(spec.type)
  {
  case "Object": data=new Object(); break;
  case "Array": data=new Array();break;
  };
 };
 spec.object=data;
 spec.calculator=false;
};

function checkViews()
{
 var i,j,spc,view,pageView,field;
 if(thisPage && !thisPage.search.views.length)
 {
  // see if this is a search of a view
  if(args.view && (!args.select) && (thisPage.page=='search'))
  {
   thisPage.search.views[0]=new Object();
   thisPage.search.views[0].view=database.views[Number(args.view)].view;
  };
 };
 if(!(thisPage && thisPage.search.views.length))
 {
  for(i=0;i<dbDataSpec.length;i++)
  {
   dbDataSpec[i].readonly=true;
   dbDataSpec[i].repeat=20;
  };
  return;
 };
 for(i=0;i<dbData.length;i++)
 {
  pageView=thisPage.search.views[i];
  view=database.views[pageView.view];
  if(typeof(view)=='undefined'){continue;};
  dbData[pageView.view]=dbData[i];
  dbDataSpec[pageView.view]=dbDataSpec[i];
  if((!dbDataSpec[i]) || (!view.table))
  {
   // not obtained from the database
   if(pageView.obj)
   {
    dbDataSpec[i]=new itemSpec(view.view,view.title,'Object');
   }
   else
   {
    dbDataSpec[i]=new itemSpec(view.view,view.title,'Array');
   };
  }
  else
  {
   dbDataSpec[i].name=pageView.view;
  };
  if(pageView.readonly)
  {
   dbDataSpec[i].readonly=true;
  };
  dbDataSpec[i].children.length=0;
  dbDataSpec[i].repeat=20;
  for(j=0;j<view.fields.length;j++)
  {
   field=database.fields[baseField(view.fields[j])];
   if(field)
   {
    if(field.fieldType=="Object")
    {
     spc=itemSpec.prototype.safeEval(field.special);
     dbDataSpec[i].children[dbDataSpec[i].children.length]=spc;
     spc.name=field.field;
     spc.parent=dbDataSpec[i];
     spc.calculator="unwrapObject(this)";
    }
    else
    {
     spc=dbDataSpec[i].appendChild(field.field,field.title,field.fieldType);
     if(field.width){spc.width=field.width;};
     if(field.calculator){spc.calculator=field.calculator; };
     if(field.linkPage){spc.action="dbLink(this)"; };
     if(field.editor){spc.editor=field.editor; };
     if(field.action){spc.action=field.action; };
     if(field.special){spc.special=field.special; };
     if(field.options && field.options.length){spc.options=field.options; };
     if(field.optionsDisplay && field.options.length)
     {
      spc.optionsDisplay=field.optionsDisplay;
      spc.indexOptions();
     };
    };
    if(field.fieldType=="Object")
    {
     if(!view.set[spc.name]){spc.readonly=false;};
    }
    else
    {
     spc.readonly=true;
     if(view.set[spc.name])
     {
      spc.readonly=false;
      spc.checker="fieldCheck(this)";
     };
    };
    if(view.readonly[spc.name]){spc.readonly=true;};
    if(view.hidden[spc.name]){spc.hidden=true;};
    if(view.popup[spc.name]){spc.popup=true;};    if(view.key[spc.name]){spc.checker="keyCheck(this)";};
   };
  };
 };
};

function createDataArea()
{
 var i,j;
 var men;
 for(i=0;i<dbData.length;i++)
 {
  if(thisPage && thisPage.search.views.length)
  {
   if(thisPage.search.views[i].tab)
   {
    document.writeln("<div id='data"+i+"'><\/div>");
    for(j=i;(j<dbData.length) && (thisPage.search.views[j].tab);j++)
    {
    };
    i=j;
/*    men="";
    for(j=i;(j<dbData.length) && (thisPage.search.views[j].tab);j++)
    {
     if(men){men+="|";};
     men+=database.views[thisPage.search.views[j].view].title;
    };
    document.writeln("<br/>");
    menu("data_"+i+"_",men,true);
    for(j=i;(j<dbData.length) && (thisPage.search.views[j].tab);j++)
    {
     document.writeln("<div id='data_"+i+"_"+(j-i)+"' class='option'><\/div>");
    };
    i=j;*/
   };
  };
  if(i<dbData.length)
  {
   if((i<thisPage.search.views.length)&&(!database.views[thisPage.search.views[i].view]))
   {
    document.writeln("<h3>"+thisPage.search.views[i].view+"<\/h3>");
   }
   else
   {
    document.writeln("<div id='data"+i+"'><\/div>");
   };
  };
 };
};

/* get arguments */
function getArgs()
{
 var args = new Array();  
 args.group=undefined; // override array function
 var query = document.location.search.substring(1);
 var pairs = query.split("\&");
 for(var i=0;i < pairs.length; i++)
 {
  var pos=pairs[i].indexOf('=');
  if(pos==-1){ continue;};
   var argname = pairs[i].substring(0,pos);
  var value = pairs[i].substring(pos+1);
  args[argname]=decodeURIComponent(value);
  args[i]=new Object;
  args[i].name=decodeURIComponent(argname);
  args[i].value=decodeURIComponent(value);
 };
 return args;
};

/* set up group menu for up to 7 groups */
function checkChanged(testonly)
{
 var i;
 if(dbDataSpec)
 {
  for(i=0;i<dbDataSpec.length;i++)
  {
   if(!dbDataSpec[i]){continue;};
   if(dbDataSpec[i].edit){dbDataSpec[i].makeEdit(false);};
   if(dbDataSpec[i].changed)
   {
    if(testonly){return false;};
    return confirm("Abandon unsaved changes?");
   };
  };
 };
 return true;
};
function pageClick(grp,op)
{
 var url="db.php?";
 if(!checkChanged()){return;};
 window.name=database.groups[grp].pages[op];
 if(database.pages[database.groups[grp].pages[op]].search.auto)
 {
  url+="page="+window.name+"&auto=true";
  window.location.replace("db.php?page="+window.name+"&auto=true");
 }
 else
 {
  url+="page="+window.name;
  window.location.replace("db.php?page="+window.name);
 };
 if(args.embed)
 {
  url+="&embed="+args.embed;
 };
 window.location.replace(url);
};
function fileClick(op)
{
 if(thisPage)
 {
  fileOptionSpec.emptyContainer();
  searchSpec.emptyContainer();
  databaseAction(op);
  searchSpec.fillContainer();
  fileOptionSpec.fillContainer();
 }
 else
 {
  databaseAction(op);
 };
};
function editClick(op)
{
 var i,done=false;
 switch(op)
 {
 case "View mode":
  for(i=0;i<dbDataSpec.length;i++)
  {
   if(!dbDataSpec[i].readonly)
   {
    dbDataSpec[i].makeEdit(false);
   };
  };
  break;
 case "Edit mode":
  for(i=0;i<dbDataSpec.length;i++)
  {
   if(!dbDataSpec[i].readonly)
   {
    dbDataSpec[i].makeEdit(true);
    done=true;
   };
  };
  if(!done){alert("Nothing to edit!");};
  break;
 };
};
function actionClick(op)
{
 optionSpec.emptyContainer();
 databaseAction(op);
 optionSpec.fillContainer();
};
function page0Click(op){pageClick(0,op);};
function page1Click(op){pageClick(1,op);};
function page2Click(op){pageClick(2,op);};
function page3Click(op){pageClick(3,op);};
function page4Click(op){pageClick(4,op);};
function page5Click(op){pageClick(5,op);};
function page6Click(op){pageClick(6,op);};

function innerMenu(lev)
{
 var men;
 var i,j;
 switch(lev)
 {
 case 0:
  if(args.embed)
  {
   clickmenu("file","Save|Print",true);
  }
  else
  {
   clickmenu("file","Save|Print|Change password|Logout",true);
  };
  document.writeln("<div id='fileOptions' class='toolbar'><\/div>");
  break;
 case 1:
  clickmenu("edit","View mode|Edit mode",true);
  document.writeln("<form><div id='search' class='toolbar'><\/div></form>");
  break;
 case 2:
  if(thisPage)
  {
   men="";
   for(i=0;i<thisPage.actions.length;i++)
   {
    if(i){men+="|";};
    men+=thisPage.actions[i];
   };
   if(men)
   {
    clickmenu("action",men,true);
   };
  };
  break;
 case 3:
  document.writeln("<div id='options' class='toolbar' style='left:0px'><\/div>");
  break;
 case 4:
  break;
 default:
  if(args.embed){break;}; // no navigation for embedded database
  men="";
  for(j=0;j<database.groups[lev-5].pages.length;j++)
  {
   if(j){men+="|";};
   if(database.groups[lev-5].pages[j] && database.pages[database.groups[lev-5].pages[j]])
   {
    men+=database.pages[database.groups[lev-5].pages[j]].title;
   };
  };
  clickmenu("page"+(lev-5),men);
  break;
 };
};
function checkActionMenu(item)
{
 var i;
 if(thisPage)
 {
  for(i=0;i<thisPage.actions.length;i++)
  {
   if(thisPage.actions[i]==item)
   {
    return true;
   };
  };
 };
 return false;
};
function createMenu()
{
 var men="File|Edit|View|Actions|";
 var i,j;
 if(thisPage)
 {
  if(!thisPage.actions.length)
  {
   men=men.replace("|View|","| |");
  };
  if(!thisPage.options.length)
  {
   men=men.replace("|Actions|","| |");
  };
 }
 else
 {
  men=" | | | |";
 };
 if(!args.embed)
 { // no navigation for embedded database
  for(i=0;i<database.groups.length;i++)
  {
   men+="|";
   men+=database.groups[i].title;
  };
 };
 menu("main",men,false,innerMenu);
 if(database.groups.length>7){alert("Menu groups limited to 7");};
};

/* functions to index fields and return field attributes */
function indexFields()
{
 var i,j;
 database.fieldNames=new Array();
 database.fieldIndex=new Array();
 j=0;
 for(i=0;i<database.fields.length;i++)
 {
  database.fields[i].index=i;
  database.fields[database.fields[i].field]=database.fields[i];
  if((database.fields[i].fieldType!="Button")&&(!database.fields[i].calculator))
  {
   database.fieldNames[j]=database.fields[i].title+" ("+database.fields[i].field+")";
   database.fieldIndex[j]=i;
   j++;
  };
 };
};
function fieldName(field)
{
 field=baseField(field);
 if(!database.fields[field]){return field;};
 return database.fields[field].title;
};
function fieldType(field,def)
{
 field=baseField(field);
 if(!database.fields[field]){return def;};
 return database.fields[field].fieldType;
};
function fieldAction(field)
{
 field=baseField(field);
 if(!database.fields[field]){return "";};
 if(!database.fields[field].linkPage){return "";};
 return "dbLink(this)";
};
function fieldSpecial(field)
{
 field=baseField(field);
 if(!database.fields[field]){return "";};
 return database.fields[field].special;
};
function fieldOptions(field)
{
 field=baseField(field);
 if(!database.fields[field]){return new Array();};
 return database.fields[field].options; 
};
function fieldOptionsDisplay(field)
{
 field=baseField(field);
 if(!database.fields[field]){return false;};
 if(!database.fields[field].optionsDisplay){return false;};
 return database.fields[field].optionsDisplay; 
};
function indexBooleanArray(ar)
{
 var i;
 for(i=0;i<ar.length;i++)
 {
  ar[ar[i]]=true;
 };
};
function showSearch()
{
 makeActive('main',1);
};
function indexViews()
{
 var i,j;
 database.viewNames=new Array();
 for(i=0;i<database.views.length;i++)
 {
  database.views[i].index=i;
  database.views[database.views[i].view]=database.views[i];
  database.viewNames[i]=database.views[i].title+" ("+database.views[i].view+")";
  indexBooleanArray(database.views[i].key);
  indexBooleanArray(database.views[i].set);
  indexBooleanArray(database.views[i].readonly);
  indexBooleanArray(database.views[i].hidden);
  indexBooleanArray(database.views[i].popup);
 };
};
function indexPages()
{
 var i;
 database.pageNames=new Array();
 for(i=0;i<database.pages.length;i++)
 {
  database.pages[i].index=i;
  database.pages[database.pages[i].page]=database.pages[i];
  database.pageNames[i]=database.pages[i].title;
 };
};

function indexArray(ar,field)
{
 var i,ind;
 ind=new Object;
 for(i=0;i<ar.length;i++)
 {
  ind[ar[i][field]]=i;
 };
 return ind;
};

function baseField(field)
{
 var s,r,len;
 s=field.replace(/\(/g,"").replace(/\)/g,"").split("AS");
 len=s.length;
 field=s[len-1];
 s=field.replace("DISTINCT","").replace(/ /g,"").split(".");
 len=s.length;
 r=s[len-1];
 return r;
};

function buttonAction()
{
 databaseAction(this.name.toString());
};

/* set up the search menu */
var optionSpec,searchSpec,fileSpec,actionSpec,fileOptionSpec;
var toolbar=new Object();
function toolbarMenu()
{
 var i,s,spc,srch;
 /* copy over data */
 toolbar.search=new Object;
 toolbar.options=new Object;
 toolbar.fileOptions=new Object;
 toolbar.fileOptions.exportType="csv";
 
 /* set up spec of toolbar */
 fileOptionSpec=new itemSpec("fileOptions","File options","Object");
 fileOptionSpec.dialog=true;
 spc=fileOptionSpec.appendChild("exportType","Export as","Text");
 spc.options=["tab","csv","csv (display)","csv (No BOM)","csv (disp/No BOM)","TeX","tabTeX"];
 spc=fileOptionSpec.appendChild("export","Export","Button");
 spc.action=exportData;
 spc.readonly=true;
 optionSpec=new itemSpec("options","Actions","Object");
 optionSpec.dialog=true;
 if(thisPage)
 {
  s=thisPage.options;
  for(i=0;i<s.length;i++)
  {
   spc=optionSpec.appendChild(s[i],fieldName(s[i]), fieldType(s[i],"Text"));
   if(spc.type=="Button")
   {
    spc.readonly=true;
    spc.action=buttonAction;
   };
   spc.options=fieldOptions(s[i]);
   spc.optionsDisplay=fieldOptionsDisplay(s[i]);
   if(database.fields[s[i]])
   {
    if(database.fields[s[i]].defaultValue)
    {
     toolbar.options[s[i]]=database.fields[s[i]].defaultValue;
    };
    spc.editor=database.fields[s[i]].editor;
   };
   if(args[s[i]])
   {
    toolbar.options[s[i]]=dbRead(args[s[i]],fieldType(s[i],"Text"));
   };
   spc=false;
  };
 };
 if(thisPage)
 {
  searchSpec=new itemSpec("search","Search","Object");
  searchSpec.dialog=true;
 };
 if(thisPage && thisPage.search.views.length && (thisPage.page!='search'))
 {
  s=thisPage.search.conditions;
  for(i=0;i<s.length;i++)
  {
   spc=searchSpec.appendChild(s[i].field, fieldName(baseField(s[i].field))+" "+s[i].relation, fieldType(baseField(s[i].field),"Text"));
   spc.options=fieldOptions(s[i].field);
   spc.optionsDisplay=fieldOptionsDisplay(s[i].field);
   switch(fieldType(baseField(s[i].field)))
   {
   case "Date":
    toolbar.search[s[i].field]=new Date();
    if(s[i].value)
    {
     toolbar.search[s[i].field]=myReadDate(s[i].value);
    };
    if(args[baseField(s[i].field)])
    {
     toolbar.search[s[i].field]=myReadDate(args[baseField(s[i].field)]);
    };
    if(args[s[i].field])
    {
     toolbar.search[s[i].field]=myReadDate(args[s[i].field]);
    };
    break;
   case "Number":
    toolbar.search[s[i].field]=Number(s[i].value);
    if(args[baseField(s[i].field)])
    {
     toolbar.search[s[i].field]=Number(args[baseField(s[i].field)]);
    };
    if(args[s[i].field])
    {
     toolbar.search[s[i].field]=Number(args[s[i].field]);
    };
    break;
   case "Boolean":
    toolbar.search[s[i].field]=(s[i].value=="true");
    if(args[baseField(s[i].field)])
    {
     toolbar.search[s[i].field]=(args[baseField(s[i].field)]=="true");
    };
    if(args[s[i].field])
    {
     toolbar.search[s[i].field]=(args[s[i].field]=="true");
    };
    break;
   default:
    toolbar.search[s[i].field]=s[i].value;
    if(args[baseField(s[i].field)])
    {
     toolbar.search[s[i].field]=args[baseField(s[i].field)];
    };
    if(args[s[i].field])
    {
     toolbar.search[s[i].field]=args[s[i].field];
    };
    break;
   };
   if(database.fields[baseField(s[i].field)] && (!s[i].value) && (!args[baseField(s[i].field)])&&(!args[s[i].field]))
   {
    if(database.fields[baseField(s[i].field)].defaultValue)
    {
     toolbar.search[s[i].field]=database.fields[baseField(s[i].field)].defaultValue;
    };
   };
  };
  spc=searchSpec.appendChild("search","Search","Button");
  spc.submit=true;
 }
 else
 {
  if(thisPage && (thisPage.page=='search'))
  {
   searchSpec.appendChild("select","SELECT","Text");
   spc=searchSpec.appendChild("view","FROM","Number");
   spc.options=database.viewNames;
   searchSpec.appendChild("where","WHERE","Text");
   searchSpec.appendChild("group","GROUP BY","Text");
   searchSpec.appendChild("order","ORDER BY","Text");
   searchSpec.appendChild("limit","LIMIT","Text");
   if(args.select){toolbar.search.select=args.select;};
   if(args.view){toolbar.search.view=args.view;};
   if(args.where){toolbar.search.where=args.where;};
   if(args.group){toolbar.search.group=args.group;};
   if(args.order){toolbar.search.order=args.order;};
   if(args.limit){toolbar.search.limit=args.limit;};
   spc=searchSpec.appendChild("search","Search","Button");
   spc.submit=true;
  };
 };
 spc.action=searchDatabase;
 spc.readonly=true;
 document.getElementById("fileOptions").appendChild(
   fileOptionSpec.createDisplay(toolbar.fileOptions));
 if(thisPage && thisPage.options.length)
 {
  document.getElementById("options").appendChild(
    optionSpec.createDisplay(toolbar.options));
  optionSpec.makeEdit(true);
 };
 if(thisPage)
 {
  document.getElementById("search").appendChild(
   searchSpec.createDisplay(toolbar.search));
  searchSpec.makeEdit(true);
 };
 fileOptionSpec.makeEdit(true);
};

function goDatabase(page,other,auto)
{
 var loc;
 loc="db.php";
 loc+="?page="+page;
 if(other)
 {
  loc+="&"+other;
 };
 if(args.embed)
 {
  loc+="&embed="+args.embed;
 };
 if(auto)
 {
  loc+="&auto=true";
 };
 window.name="main";
 loc=encodeURI(loc);
 if(thisPage)
 {
  if(!checkChanged(true))
  {
   window.open(loc,"popup").focus();
   return;
  };
  if((!thisPage.parent)&&(thisPage.page!=page))
  {
   if(database.pages[page].parent||(thisPage.page=='search'))
   {
    if(database.pages[page].parent!=thisPage.page)
    {
     window.open(loc,"popup").focus();
     return;
    };
   };
  };
  if(thisPage.parent)
  {
   window.name="popup";
  };
 };
 if(!checkChanged()){return;};
 window.location.replace(loc);
};

function dbLink(spec)
{
 var linkPage,obj,fld;
 var i,added=false,other="";
 if(database.fields[spec.name].linkPage.indexOf("(")!=-1)
 {
  itemSpec.prototype.safeEval.bind(spec)(database.fields[spec.name].linkPage);
 } 
 else
 {
  linkPage=database.pages[database.fields[spec.name].linkPage];
  obj=spec.parent.object;
  for(i=0;i<linkPage.search.conditions.length;i++)
  {
   fld=baseField(linkPage.search.conditions[i].field);
   if(typeof(obj[fld])!='undefined')
   {
    if(added){other+="&";};
    switch(fieldType(fld))
    {
    case "Date":
     other+=linkPage.search.conditions[i].field+"="+myWriteDate(obj[fld]);
     break;
    case "Boolean":
     if(obj[fld])
     {
      other+=linkPage.search.conditions[i].field+"=true"
     }
     else
     {
      other+=linkPage.search.conditions[i].field+"=false"
     };
     break;
    default:
     other+=linkPage.search.conditions[i].field+"="+obj[fld];
     break;
    };
    added=true;
   };
  };
  if(added)
  {
   goDatabase(database.fields[spec.name].linkPage,other,true);
  }
  else
  {
   if(spec.type=="Date")
   {
    goDatabase(database.fields[spec.name].linkPage,spec.name+"="+myWriteDate(spec.object),true);
   }
   else
   {
    goDatabase(database.fields[spec.name].linkPage,spec.name+"="+spec.object,true);
   };
  };
 };
};

function callDatabase(query,update)
{
 var i,c,u,q;
 q=document.getElementById("dbQuery");
 u=document.getElementById("dbUpdate");
 c=document.getElementById("dbCall");
 c.action="db.php?";
 if(args.page)
 {
  c.action+="page="+encodeURIComponent(args.page);
  for(i=0;i<thisPage.search.conditions.length;i++)
  {
   c.action+="&"+encodeURIComponent(thisPage.search.conditions[i].field)+"=";
   if(toolbar.search[thisPage.search.conditions[i].field].constructor==Date)
   {
    c.action+=myWriteDate(toolbar.search[thisPage.search.conditions[i].field]);
   }
   else
   {
    c.action+=encodeURIComponent(toolbar.search[thisPage.search.conditions[i].field]);
   };
  };
  if(args.page=="search")
  {
   c.action+="&select="+encodeURIComponent(toolbar.search.select);
   c.action+="&view="+encodeURIComponent(toolbar.search.view);
   c.action+="&where="+encodeURIComponent(toolbar.search.where);
   c.action+="&group="+encodeURIComponent(toolbar.search.group);
   c.action+="&order="+encodeURIComponent(toolbar.search.order);
   c.action+="&limit="+encodeURIComponent(toolbar.search.limit);
  };
  if((query) && (update==""))
  {
   c.action+="&auto=true";
  };
 };
 if(args.embed)
 {
  c.action+="&embed="+encodeURIComponent(args.embed);
 };
 q.value=query;
 u.value=update;
 c.submit();
};

// toFixxed() :
function toFixxed(num,f) 
{
  f = parseInt(f/1 || 0);
  if (f < 0 || f > 20)
    alert("The number of fractional digits is out of range");
  if ((isNaN(num))||(num==null))
    return "-";
  var s = num < 0 ? "-" : "", x = Math.abs(num);
  if (x > Math.pow(10, 21))
    return s+x.toString();
  var m = Math.round(x*Math.pow(10, f)).toString();
  if (!f)
    return s+m;
  while (m.length <= f)
    m = "0"+m;
  return s+m.substring(0, m.length-f)+"."+m.substring(m.length-f);
};

function fixed(spec,dp)
{
 if((spec.object).toFixed)
 {
  spec.specialTeX=toFixxed(spec.object,dp);
  spec.container.appendChild(document.createTextNode(spec.specialTeX));
 };
};

function fixedNotZero(spec,dp)
{
 if(spec.object)
 {
  fixed(spec,dp);
 }
 else
 {
  spec.specialTeX=" ";
 };
};

function exponential(spec,dp)
{
 if((spec.object).toExponential)
 {
  spec.specialTeX=spec.object.toExponential(dp);
  spec.container.appendChild(document.createTextNode(spec.specialTeX));
 };
};

function precision(spec,dp)
{
 if((spec.object).toPrecision)
 {
  spec.specialTeX=spec.object.toPrecision(dp);
  spec.container.appendChild(document.createTextNode(spec.specialTeX));
 };
};

function financial(spec)
{
 if(typeof(spec.object)=='number')
 {
  spec.specialTeX=toFixxed(spec.object,2);
  spec.container.appendChild(document.createTextNode(spec.specialTeX));
 };
};

function dbRead(val,type)
{
 var dt;
 switch(type)
 {
 case "Number":
  return Number(val);
 case "Date":
 case "Time":
  dt=myReadDate(val);
  return dt;
 case "Boolean":
  return (Number(val)>0)||(val=="true")||(val=="TRUE");
 default:
  return val;
 };
 return val;
};

function dbValue(val,type)
{
 if((typeof(val)=="undefined")||(val===null))
 {
  switch(type.toLowerCase())
  {
  case "date":case "time":
  case "number": return "NULL";
  };
  return "''";
 };
 if(!type){type=typeof(val);};
 switch(type.toLowerCase())
 {
  case "string":
  case "text":
  case "textarea":
  case "pre":
   return "'"+val.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"'";
  case "number":
   if(isNaN(val)||(val==null)){return "NULL";};
   return val.toString();
  case "date":
   if(val.constructor!=Date){return "NULL";};
   val=myWriteDate(val,false,false);
   if(!val){return "NULL";};
   return "'"+val+"'"; 
  case "time":
   if(val.constructor!=Date){return "NULL";};
   val=myWriteDate(val,true,false);
   if(!val){return "NULL";};
   return "'"+val+"'";
  case "object":
   return "'"+JSON.stringify(val).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"'";
  case "boolean":
   if(val)
   {
    return 1;
   }
   else
   {
    return 0;
   };
   break;
  default:
   return "''";
 };
 return "''";
};

function valueList(fields,obj)
{
 var i;
 values=new Array();
 for(i=0;i<fields.length;i++)
 {
  if(database.fields[fields[i]])
  {
	values[i]=dbValue(obj[baseField(fields[i])],database.fields[baseField(fields[i])].fieldType);
  }
  else
  {
   alert(fields[i] + " not defined in field list");
   values[i]="'"+obj[fields[i]]+"'";
  };
 };
 return values.join("!@!");
};

function fieldList(fields)
{
 var str,fld,i;
 str="";
 for(i=0;i<fields.length;i++)
 {
  fld=database.fields[baseField(fields[i])];
  if(fld)
  {
   if(fld.calculator){continue;};
   if(fld.fieldType=="Button"){continue;};
   if(str){str+=",";};
   str+=fields[i];
  }
  else
  {
   alert(fields[i] + " not defined in field list");
   if(str){str+=",";};
   str+=fields[i];
  };
 };
 return str;
};

function makeTitle()
{
 var i,first=true;
 var str=thisPage.title;
 for(i=0;i<args.length;i++)
 {
  if((args[i].name!='page') && (args[i].name!='auto') &&(args[i].value))
  {
   if(first)
   {
    first=false;
    str+=" - ";
   }
   else
   {
    str+=", ";
   };
   str+=args[i].value;
  };
 };
 return str;
};

function makeDate()
{
 var d=new Date();
 return myWriteDate(d);
};

function getExport(typ)
{
 var i;
 var expString="";
 var extr,first;
 if(typ=="TeX")
 {
  expString="\\documentclass[a4paper,8pt]{article}\n\\usepackage{longtable}\n"+
    "\\usepackage{fontspec,xltxtra,xunicode}"+
    "\\defaultfontfeatures{Mapping=tex-text}"+
    "\\setromanfont[Mapping=tex-text]{Times New Roman}"+
    "\\setsansfont[Scale=MatchLowercase,Mapping=tex-text]{Helvetica Neue}"+
    "\\setmonofont[Scale=MatchLowercase]{Monaco}"+
    "\\usepackage{lscape}\n\\usepackage{amssymb}\n\\usepackage{array}\n"+
	"\\parindent 0pt \\parskip 0pt \\oddsidemargin  0cm \\evensidemargin 0cm\n"+
	"\\textwidth 16.00cm \\headheight 0.5cm \\topmargin -2cm \\textheight 26cm \\headsep 1cm\n"+
	"\\begin{document}\n\\pagestyle{myheadings}\\markright{"+
	 TeXclean(makeTitle())+" \\hfill "+TeXclean(makeDate())+" \\hfill}";
 };
 first=true;
 switch(typ)
 {
  case 'csv (No BOM)': typ='csv'; break;
  case 'csv (disp/No BOM)': typ='csv (display)'; break;
 }; 
 for(i=0;i<dbDataSpec.length;i++)
 {
  if(!dbDataSpec[i]){continue;};
  if(dbDataSpec.length>1)
  {
   switch(typ)
   {
   case 'tab':
   case 'csv':
   case 'csv (display)':
    if(!first){expString+='\n';};
    expString+=dbDataSpec[i].prompt+'\n';
    break;
   };
  };
  extr=dbDataSpec[i].exportData(true,typ);
  if(first && extr)
  {
   first=false;
  }
  else
  {
   if(typ=="TeX")
   {
    expString+="\\eject\n";
   };
  };
  expString+=extr;
 };
 if(typ=="TeX")
 {
  expString+="\\end{document}\n";
 };
 return expString;
};

function getSave()
{
 var u="";
 var i,j,obj,view;
 // do arrays before objects as the latter are likely to be summaries
 // and may have extra tests on them
 for(obj=0;obj<2;obj++){for(i=0;i<dbDataSpec.length;i++)
 {
  view=database.views[thisPage.search.views[i].view];
  if(typeof(view)=='undefined'){continue;};
  if(!obj){dbDataSpec[i].makeEdit(false);};
  if(!dbDataSpec[i].unChanged() && view.save)
  {
   switch(dbDataSpec[i].type)
   {
   case "Object":
    if(!obj){break;};
    dbDataSpec[i].emptyContainer();
    if(dbData[i].deleted)
    {
     u+="DELETE\t"+view.save+"\t";
     u+="\t";
     u+="\t";
     u+=view.key.join(",")+"\t";
	 u+=valueList(view.key,dbData[i])+"\t";
	 u+="\n";
    }
    else
    {
     if(dbData[i].created)
     {
      u+="INSERT\t"+view.save+"\t";
      if(view.set.length)
      {
       if(view.key.length)
       {
        u+=view.key.join(",")+","+view.set.join(",")+"\t";
	    u+=valueList(view.key,dbData[i])+"!@!"+valueList(view.set,dbData[i])+"\t";
	   }
	   else
	   {
        u+=view.set.join(",")+"\t";
	    u+=valueList(view.set,dbData[i])+"\t";
	   };
	  }
	  else
	  {
       u+=view.key.join(",")+"\t";
	   u+=valueList(view.key,dbData[i])+"\t";
	  };
      u+="\t";
      u+="\t";
	  u+="\n";
     }
     else
     {
      u+="UPDATE\t"+view.save+"\t";
      u+=view.set.join(",")+"\t";
	  u+=valueList(view.set,dbData[i])+"\t";
      u+=view.key.join(",")+"\t";
	  u+=valueList(view.key,dbData[i])+"\t";
	  u+="\n";
     };
    };
    break;
   case "Array":
    if(obj){break;};
    dbDataSpec[i].emptyContainer();
    for(j=0;j<dbData[i].length;j++)
    {
     if(dbData[i][j].deleted)
     {
      u+="DELETE\t"+view.save+"\t";
      u+="\t";
      u+="\t";
      u+=view.key.join(",")+"\t";
	  u+=valueList(view.key,dbData[i][j])+"\t";
	  u+="\n";
     }
     else
     {
      if(dbData[i][j].created)
      {
       u+="INSERT\t"+view.save+"\t";
       if(view.set.length)
       {
        u+=view.key.join(",")+","+view.set.join(",")+"\t";
	    u+=valueList(view.key,dbData[i][j])+"!@!"+valueList(view.set,dbData[i][j])+"\t";
	   }
	   else
	   {
        u+=view.key.join(",")+"\t";
	    u+=valueList(view.key,dbData[i][j])+"\t";
	   };
       u+="\t";
	   u+="\t";
	   u+="\n";
      }
      else
      {
       if(dbData[i][j].changed)
       {
        u+="UPDATE\t"+view.save+"\t";
        u+=view.set.join(",")+"\t";
	    u+=valueList(view.set,dbData[i][j])+"\t";
        u+=view.key.join(",")+"\t";
	    u+=valueList(view.key,dbData[i][j])+"\t";
	    u+="\n";
	   };
	  };
     };
    };
    break;
   };
  };
 };};
 if((u=="") && !(document.getElementById("messageBody").value)){alert("Nothing to save!");};
 return u;
};

function getSearch()
{
 var q="";
 var i,j,v,done;
 if(thisPage && thisPage.search.views.length && (thisPage.page!='search'))
 {
  for(v=0;v<thisPage.search.views.length;v++)
  {
   if(!database.views[thisPage.search.views[v].view]
     ||!database.views[thisPage.search.views[v].view].table)
   {
    // get nothing from the database
    q+="\n";
    continue;
   };
   q+=database.views[thisPage.search.views[v].view].title+"\t";
   q+=fieldList(database.views[thisPage.search.views[v].view].fields)+"\t";
   q+=database.views[thisPage.search.views[v].view].table+"\t";
   for(i=0;i<thisPage.search.conditions.length;i++)    
   {
    if(i){q+=" AND ";};
    q+=thisPage.search.conditions[i].field+" "+thisPage.search.conditions[i].relation+" ";
    q+=dbValue(toolbar.search[thisPage.search.conditions[i].field], database.fields[baseField(thisPage.search.conditions[i].field)].fieldType);
   };
   if(thisPage.search.views[v].condition)
   {
    if(i){q+=" AND ";};
    q+=thisPage.search.views[v].condition;
   };
   q+="\t";
   if(thisPage.search.views[v].order)
   {
    q+=thisPage.search.views[v].order;
   };
   q+="\t";
   q+=thisPage.search.views[v].obj;
   q+="\t\n";
  };
 }
 else
 {
  // general search
  if(thisPage && (thisPage.page=='search') && (toolbar.search.view || toolbar.search.where))
  {
   q+="Search\t";
   if(toolbar.search.select)
   {
    q+=toolbar.search.select+"\t";
   }
   else
   {
    q+=fieldList(database.views[toolbar.search.view].fields)+"\t"; 
   }
   q+=database.views[toolbar.search.view].table+"\t";
   q+=toolbar.search.where;
   if(toolbar.search.group)
   {
    q+=" GROUP BY "+toolbar.search.group;
   };
   q+="\t";
   q+=toolbar.search.order;
   if(toolbar.search.limit)
   {
    q+=" LIMIT "+toolbar.search.limit;
   };
   q+="\tfalse\t\n";
  };
 };
 return q;
};

/* functions */
function databaseAction(action)
{
 var typ,expString;
 var i,j,v,view,done;
 var u="",q="";
 typ=toolbar.fileOptions.exportType;
 makeActive('main',-1);
 if(typeof(specialActions) != "undefined")
 {
  if(specialActions(action))
  {
   return;
  };
 };
 switch(action)
 {
 case "Print":
  typ="TeX";
 case "export":
  expString=getExport(typ);
  switch(typ)
  {
  case "csv":
  case "csv (display)":
   download("dbExport.csv","\ufeff"+expString);
   break;
  case "csv (No BOM)":
  case "csv (disp/No BOM)":
   download("dbExport.csv",expString);
   break;
  case "TeX":
   if(action=="Print")
   {
    download("dbPrint.tex",expString);
   }
   else
   {
    download("dbExport.tex",expString);
   };
   break;
  default:
   download("dbExport.txt",expString);
   break;
  };
  break;
 case "Change password":
  window.location="../login/login.php?Action=Logout&Change=true&Location="
   +encodeURIComponent(window.location.pathname)+encodeURIComponent(window.location.search);;
  break;
 case "Logout":
  window.location="../login/login.php?Action=Logout&Location="
   +encodeURIComponent(window.location.pathname)+encodeURIComponent(window.location.search);;
  break;
 case "Save":
  u=getSave();
 case "search":
  if(action!="Save"){if(!checkChanged()){return;};};
  q=getSearch();
  callDatabase(q,u);
  break;
 default:
  alert(action+" not defined");
  break;
 };
};

function createFooterMenu()
{
 document.write("<p>[ <a href='");
 document.write("../login/login.php?Action=Logout&Location="
   +encodeURIComponent(window.location.pathname)+encodeURIComponent(window.location.search));
 document.write("'>Logout<\/a> | <a href='");
 document.write("../login/login.php?Action=Logout&Change=true&Location="
   +encodeURIComponent(window.location.pathname)+encodeURIComponent(window.location.search));
 document.writeln("'>Change password<\/a> ]<\/p>");
};

/* download a file */
function download(filename,str,merge)
{
 document.getElementById("downloadText").value=str;
 document.getElementById("downloadFilename").value=filename;
 if(merge)
 {
  document.getElementById("mergeFilename").value=merge;
 };
 document.getElementById("download").submit();
};

/* upload a file */
function upload()
{
 window.scrollTo(0,0);
 document.getElementById("uploadArea").style.display="block";
};

function cancelUpload()
{
 document.getElementById("downloadText").value="";
 document.getElementById("downloadFilename").value="";
 document.getElementById("uploadArea").style.display="none";
};

function attach(filename,str,merge)
{
 document.getElementById("dbFileData").value=str;
 document.getElementById("dbFilename").value=filename;
 if(merge)
 {
  document.getElementById("dbMergeFilename").value=merge;
 };
};

function doEmailAction()
{
 itemSpec.prototype.safeEval(emailAction);
};

function email(to,subject,message,action,file1,file2)
{
 var f1n,f2n;
 window.scrollTo(0,0);
 document.getElementById("messageTo").value=to;
 document.getElementById("messageSubject").value=subject;
 document.getElementById("messageBody").value=message;
 if(action)
 {
  emailAction=action;
 }
 else
 {
  emailAction="databaseAction('Save')";
 };
 f1n=document.getElementById("emailFile1Name");
 f2n=document.getElementById("emailFile2Name");
 if(f1n.firstChild){f1n.removeChild(f1n.firstChild);};
 if(f2n.firstChild){f2n.removeChild(f2n.firstChild);};
 document.getElementById("emailArea").style.display="block";
 if(file1)
 {
  f1n.appendChild(document.createTextNode(file1));
  document.getElementById("emailFile1File").style.display="block";
 }
 else
 {
  document.getElementById("emailFile1File").style.display="none";
 };
 if(file2)
 {
  f2n.appendChild(document.createTextNode(file2));
  document.getElementById("emailFile2File").style.display="block";
 }
 else
 {
  document.getElementById("emailFile2File").style.display="none";
 };
};

function cancelEmail()
{
 document.getElementById("messageTo").value="";
 document.getElementById("messageSubject").value="";
 document.getElementById("messageBody").value="";
 document.getElementById("dbFileData").value="";
 document.getElementById("dbFilename").value="";
 document.getElementById("emailArea").style.display="none";
};

function sendLocalEmail(to,subject,body,cc,bcc)
{
 if(!cc){cc="";};
 if(!bcc){bcc="";};
 if(!body){body="";};
 if(!subject){subject="Graduate studies";};
 document.location="mailto:"+to+"?subject="+subject+"&cc="+cc+"&bcc="+bcc+"&body="+encodeURIComponent(body);
};

function searchDatabase()
{
 searchSpec.emptyContainer();
 databaseAction("search");
 searchSpec.fillContainer();
};

function exportData()
{
 fileOptionSpec.emptyContainer();
 databaseAction("export");
 fileOptionSpec.fillContainer();
};

function goSearch()
{
 if(!checkChanged()){return;};
 window.location.replace("db.php");
};

function goParent()
{
 var parentPage;
 var i,added=false;
 var url="db.php?page="+thisPage.parent;
 parentPage=database.pages[thisPage.parent];
 for(i=0;i<parentPage.search.conditions.length;i++)
 {
  if(dbData[0][baseField(parentPage.search.conditions[i].field)])
  {
   switch(fieldType(baseField(parentPage.search.conditions[i].field)))
   {
   case "Date":
    url+="&"+baseField(parentPage.search.conditions[i].field)+"="
     +myWriteDate(dbData[0][baseField(parentPage.search.conditions[i].field)]);
    break;
   case "Boolean":
    if(dbData[0][baseField(parentPage.search.conditions[i].field)])
    {
     url+="&"+baseField(parentPage.search.conditions[i].field)+"=true"
    }
    else
    {
     url+="&"+baseField(parentPage.search.conditions[i].field)+"=false"
    };
    break;
   default:
    url+="&"+baseField(parentPage.search.conditions[i].field)+"="
     +dbData[0][baseField(parentPage.search.conditions[i].field)];
    break;
   };
   added=true;
  }
  else
  {
   if(dbData[0][0] && dbData[0][0][baseField(parentPage.search.conditions[i].field)])
   {
    switch(fieldType(baseField(parentPage.search.conditions[i].field)))
    {
    case "Date":
     url+="&"+baseField(parentPage.search.conditions[i].field)+"="
     +myWriteDate(dbData[0][0][baseField(parentPage.search.conditions[i].field)]);
     break;
    case "Boolean":
     if(dbData[0][0][baseField(parentPage.search.conditions[i].field)])
     {
      url+="&"+baseField(parentPage.search.conditions[i].field)+"=true"
     }
     else
     {
      url+="&"+baseField(parentPage.search.conditions[i].field)+"=false"
     };
     break;
    default:
     url+="&"+baseField(parentPage.search.conditions[i].field)+"="
     +dbData[0][0][baseField(parentPage.search.conditions[i].field)];
     break;
    };
    added=true;
   };
  };
 };
 if(added || parentPage.search.auto);
 {
  url+="&auto=true";
 };
 if(args.embed)
 {
  url+="&embed="+args.embed;
 };
 if(!checkChanged()){return;};
 window.location.replace(url);
};

/* do header initialisation */
args=getArgs();
if(typeof(database)!="undefined")
{
 decodeObject(database);
 indexFields();
 indexViews();
 indexPages();
 if(args.page){thisPage=database.pages[args.page];};
};
