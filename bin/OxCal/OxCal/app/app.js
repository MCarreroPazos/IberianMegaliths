// Global variables and constants
var app,appDrag,header;
var APP_HEAD=30; // should agree with css

// Application GUI

function appEnvironment(d)
{
 if(!d){return;};
 this.initialise=d.initialise;
 this.header=d.header;
 this.header.header_height=0;
 this.frames=d.frames;
 this.menus=d.menus;
 this.tools=d.tools;
 this.tools.push({"tool_id":"_Console","title":"Console","left":20,"top":30,"width":800,"height":400,"body_type":"New div","body_id":"_consoleArea","iframe_src":"","header_menu":"","footer_menu":""});
 this.files=d.files;
 this.options=d.options;
 this.frame=0;
 this.filename="";
 this.fileSaving=false;
 this.changed=false;
 this.fileResolve=false;
 this.fileReject=false;
 this.parent=false;
 this.cookiePermission=false;
 try
 {
  if(window.opener && window.opener.app)
  {
   this.cookiePermission=window.opener.app.cookiePermission;
  };
 }catch(e){};
 this.controlIndex={};
};

appEnvironment.prototype.safeEval=function(txt)
{
 return itemSpec.prototype.safeEval(txt);
};
appEnvironment.prototype.clone=function(o)
{
 var i,r;
 if(typeof(o)=="object")
 {
  if(o===null){return null;};
  if(Array.isArray(o)){r=[];}else{if(o.constructor.name == "Date"){return new Date(o);}else{r={};};};
  for(i in o){r[i]=this.clone(o[i]);};
  return r;
 }
 else
 {
  return o;
 };
};
appEnvironment.prototype.xml2Str=function(xmlNode)
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
appEnvironment.prototype.menuClass=function(level)
{
 switch(level)
 {
 case 0:
  return 'appMenuMain';
 case 1:
  return 'appMenuSub';
 case 2:
  return 'appMenuSubSub';
 };
 return 'appMenuSubSub';
};

appEnvironment.prototype.createMenu=function(d,level,id)
{
 var i;
 var m;
 m=document.createElement('ul');
 if(id){m.id=id;};
 m.className=this.menuClass(level);
 if(!d){alert("Menu "+id+" not found");return m;};
 for(i=0;i<d.items.length;i++)
 {
  m.appendChild(this.createMenuItem(d.items[i],level,(id+"__"+i)));
 };
 return m;
};

appEnvironment.prototype.createMenuItem=function(d,level,id)
{
 var mi,a,img,div,tn,sm;
 mi=document.createElement('li');
 if(d.title)
 {
  mi.title=d.title;
 };
 a=document.createElement('a');
 if(id){a.id=id;};
 mi.appendChild(a);
 if(d.type!='MenuItem')
 {
  a.className='app'+d.type;
  a.ariaLabel=d.type;
 }
 else
 {
  a.className=this.menuClass(level);
 };
 if(d.link)
 {
  a.href=d.link;
 }
 else
 {
  a.href='#';
 };
 if(d.onclick && (d.type!="Key") && (d.type!="Slider"))
 {
  switch(typeof(d.onclick))
  {
  case "string":
   a.onmousedown=function(){try{app.safeEval(d.onclick);}catch(e){};};
   break;
  case "function":
   a.onmousedown=d.onclick;
   break;
  };
 };
 if(d.icon)
 {
  if(d.icon.indexOf(".")!=-1)
  {
   img=document.createElement('img');
   a.appendChild(mi.img);
   img.src=d.icon;
   img.alt="Menu: "+d.title;
   img.height='12px';
  }
  else
  {
   div=document.createElement('div');
   div.className='appMenuIcon';
   img=document.createElement('div');
   img.className=d.icon;
   div.appendChild(img);
   switch(d.icon)
   {
   case 'home':
    img=document.createElement('div');
    img.className='chimney';
    div.appendChild(img);
    break;
   };
   a.appendChild(div);
  };
 }
 else
 {
  itemSpec.prototype.appendComplexText(a,d.text);
 };
 switch(d.type)
 {
 case "Key":
  img=document.createElement("input");
  img.className="appKey";
  img.onfocus=function(){this.style.backgroundColor='black';};
  img.onblur=function(){this.style.backgroundColor='white';};
  img.onkeydown=keyInputHandler.bind(img,d.onclick);
  a.appendChild(img);
  break;
 case "Slider":
  img=document.createElement("div");
  img.className="appSlider";
  img.onmousedown=sliderInputHandler.bind(img,"down",d.onclick);
  img.onmouseup=sliderInputHandler.bind(img,"up",d.onclick);
  img.onmousemove=sliderInputHandler.bind(img,"move",d.onclick);
  img.onmouseout=sliderInputHandler.bind(img,"out",d.onclick);
  img.onmouseover=sliderInputHandler.bind(img,"over",d.onclick);
  div=document.createElement("div");
  div.className="appSliderPos";
  img.appendChild(div);
  a.appendChild(img);
  break;
 };
 if(d.submenu_id)
 {
  sm=this.createMenu(this.menus[this.menu_index[d.submenu_id]],level+1,d.submenu_id);
  mi.appendChild(sm);
 };
 return mi;
};

appEnvironment.prototype.addToMenu=function(menu_id,item,atStart)
{
 var el=document.getElementById(menu_id);
 if(atStart)
 {
  el=el.insertBefore(document.createElement('li'),el.firstChild);
 }
 else
 {
  el=el.appendChild(document.createElement('li'));
 };
 el.appendChild(item);
 return item;
};

appEnvironment.prototype.appendToMenu=function(mode,style,text,action,hidden)
{
 var li,a,l;
 l=document.getElementById(mode+"Menu");
 if(l){mode+="Menu";}else{l=document.getElementById(mode);};
 if(!l){app.alert(mode+" not found");return false;};
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


appEnvironment.prototype.createTool=function(d)
{
 var div,cont;
 function px(v,horiz,abs)
 {
  if(typeof(v)=="number"){return v+"px";};
  if(v.indexOf("px")!=-1){return v;};
  if(v.indexOf("%")!=-1)
  {
   if(horiz)
   {
    return Math.round(Number(v.replace("%",""))*document.documentElement.clientWidth/100)+"px";
   }
   else
   {
    if(abs)
    {
     return Math.round(2*APP_HEAD+Number(v.replace("%",""))*(document.documentElement.clientHeight-3*APP_HEAD)/100)+"px";
    }
    else
    {
     return Math.round(Number(v.replace("%",""))*(document.documentElement.clientHeight-3*APP_HEAD)/100)+"px";
    };
   };
  };
  return v+"px";
 };
 d.minimised=false;
 d.expanded=false;
 d.element=document.createElement('div');
 d.element.className='appDraggable';
 d.element.id=d.tool_id;
 switch(d.body_type)
 {
 case 'Existing div':
  cont=document.getElementById(d.body_id);
  if(cont){break;};
 default:
 case 'New div':
  cont=document.createElement('div');
  cont.id=d.body_id;
  break;
 case 'Existing iframe':
  cont=document.getElementById(d.body_id);
  if(cont){break;};
 case 'New iframe':
  cont=document.createElement('iframe');
  cont.id=d.body_id;
  if(d.iframe_src){cont.src=d.iframe_src;};
  break;
 };
 cont.style.boxShadow="0px 0px 3px rgba(0,0,0,0.2) inset";
 if(d.width && d.height)
 {
  d.width=px(d.width,true,false);
  d.height=px(d.height,false,false);
  cont.style.width=d.width;
  cont.style.height=d.height;
 }
 else
 {
  cont.style.maxWidth=Math.round(document.documentElement.clientWidth*0.9)+"px";
  cont.style.maxHeight=Math.round(document.documentElement.clientHeight*0.9)+"px";
 };
 cont.style.overflow="auto";
 cont.style.cursor="auto";
 d.body=cont;
 if(d.left && d.top)
 {
  if(typeof(d.top)=="number")
  { 
   d.top+=(2*APP_HEAD);
  }
  else
  {
   if(d.top.indexOf("%")==-1)
   {
    d.top=Number(d.top.replace("px",""));
   };
  };
  d.left=px(d.left,true,true);
  d.top=px(d.top,false,true);
  d.element.style.left=d.left;
  d.element.style.top=d.top;
  if(!(d.width && d.height) && (Number(d.left.replace("px",""))*Number(d.top.replace("px",""))))
  {
   cont.style.maxWidth=Math.round(document.documentElement.clientWidth*0.9-Number(d.left.replace("px","")))+"px";
   cont.style.maxHeight=Math.round(document.documentElement.clientHeight*0.9-Number(d.top.replace("px",""))-3*APP_HEAD)+"px";
  };
 };
 div=document.createElement("div");
 div.className="appDragHeader";
 d.element.appendChild(div);
 if(d.header_menu)
 {
  switch(typeof(d.header_menu))
  {
  case "string":
   d.element.appendChild(
  	this.createMenu(this.menus[this.menu_index[d.header_menu]],0,d.header_menu));
   break;
  default:
   d.element.appendChild(
  	this.createMenu(d.header_menu,0,d.header_menu.menu_id));
   break;
  };
 };
 d.element.appendChild(cont);
 if(d.footer_menu)
 {
  switch(typeof(d.footer_menu))
  {
  case "string":
   d.element.appendChild(
  	this.createMenu(this.menus[this.menu_index[d.footer_menu]],0,d.footer_menu));
   break;
  default:
   d.element.appendChild(
  	this.createMenu(d.footer_menu,0,d.footer_menu.menu_id));
   break;
  };
 };
 d.element.dragResize=cont;
 d.element.tool=d;
 if(d.tool_id)
 {
  div=document.createElement('div');
  div.onclick=(function(){
   app.hideTool(d.tool_id);
   if(d.tool_id=='fileDialog'){app.fileReply(false,"Cancelled by user");};
  });
  div.className='objIcon';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='circleRed';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='cross';
  div.style.position='absolute';
  div.style.top='2px';
  div.style.left='2px';
  d.element.appendChild(div);
  div=document.createElement('div');
  div.onclick=(function(){app.minimiseTool(d.tool_id);});
  div.className='objIcon';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='circleOrange';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='minus';
  div.style.position='absolute';
  div.style.top='2px';
  div.style.left='22px';
  d.element.appendChild(div);
  div=document.createElement('div');
  div.onclick=(function(){app.expandTool(d.tool_id);});
  div.className='objIcon';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='circleGreen';
  div.appendChild(document.createElement('div'));
  div.lastChild.className='plus';
  div.style.position='absolute';
  div.style.top='2px';
  div.style.left='42px';
 }
 else
 {
  if(d.closer)
  {
   div=document.createElement('div');
   div.onclick=d.closer;
   div.className='objIcon';
   div.appendChild(document.createElement('div'));
   div.lastChild.className='circleRed';
   div.appendChild(document.createElement('div'));
   div.lastChild.className='cross';
   div.style.position='absolute';
   div.style.top='2px';
   div.style.left='2px';
   d.element.appendChild(div);
  };
 };
 d.element.appendChild(div);
 if(d.title)
 {
  div=document.createElement('div');
  d.titleElement=div;
  div.className='appDragTitle';
  itemSpec.prototype.appendComplexText(div,d.title);
  d.element.appendChild(div);
  if(d.tool_id)
  {
   div=document.createElement('div');
   div.className='appTrayIconHidden';
   div.appendChild(document.createTextNode(d.title));
   div.onclick=(function(){app.minimiseTool(d.tool_id,true);});
   d.trayIcon=div;
   this.trayContainer.appendChild(div);
  };
 };
 div=document.createElement('div');
 div.className='appDragCover';
 d.element.appendChild(div);
 d.element.dragCover=div;
 return d.element;
};

appEnvironment.prototype.delTransient=function(o,rtn)
{
 if(o.element)
 {
  this.lastPosition={"left":o.left,"top":o.top};
  if(rtn){if(o.element.rtn){o.element.rtn();};}else{if(o.element.esc){o.element.esc();};};
  this.dialogContainer.removeChild(o.element);
  o.element=false;
  if(o.control && o.control.id)
  {
   this.controlIndex[o.control.id]=false;
  };
 };
};

appEnvironment.prototype.transientTool=function(o,b,control)
{
 o.tool_id="";
 if(control && control.id)
 {
  o.control=control;
  if(this.controlIndex[control.id])
  {
   this.controlIndex[control.id].cancel();
  };
  this.controlIndex[control.id]=control;
 };
 if(this.lastPosition)
 {
  o.left=this.lastPosition.left;
  o.top=this.lastPosition.top;
  this.lastPosition=undefined;
 }
 else
 {
  o.left=(30+Math.random()*10)+"%";
  o.top=(30+Math.random()*10)+"%";
 };
 o.width=0;
 o.height=0;
 o.body_type="New div";
 o.header_menu="";
 this.createTool(o);
 o.element.style.display='block';
 o.element.style.zIndex = 3*(appDrag.nZfocus++);
 if(appDrag.oActive){appDrag.oActive.dragCover.style.display="block";};
 appDrag.oActive=o.element;
 appDrag.oActive.dragCover.style.display="none";
 o.element.style.minWidth="300px";
 this.dialogContainer.appendChild(o.element);
 o.body.appendChild(b);
 if(control)
 {
  control.cancel=function(){this.delTransient(o,false);}.bind(this);
  control.hide=function(){if(o.element){this.dialogContainer.removeChild(o.element);};}.bind(this);
 };
 o.element.key=function(ok){this.delTransient(o,ok);}.bind(this);
};

appEnvironment.prototype.confirm_setup=function(txt,resolve,reject,control)
{
 var d,a,i;
 var o={"title":"Confirm","closer":function(){this.delTransient(o,false);}.bind(this),"footer_menu":{"menu_id":"","items":[{"type":"Button","text":"Ok","onclick":function(){this.delTransient(o,true);}.bind(this)},{"type":"Button","text":"Cancel","onclick":function(){this.delTransient(o,false);}.bind(this)}]}};
 if(control && control.multiple)
 {
  if(typof(control.multiple)=="string")
  {
   o.footer_menu.items[0].text=control.multiple;
  }
  else
  {
   o.footer_menu.items[0].text="Ok";
  };
  o.footer_menu.items[0].onclick=function(){o.element.rtn();}.bind(this);
 };
 d=document.createElement('div');
 d.className="appDialog";
 a=txt.split("\n");
 for(i in a)
 {
  d.appendChild(document.createTextNode(a[i]));
  d.appendChild(document.createElement('br'));
 };
 this.transientTool(o,d,control);
 o.element.esc=function(){reject("Cancelled");};
 o.element.rtn=function(){resolve(true);};
 return o;
};

appEnvironment.prototype.confirm=function(txt,control)
{
 var o,keepalive=false;
 if(control && (typeof(control)=="number")){keepalive=control;control=false;};
 if(this.parent){return this.parent.confirm(txt,control);};
 if(control && control.resolve && control.reject)
 {
  return this.confirm_setup(txt,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  if(control)
  { 
   control.resolve=resolve;
   control.reject=reject;
   return this.confirm_setup(txt,resolve,reject,control);
  };
  o=this.confirm_setup(txt,resolve,reject);
  if(keepalive)
  {
   window.setTimeout(function(){this.delTransient(o,false);}.bind(this),keepalive);
  };
 }.bind(this));
};

appEnvironment.prototype.alert_setup=function(txt,resolve,reject,control)
{
 var d,a,i;
 var o={"title":"Alert","closer":function(){this.delTransient(o,false);}.bind(this),"footer_menu":{"menu_id":"","items":[{"type":"Button","text":"Ok","onclick":function(){this.delTransient(o,true);}.bind(this)}]}};
 if(!resolve){o.footer_menu=false;resolve=function(){};};
 d=document.createElement('div');
 d.className="appAlert";
 if(txt===null){txt="null";};
 if(!txt.split)
 {
  if(txt.message){txt=txt.message;}else{txt=JSON.stringify(txt);};
 };
 a=txt.split("\n");
 for(i in a)
 {
  d.appendChild(document.createTextNode(a[i]));
  d.appendChild(document.createElement('br'));
 };
 this.transientTool(o,d,control);
 o.element.esc=function(){resolve(true);};
 o.element.rtn=function(){resolve(true);};
 return o;
};

appEnvironment.prototype.alert=function(txt,control)
{
 var o,n;
 if(this.parent){return this.parent.alert(txt,control);};
 if(control)
 {
  switch(typeof(control))
  {
  case 'object':
   if(control.resolve && control.reject)
   {
    return this.alert_setup(txt,control.resolve,control.reject,control);
   };
   break;
  case 'number':
   n=control;
   control={"resolve":function(){},"reject":function(){}};
   o=this.alert_setup(txt,false,control.reject,control);
   window.setTimeout(function(){this.delTransient(o,true);}.bind(this),n);
   return o;
  };
 };
 return new Promise(function(resolve,reject)
 {
  if(control)
  { 
   control.resolve=resolve;
   control.reject=reject;
   return this.alert_setup(txt,resolve,reject,control);
  };
  this.alert_setup(txt,resolve,reject);
 }.bind(this));
};

appEnvironment.prototype.prompt_setup=function(pr,val,ty,resolve,reject,control)
{
 var d,s;
 var  o={"title":pr,"closer":function(){this.delTransient(o,false);}.bind(this),"footer_menu":{"menu_id":"","items":[{"type":"Button","text":"Ok","onclick":function(){this.delTransient(o,true);}.bind(this)},{"type":"Button","text":"Cancel","onclick":function(){this.delTransient(o,false);}.bind(this)}]}};
 if(control && control.multiple)
 {
  if(typeof(control.multiple)=="string")
  {
   o.footer_menu.items[0].text=control.multiple;
  }
  else
  {
   o.footer_menu.items[0].text="Ok";
  };
  o.footer_menu.items[0].onclick=function(){o.element.rtn();}.bind(this);
 };
 switch(typeof(val))
 {
 case "object":
  if(val==null)
  {
   val="null";
   s=new itemSpec("data","","Text");
   break;
  };
  if(ty && typeof(ty)=="object")
  {
   s=ty;
   break;
  };
  switch(val.constructor)
  {
  case Date:
   s=new itemSpec("data","","Date");
   break;
  case Array:
   s=new itemSpec("data","","Array");
   if(val.length)
   {
    switch(typeof(val[0]))
    {
    case "number":
     s.appendChild("el","Elements","Number");
     break;
    default:
     s.appendChild("el","Elements","Text");
     break;
    };
   };
   break;
  default:
   if(ty)
   {
    s=new itemSpec("data","",ty);
   }
   else
   {
    val=JSON.stringify(val);
    s=new itemSpec("data","","Text");
   };
   break;
  };
  break;
 case "boolean":
  if(ty && typeof(ty)=="object")
  {
   s=ty;
   break;
  };
  s=new itemSpec("data","","Boolean");
  break;
 case "number":
  if(ty && typeof(ty)=="object")
  {
   s=ty;
   break;
  };
  s=new itemSpec("data","","Number");
  break;
 case "string":
  val=val.toString();
  if(ty && typeof(ty)=="object")
  {
   s=ty;
   break;
  };
  switch(ty)
  { 
  case "paste":case "copy":
   s=new itemSpec("data","","TextArea");
   break;
  case "Color":  case "Pre":case "TextArea":
   s=new itemSpec("data","",ty);
   break;
  default:
   s=new itemSpec("data","","Text"); 
   break; 
  };
  break;
 case "undefined":
 default:
  if(ty)
  {
   s=new itemSpec("data","",ty);
   val=false;
  }
  else
  {
   s=new itemSpec("data","","Text");
   val="";
  };
  break;
 };
 if(!s.readonly){s.edit=true;};
 s.transparent=true;
 switch(ty)
 {
 case "copy":
 case "paste":
  o.footer_menu.items.shift();
  break;
 };
 this.transientTool(o,s.createDisplay(val),control);
 o.element.esc=function(){reject("Cancelled");};
 o.element.rtn=function(){s.emptyContainer();s.fillContainer();if(s.checkRequired()){val=s.object;resolve(val);};}.bind(this);
 d=s.container.firstChild;
 if(d){window.setTimeout(function()
 {
  d.focus();
  if(d.value && d.setSelectionRange)
  {
   d.setSelectionRange(0, d.value.length);
  };
 },10);};
 switch(ty)
 {
 case "copy":
  if(!d){break;};
  d.onclick=function(){d.setSelectionRange(0, d.value.length);};
  d.readOnly=true;
  d.style.color="grey";
  d.oncopy=function()
  {
   d.setSelectionRange(0, d.value.length);
   window.setTimeout(function(){this.delTransient(o,true);}.bind(this),100);
  }.bind(this);
  break;
 case "paste":
  if(!d){break;};
  d.style.color="grey";
  d.onpaste=function()
  {
   d.setSelectionRange(0, d.value.length);
   window.setTimeout(function(){this.delTransient(o,true);}.bind(this),100);
  }.bind(this);
  break;
 };
 return o;
};


appEnvironment.prototype.prompt=function(pr,val,ty,control)
/* This is set up to work with any of the following:
 prompt(pr,val,ty);
 prompt(pr,val,spec);
 prompt(pr,val,control); 
 prompt(pr,val,ty,control);
*/
{
 val=this.clone(val);
 if(this.parent)
 {
  if((!ty || (typeof(ty)!='object'))&&(typeof(val)!='object'))
  {
   return this.parent.prompt(pr,val,ty,control);
  };
 };
 if(typeof(ty)=='object')
 {
  if(ty.constructor!=itemSpec)
  {
   control=ty;ty=false;
   if(control.ty){ty=control.ty;};
   if(control.spec){ty=control.spec;};
  };
 };
 if(control && control.resolve && control.reject)
 {
  return this.prompt_setup(pr,val,ty,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  if(control)
  { 
   control.resolve=resolve;
   control.reject=reject;
   return this.prompt_setup(pr,val,ty,resolve,reject,control);
  };
  this.prompt_setup(pr,val,ty,resolve,reject);
 }.bind(this));
};

appEnvironment.prototype.doExchange=function(exch)
{
 var spec,s,obj,ln;
 if(this.parent)
 {
  return this.parent.doExchange(exch);
 };
 spec=new itemSpec("exchange","Data exchange","Object");
 spec.noheader=true;
 spec.edit=true;
 s=spec.appendChild("header","Header","Text");
 s.readonly=true;
 s.width=60;
 s=spec.appendChild("data","Data","Pre");
 s.width=60;
 s=spec.appendChild("include","Include header","Boolean");
 s.changer=function(spc)
 {
  var ln;
  if(spc.object)
  {
   spc.parent.emptyContainer();
   spc.parent.object.data=spc.parent.object.header+"\n"+spc.parent.object.data;
   spc.parent.fillContainer();
  }
  else
  {
   if((ln=spc.parent.object.data.indexOf("\n"))!=-1)
   {
    spc.parent.emptyContainer();
    spc.parent.object.data=spc.parent.object.data.slice(ln+1);
    spc.parent.fillContainer();
   };
  };
 };
 obj={};
 obj.data=exch.exportData(true);
 ln=obj.data.indexOf("\n");
 if(ln==-1)
 {
  obj.header=obj.data;obj.data="";
 }
 else
 {
  obj.header=obj.data.slice(0,ln);
  obj.data=obj.data.slice(ln+1);
 };
 obj.include=false;
 this.prompt(exch.prompt,obj,spec)
 .then(function(rpl){
  if(!rpl.include){rpl.data=rpl.header+"\n"+rpl.data;};
  exch.importData(rpl.data,true);
 }.bind(this))
 .catch(function(e){});
};

appEnvironment.prototype.menu_setup=function(men,resolve,reject,control)
{
 var i,ar=men.split(/[|\n]/),ul,li,lines,buttons,t,r,d,a,n;
 var o={"title":ar[0],"closer":function(){this.delTransient(o,false);}.bind(this),"footer_menu":{"menu_id":"","items":[{"type":"Button","text":"Cancel","onclick":function(){this.delTransient(o,false);}.bind(this)}]},
 "manual":false,"pos":0,"lines":[false],"menu":true,
 "posFunc":(function(v)
 {
  if(!control || !control.multiple)
  {
   this.delTransient(o,true);resolve(v);
  }
  else
  {
   resolve(v);
  };
 }).bind(this)};
 if(control && control.multiple)
 {
  o.footer_menu.items[0].text="Done";
 };
 o.setPos=function(v,relative)
 {
  var i;
  if(relative){i=o.pos+v;}else(i=v);
  if(i<1){i=0;};
  if(i>=o.lines.length){i=o.lines.length-1;};
  if(relative){if(i<1){i=1;};}
  if(o.manual && o.pos)
  {
   o.lines[o.pos].className="appMenuSub";
  };
  o.manual=false;
  o.element.rtn=false;
  o.pos=i;
  if(i && (o.lines[i].className=="appMenuSub"))
  {
   o.manual=true;
   o.element.rtn=function(){resolve(o.pos);};
   o.lines[o.pos].className="appMenuSubActive";
  };
 }.bind(this);
 n=0;
 if(men.indexOf('\n')!=-1)
 {
  t=document.createElement('table');
  lines=men.split('\n');
  for(i=0;i<lines.length;i++)
  {
   r=document.createElement('tr');
   if(!lines[i])
   {
    d=document.createElement('td');
    d.style.height="4px";
    r.appendChild(d);
   };
   buttons=lines[i].split("|");
   for(j=0;j<buttons.length;j++)
   {
    if(n==0){n++;continue;};
    d=document.createElement('td');
    d.className="appMenuPanel";
    a=document.createElement("a");
    o['lines'][n]=a;
    if(ar[n] && (ar[n].indexOf(":")!=ar[n].length-1))
    {
     itemSpec.prototype.appendComplexText(a,ar[n]);
     a.href="#";
     a.className="appButton";
     a.ariaLabel="Button";
     a.onmouseover=(function(){o.setPos(0);});
     a.onmousedown=(function(v){o.posFunc(v);}).bind(this,n);
     d.appendChild(a);
    }
    else
    {
     if(ar[n])
     {
      itemSpec.prototype.appendComplexText(d,ar[n]);
      d.style.padding="10px 5px";
     };
    };
    r.appendChild(d);
    n++;
   };
   t.appendChild(r);
  };
  this.transientTool(o,t,control);
 }
 else
 {
  ul=document.createElement("ul");
  ul.className="appMenuSub";
  ul.style.background="none";
  ul.style.boxShadow="none";
  ul.style.overflow="hidden";
  for(i=1;i<ar.length;i++)
  {
   li=document.createElement("li");
   a=document.createElement("a");
   o['lines'][i]=a;
   if(ar[i])
   {
    itemSpec.prototype.appendComplexText(a,ar[i]);
    a.href="#";
    a.className="appMenuSub";
   }
   else
   {
    a.ariaLabel="Spacer";
    a.className="appSpacer";
   };
   a.style.minWidth="95%";
   a.onmouseover=(function(){o.setPos(0);});
   a.onmousedown=(function(v){o.posFunc(v);}).bind(this,i);
   li.appendChild(a);
   ul.appendChild(li);
  };
  this.transientTool(o,ul,control);
  o.element.style.minWidth=(ar[0].length*10+50)+"px";
 };
 o.element.esc=function(){reject("Cancelled");};
 return o;
};

appEnvironment.prototype.menu=function(men,control)
{
 if(this.parent){return this.parent.menu(men,control);};
 if(control && control.resolve && control.reject)
 {
  return this.menu_setup(men,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  if(control)
  { 
   control.resolve=resolve;
   control.reject=reject;
   return this.menu_setup(men,resolve,reject,control);
  };
  this.menu_setup(men,resolve,reject);
 }.bind(this));
};

appEnvironment.prototype.iFrame_setup=function(title,src,w,h,resolve,reject,control)
{
 var d,a,i;
 var o={"title":title,"closer":function(){this.delTransient(o,false);}.bind(this)};
 d=document.createElement('iframe');
 d.style.width="100%";
 d.style.height="100%";
 d.src=src;
 this.transientTool(o,d,control);
 o.body.style.width=w;
 o.body.style.height=h;
 o.body.style.maxHeight=h;
 o.body.style.maxWidth=w;
 d.close=function(ok){this.delTransient(o,ok);}.bind(this);
 return o;
};

appEnvironment.prototype.iFrame=function(title,src,w,h,control)
{
 if(control)
 {
  return this.iFrame_setup(title,src,w,h,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  this.iFrame_setup(title,src,w,h,resolve,reject);
 }.bind(this));
};

appEnvironment.prototype.image_setup=function(title,src,w,h,resolve,reject,control)
{
 var d,a,i;
 var o={"title":title,"closer":function(){this.delTransient(o,false);}.bind(this)};
 d=document.createElement('img');
 d.style.width="100%";
 d.style.height="100%";
 d.style.objectFit="contain";
 d.src=src;
 this.transientTool(o,d,control);
 o.body.style.width=w;
 o.body.style.height=h;
 o.body.style.maxHeight=h;
 o.body.style.maxWidth=w;
 d.close=function(ok){this.delTransient(o,ok);}.bind(this);
 return o;
};

appEnvironment.prototype.image=function(title,src,w,h,control)
{
 if(control)
 {
  return this.image_setup(title,src,w,h,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  this.image_setup(title,src,w,h,resolve,reject);
 }.bind(this));
};


appEnvironment.prototype.upload_setup=function(title,accept,multiple,resolve,reject,control)
{
 var div,d,a,i;
 var o={"title":title,"closer":function(){this.delTransient(o,false);}.bind(this),"footer_menu":{"menu_id":"","items":[{"type":"Button","text":"Ok","onclick":function(){this.delTransient(o,true);}.bind(this)},{"type":"Button","text":"Cancel","onclick":function(){this.delTransient(o,false);}.bind(this)}]}};
 div=document.createElement('div');
 div.width="100%";
 div.height="100%";
 div.position="relative";
 d=document.createElement('div');
 d.style.textAlign="center";
 d.style.position="absolute";
 d.style.left="0px";
 d.style.top="80px";
 d.style.width="300px";
 d.appendChild(document.createTextNode("Drop file"+(multiple?"s":"")+" here"));
 div.appendChild(d);
 d=document.createElement('input');
 d.type='file';
 if(multiple){d.multiple=true;};
 if(accept){d.accept=accept;};
 d.style.position="absolute";
 d.style.left="0px";
 d.style.top="20px";
 d.style.width="300px";
 d.style.height="200px";
 d.style.backgroundColor="rgba(0,0,0,0.3)";
 div.appendChild(d);
 this.transientTool(o,div,control);
 o.body.style.width="300px";
 o.body.style.height="200px";
 o.element.esc=function(){reject("Cancelled");};
 o.element.rtn=function(){resolve(d.files);}.bind(this);
 return o;
};


appEnvironment.prototype.upload=function(title,accept,multiple,control)
{
 if(control)
 {
  return this.upload_setup(title,accept,multiple,control.resolve,control.reject,control);
 };
 return new Promise(function(resolve,reject)
 {
  this.upload_setup(title,accept,multiple,resolve,reject);
 }.bind(this)); 
};

appEnvironment.prototype.getTool=function(t)
{
 var i=this.tool_index[t];
 return this.tools[i];
};

appEnvironment.prototype.hideTool=function(t)
{
 var i=this.tool_index[t];
 if(t=="_Console")
 {
  this.log(null,null);
 };
 this.tools[i].element.style.display='none';
 if(this.tools[i].trayIcon){this.tools[i].trayIcon.className="appTrayIconHidden";};
 this.tools[i].active=false;
 this.checkTray();
};

appEnvironment.prototype.showTool=function(t,allowMinimised)
{
 var i=this.tool_index[t];
 var t=this.tools[i];
 if(this.tools[i].trayIcon && (this.tools[i].trayIcon.className=="appTrayIconHidden"))
 {
  this.trayContainer.removeChild(this.tools[i].trayIcon);
  this.trayContainer.appendChild(this.tools[i].trayIcon);
 };
 if(t.minimised && allowMinimised)
 {
  if(this.tools[i].trayIcon){this.tools[i].trayIcon.className="appTrayIconMin";};
 }
 else
 {
  t.minimised=false;
  if(this.tools[i].trayIcon){this.tools[i].trayIcon.className="appTrayIcon";};
  t.element.style.display='block';
  t.element.style.zIndex = 3*(appDrag.nZfocus++);
  if(appDrag.oActive){appDrag.oActive.dragCover.style.display="block";};
  appDrag.oActive=t.element;
  appDrag.oActive.dragCover.style.display="none";
 };
 this.checkTray();
 t.active=true;
};

appEnvironment.prototype.hideAllTools=function()
{
 var i;
 for(i=0;i<this.tools.length;i++)
 {
  this.tools[i].element.style.display='none';
  this.tools[i].active=false;
  if(this.tools[i].trayIcon){this.tools[i].trayIcon.className="appTrayIconHidden";};
 };
 this.checkTray();
};

appEnvironment.prototype.showActiveTools=function(list)
{
 var i,j;
 if(!list)
 {
  for(i=0;i<this.tools.length;i++)
  {
   if(this.tools[i].active)
   {
    this.showTool(this.tools[i].tool_id,true);
   };
  };
 }
 else
 {
  for(i=0;i<list.length;i++)
  {
   j=this.tool_index[list[i]];
   if(this.tools[j].active)
   {
    this.showTool(this.tools[j].tool_id,true);
   };
  };
 };
 this.checkTray();
};

appEnvironment.prototype.checkTray=function()
{
 var disp=false;
 if(!this.trayContainer){return;};
 var e=this.trayContainer.firstChild;
 while(e)
 {
  if(e.className!='appTrayHidden'){disp=true;};
  e=e.nextSibling;
 };
 this.trayContainer.style.display=disp?'block':'none';
};

appEnvironment.prototype.minimiseTool=function(t,un)
{
 var d=this.tools[this.tool_index[t]];
 if(!d.trayIcon){return;};
 if(d.minimised || un)
 {
  d.minimised=false;
  d.trayIcon.className="appTrayIcon";;
  this.showTool(t);
 }
 else
 {
  d.minimised=true;
  d.element.style.display='none';
  d.trayIcon.className="appTrayIconMin";;
 };
 this.checkTray();
};

appEnvironment.prototype.expandTool=function(t)
{
 var d=this.tools[this.tool_index[t]];
 var pcMarg=100*30/document.documentElement.clientHeight;
 var h=100-(d.header_menu?pcMarg:0)-(d.footer_menu?pcMarg:0);
 if(!d.expanded)
 {
  d.expanded=true;
  d.element.style.left='0px';
  d.element.style.top=this.top+'px';
  d.element.style.right="0px";
  d.element.style.bottom=this.bottom+"px";
  d.body.style.width="100%";
  d.body.style.height=h+"%";
  d.body.style.overflow="auto";
 }
 else
 {
  d.expanded=false;
  d.element.style.width="";
  d.element.style.height="";
  d.element.style.right="";
  d.element.style.bottom="";
  if(d.left && d.top)
  {
   d.element.style.left=d.left;
   d.element.style.top=d.top;
  }
  else
  {
   d.left=d.element.style.left;
   d.top=d.element.style.top;
  };
  if(d.width && d.height)
  {
   d.body.style.width=d.width;
   d.body.style.height=d.height;
  }
  else
  {
   d.body.style.width="";
   d.body.style.height="";
   d.body.style.maxWidth=Math.round(document.documentElement.clientWidth*0.9-Number(d.left.replace("px","")))+"px";
   d.body.style.maxHeight=Math.round(document.documentElement.clientHeight*0.9-Number(d.top.replace("px",""))-3*APP_HEAD)+"px";
  };
 };
};


appEnvironment.prototype.clearTool=function(t,src)
{
 var t=this.tools[this.tool_index[t]];
 switch(t.body_type)
 {
 case 'New div':
 case 'Existing div':
  while(t.body.firstChild)
  {
   t.body.removeChild(t.body.firstChild);
  };
  break;
 case 'Existing iframe':
 case 'New iframe':
  if(src)
  {
   t.body.src=src;
  }
  else
  {
   t.body.src="";
  };
  break;
 };
};

appEnvironment.prototype.reloadTool=function(t)
{
 var t=this.tools[this.tool_index[t]];
 switch(t.body_type)
 {
 case 'Existing iframe':
 case 'New iframe':
  if(t.body.src)
  {
   t.body.src=t.body.src;
  };
  break;
 };
};

appEnvironment.prototype.createFrame=function(d)
{
 var hdr,div,divPos,men,footer;
 d.element=document.createElement('div');
 d.element.className='appFrame';
 d.element.style.top=this.header.header_height+"px";
 d.element.style.bottom="0px";
 d.control=document.createElement('div');
 d.control.className='appContainer';
 d.control.style.top=this.header.header_height+"px";
 d.control.style.bottom="0px";
 switch(d.body_type)
 {
 case 'Existing div':
 case 'Existing iframe':
  d.body=document.getElementById(d.body_id);
  break;
 case 'New div':
  d.body=document.createElement('div');
  d.body.className='appBody';
  d.body.id=d.body_id;
  d.body.style.padding="10px";
  break;
 case 'New iframe':
  d.body=document.createElement('iframe');
  d.body.id=d.body_id;
  d.body.src=d.iframe_src;
  d.body.style.width="100%";
  d.body.style.height="100%";
  break;
 };
 d.body.style.top=this.header.header_height+"px";
 d.body.style.bottom="0px";
 d.element.appendChild(d.body);
 if(d.left_menu || d.right_menu)
 {
  switch(d.body_type)
  {
  case 'Existing iframe':
  case 'New iframe':
   d.element.style.top=(this.header.header_height+APP_HEAD)+"px";
   d.control.style.top=(this.header.header_height+APP_HEAD)+"px";
   break;
  default:
   d.body.style.paddingTop=(10+APP_HEAD)+"px";
   break;
  };
  div=document.createElement('div');
  div.className='appHeaderBar';
  div.style.top=this.header.header_height+"px";
  d.control.appendChild(div);
  this.hasFrameMenu=true;
  if(d.left_menu)
  {
   divPos=document.createElement('div');
   divPos.className='appLeft';
   div.appendChild(divPos);
   men=this.createMenu(this.menus[this.menu_index[d.left_menu]],0,d.left_menu);
   divPos.appendChild(men);
   divPos=false;men=false;
  };
  if(d.right_menu)
  {
   divPos=document.createElement('div');
   divPos.className='appRight';
   div.appendChild(divPos);
   men=this.createMenu(this.menus[this.menu_index[d.right_menu]],0,d.right_menu);
   divPos.appendChild(men);   
   divPos=false;men=false;
  };
  div=false;
 };
 if(d.footer_menu)
 {
  switch(d.body_type)
  {
  case 'Existing iframe':
  case 'New iframe':
   d.element.style.bottom=(APP_HEAD)+"px";
   d.control.style.bottom=(APP_HEAD)+"px";
   break;
  default:
   d.body.style.bottom=(APP_HEAD)+"px";
   break;
  };
  div=document.createElement('div');
  div.className='appFooterBar';
  d.control.appendChild(div);
  this.hasFrameFooter=true;
  if(d.footer_menu)
  {
   divPos=document.createElement('div');
   divPos.className='appLeft';
   div.appendChild(divPos);
   men=this.createMenu(this.menus[this.menu_index[d.footer_menu]],0,d.footer_menu);
   divPos.appendChild(men);
   divPos=false;men=false;
  };
  div=false;
 };
 this.frameContainer.appendChild(d.element);
 this.controlContainer.appendChild(d.control);
 d.control.style.display='none';
};

appEnvironment.prototype.toolTitle=function(t,newTitle)
{
 var t=this.tools[this.tool_index[t]];
 var st;
 if(!newTitle){newTitle=t.title;};
 if(t.titleElement)
 {
  t.titleElement.removeChild(t.titleElement.firstChild);
  t.titleElement.appendChild(document.createTextNode(newTitle));
 };
 st=newTitle;
 if(st.length>20){st=st.slice(0,17)+"...";};
 if(t.trayIcon)
 {
  t.trayIcon.removeChild(t.trayIcon.firstChild);
  t.trayIcon.appendChild(document.createTextNode(st));
 };
 return newTitle;
};

appEnvironment.prototype.index=function(ar,id)
{
 var i;
 var ind={};
 for(i=0;i<ar.length;i++)
 {
  if(ar[i][id])
  {
   ind[ar[i][id]]=i;
  };
 };
 return ind;
};

appEnvironment.prototype.frameMenu=function()
{
 var i,it,men={};
 men.menu_id="Frame_menu";
 men.items=[{"type":"ButtonLeft","text":"<","link":"",
  	"onclick":"app.shiftFrame(-1)","submenu_id":"","title":"","icon":""}];
 for(i=0;i<this.frames.length;i++)
 {
  it={"type":"ButtonCenter","text":"","link":"",
  	"onclick":"","submenu_id":"","title":"","icon":""};
  if(this.frames[i].icon)
  {
   it.icon=this.frames[i].icon;
  }
  else
  {
   it.text=this.frames[i].title;
  };
  it.title="Select frame: "+this.frames[i].title;
  it.onclick="app.selectFrame("+i+")";
  men.items[i+1]=it;
 };
 men.items.push({"type":"ButtonRight","text":">","link":"",
  	"onclick":"app.shiftFrame(1)","submenu_id":"","title":"","icon":""});
 return men;
};

appEnvironment.prototype.frameIndex=function(title)
{
 var i;
 for(i=0;i<this.frames.length;i++)
 {
  if(this.frames[i].title==title){return i;};
 };
 return -1;
};

appEnvironment.prototype.reloadFrame=function(i,src)
{
 if(typeof(i)=="string"){return this.reloadFrame(this.frameIndex(i),src);};
 d=this.frames[i];
 switch(d.body_type)
 {
 case 'Existing div':
 case 'New div':
  while(d.body.firstChild)
  {
   d.body.removeChild(d.body.firstChild);
  };
  break;
 case 'Existing iframe':
 case 'New iframe':
  if(src)
  {
   d.body.src=src;
  };
  d.body.src=d.body.src;
  break;
 };
};

appEnvironment.prototype.selectFrame=function(i)
{
 if(typeof(i)=="string"){return this.selectFrame(this.frameIndex(i));};
 if((i<0)|| (i>=this.frames.length)){return;};
 if(this.frames.length==1) // only one frame - no frame control 
 {
  this.frame=i;
  this.frames[this.frame].element.style.display='block';
  this.frames[this.frame].control.style.display='block';
  this.frames[this.frame].neverShown=false;
  return;
 };
 this.hideAllTools();
 this.frames[this.frame].element.style.display='none';
 this.frames[this.frame].control.style.display='none';
 if(!this.header.hide_frame_navigator)
 {
  document.getElementById('frame_menu__'+(this.frame+1)).className='appButtonCenter';
 };
 this.frame=i;
 this.frames[this.frame].element.style.display='block';
 this.frames[this.frame].control.style.display='block';
 if(this.frames[this.frame].body.src && this.frames[this.frame].neverShown)
 {
  this.reloadFrame(this.frame); // for Safari
 };
 if(!this.header.hide_frame_navigator)
 {
  document.getElementById('frame_menu__'+(this.frame+1)).className='appButtonActive';
 };
 this.frames[this.frame].neverShown=false;
 this.showActiveTools(this.frames[this.frame].tools);
 if(this.trayContainer)
 {
  this.trayContainer.style.bottom=this.frames[this.frame].footer_menu ? (APP_HEAD)+"px" : "0px";
 };
 this.frames[this.frame].element.style.bottom;
};

appEnvironment.prototype.shiftFrame=function(shift)
{
 var to=this.frame+shift;
 if((to>=0) && (to<this.frames.length))
 {
  this.selectFrame(to);
 };
};

appEnvironment.prototype.createHeader=function(d)
{
 document.title=d.title;
 if((d.icon && (window.parent==window)) || d.left_menu || d.right_menu || ((this.frames.length>1)&&(!d.hide_frame_navigator)))
 {
  d.header_height=APP_HEAD;
  hd=document.createElement('DIV');
  hd.className='appHeader';
  if(d.icon || d.left_menu)
  {
   divPos=document.createElement('div');
   divPos.className='appLeft';
   if(d.icon)
   {
    divPos.style.marginLeft="0px";
    img=document.createElement('img');
    img.style.height=d.header_height+"px";
    img.src=d.icon;
    img.alt="Logo";
    divPos.appendChild(img);
   };
   if(d.leftmenu)
   {
    divPos.appendChild(this.createMenu(this.menus[this.menu_index[d.left_menu]],0,d.left_menu));
   };
   hd.appendChild(divPos);
   this.hasHeader=true;
   divPos=false;
  };
  if(d.right_menu)
  {
   divPos=document.createElement('div');
   divPos.className='appRight';
   divPos.appendChild(this.createMenu(this.menus[this.menu_index[d.right_menu]],0,d.right_menu));
   hd.appendChild(divPos);
   divPos=false;
  };
  if(d.title || (this.frames.length>1))
  {
   divPos=document.createElement('div');
   if(d.title && (this.frames.length<2))
   {
    divPos.className='appTitle';
    divPos.id="appTitle";
    divPos.appendChild(document.createTextNode(d.title));
   }
   else
   {
    divPos.className='appCenter';
    divPos.appendChild(this.createMenu(this.frameMenu(),0,'frame_menu'));
   };
   hd.appendChild(divPos);
   divPos=false;
  };
  hd.style.height=d.header_height+"px";
  this.controlContainer.appendChild(hd);
 };
};

appEnvironment.prototype.applyOptions=function()
{
 if(this.options.file_dialog)
 {
  this.tools.push({"tool_id":"fileDialog","title":"Files",
  	"left":100,"top":50,"width":450,"height":575,"dialog":true,
  	"body_type":"New iframe","body_id":"fileFrame","iframe_src":""});
 };
 if(this.options.color_dialog)
 {
  this.tools.push({"tool_id":"colorArea","title":"Color picker",
  	"left":"40%","top":"20%","width":600,"height":400,"dialog":true,
  	"body_type":"New iframe","body_id":"colorFrame","iframe_src":"../utils/c_picker.html"});
 };
};

appEnvironment.prototype.createProgress=function(title,cancel,start,assoc)
{
 var d,ul,can,ti;
 this.endProgress();
 this.progress=document.createElement('div');
 this.progress.className='appVeil';
 this.progress.assoc=assoc;
 d=document.createElement('div');
 d.className='appProgress';
 this.progressBar=document.createElement('div');
 this.progressBar.className='appProgressBar';
 this.progress.appendChild(d);
 d.appendChild(this.progressBar);
 if(title)
 {
  ti=document.createElement('div');
  ti.className='appProgressTitle';
  ti.appendChild(document.createTextNode(title));
  this.progress.appendChild(ti);
 };
 if(cancel)
 {
  can=document.createElement('div');
  can.className='appProgressControl';
  can.appendChild(this.createMenu({menu_id:"app_progress",
 	items:[{"type":"Button","text":"Cancel","link":"",
  	"onclick":cancel,"submenu_id":"","title":"","icon":""}]},0,'cancel'));
  this.progress.appendChild(can);
 };
 if(start)
 {
  this.updateProgress(start);
 };
 if(appDrag){this.progress.style.zIndex=3*(appDrag.nZfocus++);};
 document.body.appendChild(this.progress);
};

appEnvironment.prototype.updateProgress=function(percent,assoc)
{
 if(assoc && this.progress.assoc && (this.progress.assoc!=assoc)){return;};
 this.progressBar.style.width=percent+"%";
};

appEnvironment.prototype.endProgress=function(assoc)
{
 if(!this.progress){return;};
 if(assoc && this.progress.assoc && (this.progress.assoc!=assoc)){return;};
 document.body.removeChild(this.progress);
 this.progress=false;
};

function NoLoginInterface(obj)
{
};

NoLoginInterface.prototype.logged_in=function()
{
 return new Promise(function (resolve,reject)
 {
  resolve(true);
 }.bind(this));
};

NoLoginInterface.prototype.loginTry=function()
{
 return true;
};

NoLoginInterface.prototype.login=function()
{
 return new Promise(function (resolve,reject)
 {
  resolve(true);
 }.bind(this));
};

appEnvironment.prototype.createFramework=function()
{
 var hd,divPos,img;
 this.applyOptions();
 this.hasHeader=false;
 this.hasFrameMenu=false;
 this.hasFrameFooter=false;
 this.menu_index=this.index(this.menus,'menu_id');
 this.tool_index=this.index(this.tools,'tool_id');
 this.frame_index=this.index(this.frames, 'frame_id');
 this.frameContainer=document.createElement('div');;
 this.frameContainer.className='appContainer';
 this.toolContainer=document.createElement('div');;
 this.toolContainer.className='appContainer';
 if(this.tools && (this.tools.length>0))
 {
  this.trayContainer=document.createElement('div');
  this.trayContainer.className='appTray';
 };
 this.dialogContainer=document.createElement('div');;
 this.dialogContainer.className='appContainer';
 this.controlContainer=document.createElement('div');
 this.controlContainer.className='appContainer';
 document.body.appendChild(this.frameContainer);
 document.body.appendChild(this.toolContainer);
 if(this.trayContainer)
 {
  document.body.appendChild(this.trayContainer);
 };
 document.body.appendChild(this.dialogContainer);
 document.body.appendChild(this.controlContainer);
 /* top level */
 this.createHeader(this.header);
 for(i=0;i<this.frames.length;i++)
 {
  this.createFrame(this.frames[i]);
  this.frames[i].neverShown=true;
 };
 for(i=0;i<this.tools.length;i++)
 {
  if(this.tools[i].dialog)
  {
   this.dialogContainer.appendChild(this.createTool(this.tools[i]));
  }
  else
  {
   this.toolContainer.appendChild(this.createTool(this.tools[i]));
  };
 };
 this.selectFrame(0);
 if(!onAServer()){window.login=new NoLoginInterface();};
 document.getElementById("_consoleArea").className="appConsole";
 if(this.options.initialise){this.safeEval(this.options.initialise);};
 if(!window.parent)
 {
  window.onbeforeunload=function(){return app.changed;};
 };
 this.top=0+(this.hasHeader?APP_HEAD:0)+(this.hasFrameMenu?APP_HEAD:0);
 this.bottom=APP_HEAD+(this.hasFrameFooter?APP_HEAD:0);
 appLink=this;
};

appEnvironment.prototype.includeFile=function(name)
{
 if(window.version && (name.indexOf(":")==-1)){window.version.includeFile(name);return;};
 document.write("<script type='text/javascript' src='"+name+"'><\/script>\n");
};

appEnvironment.prototype.includeFiles=function()
{
 var i,v,c;
 for(i=0;i<this.files.length;i++)
 {
  this.includeFile(this.files[i]);
 };
};


// file handling
var prevTest="";

appEnvironment.prototype.filePromise=function(test)
{
 var res=app.fileResolve,rej=app.fileReject;
 app.fileReject=false;
 app.fileResolve=false;
 if(rej)
 {
  app.alert("Overlapping file request "+prevTest+" > "+test);
 };
 prevTest=test;
 return new Promise(function(resolve,reject)
 {
  app.fileResolve=resolve;
  app.fileReject=reject;
 });
};
appEnvironment.prototype.fileReply=function(a,b)
{
 var done=false;
 var res=app.fileResolve,rej=app.fileReject;
 app.fileReject=false;
 app.fileResolve=false;
 if(a==false)
 {
  if(rej)
  {
   rej(b);
   done=true;
  };
 }
 else
 {
  if(res)
  {
   if(b){res({"name":a,"content":b})}
   else{res(a);};
   done=true;
  };
 };
 return done;
};
appEnvironment.prototype.fileLogInFirst=function(action)
{
 if(onAServer() && (typeof(login)!='undefined') && login)
 {
  login.login()
  .then(function(rpl){
   if(rpl)
   {
    action();
   }
   else
   {
    app.fileReply(false,"Failed to log in");
   };
  }.bind(this))
  .catch(function(e){app.fileReply(false,"Failed to log in");app.alert(e);});
 }
 else
 {
  action();
 };
};
appEnvironment.prototype.fileNew=function(mode,content)
{
 if(!content){content="";};
 this.fileMode=mode;
 this.setFileContent("",content);
 return {"name":"","content":content};
};
appEnvironment.prototype.fileSave=function(mode,ft,prom)
{
 var fname;
 if(!prom)
 {
  prom=new this.filePromise(mode);
  this.fileLogInFirst(this.fileSave.bind(this,mode,ft,prom));
  return prom;
 };
 this.fileMode=mode;
 this.filename=this.getFilename();
 if(!this.filename){this.fileSaveAs(mode,ft,prom);};
 this.filecontent=this.getFileContent();
// this.setFilename(this.filename);
 fname=this.filename; // used for async return
 if(this.filename && this.filecontent)
 {
  if(fname.indexOf('http')==0)
  {
   // try saving directly to the url
   putToServer(fname,this.filecontent,
   	function (txt){
    	var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(!res.status){app.alert(res.error+"\n\n"+txt);app.fileReply(false,res.error+"\n\n"+txt);}
   		 else{app.setFilename(fname);};
   		}
   		catch(e){app.alert(txt);app.fileReply(false,txt);};
   	},
   	function (err){app.alert("Cannot save: "+fname);app.fileReply(false,"Cannot save: "+fname);});
   	return;
  };
  if(onAServer())
  {
   putToServer('../fs/put_file.php?filename='+encodeURIComponent(fname),this.filecontent,
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(!res.status){app.alert(res.error);}
   		 else{app.setFilename(fname);};
   		}catch(e){app.alert(txt);app.fileReply(false,txt);};
   	},
   	function (err){app.alert("Cannot save: "+fname);app.fileReply(false,"Cannot save: "+fname);});
  }
  else
  {
   localFileWrite(this.filename,this.filecontent);
   this.setFilename(this.filename);
  };
 };
 return prom;
};
appEnvironment.prototype.finishSave=function(mode)
{
 this.alert("Finish");
 this.hideTool('fileDialog');
};
appEnvironment.prototype.fileSaveAs=function(mode,ft,prom,action)
{
 if(!prom)
 {
  prom=this.filePromise(mode);
  this.fileLogInFirst(this.fileSaveAs.bind(this,mode,ft,prom,action));
  return prom;
 };
 if(!ft){ft=this.options.file_type;};
 if(!action){action="Save";};
 this.fileMode=mode;
 this.showTool('fileDialog');
 this.fileSaving=true;
 fileDialog(action,ft);
 return prom;
};
appEnvironment.prototype.fileOpen=function(mode,fname,action,prom)
{
 var a;
 if(!prom)
 {
  prom=new this.filePromise(mode+" "+fname);
  this.fileLogInFirst(this.fileOpen.bind(this,mode,fname,action,prom));
  return prom;
 };
 if(!action){action="Open";};
 this.fileMode=mode;
 if(fname)
 {
  a=fname.split('.');
  if((a.length==2)&&(a[0]=='*'))
  {
   this.showTool('fileDialog');
   fileDialog(action,a[1]);   
  }
  else
  {
   if(onAServer() && ((typeof(login)=='undefined') || !login))
   {
    this.clearTool('fileDialog','../fs/get_file_content.php?filename='+encodeURIComponent(fname));
   }
   else
   {
     try
     {
       getFromServer(myDataUrl(fname),
        function (txt){setFileContent(fname,txt)},
        function (err)
        {
         if(mode!="async")
         {
          app.log("warning","Cannot open file: "+fname);
         };
         app.fileReply(false,"Cannot open file: "+fname);
        });
     }
     catch(e){app.alert(e);};
//    localFileRead(fname,function (txt){setFileContent(fname,txt);});
   };
  };
 }
 else
 {
  this.showTool('fileDialog');
  if(mode && (this.options.file_type=='json')&&this.header.id)
  {
   fileDialog(action,this.options.file_type+
   	"&contains="+encodeURIComponent(this.header.id+"."+mode));
  }
  else
  {
   fileDialog(action,this.options.file_type);
  };
 };
 return prom;
};
appEnvironment.prototype.fileManager=function(ext)
{
 var url='../fs/filedialog.html';
 if(ext){url+="?ext="+ext;};
 window.open(url,'FileManager',"width=650,height=650,toolbar=no,location=no,menubar=no,resizable=no,status=no");
};
appEnvironment.prototype.myDataUrl=function(fname)
{
 return myDataUrl(fname);
};
appEnvironment.prototype.mkDir=function(dir,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.mkDir(dir,resolve,reject);
  }.bind(this));
 };
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   if(!dir){onerror("Connot create root directory");return;};
   getFromServer(myDataUrl(dir)+'?action=createDir',
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(!res.status)
   		 {
   		  onerror(res.error+"\n\n"+txt);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res.message);};
   		 };
   		}catch(e){onerror(e+"\n"+txt);};
   	},
   	function (err){onerror("Cannot create "+dir+"\n"+err);});
};
appEnvironment.prototype.rm=function(dir,onfinish,onerror) // should work for dir or file
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.rm(dir,resolve,reject);
  }.bind(this));
 };
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   if(!dir){onerror("Connot delete nothing");};
   getFromServer(myDataUrl(dir)+'?action=delete',
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(!res.status)
   		 {
   		  onerror(res.error+"\n\n"+txt);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res.message);};
   		 };
   		}catch(e){onerror(e+"\n"+txt);};
   	},
   	function (err){onerror("Cannot delete "+dir+"\n"+err);});
};
appEnvironment.prototype.putTo=function(fname,contents,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.putTo(fname,contents,resolve,reject);
  }.bind(this));
 };
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   if(!fname){onerror("Connot write to nothing");};
   putToServer(fname,contents,
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(!res.status)
   		 {
   		  onerror(res.error+"\n\n"+txt);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res.message);};
   		 };
        }catch(e){onerror(e);};
    },
   	function(err){onerror(err);});
};
appEnvironment.prototype.fwrite=function(fname,contents,onfinish,onerror)
{
 return this.putTo(myDataUrl(fname),contents,onfinish,onerror);
};
appEnvironment.prototype.getFrom=function(fname,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.getFrom(fname,resolve,reject);
  }.bind(this));
 };
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   if(!fname){onerror("Connot read from nothing");};
   getFromServer(fname,
   	function (txt){onfinish(txt);},
   	function (err){onerror("Cannot get from: "+fname+"\n"+err);});
};
appEnvironment.prototype.fread=function(fname,onfinish,onerror)
{
 return this.getFrom(myDataUrl(fname),onfinish,onerror);
};
appEnvironment.prototype.dir=function(path,onfinish,onerror,simple)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.dir(path,resolve,reject,simple);
  }.bind(this));
 };
   var urq='?action=readDir';
   if(!simple){urq+='&detail=true';};
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   getFromServer(myDataUrl(path)+urq,
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(res.status===false)
   		 {
   		  onerror(res.error);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res);};
   		 };
        }catch(e){onerror(e);};
   	},
   	function(err){onerror(err);});
};
appEnvironment.prototype.mv=function(path,to,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.mv(path,to,resolve,reject);
  }.bind(this));
 };
   var urq='?action=rename&to='+to;
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   getFromServer(myDataUrl(path)+urq,
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(res.status===false)
   		 {
   		  onerror(res.error);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res);};
   		 };
        }catch(e){onerror(e+"\n"+txt);};
   	},
   	function(err){onerror(err);});
};
appEnvironment.prototype.cp=function(path,to,onfinish,onerror)
{
 if(!onfinish)
 {
  return new Promise(function(resolve,reject)
  {
   this.cp(path,to,resolve,reject);
  }.bind(this));
 };
   var urq='?action=copy&to='+to;
   if(!onerror){onerror=function(txt){app.alert(txt)};};
   getFromServer(myDataUrl(path)+urq,
   	function (txt){
   		var res;
   		try
   		{
   		 res=JSON.parse(txt);
   		 if(res.status===false)
   		 {
   		  onerror(res.error);
   		 }
   		 else
   		 {
   		  if(onfinish){onfinish(res);};
   		 };
        }catch(e){onerror(e+"\n"+txt);};
   	},
   	function(err){onerror(err);});
};


// only used in old dendro application
appEnvironment.prototype.fileOpenLocal=function(mode,accept)
{
 var prom=new this.filePromise();
 this.fileMode=mode;
 if(accept)
 {
  this.clearTool('fileDialog','../fs/get_file_content.html?accept='+accept);
 }
 else
 {
  this.clearTool('fileDialog','../fs/get_file_content.html');
 };
 this.showTool('fileDialog');
 return prom;
};

appEnvironment.prototype.fileOpenRemote=function(mode,url)
{
 var prom=new this.filePromise(url);
 this.fileMode=mode;
 if(url)
 {
  getFromServer(url,function (txt){
      setFileContent(url,txt)},function(){
       if(mode!="async")
       {
        this.log("warning","Cannot open: "+url);
       };
       this.fileReply(false,"Cannot open: "+url);
      }.bind(this));
 }
 else
 {
  this.showTool('fileDialog');
  this.clearTool('fileDialog','../fs/get_file_content.html?source=url');
 };
 return prom;
};

appEnvironment.prototype.dirView=function(dir,ext)
{
  if(!ext){ext="*";};
  fileDialog("",ext+"&path="+dir+"/");
};

appEnvironment.prototype.setFilename=function(fname,noreply)
{
 if(this.fileMode!='async')
 {
  this.filename=fname;
  if(this.options.file_set_name){this.safeEval(this.options.file_set_name);}
  else{this.showFilename(fname);};
 };
 if(!noreply){this.fileReply(fname);};
};

appEnvironment.prototype.showFilename=function(fname)
{
 var d;
 document.title=this.header.title+" : "+fname;
 if(d=document.getElementById("appTitle"))
 {
  d.removeChild(d.firstChild);
  d.appendChild(document.createTextNode(document.title));
 };
};

appEnvironment.prototype.setFileContent=function(fname,fcontent)
{
 if(this.fileMode!='async')
 {
  this.fileSaving=false;
  this.setFilename(fname,true);
  this.filecontent=fcontent;
  if(this.options.file_set_content){this.safeEval(this.options.file_set_content);};
 };
 this.fileReply(fname,fcontent);
 app.hideTool('fileDialog');
};

appEnvironment.prototype.getFilename=function()
{
 if(this.options.file_get_name){this.safeEval(this.options.file_get_name);};
 return this.filename;
};

appEnvironment.prototype.getFileContent=function()
{
 this.fileSaving=true;
 if(this.options.file_get_content){app.safeEval(this.options.file_get_content);};
 return this.filecontent;
};

appEnvironment.prototype.fileDownload=function(filename, text) 
{
 var pom = document.createElement('a'); 
 pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(/*'\ufeff'+*/text));
 pom.setAttribute('download', filename);
 if(document.createEvent) 
 {
  var event = document.createEvent('MouseEvents');
  event.initEvent('click', true, true);
  pom.dispatchEvent(event);
  this.alert("Downloading "+filename,2000);
 }
 else 
 {
  pom.click();
 };
};


// object tagging

appEnvironment.prototype.tagObject=function(obj,mode)
{
 var tmp={};
 for(i in obj)
 {
  tmp[i]=obj[i];
  delete obj[i];
 };
 obj.json_application=this.header.id;
 if(mode){obj.json_application+='.'+mode;};
 obj.json_application+=':'+this.header.version;
 for(i in tmp)
 {
  if(i=='json_application'){continue;};
  obj[i]=tmp[i];
 };
 return obj;
};

appEnvironment.prototype.checkObject=function(obj,mode,ver)
{
 var a,tst=this.header.id;
 if(mode){tst+='.'+mode;};
 if(!obj.json_application){return false;};
 a=obj.json_application.split(':');
 if(a[0]!=tst){return false;};
 if(a.length<2){return true;};
 return Number(a[1]);
};

appEnvironment.prototype.toFixed=function(num,f)
{
  if (f < -20 || f > 20)
    alert("The number of fractional digits is out of range");
  if (isNaN(num)||(num==null))
    return "-";
  var s = num < 0 ? "-" : "", x = Math.abs(num);
  if (isNaN(f))
    return s+x.toString();
  if (x > Math.pow(10, 21))
    return s+x.toString();
  var m = Math.round(x*Math.pow(10, f)).toString();
  f = parseInt(f/1 || 0);
  if(f<=0)
  {
   for(;f<0;f++) m = m+"0";
   return s+m;
  }
  else
  {
   while (m.length <= f)
     m = "0"+m;
   return s+m.substring(0, m.length-f)+"."+m.substring(m.length-f);
  };
};

// Queue system


appEnvironment.prototype.queue=function()
{
 this.actions=[];
 this.taskLength=false;
};

appEnvironment.prototype.queueMethods=function()
{
 this.queue.prototype.active=function()
 {
  return this.actions.length;
 };
 this.queue.prototype.addAction=function(action)
 {
  this.actions.push(action);
 };
 this.queue.prototype.addNextAction=function(action)
 {
  this.actions.unshift(action);
 };
 this.queue.prototype.modal=function(message,oncancel)
 {
  this.taskLength=this.actions.length;
  if(this.taskLength)
  {
   app.createProgress(message,oncancel,0,this);
  };
 };
 this.queue.prototype.step=function(delay)
 {
  if(this.actions.length>0)
  {
   if(delay)
   {
    window.setTimeout(this.step.bind(this),delay);
    return true;
   };
   if(this.actions[0] instanceof Function){(this.actions.shift())();}
   else{this.safeEval(this.actions.shift());};
   if(this.taskLength){app.updateProgress(100*(this.taskLength-this.actions.length)/this.taskLength);};
   if(this.actions.length==0){this.finish();};
   return true;
  }
  else{return false;};
 };
 this.queue.prototype.finish=function()
 {
  if(this.taskLength)
  {
   if(this.modal){app.endProgress(this);};
   this.taskLength=0;
   this.actions=[];
  };
 };
};

appEnvironment.prototype.select=function(ar,onchange,start)
{
 this.newOptions=function(ar,start)
 {
  var i;
  while(this.element.options.length > 0) 
  {
   this.element.remove(this.element.options.length - 1);
  };
  this.options=ar;
  for(i=0;i<ar.length;i++)
  {
   this.element.options[i]=new Option(ar[i]);
   if((i==0) || (start && (ar[i]==start))){this.element.selectedIndex=i;};
  };
 };
 this.element=document.createElement("select");
 this.element.appSel=this;
 if(typeof(onchange)=="function")
 {
  this.onchange=onchange;
 }
 else
 {
  this.onchangeCode=onchange;
  this.onchange=function(){app.safeEval(this.onchangeCode);};
 };
 this.newOptions(ar,start);
 this.element.onchange=function(){this.appSel.onchange();};
};

appEnvironment.prototype.selectMethods=function()
{
 this.select.prototype.getValue=function()
 {
  return this.options[this.element.selectedIndex];
 };
 this.select.prototype.setValue=function(val)
 {
  var i;
  for(i=0;i<ar.length;i++)
  {
   if(val && (this.element.options[i]==val)){this.element.selectedIndex=i;};
  };
 };
 this.select.prototype.getIndex=function()
 {
  return this.element.selectedIndex;
 };
 this.select.prototype.setIndex=function(val)
 {
  this.element.selectedIndex=val;
 };
};

// Cookies

appEnvironment.prototype.setCookie=function(name,obj)
{
 var expireDate = new Date();
 if(!this.cookies){this.cookies={};};
 this.cookies[name]=obj;
 if(!this.cookiePermission)
 {
  if(this.cookiePermission===null){return;};
  app.confirm("Are you happy to enable Functional cookies\n for "+this.header.title,{"id":"CookiePermissions"}).then(function(){
   this.cookiePermission=true;
   this.setCookie(name,obj);
  }.bind(this)).catch(function(){this.cookiePermission=null}.bind(this));
  return;
 };
 expireDate.setFullYear(expireDate.getFullYear()+1);
 document.cookie=name+"="+encodeURIComponent(JSON.stringify(obj))
 	+";expires="+expireDate.toGMTString()+";path=/;sameSite=Strict";
};

appEnvironment.prototype.getCookie=function(name)
{
 var str,cookies,i,cookie,re;
 if(this.cookies)
 {
  if(this.cookies[name]){this.cookiePermission="true";return this.cookies[name];};
 }
 else
 {
  this.cookies={};
 };
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
     try
     {
      this.cookies[name]=myParseJSON(decodeURIComponent(cookie[1]));
     }
     catch(e)
     {
      this.cookies[name]=decodeURIComponent(cookie[1]);
     };
     this.cookiePermission="true";
     return this.cookies[name];
    };
   };
  };
  return false;
 };
 return false;
};

// Arguments

appEnvironment.prototype.getArgs=function()
{
 if(this.args){return this.args;};
 this.args={};
 var query = document.location.search.substring(1);
 var pairs = query.split("\&");
 for(var i=0;i < pairs.length; i++)
 {
  var pos=pairs[i].indexOf('=');
  if(pos==-1){ continue;};
  var argname = pairs[i].substring(0,pos);
  var value = pairs[i].substring(pos+1);
  this.args[argname]=decodeURIComponent(value);
 };
 return this.args;
};

// Async process support

appEnvironment.prototype.delay=function(time) {
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve();
    }, time);
  }.bind(this));
};

// C-type number formatting

appEnvironment.prototype.disp=function(f,v)
{
 return itemSpec.prototype.disp(f,v);
};

appEnvironment.prototype.sprintf=function()
{
 return itemSpec.prototype.sprintf.apply(null,arguments);
};

// date function

appEnvironment.prototype.writeDate=function(d,tm,uk)
{
 return myWriteDate(d,tm,uk);
};


// debug functions

appEnvironment.prototype.debugMessage=function(txt,quiet)
{
 if(!quiet){quiet=1000;}; // silences for 1s
 tm=Date.now();
 if(!this.debugSilence || tm>(this.debugSilence+quiet)) 
 {
  if(window.confirm(txt)){return;};
  if(window.confirm("Quiet mode"))
  {
   this.debugSilence=Date.now();
  }
  else
  {
   throw 'Debug terminated';
  };
 };
};

appEnvironment.prototype.log=function(a,b)
{
 if(this.parent){return this.parent.log(a,b);};
 var level="",message="",s,col=false,lines,i;
 if(typeof(b)!="undefined"){level=a;message=b;}else{message=a;};
 c=document.getElementById("_consoleArea");  
 switch(typeof(message))
 {
 case "object":
  if(a==null && b==null) // clear log
  {
   while(c.lastChild){c.removeChild(c.lastChild);};
   return;
  };
  message=JSON.stringify(message);
  break;
 case "string":
  break;
 default:
  message=message.toString();
  break;
 };
 s=document.createElement('code');
 switch(level)
 {
 case "warning":col="orange";break;
 case "fatal":col="red";break;
 case "inform":col="lightgreen";break;
 case "data":col="lightblue";break;
 default:
  if(typeof(level)=='string')
  {
   col=level;
  };
  break;
 };
 if(col){s.style.color=col;};
 lines=message.split("\n");
 for(i=0;i<lines.length;i++)
 {
  s.appendChild(document.createTextNode(lines[i]+"\n"));
  s.appendChild(document.createElement('br'));
 };
 c.appendChild(s);
 if(!this.getTool("_Console").active)
 {
  this.showTool("_Console");
 };
};

// printing

appEnvironment.prototype.printFrame=function(name)
{
 var frm=document.getElementById(name);
 frm.contentWindow.print();
};


// Draggable window support
function draggableElements()
{
 this.oActive=false;
 this.nMouseX=0;
 this.nMouseY=0;
 this.nStartX=0;
 this.nStartY=0;
 this.bMouseUp=true;
 this.nZfocus=33;
 document.onmousedown = function (oPssEvt1) {
        var oMsEvent1 = oPssEvt1 ||  window.event;
        var iNode = oMsEvent1.target || oMsEvent1.srcElement;
        if(iNode.className === "appDraggable")
        {
         appDrag.oActive = iNode;
		 appDrag.oActive.dragCover.style.display="block";        
        }
        else
        {
         if(iNode.className === "appDragCover")
         {
          if(appDrag.oActive){appDrag.oActive.dragCover.style.display="block";};
          iNode=iNode.parentNode;
          appDrag.oActive = iNode;
         }
         else
         {
          appDrag.bMouseUp = true;
          return;
         };
        };
        appDrag.bMouseUp = false;
        appDrag.nStartX = appDrag.nStartY = appDrag.nStartW = appDrag.nStartH = 0;
        appDrag.nMouseX = oMsEvent1.clientX;
        appDrag.nMouseY = oMsEvent1.clientY;
        appDrag.nStartX = appDrag.oActive.offsetLeft;
        appDrag.nStartY = appDrag.oActive.offsetTop;
        appDrag.reSize=((appDrag.nMouseX > appDrag.nStartX +appDrag.oActive.offsetWidth/2) &&
            	(appDrag.nMouseY > appDrag.nStartY +appDrag.oActive.offsetHeight/2) &&
            	appDrag.oActive.dragResize);
        if(appDrag.reSize)
        {
        	appDrag.nStartW = appDrag.oActive.dragResize.clientWidth;
        	appDrag.nStartH = appDrag.oActive.dragResize.clientHeight;
        };
        appDrag.oActive.style.zIndex = 3*(appDrag.nZfocus++);
        return false;
    };

 document.onmousemove = function (oPssEvt2) {
        var oMsEvent2 = oPssEvt2 || /* IE */ window.event;
        var newTop;
        if (appDrag.bMouseUp || (!oMsEvent2.buttons)) { appDrag.bMouseUp=true; return; }
        if(appDrag.reSize)
        {
        	appDrag.oActive.dragResize.style.width = String(appDrag.nStartW + oMsEvent2.clientX - appDrag.nMouseX) + "px";
        	appDrag.oActive.dragResize.style.height = String(appDrag.nStartH + oMsEvent2.clientY - appDrag.nMouseY) + "px";
        	appDrag.oActive.dragResize.style.maxWidth = "";
        	appDrag.oActive.dragResize.style.maxHeight = "";
        	appDrag.oActive.tool.width = appDrag.oActive.dragResize.style.width;
        	appDrag.oActive.tool.height = appDrag.oActive.dragResize.style.height;
        }
        else
        {
        	appDrag.oActive.style.left = String(appDrag.nStartX + oMsEvent2.clientX - appDrag.nMouseX) + "px";
        	newTop=appDrag.nStartY + oMsEvent2.clientY - appDrag.nMouseY;
        	if(newTop<app.top){newTop=app.top;};
        	if(newTop>window.innerHeight-app.top){newTop=window.innerHeight-app.top;};
        	appDrag.oActive.style.top = String(newTop) + "px";
        	appDrag.oActive.tool.left = appDrag.oActive.style.left;
        	appDrag.oActive.tool.top = appDrag.oActive.style.top;
        };
    };

 document.onmouseup = function () {
        if(appDrag.oActive)
        {
 			appDrag.oActive.dragCover.style.display="none";
 		};
        appDrag.bMouseUp = true;
    };
 document.onmouseout = function () {
//        appDrag.bMouseUp = true;
    };
};

function keyHandler(e)
{
 if(!appDrag.oActive){return false;};
 if(e.altKey || e.shiftKey){return false;};
 switch(e.keyCode)
 {
 case 13: if(appDrag.oActive.rtn){appDrag.oActive.key(true);return true;};break;
 case 27: if(appDrag.oActive.esc){appDrag.oActive.key(false);return true;};break;
 case 38: if(appDrag.oActive.tool.menu){appDrag.oActive.tool.setPos(-1,true);return true;};break;
 case 40: if(appDrag.oActive.tool.menu){appDrag.oActive.tool.setPos(1,true);return true;};break;
 };
 return false;
};

function sliderInputHandler(typ,func,e)
{
 e.preventDefault();
 app.sliderInput={"which":e.which,"x":e.clientX,"type":typ};
 app.safeEval(func);
};

function keyInputHandler(func,e)
{
   e.preventDefault();
   app.keyInput={"alt":e.altKey,"shift":e.shiftKey,"key":false};
   switch(e.keyCode)
   {
   case 37: // left
    app.keyInput.key="left";break;
   case 38: // up
    app.keyInput.key="up";break;
   case 39: // right
    app.keyInput.key="right";break;
   case 40: // down
    app.keyInput.key="down";break;
   case 173:
   case 189: // -
    app.keyInput.key="minus";break;
   case 61:
   case 187: // +
    app.keyInput.key="plus";break;
   case 48: // 0
    app.keyInput.key="zero";break;
   };
   this.value="";this.focus();
   if(app.keyInput.key)
   {
    switch(typeof(func))
    {
    case "string":
     try{app.safeEval(func);}catch(e){};
     break;
    case "function":
     func(app.keyInput);
     break;
    };
    app.safeEval(func);
   };
   return true;
};

// globals needed by other functions

function hideArea(a)
{
 app.hideTool(a);
};

function setFilename(fn)
{
 app.setFilename(fn);
};
function setFileContent(fname,fcontent){app.setFileContent(fname,fcontent);};
function getFilename(){return app.getFilename();};
function getFileContent(){return app.getFileContent();};

// initialisation code
(function () {
 app=new appEnvironment(data);
 if(window.parent && window.parent.app && (window.parent!=window))
 {
  app.parent=window.parent.app;
 };
 app.includeFiles();
 app.queueMethods();
 app.selectMethods();
 appDrag=new draggableElements();
 window.onload=(function(){app.createFramework();});
 document.addEventListener("keydown",function(e){keyHandler(e||window.event);});
})();