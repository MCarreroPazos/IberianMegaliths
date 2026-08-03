var OxCalView=parent.oxcal.modelView; 
var modelDisplay;
var reversed=(OxCalView=="ModelRev");
var selectList;
var moveItem,duplsReported=false;
var commandList=new Array();
commandList[0]=parent.oxcal.command;
commandList.mod=10
commandList.min=0;
commandList.max=0;
commandList.pos=0;
parent.oxcal.namesUsed={};
parent.oxcal.namesChecked=false;
parent.oxcal.refsUsed={};
parent.oxcal.curvesUsed={};

function OxCalArray()
{
 this.elements=new Array;
};

new OxCalArray();

OxCalArray.prototype.parseCode=function(str)
{
 var i;
 var child;
 for(i=0;(i<str.length) && (str.charAt(i)!='}');i++)
 {
  child=new OxCalElement();
  i=child.parseCode(str,i,str.length);
  if(typeof(child.type)!="undefined")
  {
   if((child.type=="verb")||(child.type=="expression")||(child.type=="comment"))
   {
    this.elements[this.elements.length]=child;
   };
  };
 };
};

OxCalArray.prototype.extractCode=function()
{
 var i;
 var code="";
 for(i=0;i<this.elements.length;i++)
 {
  code+=this.elements[i].extractCode();
 };
 return code;
};

function OxCalElement()
{
 this.parent=null; // defines the parent
 this.script=""; // defines the program script
 this.children=new Array; // defines any children within {}
 this.comments=new Array; // comments array {}
 this.XHTML=null; // defines the XHTML element for this object
 this.top=false;
};

new OxCalElement();

OxCalElement.prototype.elementWithClass=function(typ,cl)
{
 var el=document.createElement(typ);
 el.className=cl;
 return el;
};

OxCalElement.prototype.dot=function(typ,d)
{
 if(!d)
 {
  d=this.elementWithClass('div','objIcon');
  d.style.margin="-3px 0px";
 };
 while(d.lastChild){d.removeChild(d.lastChild);};
 switch(typ)
 {
 case 'blue':
  d.appendChild(this.elementWithClass('div','circleBlue'));
  if(this.script)
  {
   d.appendChild(this.elementWithClass('div','sort'));
  };
  break;
 case 'green':
  d.appendChild(this.elementWithClass('div','circleGreen'));
  d.appendChild(this.elementWithClass('div','plus'));
  break;
 case 'orange':
  d.appendChild(this.elementWithClass('div','circleOrange'));
  d.appendChild(this.elementWithClass('div','minus'));
  break;
 case 'blueSpot':
  d.appendChild(this.elementWithClass('div','circleBlue'));
  d.appendChild(this.elementWithClass('div','spot'));
  break;
 case 'greenSpot':
  d.appendChild(this.elementWithClass('div','circleGreen'));
  d.appendChild(this.elementWithClass('div','spot'));
  break;
 case 'orangeSpot':
  d.appendChild(this.elementWithClass('div','circleOrange'));
  d.appendChild(this.elementWithClass('div','spot'));
  break;
 };
 return d;
};

OxCalElement.prototype.createElement=function()
{
 var newOCE;
 newOCE= new OxCalElement();
 newOCE.parent=this;
 return newOCE;
};

OxCalElement.prototype.appendChild=function(el)
{
 var tr;
 var newrow;
 if(!el.XHTML){return;};
 this.children[this.children.length]=el;
 if(!this.container){this.createContainer();};
 switch(OxCalView)
 {
 case 'Model':
 case 'ModelRev':
  newrow=this.ordered;
  if(this.container.childNodes.length==0)
  {
   newrow=true;
  }
  else
  {
   if(reversed)
   {
    tr=this.container.childNodes[0];
   }
   else
   {
    tr=this.container.childNodes[this.container.childNodes.length-1];
   };
   if(tr.childNodes.length>2)
   {
    newrow=true;
   };
  };
  if(newrow)
  {
   tr=document.createElement("TR");
   tr.appendChild(el.XHTML);
   if(reversed && this.container.hasChildNodes())
   {
    this.container.insertBefore(tr,this.container.firstChild);
   }
   else
   {
    this.container.appendChild(tr);
   };
  }
  else
  {
   tr.appendChild(el.XHTML);
  };
  break;
 case 'List':
  this.container.appendChild(el.XHTML);
  break;
 };
 // select first element of first group on first draw
 if(selectList.elements.length==0 && el.children.length>=1)
 {
  if((!this.parent)&&(this.type=="model"))
  {
   el.children[0].selectElement();
   el.setOpen(true);
  };
 };
};

OxCalElement.prototype.insertBefore=function(el,next)
{
 var i,j;
 var tr,newtr,sib,pos,test,newrow;
 for(i=0;i<this.children.length;i++)
 {
  if(this.children[i]==next)
  {
   for(j=this.children.length;j>i;j--)
   {
    this.children[j]=this.children[j-1];
   };
   this.children[i]=el;
   el.parent=this;
   if(!el.XHTML)
   {
    return i+1;
   };
   switch(OxCalView)
   {
   case 'Model': 
   case 'ModelRev': 
    newrow=this.ordered;
    tr=next.XHTML.parentNode;
    pos=0;
    for(test=next.XHTML.previousSibling;test;test=test.previousSibling){pos++;};
    if(tr.childNodes.length>2)
    {
     newrow=true;
    };
    if(newrow && !this.ordered) // try a shuffle
    {
     if(reversed){sib=tr.nextSibling;}else{sib=tr.previousSibling;};
     if((sib)&&(sib.childNodes.length<2))
     {
      sib.appendChild(tr.removeChild(tr.firstChild));
      if(pos==0)
      {
       tr=sib;
      };
      newrow=false;
     };
    };
    if(newrow)
    {
     newtr=document.createElement("TR");
     for(j=0;j<pos;j++)
     {
      newtr.appendChild(tr.removeChild(tr.childNodes[0]));
     };
     newtr.appendChild(el.XHTML);
     if(reversed)
     {
      if(tr.nextSibling)
      {
       this.container.insertBefore(newtr,tr.nextSibling);
      }
      else
      {
       this.container.appendChild(newtr);
      };
     }
     else
     {
      this.container.insertBefore(newtr,tr);
     };
    }
    else
    {
     tr.insertBefore(el.XHTML,next.XHTML);
    };
    break;
   case 'List': 
    this.container.insertBefore(el.XHTML,next.XHTML);
    break;
   };
   return i+1;
  };
 };
 return false;
};

OxCalElement.prototype.removeChild=function(el,force)
{
 var i,j;
 var tr;
 if((el.type=="filler")&&(!force)){return false;};
 for(i=0;i<this.children.length;i++)
 {
  if(this.children[i]==el)
  {
   switch(OxCalView)
   {
   case 'Model':
   case 'ModelRev':
    tr=el.XHTML.parentNode;
    tr.removeChild(el.XHTML);
    if(tr.childNodes.length==0)
    {
     this.container.removeChild(tr);
    };
    break;
   case 'List':
    this.container.removeChild(el.XHTML);
    break;
   };
   for(j=i;j<this.children.length-1;j++)
   {
    this.children[j]=this.children[j+1];
   };
   this.children.length--;
   return i;
  };
 };
 return false;
};

OxCalElement.prototype.checkCode=function()
{
 var verb,start,c;
 var stringchar;
 var instring;
 if(!this.type) //ie not an expression nor a verb
 {
  verb=new Array;
  start=0;instring=false;
  for(i=0;i<this.script.length;i++)
  {
   c=this.script.charAt(i);
   if(instring)
   {
    if(c==stringchar){instring=false;};
    continue;
   };
   switch(c)
   {
   case '"':
   case "'":
    instring=true;
    charstring=c;
    break;
   case ' ':case '\n': case '\t': case '\r':
    if(start==i)
    {
     start=i+1;
    }
    else
    {
     verb[verb.length]=this.script.substring(start,i);
     start=i+1;
    };
   };
  };
  if(i!=start)
  {
   verb[verb.length]=this.script.substring(start,i);
  };
  if(verb.length>0)
  {
   this.script=verb[0]+"( ";
   for(i=1;i<verb.length;i++)
   {
    if(i>1){this.script+=", ";};
    this.script+=verb[i];
   };
   this.script+=")";
   this.type="verb";
  };
 };
 // check if elements are in a specific order
 this.ordered=false;
 if(this.type=="verb")
 {
  var tst;
  tst=this.script.indexOf("Plot");
  if((tst>-1)&&(tst<6)){this.ordered=true;};
  tst=this.script.indexOf("Seq");
  if((tst>-1)&&(tst<6)){this.ordered=true;};
  tst=this.script.indexOf("Bound");
  if((tst>-1)&&(tst<6)){this.boundary=true;};
 };
 if(this.type=="model")
 {
  this.ordered=true;
 };
};

OxCalElement.prototype.parseCode=function(str,start,end)
{
 var i;
 var c;
 var instring=false;
 var stringchar;
 var bracketLevel=0;
 var child;
 var endVerb=start;
 var commentStart;
 for (i=start; i<end; i++)
 {
  c=str.charAt(i);
  if(instring)
  {
   endVerb=i;
   if(c==charstring)
   {
    if((i>start)&&(str.charAt(i-1)=="\\")){continue;};
    instring=false;
   };
   continue;
  };
  switch(c)
  {
  case '"':
  case "'":
   instring=true;
   charstring=c;
   endVerb=i;
   break;
  case ' ':case '\n': case '\t': case '\r':
   if(i==start){start=i+1;};
   break;
  case '(':
   endVerb=i;
   bracketLevel++;
   if(!this.type)
   {
    this.keyword=str.substring(start,endVerb);
    this.type="verb";
   };
   break;
  case ')':
   endVerb=i;
   bracketLevel--;
   if(bracketLevel<0){parent.app.alert("Unbalanced () at character "+i);return i+1;}; // ignore this
   break;
  case '{':
   if(bracketLevel>0){break;};
   this.script=str.substring(start,endVerb+1);
   this.checkCode();
   this.createXHTML();
   while((i<end)&&(str.charAt(i)!='}'))
   {
    child=this.createElement();
    i=child.parseCode(str,i+1,end);
    this.appendChild(child);
   };
   child=this.createElement();
   child.type="filler";
   child.script="";
   child.createXHTML();
   this.appendChild(child);
   break;
  case '\<':
  case '\>':
  case '=':
   endVerb=i;
   if(bracketLevel>0){break;};
   this.keyword=str.substring(start,endVerb);
   this.type="expression";
   break;
  case '}':
   if(bracketLevel>0){break;};
   if(this.comments.length>0)
   {
    this.type="comment";
    this.script="Comment";
    this.createXHTML();
   };
   return i;
   break;
  case ';':
  case '?':
   if(bracketLevel>0){break;};
   if(start==i)
   {
    if(this.comments.length==0)
    {
     return i;
    }
    else
    {
     this.type="comment";
     this.script="Comment";
     this.createXHTML();
     return i;
    };
   };
   if(this.script!="")
   {
    return i;
   };
   this.script=str.substring(start,endVerb+1);
   this.checkCode();
   this.createXHTML();
   return i;
   break;
 case '\/':case '!':
   commentStart=-1;
   if((c=='!')&&(i==start))
   {
    commentStart=i+1;
    if(start==i){start=commentStart;};
   };
   if((c=='\/')&&(str.charAt(i+1)=='\/'))
   {
    commentStart=i+2;
    if(start==i){start=commentStart;};
   };
   if(commentStart!=-1)
   {
	for(i==commentStart;(i<end)&&(str.charAt(i)!='\n')&&(str.charAt(i)!='\r');i++){};
	this.comments[this.comments.length]=str.substr(commentStart,i-commentStart);
	if(start==commentStart){start=i+1;};
	break;
   };
   if((c=='\/')&&(str.charAt(i+1)=='*'))
   {
    commentStart=i+2;
    if(start==i){start=commentStart;};
	for(i==commentStart;(i<end)&&!((str.charAt(i)=='*')&&(str.charAt(i+1)=='\/'));i++){};
	this.comments[this.comments.length]=str.substr(commentStart,i-commentStart);
	i++;
	if(start==commentStart){start=i+1;};
	break;
   };
  default:
   endVerb=i;
   break;
  };
 };
 if(this.comments.length>0)
 {
  this.type="comment";
  this.script="";
  this.createXHTML();
 };
 return i;
};

OxCalElement.prototype.showSelect=function(selected)
{
 var i;
 if(this.title)
 {
  if(selected)
  {
   this.title.className="selected";
  }
  else
  {
   this.title.className="normal";
  };
 };
 if(this.children.length>0)
 {
  for(i=0;i<this.children.length;i++)
  {
   this.children[i].showSelect(selected);
  };
 };
};

OxCalElement.prototype.selectElement=function()
{
 var i;
 if(selectList.elements.length>0)
 {
  for(i=0;i<selectList.elements.length;i++)
  {
   selectList.elements[i].showSelect(false);
  };
  hideCursor();
  selectList.elements.length=0;
 };
 selectList.elements[0]=this;
 this.showSelect(true);
 return this;
};

OxCalElement.prototype.selectRegion=function()
{
 var i;
 var other;
 var from=-1,to=-1;
 if(!this.parent){return;};
 if(selectList.elements.length!=1){return;};
 other=selectList.elements[0];
 if(other==this){return;};
 for(i=0;i<this.parent.children.length;i++)
 {
  if((this.parent.children[i]==other)||(this.parent.children[i]==this))
  {
   if(from==-1)
   {
    from=i;
   }
   else
   {
    to=i;
   };
  };
 };
 if(to && (to>from))
 {
  hideCursor();
  selectList.elements.length=0;
  for(i=from;i<=to;i++)
  {
   this.parent.children[i].showSelect(true);
   selectList.elements[selectList.elements.length]=this.parent.children[i];
  };
 };
};

function mousedownOnScript(e)
{
 this.ocElement.selectElement();
 e.preventDefault();
};

function mouseupOnScript(e)
{
 this.ocElement.selectRegion();
 e.preventDefault();
};

function mousedownOnBullet(e)
{
 if(selectList.elements.length && (selectList.elements[0]==this.ocElement))
 {
  // leave selected region
 }
 else
 {
  this.ocElement.selectElement();
 };
 e.preventDefault();
};

function mouseupOnBullet(e)
{
 var i;
 if(selectList.elements.length && (selectList.elements[0]==this.ocElement))
 {
  if(this.ocElement.containerArea)
  {
   this.ocElement.toggleOpen();
  };
 }
 else
 {
  if(selectList.elements.length)
  {
   for(i=0;i<selectList.elements.length;i++)
   {
    if(this.ocElement.parent==selectList.elements[i]){return;};
    if(this.ocElement==selectList.elements[i]){return;};
   };
   cut();
   this.ocElement.selectElement();
   paste();
  };
 };
 e.preventDefault();
};

OxCalElement.prototype.setOpen=function(open)
{
 if(open)
 {
  this.dot('orange',this.expander);
  this.containerArea.style.display="block";
  this.open=true;
 }
 else
 {
  this.dot('green',this.expander);
  this.containerArea.style.display="none";
  this.open=false;
 };
};

OxCalElement.prototype.toggleOpen=function()
{
 if(!this.containerArea)
 {
  this.selectElement();
  return;
 };
 if(this.open){this.setOpen(false);}else{this.setOpen(true);};
};

function editThis()
{
 this.ocElement.selectElement();
 parent.oxcal.edit();
};

OxCalElement.prototype.checkForNames=function(subtract)
{
 var params,code=this.script;
 if(!this.keyword){return;};
 code=code.split(";")[0].replace(')','');
 code=code.split("(");
 if((code.length==2)&&parent.oxcal.commandsRef[this.keyword]
  &&parent.oxcal.commandsRef[this.keyword].param[0]&&parent.oxcal.commandsRef[this.keyword].param[0].indexOf)
 {
  if(parent.oxcal.commandsRef[this.keyword].param[0].indexOf("Name")==-1){return;};
  params=code[1].split(',');
  try{params[0]=JSON.parse(params[0]);}catch(e){return;};
  if(!params[0].indexOf){return;};// not a string
  if(!params[0]){return;}; // ignore empty string
  if(!parent.oxcal.namesUsed[params[0]]){parent.oxcal.namesUsed[params[0]]=0;};
  parent.oxcal.namesChecked=true;
  if(params[0].indexOf("=")==0)
  {
   parent.oxcal.refsUsed[params[0]]=true;
  }
  else
  {
   if(subtract)
   {
    parent.oxcal.namesUsed[params[0]]--;
   }
   else
   {
    parent.oxcal.namesUsed[params[0]]++;
   };
   switch(this.keyword)
   {
   case "Curve":
   case "Delta_R":
   case "Mix_Curves":
    parent.oxcal.curvesUsed[params[0]]=true;
    break;
   };
  };
 };
};

OxCalElement.prototype.appendScript=function(el)
{
 var sp;
 if(this.keyword)
 {
  this.checkForNames();
  sp=document.createElement("SPAN");
  sp.appendChild(document.createTextNode(this.keyword));
  switch(this.type)
  {
  case "verb":
   if(parent.oxcal.commandsRef[this.keyword.trim()]||(this.keyword=="Options"))
   {
    sp.style.fontWeight='bold';
   }
   else
   {
    sp.style.textDecoration='underline';
   };
   break;
  case "expression":
   sp.style.fontStyle='italic';
   break;
  };
  el.appendChild(sp);
  el.appendChild(document.createTextNode(this.script.replace(this.keyword,'')));
 }
 else
 {
  el.appendChild(document.createTextNode(this.script));
 };
};

OxCalElement.prototype.createXHTML=function()
{
 var title,tr,td,table,i;
 switch(OxCalView)
 {
 case 'Model':
 case 'ModelRev':
  if(this.type=="model")
  {
   this.XHTML=document.createElement("TABLE");
   this.XHTML.className="clear";
   this.tableBody=document.createElement("TBODY");
   this.XHTML.appendChild(this.tableBody);
   return;
  };
  this.XHTML=document.createElement("TD");
  table=document.createElement("TABLE");
  table.className="normal";
  if(this.boundary)
  {
   table.style.width="100%";
  };
  this.tableBody=document.createElement("TBODY");
  if(this.script!="Comment")
  {
   for(i=0;i<this.comments.length;i++)
   {
    tr=document.createElement("TR");
    td=document.createElement("TD");
    title=document.createTextNode(this.comments[i]);
    td.appendChild(title);
    td.className="comment";
    tr.appendChild(td);
    this.tableBody.appendChild(tr);
   };
  };
  tr=document.createElement("TR");
  this.title=document.createElement("TH");
  this.showSelect(false);
  this.expander=this.dot('blue');
  this.expander.ocElement=this;
  this.expander.onmousedown=mousedownOnBullet;
  this.expander.onmouseup=mouseupOnBullet;
  this.title.appendChild(this.expander);
  this.titleSpan=document.createElement("SPAN");
  this.titleSpan.ocElement=this;
  this.titleSpan.onmousedown=mousedownOnScript;
  this.titleSpan.onmouseup=mouseupOnScript;
  this.titleSpan.ondblclick=editThis;
  this.appendScript(this.titleSpan);
  this.title.appendChild(this.titleSpan);
  tr.appendChild(this.title);
  this.tableBody.appendChild(tr);
  if(this.script=="Comment")
  {
   for(i=0;i<this.comments.length;i++)
   {
    tr=document.createElement("TR");
    td=document.createElement("TD");
    title=document.createTextNode(this.comments[i]);
    td.appendChild(title);
    td.className="comment";
    tr.appendChild(td);
    this.tableBody.appendChild(tr);
   };
  };
  table.appendChild(this.tableBody);
  this.XHTML.appendChild(table);
  break;
 case "List":
  if(this.type=="model")
  {
   this.XHTML=document.createElement("DIV");
   return;
  };
  this.XHTML=document.createElement("LI");
  if(this.script!="Comment")
  {
   for(i=0;i<this.comments.length;i++)
   {
    tr=document.createElement("UL");
    td=document.createElement("LI");
    title=document.createTextNode(this.comments[i]);
    td.appendChild(title);
    tr.appendChild(td);
    this.XHTML.appendChild(tr);
   };
  };
  this.expander=this.dot('blue');
  this.expander.ocElement=this;
  this.expander.onmousedown=mousedownOnBullet;
  this.expander.onmouseup=mouseupOnBullet;
  this.XHTML.appendChild(this.expander);
  this.title=document.createElement("SPAN");
  this.title.ocElement=this;
  this.showSelect(false);
  this.title.onmousedown=mousedownOnScript;
  this.title.onmouseup=mouseupOnScript;
  this.title.ondblclick=editThis;
  this.appendScript(this.title);
  this.XHTML.appendChild(this.title);
  if(this.script=="Comment")
  {
   for(i=0;i<this.comments.length;i++)
   {
    tr=document.createElement("UL");
    td=document.createElement("LI");
    title=document.createTextNode(this.comments[i]);
    td.appendChild(title);
    tr.appendChild(td);
    this.XHTML.appendChild(tr);
   };
  };
  break;
 };
};

OxCalElement.prototype.createContainer=function()
{
 var tr,td,d;
 switch(OxCalView)
 {
 case "Model":
 case "ModelRev":
  tr=document.createElement("TR");
  td=document.createElement("TD");
  this.containerArea=document.createElement("TABLE");
  if(this.type=="model")
  {
   this.containerArea.className="clear";
  }
  else
  {
   this.containerArea.className="clearInside";
  };
  this.container=document.createElement("TBODY");
  this.containerArea.appendChild(this.container);
  td.appendChild(this.containerArea);
  tr.appendChild(td);
  if(this.top)
  {
   td=document.createElement("TD");
   d=document.createElement("DIV");
   d.appendChild(document.createTextNode("Time →"));
   d.style="text-align: center;vertical-align: middle;line-height: 100px; color:grey;font-size:20px;position:sticky;height:100px;width:100px;padding:10px;right:0px;top:0px;transform:rotate("+(reversed?"-":"")+"90deg)";
   td.appendChild(d);
   tr.appendChild(td);
  };
  if(reversed && this.tableBody.hasChildNodes())
  {
   this.tableBody.insertBefore(tr,this.tableBody.firstChild);
  }
  else
  {
   this.tableBody.appendChild(tr);
  };
  if(this.expander)
  {
   this.dot('orange',this.expander);
  };
  this.open=true;
  break;
 case "List":
  this.containerArea=document.createElement("SPAN");
  this.container=document.createElement("UL");
  this.containerArea.appendChild(this.container);
  this.XHTML.appendChild(this.containerArea);
  if(this.expander)
  {
   this.dot('orange',this.expander);
  };
  this.open=true;
  break;
 };
};

OxCalElement.prototype.deleteContainer=function()
{
 this.children.length=0;
 switch(OxCalView)
 {
 case "Model":
 case "ModelRev":
  if(reversed)
  {
   this.tableBody.removeChild(this.tableBody.firstChild);
  }
  else
  {
   this.tableBody.removeChild(this.tableBody.lastChild);
  };
  break;
 case "List":
  this.XHTML.removeChild(this.containerArea);
  break;
 };
 this.containerArea=null;
 this.container=null;
 if(this.expander)
 {
  this.dot('blue',this.expander);
 };
};

OxCalElement.prototype.fillXHTML=function()
{
 var i;
 if(this.children.length>0)
 {
  if(!this.container)
  {
   this.createContainer();
   switch(OxCalView)
   {
   case "Model":
   case "ModelRev":
    for(i=0;i<this.children.length;i++)
    {
     container.appendChild(this.children[i].XHTML);
    };
   };
  };
 };
};

OxCalElement.prototype.extractCode=function()
{
 var code;
 var i;
 var levelFiller="            ";
 if(this.type=="model")
 {
  this.level=0;
  levelFiller="";
  code="";
 }
 else
 {
  if(this.type=="filler"){return "";};
  if(this.parent && (typeof(this.parent.level)!="undefined"))
  {
   this.level=this.parent.level+1;
  }
  else
  {
   this.level=0;
  };
  levelFiller=levelFiller.substring(0,this.level);
  code="";
  if(this.comments.length>0)
  {
   for(i=0;i<this.comments.length;i++)
   {
    if(this.comments[i].indexOf('\n')==-1)
    {
     code+=levelFiller+"\/\/"+this.comments[i]+"\n";
    }
    else
    {
     code+="\/*"+this.comments[i]+"*\/\n";
    };
   };
  };
  if(this.type=="comment"){return code;};
  code+=levelFiller+this.script;
 };
 if(this.children.length>0)
 {
  if(this.type!="model")
  {
   code+="\n"+levelFiller+"{\n";
  };
  for(i=0;i<this.children.length;i++)
  {
   code+=this.children[i].extractCode();
  };
  if(this.type!="model")
  {
   code+=levelFiller+"}";
  };
 };
 if(this.type!="model")
 {
  code+=";\n";
 };
 return code;
};


// copy
function copy(silent)
{
 var obj;
 parent.oxcal.clipboard="";
 if(OxCalView!="Code")
 {
  if(selectList.elements.length==0){return;};
  parent.oxcal.clipboard=selectList.extractCode();
 }
 else
 {
  if((typeof(modelDisplay.selectionStart)=='number')&&(typeof(modelDisplay.selectionEnd)=='number'))
  {
   parent.oxcal.clipboard=modelDisplay.value.slice(modelDisplay.selectionStart,modelDisplay.selectionEnd);
  };
 };
 if(parent.oxcal.clipboard.length<1000)
 {
  parent.app.setCookie("OxCalClip",parent.oxcal.clipboard);
 }
 else
 {
  parent.app.setCookie("OxCalClip","");
 };
};

function addVersion()
{
 var newpos,dupls=[],n;
 parent.oxcal.changed=true;
 newpos=(commandList.pos+1) % commandList.mod;
 if(newpos==commandList.min)
 {
  commandList.min=(commandList.min+1) % commandList.mod;
 };
 commandList.pos=newpos;
 commandList.max=newpos;
 readModel();
 for(n in parent.oxcal.namesUsed)
 {
  if(parent.oxcal.namesUsed[n]>1){dupls.push(n+"("+parent.oxcal.namesUsed[n]+")");};
 };
 if((dupls.length>0)&&!duplsReported)
 {
  dupls.sort();
  parent.app.alert("Duplicate names\n"+dupls.join(", "));
  duplsReported=true;
 };
 commandList[newpos]=parent.oxcal.command;
};

function undo()
{
 var newpos;
 if(commandList.pos==commandList.min){return;};
 newpos=(commandList.pos-1);
 if(newpos==-1){newpos=commandList.mod-1;};
 commandList.pos=newpos;
 parent.oxcal.command=commandList[newpos];
 writeModel(true);
};

function redo()
{
 var newpos;
 if(commandList.pos==commandList.max){return;};
 newpos=(commandList.pos+1) % commandList.mod;
 commandList.pos=newpos;
 parent.oxcal.command=commandList[newpos];
 writeModel(true);
};

// delete
function deleteCode()
{
 var i,pos,par;
 if(OxCalView=="Code")
 {
  if((typeof(modelDisplay.selectionStart)=='number')&&(typeof(modelDisplay.selectionEnd)=='number'))
  {
   a=modelDisplay.value.slice(0,modelDisplay.selectionStart);
   b=modelDisplay.value.slice(modelDisplay.selectionEnd);
   modelDisplay.value=a+b;
   modelDisplay.setSelectionRange(a.length,a.length);
   addVersion();
  };
  return;
 };
 if(selectList.elements.length==0){return;};
 for(i=0;i<selectList.elements.length;i++)
 {
  selectList.elements[i].checkForNames(true);
  par=selectList.elements[i].parent;
  if(par)
  {
   pos=par.removeChild(selectList.elements[i]);
  }
  else
  {
   pos=modelDisplay.removeChild(selectList.elements[i]);
  };
 };
 if(par && (pos!==false))
 {
  if(pos<par.children.length)
  {
   par.children[pos].selectElement();
  }
  else
  {
   par.selectElement();
  };
  if(par.children.length==0)
  {
   par.deleteContainer();
  };
 };
 addVersion();
};

// cut
function cut()
{
 copy();
 deleteCode();
};

// insert
function insert(str)
{
 var oca,i,a,b;
 var pos,par;
 if(OxCalView=="Code")
 {
  if((typeof(modelDisplay.selectionStart)=='number')&&(typeof(modelDisplay.selectionEnd)=='number'))
  {
   a=modelDisplay.value.slice(0,modelDisplay.selectionStart);
   b=modelDisplay.value.slice(modelDisplay.selectionEnd);
   modelDisplay.value=a+str+b;
   modelDisplay.setSelectionRange(a.length+str.length,a.length+str.length);
   addVersion();
  };
  return;
 };
 if(selectList.elements.length==0){return;};
 // special code to keep options first
 if(selectList.elements[0].script=="Options()")
 {
  if(selectList.elements[0].parent.children.length==1){return;};
  selectList.elements[0].parent.children[1].selectElement();
 };
 oca=new OxCalArray();
 oca.parseCode(str);
 for(i=0;i<oca.elements.length;i++)
 {
  par=selectList.elements[0].parent;
  if(par)
  {
   pos=par.insertBefore(oca.elements[i],selectList.elements[0]);
  }
  else
  {
   if(selectList.elements[0].length>0)
   {
    modelDisplay.insertBefore(oca.elements[i],selectList.elements[0]);
   }
   else
   {
    modelDisplay.appendChild(oca.elements[i]);
   };
  };
 };
 if(pos)
 {
  if(reversed)
  {
//   finalpos=par.children[pos-oca.elements.length].selectElement();
   finalpos=par.children[pos].selectElement();
  }
  else
  {
   finalpos=par.children[pos].selectElement();
  };
  if((oca.elements.length==1)&&(oca.elements[0])&&(oca.elements[0].children.length==1))
  {
   oca.elements[0].setOpen(true);
   oca.elements[0].children[0].selectElement();
  };
 };
 addVersion();
};

// apply
function apply(str)
{
 var el,child,i,lst;
 if(OxCalView=="Code"){parent.app.alert("Use model or list view",1000);return;};
 if(selectList.elements.length==0){return;};
 lst=new Array();
 for(i=0;i<selectList.elements.length;i++)
 {
  lst[i]=selectList.elements[i];
 };
 for(i=0;i<lst.length;i++)
 {
  el=lst[i];
  if(el.type!="verb"){return;};
  if(str.indexOf("Offset(")!=-1)
  {
   el.selectElement();
   cut();
   if(str.indexOf(",")!=-1)
   {
    parent.oxcal.clipboard=parent.oxcal.clipboard.replace(");",str.replace("Offset(",")+N("));
   }
   else
   {
    parent.oxcal.clipboard=parent.oxcal.clipboard.replace(");",str.replace(")","").replace("Offset(",")+"));
   };
   parent.app.setCookie("OxCalClip","");
   paste();
   continue;
  };
  if(el.children.length==0)
  {
   child=el.createElement();
   child.type="filler";
   child.script="";
   child.createXHTML();
   el.appendChild(child);
  }
  else
  {
   if(reversed)
   {
    child=el.children[el.children.length-1];
   }
   else
   {
    child=el.children[0];
   };
  };
  child.selectElement();
  insert(str);
  if(child.type=="filler")
  {
   el.removeChild(child,true);
  };
  el.selectElement();
 };
};

// paste
function paste()
{
 var c;
 if(c=parent.app.getCookie("OxCalClip"))
 {
  parent.oxcal.clipboard=c;
 };
 insert(parent.oxcal.clipboard);
};

// set options
function setOptions(command)
{
 // first of all find if the options are already set and if so delete them
 var i,se;
 se=selectList.elements[0];
 if(modelDisplay.children)
 {
  for(i=0;i<modelDisplay.children.length;i++)
  {
   if(modelDisplay.children[i].script=="Options()")
   {
    modelDisplay.removeChild(modelDisplay.children[i]);
    break;
   };
  };
 };
 // then add options at the top of the list
 if(modelDisplay.children)
 {
  modelDisplay.children[0].selectElement();
  insert(command);
  if(se)
  {
   se.selectElement();
  }
  else
  {
   modelDisplay.children[1].selectElement();
  };
 };
 addVersion();
};

// cursor functions
var spotOn=false;
function blinkCursor(once)
{
 var cursor;
 if(!selectList){return;};
 if(!selectList.elements){return;};
 if(selectList.elements.length>0)
 {
  cursor=selectList.elements[0];
  spotOn=!spotOn;
  if(parent.app.args['noflash'] && !once){spotOn=true;}; // option for epileptics
  if(cursor.expander)
  {
   if(spotOn)
   {
    cursor.expander.firstChild.className='circleGreenOn';
   }
   else
   {
    if(cursor.children.length==0)
    {
     cursor.expander.firstChild.className='circleBlue';
    }
    else
    {
     if(cursor.open)
     {
      cursor.expander.firstChild.className='circleOrange';
     }
     else
     {
      cursor.expander.firstChild.className='circleGreen';
     };
    };
   };
  };
 };
 if(!once)
 {
  setTimeout("blinkCursor()",500);
 };
};
function hideCursor()
{
 spotOn=true;
 blinkCursor(true);
};
// draws the model
function checkForIncompatCode()
{
 parent.oxcal.command=parent.oxcal.command.replace(/\s*-[a-z][0-9]\s*\n/g,"");
};
function writeModel()
{
 var top,dv;
 var frm,tab,tabb,tr,td,go;
 var hlp,list,listel;
 checkForIncompatCode();
 parent.oxcal.editWindow=window;
 // reset all checks on names on rewrite
 parent.oxcal.namesUsed={};
 parent.oxcal.namesChecked=false;
 parent.oxcal.refsUsed={};
 parent.oxcal.curvesUsed={};
 OxCalView=parent.oxcal.modelView;
 top=document.getElementById("modelArea");
 while(top.firstChild)
 {
  top.removeChild(top.firstChild);
 };
 switch(OxCalView)
 {
 default:
  top.className="";
  selectList=new OxCalArray();
  modelDisplay=new OxCalElement();
  modelDisplay.type="model";
  modelDisplay.top=true;
  modelDisplay.parseCode("{"+parent.oxcal.command+"};",0,parent.oxcal.command.length+3);
  top.appendChild(modelDisplay.XHTML);
  break;
 case "Code":
  dv=document.createElement("DIV");
  dv.className="code";
  modelDisplay=document.createElement("TEXTAREA");
  modelDisplay.className="code";
  modelDisplay.value=parent.oxcal.command;
  dv.appendChild(modelDisplay);
  top.appendChild(dv);
  modelDisplay.onchange=addVersion;
  break;
 };
};

function checkForOldCode()
{
 parent.oxcal.command=parent.oxcal.command.replace(/Prior\(\s*\"@/g,"Date(\"=");
 parent.oxcal.command=parent.oxcal.command.replace(/;\s*Offset\(/g,"+N(");
 parent.oxcal.command=parent.oxcal.command.replace(/TAQ\(/g,"Before(");
 parent.oxcal.command=parent.oxcal.command.replace(/TPQ\(/g,"After(");
 parent.oxcal.command=parent.oxcal.command.replace(/Question\(/g,"Outlier(");
 parent.oxcal.command=parent.oxcal.command.replace(/Event\(/g,"Date(");
 // deal with magic quotes
 parent.oxcal.command=parent.oxcal.command.replace(/[‘’‛′´`]/g,"'");
 parent.oxcal.command=parent.oxcal.command.replace(/[“”‟″˝]/g,'"');
 // check for commas in z,long and lat
 parent.oxcal.command=parent.oxcal.command.replace(/(z\s*=\s*[0-9]*)(,)([0-9]*\s*;)/g,'$1.$3');
 parent.oxcal.command=parent.oxcal.command.replace(/(longitude\s*=\s*[0-9]*)(,)([0-9]*\s*;)/g,'$1.$3');
 parent.oxcal.command=parent.oxcal.command.replace(/(latitude\s*=\s*[0-9]*)(,)([0-9]*\s*;)/g,'$1.$3');
};
function readModel()
{
 switch(OxCalView)
 {
 default:
  parent.oxcal.command=modelDisplay.extractCode();
  break;
 case "Code":
  parent.oxcal.command=modelDisplay.value;
  break; 
 };
 checkForOldCode();
// writeModel(1);
};
