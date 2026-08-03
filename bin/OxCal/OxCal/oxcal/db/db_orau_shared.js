// Database system - specific elements for ORAU in-house/public database
// contains special functions needed in database setup including OxCal linkage
// (c) Christopher Bronk Ramsey 2007

// special display functions

var locationSpec;
var locationWindow;
var refSpec;
var refWindow;
var submitter=false;
var rawPlotData;
var oxcalCode='';
database.fields.ref.defaultValue=getCookie("ref");
if(!database.fields.ref.defaultValue)
{
 database.fields.ref.defaultValue="";
}
else
{
 database.fields.citation.defaultValue=getCookie("citation");
};

function doRefLink()
{
 dbLink(this.spec);
};
function refLink(spec)
{
 var button;
 button=document.createElement("INPUT");
 button.type="Button";
 button.value="View dates";
 button.onclick=doRefLink;
 button.spec=spec;
 spec.container.appendChild(button);
};

function d2dms(num,m,p)
{
 var v,sec,min,deg;
 v=Math.round(Math.abs(num*3600));
 sec=v % 60;
 v=(v-sec)/60;
 min=v % 60;
 v=(v-min)/60;
 deg=v % 360;
 v="";
 if(deg){v+=deg+" ";};
 if(min){v+=min+"' ";};
 if(sec){v+=sec+'" ';};
 if(!v){return v;};
 if(num<0)
 {
  if(m){v+=m;};
 }
 else
 {
  if(p){v+=p;};
 };
 return v;
};

function showLong(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=d2dms(l,"W","E");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};

function showLat(spec)
{
 var l;
 l=spec.object;
 spec.specialTeX=d2dms(l,"S","N");
 spec.container.appendChild(document.createTextNode(spec.specialTeX));
};

function specialOxA(obj,prefix)
{
 var t,i;
 if(!obj.oxa)
 {
  if(obj.labref){return obj.labref;};
  return "";
 };
 if(obj.oxa<=0)
 {
  t="-"+obj.wheel+"-"+obj.pos;
  switch(obj.oxa)
  {
  case -2 : return "Next";
  case -1 : return "Failed";
  case -67: t="C"+t;break;
  case -86: t="V"+t;break;
  case -87: t="W"+t;break;
  case -88: t="X"+t;break;
  case -89: t="Y"+t;break;
  case -90: t="Z"+t;break;
  default:
   for(i=0;i<newOxAValues.length;i++)
   {
    if(obj.oxa==newOxAValues[i])
    {
     return(newOxANames[i]);
     break;
    };
   };
   t="Spec"+obj.oxa;
  };
 }
 else
 {
  t=obj.oxa;
 };
 if(prefix){return prefix+t;};
 return t;
};

function showOxA(spec)
{
 var e,s,t;
 var oxa=Number(spec.object);
 if(!oxa){spec.specialTeX=" ";return;};
 if(Math.abs(oxa)==1)
 {
  e=document.createElement("IMG");
  e.src="../img/Cross.gif";
  spec.specialTeX="$\\times$";
 }
 else
 {
  if(oxa<=0)
  {
   t=specialOxA(spec.parent.object);
   spec.specialTeX=t;
  }
  else
  {
   t=keyString(oxa);
   spec.specialTeX=t;
  };
  e=document.createTextNode(t);
 };
 if(database.fields.oxa.linkPage)
 {
  s=document.createElement("SPAN");
  s.className="link";
  s.onclick=doAction;
  s.spec=spec;
  s.appendChild(e);
  e=s;
 };
 spec.container.appendChild(e);
};

function showDel13(spec)
{
 var e,s,ss,o=spec.parent.object;
 if((spec.object==0)||(spec.object==null))
 {
  if((spec.object==null)||(!o.irmsno)||(!o.irmstype))
  {
   e=document.createElement("IMG");
   e.src="../img/Cross.gif";
   spec.container.appendChild(e);
   spec.specialTeX="$\\times$";
   return;
  };
 };
 spec.specialTeX=toFixxed(spec.object,1);
 e=document.createTextNode(spec.specialTeX);
 if(o.irmsno)
 {
  switch(o.irmstype)
  {
  case 0:
   s=document.createElement("SPAN");
   s.style.color="red";
   s.appendChild(e);
   spec.container.appendChild(s);
   return;
  case 2:
   spec.container.appendChild(e);
   spec.specialTeX+="$^"+o.irmsno+"$";
   ss=document.createElement("SUP");
   ss.appendChild(document.createTextNode(o.irmsno));
   spec.container.appendChild(ss);
   return;
  case 3:
   s=document.createElement("SPAN");
   s.style.color="green";
   s.appendChild(e);
   spec.container.appendChild(s);
   spec.specialTeX+="$^{C"+o.irmsno+"}$";
   ss=document.createElement("SUP");
   ss.appendChild(document.createTextNode("C"+o.irmsno));
   spec.container.appendChild(ss);
   return;
  default:
   break;
  };
 };
 spec.container.appendChild(e);
};

function showDate(spec)
{
 var e,s,v,o=spec.parent.object;
 spec.specialTeX=toFixxed(spec.object,0);
 if(typeof(o.oxqual)!="undefined")
 {
  switch(o.oxqual)
  {
  case "m":
   if(spec.name=='oxerr')
   {
    v=o.oxf14cerr;
   }
   else
   {
    v=o.oxf14c;
   };
   if(typeof(v)=='number')
   {
    spec.specialTeX=toFixxed(v,5);
   }
   else
   {
    spec.specialTeX="";
   };
   break;
  case ">":
   if(spec.name=='oxerr')
   {
    spec.specialTeX="";
   };
   break;
  };
 };
 e=document.createTextNode(spec.specialTeX);
 s=document.createElement("SPAN");
 s.className="link";
 s.onclick=calibrateDate;
 s.obj=spec.parent.object;
 s.appendChild(e);
 e=s;
 spec.container.appendChild(e);
};

function showWF(spec)
{
 var e=document.createElement("IMG");
 switch(spec.object)
 {
 case "y": case "ok": e.src="../img/Tick.gif";spec.specialTeX="$\\checkmark$";break;
 case "n": case "f":  e.src="../img/Cross.gif";spec.specialTeX="$\\times$"; break;
 case "d":  e.src="../img/Tick.gif";spec.specialTeX="$\\checkmark$";break;
 case "c":  e.src="../img/Right.gif";spec.specialTeX="$\\Rightarrow$";break;
 case "s":  e.src="../img/Home.gif";spec.specialTeX="$\\oslash$";break;
 case "l":  e.src="../img/Home.gif";spec.specialTeX="$\\oslash$";break;
 case "w":  e.src="../img/Left.gif";spec.specialTeX="$\\Leftarrow$";break;
 case "!":  e.src="../img/Exclam.gif";break;
 default:
  e=document.createTextNode(spec.object);
  break;
 };
 spec.container.appendChild(e); 
};

function showStar(spec)
{
 var e=document.createElement("IMG");
 switch(spec.object)
 {
 case "y":case true:case 1: e.src="../img/Star.gif";spec.specialTeX="$\\bigstar$";break;
 case "n":case false:case 0:
  e=document.createTextNode("");
  spec.specialTeX="$-$";
  break;
 default:
  e=document.createTextNode(spec.object);
  break;
 };
 spec.container.appendChild(e); 
};

function showExpected(spec)
{
 var txt,d;
 if(!spec.object){return;};
 if(spec.object.constructor!=Date){return;};
 txt=myWriteDate(spec.object);
 spec.container.appendChild(document.createTextNode(txt));
 if(spec.parent.object.deadline)
 {
  spec.specialTeX=txt+"*";
  spec.container.style.fontWeight='bold';
 }
 else
 {
  spec.specialTeX=txt;
 };
 switch(spec.parent.object.status)
 {
 case 'f':
 case 'd':
  if(!spec.parent.object.status_date){break;};
  if(!spec.parent.object.status_date.getTime){break;};
  if(spec.object.getTime()>spec.parent.object.status_date.getTime())
  {
   spec.container.style.color='#336633';
  }
  else
  {
   spec.container.style.color='#993333';
  };
  break;
 case 'l':
 case 'w':
  break;
 default:
  d=new Date();
  d=(spec.object.getTime()-d.getTime())/(1000*60*60*24);
  if(d<0)
  {
   spec.container.style.color='#FF0000';
  }
  else
  {
   if(d<14)
   {
    spec.container.style.color='#FF6600';
   }
   else
   {
    if(d<28)
    {
     spec.container.style.color='#999900';
    }
    else
    {
     spec.container.style.color='#00FF00';
    };
   };
  };
  break;  
 };
};

function keyString(key)
{
 var parts,pnum,i,str;
 parts=String(key).split("/");
 pnum=Number(parts[0]);
 if(isNaN(pnum))
 {
  str=key;
 }
 else
 {
  if(pnum>1000)
  {
   str=Math.floor(pnum/1000)+",";
   pnum=pnum%1000;
   str+=Math.floor(pnum/100);
   pnum=pnum%100;
   str+=Math.floor(pnum/10);
   pnum=pnum%10;
   str+=Math.floor(pnum);
  }
  else
  {
   str=parts[0];
  };
  for(i=2;i<parts.length;i++)
  {
   if(i==2)
   {
    str+="."+parts[i];
   }
   else
   {
    str+=" "+parts[i];
   };
  };
 };
 return str;
};

function showKey(spec)
{
 var str=keyString(spec.object);
 spec.specialTeX=TeXclean(str);
 spec.container.appendChild(document.createTextNode(str));
 spec.container.className='link';
 spec.container.spec=spec;
 spec.container.onclick=doAction;
};

function calcPcC(spec)
{
 var o,val;
 o=spec.parent.object;
 if(!o.burnweight){spec.object=null;};
 spec.object=Math.round(1000*(Number(o.burnyield)/Number(o.burnweight)))/10;
};

function calcPcYld(spec)
{
 var o,val;
 o=spec.parent.object;
 if(!o.use_weight){spec.object=null;};
 spec.object=Math.round(1000*(Number(o.pyield)/Number(o.use_weight)))/10;
};

function calcAMS(spec)
{
 var o;
 o=spec.parent.object;
 if(o.wheel>=2000)
 {
  if(o.wheel>=3000)
  {
   spec.object="MICADAS";
  }
  else
  {
   switch(o.wheel)
   {
   case 2800:case 2801:case 2802: case 2803: case 2805: case 2808:
    spec.object="MICADAS";
    break;
   default:
    spec.object="HVEE";
    break;
   };
  };
 }
 else
 {
  spec.object="General Ionex"
 };
};

function getToday(spec)
{
 spec.object=new Date();
};

// functions for \ linkage
var oxcalWindow;
function OxCalDates(view,options)
{
 var dta,spc,i,str,doall,single;
 single=false;
 dta=dbData[view];
 spc=dbDataSpec[view];
 if(!options){options="";};
 str=options+"Plot(){";
 if(dta && spc)
 {
  spc.emptyContainer();
  if(!dta.length && dta.oxf14c) // this is an object
  {
   dta=new Array();
   dta[0]=dbData[view];
   single=true;
  };
  doall=true;
  for(i=0;i<dta.length;i++)
  {
   if(dta[i].selected)
   {
    doall=false;
   };
  };
  for(i=0;i<dta.length;i++)
  {
   if(dta[i].selected || doall)
   {
    dta[i].selected=false;
    if(dta[i].oxqual!="")
    {
     str+="R_F14C(\""+specialOxA(dta[i],"OxA-")+"\","+dta[i].oxf14c+","+dta[i].oxf14cerr+")";
    }
    else
    {
     if(dta[i].oxdate && dta[i].oxerr)
     {
      str+="R_Date(\""+specialOxA(dta[i],"OxA-")+"\","+dta[i].oxdate+","+dta[i].oxerr+")";
     }
     else
     {
      if(dta[i].oxqual!="")
      {
       str+="R_F14C(\""+dta[i].target_id+"\","+dta[i].f14c+","+dta[i].f14cerror+")";
      }
      else
      {
       if(dta[i].date && dta[i].error)
       {
        str+="R_Date(\""+dta[i].target_id+"\","+dta[i].date+","+dta[i].error+")";
       };
      };
     };
    };
    if(dta[i].longitude && dta[i].latitude)
    {
     str+="{longitude="+dta[i].longitude+";latitude="+dta[i].latitude+";}";
    };
    str+=";\n";
   };
  };
  str+="};";
  if(str.length>2000)
  {
   oxcalCode=str;
   str="getFromSource";
  };
  spc.fillContainer();
  var url;
  if(single)
  {
   url=oxcal_url+"OxCal.html?Command="+encodeURIComponent(str);
  }
  else
  {
   url=oxcal_url+"OxCal.html?Mode=Input&Command="+encodeURIComponent(str);
  };
  window.open(url,"oxcal").focus;
  return true;
 };
 return false;
};

function fileManager(path)
{
 window.open("../fs/filedialog.html?path="+path, "","width=650,height=650,toolbar=no,location=no,menubar=no,resizable=no,status=no");
};

function calibrateDate()
{
 var url;
 url=oxcal_url+"OxCal.html?Command=";
 url+="R_Date(\""+specialOxA(this.obj,"OxA-")+"\","+this.obj.oxdate+","+this.obj.oxerr+");";
 window.open(url,"oxcal").focus;
};


function textReport(view)
{
 var str="",i,o,n,doall;
 if(view=="pubResults")
 {
  dbDataSpec[view].sortArray("labref",true);
 }
 else
 {
  dbDataSpec[view].sortArray("oxa",true);
 };
 dbDataSpec[view].sortArray("site",true);
 o=new Object();o.site="";
 doall=1;
 for(i=0;i<dbData[view].length;i++)
 {
  if(dbData[view][i].selected){doall=0;break;};
 };
 for(i=0;i<dbData[view].length;i++)
 {
  n=dbData[view][i];
  if((!doall) && (!n.selected)){continue;};
  if(n.site!=o.site)
  {
   str+="\n"+n.site;
   if(n.location)
   {
    str+=", "+n.location;
   }
   else
   {
    if(n.longitude && n.latitude)
    {
     str+=", "+d2dms(n.latitude,"S","N")+" "+d2dms(n.longitude,"W","E");
    };
   };
   if(n.country){str+=", "+n.country;};
   str+="\n";
  };
  str+=specialOxA(n,"\tOxA-");
  str+="\t"+n.sampref;
  if(n.material)
  {
   str+=", "+n.material;
  };
  if(n.species)
  {
   str+=", "+n.species;
  };
  str+="\td13C="+toFixxed(n.oxdel13,2);
  switch(n.oxqual)
  {
  case "m":
   str+="\t "+toFixxed(n.oxf14c,5)+" \261 "+toFixxed(n.oxf14cerr,5)+" F14C";
   break;
  case ">":
   str+="\t> "+toFixxed(n.oxdate,0)+" BP";
   break;
  default:
   str+="\t "+toFixxed(n.oxdate,0)+" \261 "+toFixxed(n.oxerr,0)+" BP";
   break;
  };
  str+="\n";
  if(n.comments)
  {
   str+="\t\t"+n.comments+"\n";
  };
  o=n;
 };
 download("report.txt",str);
};

function letterReport(attachToMail)
{
 var str="",i,o,n,cost;
 var preamble="",postamble="",appel="";
 var doSamples=0,doResults=0,doFails=0,doInvoice=false,modern=false,bp=false;
 var samples,results,project;
 str+="address_sub\tproject\tcontent\tpostscript\n";
 n=dbData["submitter"];
 if(n.firstname)
 {
  str+=n.prefix+" "+TeXclean(n.firstname)+" "+TeXclean(n.surname)+"\\\\ "
   +TeXclean(n.address).replace(/\n/g,"\\\\ ")+"\t";
  appel="Dear "+TeXclean(n.firstname)+"\\par ";
 }
 else
 {
  str+=n.prefix+" "+TeXclean(n.initials)+" "+TeXclean(n.surname)+"\\\\ "
   +TeXclean(n.address).replace(/\n/g,"\\\\ ")+"\t";
  appel="Dear "+n.prefix+" "+TeXclean(n.surname)+"\\par ";
 };
 str+=dbData['userProject'].project+"\t";
 samples=dbDataSpec["userSamples"].object;
 results=dbDataSpec["userResults"].object;
 project=dbDataSpec["userProject"].object;
 dbDataSpec["userSamples"].emptyContainer();
 optionSpec.emptyContainer();
 // this now accepts LaTeX as is in preamble/postamble
 toolbar.options.preamble=toolbar.options.preamble.replace(/\n\n/g,"\\par ").replace(/\n/g," ");
 toolbar.options.postamble=toolbar.options.postamble.replace(/\n\n/g,"\\par ").replace(/\n/g," ");
 for(i=0;i<samples.length;i++)
 {
  switch(samples[i].status)
  {
  case "f":
   if(samples[i].selected)
   {
    doFails++;
   };
   if(samples[i].sterling_price)
   {
    samples[i].sterling_price=project.sterling_failed;
   };
   break;
  case "w":
  case "l":
   samples[i].sterling_price=0;
  case "d":
  default:
   if(samples[i].selected)
   {
    doSamples++;
   };
   break;
  };
 };
 dbDataSpec["userSamples"].fillContainer();
 dbDataSpec["userSamples"].sortArray("pnum",true);
 dbDataSpec["userSamples"].sortArray("sterling_price",false);
 dbDataSpec["userSamples"].emptyContainer();
 for(i=0;i<samples.length;i++)
 {
  if(i>=project.agreed)
  {
   samples[i].sterling_price=0;
  };
 };
 dbDataSpec["userSamples"].fillContainer();
 dbDataSpec["userSamples"].sortArray("pnum",true);
 dbDataSpec["userSamples"].sortArray("site",true);
 dbDataSpec["userResults"].sortArray("pnum",true);
 dbDataSpec["userResults"].sortArray("oxa",true);
 dbDataSpec["userResults"].sortArray("site",true);
 if((doFails || doSamples)&&(project.sterling_price))
 {
  doInvoice=toolbar.options.invoiced;
 };
 doResults=0;
 for(i=0;i<results.length;i++)
 {
  if(results[i].selected)
  {
   doResults++;
  };
 };
 if(doSamples)
 {
  if(toolbar.options.preamble)
  {
   preamble=toolbar.options.preamble;
  }
  else
  {
   preamble=appel;
   if(toolbar.options.acknowledged)
   {
    preamble+="We would like to acknowledge receipt of the following sample";
    if(doSamples>1){preamble+="s";};
    preamble+=" for this project. We expect results for ";
    if(doSamples>1){preamble+="these samples";}else{preamble+="this sample";};
    preamble+=" by \\formatdate{"+project.expected.getDate()+"}{"
    +(project.expected.getMonth()+1)+"}{"+project.expected.getFullYear()+"}.\\par ";
   }
   else
   {
    preamble+="The following sample";
    if(doSamples>1){preamble+="s have";}else{preamble+=" has";};
    preamble+=" been submitted to ORAU for dating.\\par ";
   };
  };
  str+=preamble;
  toolbar.options.preamble=preamble;
  if(doInvoice)
  {
   str+="\\begininvoicelist ";
  }
  else
  {
   str+="\\beginsamplelist ";
  };
  cost=0;
  o=new Object();o.site="";
  for(i=0;i<samples.length;i++)
  {
   n=samples[i];
   if((!n.selected)){continue;};
   if((n.status=='f') && (!doInvoice)){continue;};
   if(n.site!=o.site)
   {
    str+="\\site{"+TeXclean(n.site);
    if(n.location)
    {
     str+=", "+TeXclean(n.location);
    };
    if(n.country){str+=", "+n.country;};
    str+="} ";
   }
   str+="P-"+n.pnum+" & "+TeXclean(n.sampref)+" & "+n.material;
   if(n.species)
   {
    str+=" ("+TeXclean(n.species)+")";
   };
   str+=" & ";
   switch(n.status)
   {
   case "w": str+="withdrawn"; break;
   case "l": str+="on hold"; break;
   case "d": str+="dated"; break;
   case "f": str+="failed"; break;
   default: str+="to be dated"; break;
   };
   if(doInvoice)
   {
    str+=" & "+toFixxed(n.sterling_price,2);     
    cost+=n.sterling_price;
   };
   str+=" \\\\ ";
   o=n;
  };
  if(doInvoice)
  {
   str+="\\noalign{\\vspace{2pt}}\\cline{5-5}\\noalign{\\vspace{1pt}}\\cline{5-5}\\noalign{\\vspace{2pt}} ";
   str+="&{\\bf TOTAL} (excl. VAT)&&&{\\bf "+toFixxed(cost,2)+" }\\\\ ";
  };
  str+="\\endanylist ";
 };
 if(doFails)
 {
  if(!preamble)
  {
   if(toolbar.options.preamble)
   {
    preamble=toolbar.options.preamble;
   }
   else
   {
    preamble=appel+"We regret that we have been unable to date the following sample";
    if(doFails>1){preamble+="s";};
    preamble+=":\\par ";
   };
   str+=preamble;
   toolbar.options.preamble=preamble;
  }
  else
  {
   if(doFails>1)
   {
    str+="\\textfaillist ";
   }
   else
   {
    str+="\\textfail ";
   };
  };
  str+="\\beginfaillist ";
  o=new Object();o.site="";
  for(i=0;i<samples.length;i++)
  {
   n=samples[i];
   if((!n.selected)){continue;};
   if(n.status!='f'){continue;};
   if(n.site!=o.site)
   {
    str+="\\site{"+TeXclean(n.site);
    if(n.location)
    {
     str+=", "+TeXclean(n.location);
    };
    if(n.country){str+=", "+n.country;};
    str+="} ";
   }
   str+="P-"+n.pnum+" & "+TeXclean(n.sampref)+" & ";
   str+=TeXclean(n.status_comment);
   str+=" \\\\ ";
   o=n;
  };
  str+="\\endanylist ";
 };
 if(doResults)
 {
  if(!preamble)
  {
   if(toolbar.options.preamble)
   {
    preamble=toolbar.options.preamble;
   }
   else
   {
    preamble=appel+"The following radiocarbon measurement";
    if(doResults>1){preamble+="s have been made on samples";}else{preamble+=" has been made on a sample";};
    preamble+=" from this project.\\par ";
   };
   str+=preamble;
   toolbar.options.preamble=preamble;
  }
  else
  {
   if(doResults>1)
   {
    str+="\\textdatelist ";
   }
   else
   {
    str+="\\textdate ";
   };
  };
  str+="\\begindatelist ";
  o=new Object();o.site="";
  for(i=0;i<results.length;i++)
  {
   n=results[i];
   if((!n.selected)){continue;};
   if(n.site!=o.site)
   {
    str+="\\site{"+TeXclean(n.site);
    if(n.location)
    {
     str+=", "+TeXclean(n.location);
    };
    if(n.country){str+=", "+n.country;};
    str+="} ";
   }
   str+=specialOxA(n,"OxA-");
   str+=" & "+TeXclean(n.sampref)+" & "+n.material;
   if(n.species)
   {
    str+=" ("+TeXclean(n.species)+")";
   };
   str+=" & "+toFixxed(n.oxdel13,2)+" & ";
   switch(n.oxqual)
   {
   case "m":
    str+="$^*$ "+toFixxed(n.oxf14c,5)+" & "+toFixxed(n.oxf14cerr,5);
    modern=true;
    break;
   case ">":
    str+="\\multicolumn{2}{c}{$>$ "+toFixxed(n.oxdate,0)+"}";
    bp=true;
    break;
   default:
    str+=toFixxed(n.oxdate,0)+" & "+toFixxed(n.oxerr,0);
    bp=true;
    break;
   };
   str+=" \\\\ ";
   if(n.comments)
   {
	str+="&\\multicolumn{4}{l}{\\parbox{12cm}{\\raggedright "+TeXclean(n.comments)+"}}\\\\ \\\\ ";
   };
   o=n;
  };
  if(modern)
  {
   str+="\\modernnote ";
  };
  str+="\\endanylist ";
  if(bp)
  {
   if(doResults>1)
   {
    str+="\\textbp ";
   }
   else
   {
    str+="\\textbpsingle ";
   };
  };
  if(toolbar.options.reported)
  {
   if(doResults>1)
   {
    str+="\\textmethod ";
    str+="\\textcalib ";
    str+="\\par ";
    str+="\\textgetcomment";
    str+="\\par ";
   }
   else
   {
    str+="\\textmethod ";
    str+="\\textcalibsingle ";
    str+="\\par ";
    str+="\\textgetcommentsingle";
    str+="\\par ";
   };
  }
  else
  {
   str+="\\par ";
  };
 };
 if(toolbar.options.postamble)
 {
  postamble=toolbar.options.postamble+" ";
 }
 else
 {
  postamble="Yours sincerely\\vskip 1cm \\par "+user.name;
 };
 str+=postamble;
 toolbar.options.postamble=postamble;
 toolbar.options.preamble=toolbar.options.preamble.replace(/\\par /g,"\n\n");
 toolbar.options.postamble=toolbar.options.postamble.replace(/\\par /g,"\n\n"); optionSpec.fillContainer();
 // postscript
 str+="\t \n";
 dbDataSpec["userProject"].emptyContainer();
 if(doResults){project.reported=true;dbDataSpec["userProject"].changed=true;};
 if(doInvoice){project.invoiced=true;dbDataSpec["userProject"].changed=true;};
 if(doSamples){project.acknowledged=true;dbDataSpec["userProject"].changed=true;};
 dbDataSpec["userProject"].fillContainer();
 if(attachToMail)
 {
  n=dbData["submitter"];
  attach("dbMergeAttach.tex",str,"orauLetter.tex");
  msg="Dear ";
  if(n.firstname)
  {
   msg+=n.firstname;
  }
  else
  {
   msg+=n.prefix+" "+n.surname;
  };
  msg+="\n\nPlease find attached a letter about the samples in this project.\n\n";
  msg+="Best wishes\n\n"+user.name+"";
  email(n.email+","+user.email,"ORAU radiocarbon dating project ("+dbData['userProject'].project+")",
   msg,"","Calibrations","Other_Data");
 }
 else
 {
  download("dbMergePrint.tex",str,"orauLetter.tex");
 };
};

function siteKML(s)
{
 var str;
 var thisURL,q,thisloc;
 if(s.location)
 {
  thisloc=locationToCoordinates(s.location);
 }
 else
 {
  if(s.longitude && s.latitude)
  {
   thisloc=s.longitude+","+s.latitude;
  };
 };
 if(!thisloc){return "";};
 thisURL=document.URL;
 q=thisURL.indexOf("?");
 if(q>0){thisURL=thisURL.slice(0,q);};
 str='<Placemark>\n<name>'+s.site.replace('&','&amp;')+'<\/name>\n';
 str+='<description><![CDATA[';
 if(s.country)
 {
  str+='<p>Country: '+s.country+'<\/p>';
 };
 if(s.region)
 {
  str+='<p>Region: '+s.region+'<\/p>';
 };
 if(s.location)
 {
  str+='<p>Location: '+s.location+'<\/p>';
 }
 else
 {
  if(s.longitude && s.latitude)
  {
   str+='<p>Location: '+d2dms(s.latitude,"S","N")+","+d2dms(s.longitude,"W","E")+'<\/p>';
  };  
 };
 str+='<p><a href="'+thisURL;
 str+='?page=site&site='+
  s.site+'&auto=true">View dates<\/a><\/p>';
 str+=']]><\/description>';
 str+='<Point><coordinates>'+thisloc
  +'<\/coordinates><\/Point>\n';
 str+='<\/Placemark>\n';
 return str;
};

function makeKML(sites,extra_sites)
{
 var str,extr,i,lastloc,done,lastlong,lastlat,none_selected,obj,pg;
 /* set up plot settings */
   canvas=new Object;
   canvas.scale=1.0; // zoom scaling
   canvas.scaleFont=0.8; // font scaling
   canvas.scaleLine=1.3; // line scaling
   canvas.pxPerCm=35; // px per cm
   canvas.frameWidth=18.0; // cm
   canvas.frameHeight=13.5; // cm
   
   plotInfo=new Object;
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
   plotInfo.title="";
   plotInfo.category="";
   plotInfo.table="";
   plotInfo.keyTitle="Key";
   plotInfo.pcaVariables="longitude,latitude";
   plotInfo.nonlinx="";
   plotInfo.nonliny="mercator";
   plotInfo.mapPlot=true;
   
   rawPlotData=new Array;
   
   plotOptions=new Object;
   plotOptions.background="rgb(255,255,255)";
   plotOptions.plotBackground=false;
   plotOptions.mapPlot="svg";
   plotOptions.multiPlot=false; // gives number of columns if multi
   plotOptions.plotPosX=3.0; // cm
   plotOptions.plotPosY=1.5;  // cm
   plotOptions.plotWidth=13.5; // cm
   plotOptions.plotHeight=13.5; // cm
   plotOptions.showKey=1;
   plotOptions.BandW=false;
   plotOptions.contours="95%";
      
 
 str='<?xml version="1.0" encoding="UTF-8"?>\n';
 str+='<kml xmlns="http://earth.google.com/kml/2.1">\n';
 str+='<Folder>\n';
 if(typeof(sites.length)=="undefined")
 {
  if(sites.longitude && sites.latitude)
  {
   extr=siteKML(sites);
   if(extr)
   {
    str+=extr;
    obj=new Object;
    obj.longitude=sites.longitude;
    obj.latitude=sites.latitude;
    obj.label=sites.site;
    if(sites.volcano){pg="volcano";}else{pg="site";};
    if(sites.site_no)
    {
     obj.url=window.location.href.split("?")[0]+ 
    	"?page="+pg+"&auto=true&site_no="+sites.site_no;
    }
    else
    {
     obj.url=window.location.href.split("?")[0]+ 
    	"?page="+pg+"&auto=true&site="+sites.site;
    };
    rawPlotData.push(obj);
    done=true;
   };
  };
 }
 else
 {
  none_selected=true;
  for(i=0;i<sites.length;i++)
  {
   if(sites[i].selected){none_selected=false;};
  };
  for(i=0;i<sites.length;i++)
  {
   if(!(sites[i].selected || none_selected)){continue;};
   if(sites[i].longitude && sites[i].latitude)
   {
    if((lastlong==sites[i].longitude)&&(lastlat==sites[i].latitude)){continue;};
    lastlong=sites[i].longitude;
    lastlat=sites[i].latitude;
   }
   else
   {
    if(!sites[i].location){continue;};
    if(sites[i].location==lastloc){continue;};
    lastloc=sites[i].location;
   };
   extr=siteKML(sites[i]);
   if(extr)
   {
    str+=extr;
    obj=new Object;
    obj.longitude=sites[i].longitude;
    obj.latitude=sites[i].latitude;
    obj.label=sites[i].site;
    if(sites[i].volcano){pg="volcano";}else{pg="site";};
    if(sites[i].site_no)
    {
     obj.url=window.location.href.split("?")[0]+
    	"?page="+pg+"&auto=true&site_no="+sites[i].site_no;
    }
    else
    {
     obj.url=window.location.href.split("?")[0]+
    	"?page="+pg+"&auto=true&site="+sites[i].site;
    };
    rawPlotData.push(obj);
    done=true;
   };
  };
 };
 if(extra_sites)
 {
  if(typeof(extra_sites.length)=="undefined")
  {
   if(extra_sites.longitude && extra_sites.latitude)
   {
    extr=siteKML(extra_sites);
    if(extr)
    {
     str+=extr;
     obj=new Object;
     obj.longitude=extra_sites.longitude;
     obj.latitude=extra_sites.latitude;
     obj.label=extra_sites.site;
     if(extra_sites.volcano){pg="volcano";}else{pg="site";};
     if(extra_sites.site_no)
     {
      obj.url=window.location.href.split("?")[0]+
     	"?page="+pg+"&auto=true&site_no="+extra_sites.site_no;
     }
     else
     {
      obj.url=window.location.href.split("?")[0]+
     	"?page="+pg+"&auto=true&site="+extra_sites.site;
     };
     rawPlotData.push(obj);
     done=true;
    };
   };
  }
  else
  {
   for(i=0;i<extra_sites.length;i++)
   {
    if(extra_sites[i].longitude && sites[i].latitude)
    {
     extr=siteKML(extra_sites[i]);
     if(extr)
     {
      str+=extr;
      obj=new Object;
      obj.longitude=extra_sites[i].longitude;
      obj.latitude=extra_sites[i].latitude;
      obj.label=extra_sites[i].site;
      if(extra_sites[i].volcano){pg="volcano";}else{pg="site";};
      if(extra_sites[i].site_no)
      {
       obj.url=window.location.href.split("?")[0]+
      	"?page="+pg+"&auto=true&site_no="+extra_sites[i].site_no;
      }
      else
      {
       obj.url=window.location.href.split("?")[0]+
      	"?page="+pg+"&auto=true&site="+extra_sites[i].site;
      };
      rawPlotData.push(obj);
      done=true;
     };
    };
   };
  };
 };
 str+='<\/Folder><\/kml>\n';
 if(done){return str;};
 if(sites)
 {
  alert("No locations given");
 };
 return false;
};

function showOnMap(downloadKML,view,withsort,extra_view)
{
 var kml;
 if(view && withsort)
 {
  view.sortArray("location",true);
  view.sortArray("site",true);
 };
 if(view)
 {
  kml=makeKML(view,extra_view);
 };
 if(downloadKML)
 {
  if(kml){download("locations.kml",kml);};
 }
 else
 {
  if(kml)
  {
   openMapper();
  };
 };
};

function viewLocation(s)
{
 var locat,url;
 locat=s.parent.object;
 locationSpec=s.parent;
// url="../db/db_locator.php?site="+locat.site;
 url="../db/db_locator.html?site="+locat.site;
 if(locat.country){url+="&country="+locat.country;};
 if(locat.region){url+="&region="+locat.region;};
 if(locat.location){url+="&location="+locat.location;};
 locationWindow=window.open(url,"Locator","width=350,height=400,toolbar=no,location=no,menubar=no,resizable=no,status=no");
 window.onfocus=closeLocation;
};
function closeLocation()
{
 window.onfocus="";
 locationSpec.refillContainer(true);
 if(locationWindow.open)
 {
  locationWindow.close();
 };
};
function viewReference(s)
{
 var ref,url;
 url="../db/db_ref.html";
 if(typeof(s)!='undefined')
 {
  ref=s.parent.object;
  refSpec=s.parent;
  url+="?ref="+ref.ref;
 }
 else
 {
  refSpec=false;
 };
 refWindow=window.open(url,"RefViewer","width=600,height=600,toolbar=no,location=no,menubar=no,resizable=yes,status=no");
 if(s)
 {
  window.onfocus=closeReference;
 };
};
function closeReference()
{
 window.onfocus="";
 refSpec.refillContainer(true);
 setCookie("ref",refSpec.object.ref);
 setCookie("citation",refSpec.object.citation);
 if(refWindow.open)
 {
  refWindow.close();
 };
};
function linkResults(doall)
{
 var obj,i,none=true,msg,spc;
 if(!toolbar.options.ref){alert("No reference set");return;};
 if(dbData.userResults && dbData.reflist)
 {
  dbDataSpec.userResults.emptyContainer();
  dbDataSpec.reflist.emptyContainer();
  for(i=0;i<dbData.userResults.length;i++)
  {
   if(dbData.userResults[i].selected || doall)
   {
    none=false;
    dbData.userResults[i].selected=false;
    obj=new Object();
    obj.oxa=dbData.userResults[i].oxa;
    obj.wheel=dbData.userResults[i].wheel;
    obj.pos=dbData.userResults[i].pos;
    obj.labref=specialOxA(obj,"OxA-");
    obj.ref=toolbar.options.ref;
    obj.citation=toolbar.options.citation;
    obj.created=true;
    dbData.reflist.push(obj);
   };
  };
  dbDataSpec.reflist.changed=true;
  dbDataSpec.reflist.fillContainer();
  dbDataSpec.userResults.fillContainer();
  if(!doall)
  {
   spc=dbDataSpec.projRefs.incrArray();
   spc.emptyContainer();
   spc.object.ref=toolbar.options.ref;
   spc.object.project=dbData[0].project;
   spc.fillContainer();
  };
  if((!doall) && none)
  {
   if(confirm("No results selected\nlink all results with this reference?"))
   {
    linkResults(true);
   };
   return;
  };
  if(none)
  {
   alert("No results to link");
  }
  else
  {
   msg=user.name+" has provided new links to the reference\n";
   msg+=toolbar.options.citation+" ("+toolbar.options.ref+").\n";
   msg+="The linked results can now be made public.";
   email("orau@rlaha.ox.ac.uk,"+user.email,"New references",msg);
  };
 };
};

function sampleFormChecker(spec)
{
 var prj;
 if(submitter)
 {
  spec.object.person=submitter;
 }
 else
 {
  if(dbData.user)
  {
   spec.object.person=dbData.user;
  };
 };
 if(dbData.userProject){ prj=dbData.userProject; };
 if(dbData.project){ prj=dbData.project; };
 if(prj)
 {
  if(!spec.object.summary.projtitle)
  {
   spec.object.summary.projtitle=prj.projtitle;
  };
  if(!spec.object.summary.invaddress)
  {
   spec.object.summary.invaddress=prj.invaddress;
  };
  if(!spec.object.summary.subject)
  {
   spec.object.summary.subject=prj.subject;
  };
  if(!spec.object.summary.funding)
  {
   spec.object.summary.funding=prj.funding;
  };
  if(!spec.object.summary.grant_no)
  {
   spec.object.summary.grant_no=prj.grant_no;
  };
 };
 spec.readonly=false;
 if(spec.object)
 {
  if(spec.object.header)
  {
   if(spec.object.header.submitted)
   {
    spec.readonly=true;
   };
  };
 };
 if(!spec.readonly)
 {
  if(!spec.object.required)
  {
   spec.edit=true;
   if(spec.parent)
   {
    spec.parent.object.sub=false;
   };
  };
 };
};

function printForm(spec,attachToMail)
{
 var expString;
 expString="\\documentclass[a4paper,8pt]{article}\n\\usepackage{longtable}\n"+
    "\\usepackage{fontspec,xltxtra,xunicode}"+
    "\\defaultfontfeatures{Mapping=tex-text}"+
    "\\setromanfont[Mapping=tex-text]{Times New Roman}"+
    "\\setsansfont[Scale=MatchLowercase,Mapping=tex-text]{Helvetica Neue}"+
    "\\setmonofont[Scale=MatchLowercase]{Monaco}"+
    "\\usepackage{lscape}\n\\usepackage{amssymb}\n\\usepackage{array}\n"+
    "\\usepackage{graphicx}"+
	"\\parindent 0pt \\parskip 0pt \\oddsidemargin  0cm \\evensidemargin 0cm\n"+
	"\\textwidth 16.00cm \\headheight 0.5cm \\topmargin -2cm \\textheight 25cm \\headsep 1cm\n"+
	"\\begin{document}\n\\pagestyle{myheadings}\\markright{"+
	 TeXclean(spec.prompt)+" \\hfill "+TeXclean(makeDate())+" \\hfill}\n";
 if(spec.name=="nercform")
 {
  expString+="\\includegraphics[width=16cm]{nercHeader.pdf}";
 }
 else
 {
  expString+="\\includegraphics[width=16cm]{header.pdf}";
 };
 expString+=spec.exportData(true,"TeX");
 expString+="\\end{document}\n";
 if(attachToMail)
 {
  attach("dbAttach.tex",expString);
 }
 else
 {
  download("dbPrint.tex",expString);
 };
};

function editForm(spec)
{
 if(spec.object)
 {
  if(spec.object.header)
  {
   if(spec.object.header.submitted)
   {
    if(!confirm("This has already been submitted.\n\nAre you sure you want to change it?"))
    {
     return;
    };
    if(!confirm("You can only make another new submission after the previous one has been processed (please contact the lab to confirm).  Editing this application will mean that the previous submission cannot be processed.\n\nAre you really sure you want to recall it?"))
    {
     return;
    };
   };
  };
 };
 spec.parent.emptyContainer();
 spec.object.header.submitted=false;
 spec.parent.object.sub=false;
 spec.object.header.subdate=new Date();
 spec.changed=true;
 spec.parent.changed=true;
 spec.readonly=false;
 spec.parent.fillContainer();
 spec.makeEdit(true);
 spec.parent.makeEdit(true);
};

var formSpec;

function doSubmitActions(spec)
{
 if(spec.name=="nercform")
 {
  if(!document.getElementById("emailFile1File").value || !document.getElementById("emailFile2File").value)
  {
   alert("CV and Case for support must be attached");
   return;
  };
 };
 spec.parent.emptyContainer();
 spec.object.header.submitted=true;
 if(spec.name=="nercform")
 {
  spec.parent.object.sub=spec.object.header.sub;
 }
 else
 {
  spec.parent.object.sub=true;
 };
 if(spec.name=="ssform")
 {
  for(i=0;i<spec.object.groups.length;i++)
  {
   for(j=0;j<spec.object.groups[i].samples.length;j++)
   {
    spec.object.groups[i].samples[j].created=true;
    spec.object.groups[i].samples[j].selected=true;
   };
  };
 };
 spec.changed=true;
 spec.parent.changed=true;
 spec.parent.fillContainer();
 printForm(spec,true);
 databaseAction('Save');
};

function submitForm(spec)
{
 var msg,o,labs,issues,j;
 if(!spec.checkRequired())
 {
  alert("The form has not yet been submitted:\nplease fill in required entries");
  return;
 };
 if(spec.name=="ssform")
 {
  o=spec.object;
  if(o.special.fast)
  {
   if(!confirm("Fast turnaround entails higher charges\nplease confirm choice"))
   {
    return;
   };
  };
 };
 if(spec.name=="nercform") 
 {
  o=spec.object;
  if(o.header.requested>100)
  {
   alert("With this number of analyses you may need to have grant funding.\nPlease contact the facility");
  };
  if(o.header.requested>100)
  {
   alert("With this number of analyses you may need to have grant funding.\nPlease contact the facility");
  };
  if(o.special.fast || o.special.small || o.special.hazard)
  {
   if(!o.special.contact)
   {
    alert("No lab contact given in relation to special requirements:\nplease give contact name");
    return;
   };
  };
  issues=false;
  for(j in o.issues)
  {
   if(o.issues[j])
   {
    issues=true;break;
   };
  };
  if(!issues)
  {
   alert("No research issues identified:\nplease tick at least one");
   return;
  };
  labs=getLabsFromForm(o);
 };
 formSpec=spec;
 if(spec.name=="ssform") 
 {
  msg=user.name;
  msg+=" has submitted a sample submission form.";
  msg+="\nThis form should be printed and sent with the ";
  msg+="\nsamples. A signed copy of our terms and conditions";
  msg+="\nshould also be enclosed.";
  email("orau@rlaha.ox.ac.uk,"+user.email,"Sample submission form ("+user.name+")",
   msg,"doSubmitActions(formSpec)");
 };
 if(spec.name=="nercform") 
 {
  msg=user.name;
  msg+=" has submitted an NERC project submission form.";
  msg+="\nThe case for support and PI's CV are attached.";
  email(getContacts(labs)+","+user.email,"NERC project submission ("+user.name+")",
   msg,"doSubmitActions(formSpec)","Case for support","CV");
 };
};

function setFormView(spec,single)
{
 setCookie("ssfSingle",single);
 spec.makeEdit(false);
 if(spec.changed)
 {
  spec.parent.changed=true;
  databaseAction('Save');
 }
 else
 {
  databaseAction('search');
 };
};

function sampleForm()
{
 var spec,s,ss,sss,ssss,single;
 spec=new itemSpec("data","Sample submission form","Object",true);
 spec.checker="sampleFormChecker(this)";
 spec.outline=true;
 spec.readonly=true;
 if(args.page=="newProjects")
 {
  spec.expand=false;
 };
 single=(getCookie("ssfSingle")=="TRUE");

 //header
 s=spec.appendChild("header","","Object");
 s.inline=true;
 ss=s.appendChild("makeEdit","Edit","Button");
 ss.action="editForm(this.parent.parent)";
 ss.readonly=true;
 ss.width=8;
 if(single)
 {
  ss=s.appendChild("table","> Table view","Button");
  ss.action="setFormView(this.parent.parent,'FALSE')";
 }
 else
 {
  ss=s.appendChild("single","> Sample view","Button");
  ss.action="setFormView(this.parent.parent,'TRUE')";
 };
 ss.readonly=true;
 ss.width=15;
 ss=s.appendChild("save","Save","Button");
 ss.action="databaseAction('Save')";
 ss.readonly=true;
 ss.width=8;
 ss=s.appendChild("print","Print","Button");
 ss.action="printForm(this.parent.parent)";
 ss.readonly=true;
 ss.width=8;
 ss=s.appendChild("submit","Submit","Button");
 ss.action="submitForm(this.parent.parent)";
 ss.readonly=true;
 ss.width=8;
 ss=s.appendChild("pnums","P Numbers","Text");
 ss.hint="For lab use only";
 ss.readonly=true;
 ss.width=64;
 ss=s.appendChild("submitted","Submitted","Boolean");
 ss.readonly=true;
 ss.width=14;
 ss=s.appendChild("subdate","On","Date");
 ss.readonly=true;
 ss.width=14;
 
 //submitter information
 s=spec.appendChild("person","Submitter","Object",true);
 s.hint="Information entered in 'Your details'";
 ss=s.appendChild("prefix","Title","Text",true);
 ss.readonly=true;
 ss=s.appendChild("initials","Initials","Text",true);
 ss.readonly=true;
 ss=s.appendChild("surname","Surname","Text",true);
 ss.readonly=true;
 ss=s.appendChild("firstname","First name","Text",true);
 ss.readonly=true;
 ss=s.appendChild("address","Address","Pre",true);
 ss.readonly=true;
 ss=s.appendChild("tel","Telephone","Text",true);
 ss.readonly=true;
 ss=s.appendChild("fax","Fax","Text",false);
 ss.readonly=true;
 ss=s.appendChild("email","Email","Text",true);
 ss.readonly=true;
 
 //project information
 s=spec.appendChild("summary","Project information","Object",true);
 ss=s.appendChild("projtitle","Project title","Text",true);
 ss=s.appendChild("invaddress","Invoice address (if different)","Pre",false);
 ss.hint="Address to which invoice is to be sent (if different to main submitters address)";
 ss=s.appendChild("subject","Main subject","Text",true);
 ss.hint="Main subject area of this project";
 ss.options=subjects;
 ss=s.appendChild("funding","Project funding","Text");
 ss.options=funding;
 ss.hint="Overall funding for project for which dating is carried out";
 ss=s.appendChild("grant_no","Grant number","Text",false); 

 //Requirements
 s=spec.appendChild("special","Special requirements","Object");
 ss=s.appendChild("fast","Fast turnaround","Boolean");
 ss.hint="This may not always be possible and may incur extra charges (see schedule of charges)";
 ss=s.appendChild("small","Small samples","Boolean");
 ss.hint="Typically those yielding <500ugC";
 ss=s.appendChild("hazard","Health hazard","Boolean");
 ss.hint="Bio-hazard, toxic etc.";
 ss=s.appendChild("sample_return","Return required","Boolean");
 ss.hint="Samples are valuable and any remainder has to be returned to submitter";
 ss=s.appendChild("can_use_whole","Entire sample can be used","Boolean");
 ss.hint="Tick if the lab can use the entire sample if necessary for dating";
 ss=s.appendChild("contact","Lab personnel contacted","Text");
 ss.hint="Always contact lab staff if any of the above are ticked";

 s=spec.appendChild("page","","Page");
 
 //sample information
 s=spec.appendChild("groups","Sites","Array",true);
 s.outline=true;
 ss=s.appendChild("group","Site","Object",true);
 ss.outline=true;
 sss=ss.appendChild("summary","Summary","Object",true);
 ssss=sss.appendChild("country","Country","Text",true);
 ssss.editor="viewLocation(this)";
 ssss.hint="Country of origin of samples - click on blue spot to edit";
 ssss=sss.appendChild("region","Region","Text",false);
 ssss.editor="viewLocation(this)";
 ssss.hint="Region of country - eg. England, Scotland or Wales";
 ssss=sss.appendChild("site","Site","Text",true);
 ssss.editor="viewLocation(this)";
 ssss.hint="Site name - pick from sites already dated or enter a new site";
 ssss=sss.appendChild("location","Location","Text",false);
 ssss.editor="viewLocation(this)";
 ssss.hint="Latitude/Longitude or British grid reference";
 ssss=sss.appendChild("getLocation","Get location","Button",false);
 ssss.action="viewLocation(this)";
 ssss.readonly=true;
 ssss=sss.appendChild("environment","Environment","Text",true);
 ssss.hint="Excavation, sediment core, museum etc.";
 ssss=sss.appendChild("period","Period","Text",true);
 ssss.hint="General indication of age - eg. Bronze age, Paleaolithic or Holocene";
 ssss=sss.appendChild("altitude","Altitude (m)","Number",false);
 ssss.hint="Altitude above sea level";
 ssss=sss.appendChild("grid","Grid bearing (degrees)","Number",false);
 ssss.hint="Orientation of local site grid (0 if X is east and Y is north)";
 ssss=sss.appendChild("ztype","Z used as","Number",false);
 ssss.options=new Array("Depth","Height");
 ssss.hint="Whether Z is depth below datum or height above datum";
 sss=ss.appendChild("samples","Samples","Array",true);
 if(single)
 {
  sss.outline=true;
  sss=sss.appendChild("sample","Sample","Object",true);
 }
 else
 {
  sss.database=true;
 };
 ssss=sss.appendChild("sampref","Sample ref.","Text",true);
 ssss.hint="Your reference for the sample";
 ssss.width=20;
 ssss=sss.appendChild("material","Material","Text",true);
 ssss.hint="Material: if not given here specify 'other' and give details in the notes";
 ssss.options=database.fields.material.options;
 ssss.width=14;
 ssss=sss.appendChild("species","Species","Text",false);
 ssss.hint="Latin species name or other material sub-type";
 ssss.width=20;
 ssss=sss.appendChild("context","Context","Text",false);
 ssss.hint="Level, or other context information";
 ssss.width=20;
 ssss=sss.appendChild("association","Certainty of association","Number",false);
 ssss.hint="The certainty of the association of the sample with the context";
 ssss.options=new Array("Unspecified","Certain","Very likely","Probable","Reasonable");
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("age","Age at deposition","Number",false);
 ssss.hint="Likely time-lag between fixing of carbon and deposition in the context";
 ssss.options=new Array("Unspecified","0-20yrs","0-100yrs","0-n00yrs","Uncertain");
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("if_conserved","Conserved","Boolean",false);
 ssss.hint="Tick if sample might be conserved (give details below)";
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("si_measurements","Extra IRMS measurements","Number",false);
 ssss.options=["none","single","duplicate","triplicate"];
 ssss.hint="Normally done in duplicate or triplicate if required";
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("sample_note","Special sampling required","Boolean",false);
 ssss.hint="Tick if there are special sampling considerations (give details below)";
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("alternates","Alternate samples available","Boolean",false);
 ssss.hint="Tick if there is alternative material available if necessary"; 
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("notes","Notes","TextArea");
 ssss.hint="Further information: stratigraphic details, storage, conservation, sampling instructions, previous dates, relevant publications etc.";
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("x","X (m)","Number");
 ssss.hint="Local site grid - eg. Easting";
 ssss.width=4;
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("y","Y (m)","Number");
 ssss.hint="Local site grid - eg. Northing";
 ssss.width=4;
 if(!single){ssss.popup=true;};
 ssss=sss.appendChild("z","Z (m)","Number");
 ssss.hint="Depth below (or height above) datum";
 ssss.width=4;
 ssss=sss.appendChild("marine","Marine","Boolean");
 ssss.hint="Tick if material is of marine origin";
 ssss.width=6;
 return spec;
};

