// db_ref.js - utilities for reference manipulation - (c) Christopher Ramsey 2007
var spec,ref=new Object();
var firstauthors=new Array();
var years=new Array();
var titles=new Array();
var reftitles=new Array();
var oldref=new Object();
var newLabel="[New]";
var searchLabel="[Search]";
var entryWidth=30;

// some string utilites
function strtrimblanks(s) 
{ 
if(!s.replace){return s;};
return s.replace(/^\s+/,'').replace(/\s+$/,''); 
};
function strtrimbraces(s) 
{ 
if(!s.replace){return s;};
return s.replace(/^\{+/,'').replace(/\}+$/,''); 
};
function strhasstops(s)
{
if(!s.indexOf){return s;};
return s.indexOf(".")!=-1;
};
function strhasparts(s)
{
if(!s.split){return s;};
return s.split(/\s+/).length;
};


 function checkInList(item,list)
 {
  var i,found=false;
  while(list[0]=="")
  {
   list.splice(0,1);
  };
  if(!item){return;};
  if(item==newLabel){return;};
  for(i=0;i<list.length;i++)
  {
   if(list[i]==item){found=true;};
  };
  if(!found)
  {
   list.push(item);
   list.sort();
  };
 };

 function go_ref(ref,author,year,words,reftype)
 {
  switch(reftype)
  {
  case 'article':
   window.open("http://scholar.google.com/scholar?as_q="+words+"&as_sauthors="+author+
   "&as_ylo="+year+"&as_yhi="+year+"&as_occt=title&safe=active","ref");
   break;
  case 'book':
   window.open("http://books.google.com/books?&q=intitle%3A"+
    words.split("+").join("+intitle%3A")+"+inauthor%3A"+ 
    author+"&btnG=Search+Books&as_drrb_is=b&as_miny_is="+ 
    year+"&as_maxy_is="+year,"ref");
   break;
  default:
   window.open("../db/db_ref.php?ref="+ref,"ref");
   break;
  };
 };

function initRefMenu()
{
 var s,ss,i,t,newItem,ll,initial;
 ref.created=false;
 ref.changed=false;
 newItem=false;
 args=decodeObject(args);
 if(window.opener)
 {
  if(!(window.opener && window.opener.refSpec))
  {
   document.getElementById("doButton").value="Save";
  };
  switch(args.refAction)
  {
  case "update":
  case "insert":
   if(!(window.opener && window.opener.refSpec)){break;};
   window.opener.newRef=ref.ref;
   ll=window.opener.refSpec.object;
   ll.ref=ref.ref;
   ll.firstauthor=ref.firstauthor;
   ll.title=ref.title;
   ll.year=ref.year;
   ll.citation=ref.citation;
   ll.changed=true;
   window.close();
   break;
  };
 };
 if(oldref.ref)
 {
  ref.ref=oldref.ref;
  ref.changed=true;
  args.refAction=false;
  if(!ref.firstauthor)
  {
   ref.firstauthor=oldref.firstauthor;
  };
 }
 else
 {
  if(args.ref && !ref.ref)
  {
   ref.created=true;
   ref.ref=args.ref;
  }
  else
  {
   if(args.reftype)
   {
    if(args.reftype!=ref.reftype)
    {
     ref.changed=true;
    };
   };
  };
 };
 if(args.refAction=="import")
 {
  ref.created=true;
 };
 if(args.firstauthor && (args.firstauthor.indexOf("%")==-1))
 {
  ref.firstauthor=args.firstauthor;
 };
 if(args.year)
 {
  ref.year=args.year;
 };
 if(args.ref){ref.ref=args.ref;};
 if(args.reftype)
 {
  ref.reftype=args.reftype;
 };
 if(args.title)
 {
  ref.title=args.title;
 };
 initial=false;
 if(ref.firstauthor)
 {
  checkInList(ref.firstauthor,firstauthors);
  firstauthors.splice(0,0,searchLabel);
 }
 else
 {
  if(args.firstauthor)
  {
   if(firstauthors.length)
   {
    firstauthors.splice(0,0,searchLabel);
    firstauthors.splice(0,0,newLabel);
    firstauthors.splice(0,0,"");
   };
  }
  else
  {
   firstauthors=new Array("");
   initial=true;
   for(i=0;i<26;i++)
   {
    firstauthors[i+1]=String.fromCharCode(("A").charCodeAt(0)+i)+"%";
   };
  };
 };
 if(ref.year)
 {
  checkInList(ref.year,years);
  years.splice(0,0,searchLabel);
 }
 else
 {
  if(years.length)
  {
   years.splice(0,0,newLabel);
   years.splice(0,0,"");
  };
 };
 if(ref.title)
 {
 }
 else
 {
  if(reftitles.length)
  {
   reftitles.splice(0,0,new Object())
   reftitles[0].title=newLabel;
   reftitles[0].ref="";
   reftitles.splice(0,0,new Object())
   reftitles[0].title="";
   reftitles[0].ref="";
   for(i=0;i<reftitles.length;i++)
   {
    titles[i]=reftitles[i].title;
   };
  };
 };
 spec=new itemSpec("ref","Reference","Object");
 if(ref.changed)
 {
  spec.changed=true;
 };
 spec.noheader=true;
 if(window.opener && window.opener.refSpec)
 {
  spec.edit=true;
  if(window.opener.refSpec.object.reference)
  {
   spec.edit=false;
  };
 }
 else
 {
  spec.edit=(!ref.ref)||(ref.changed)||(ref.created);
 };
 spec.database=true;
 s=spec.appendChild("ref","Reference ID","Text",true);
   s.readonly=true;
   s.width=entryWidth;
 if(initial)
 {
  s=spec.appendChild("firstauthor","Author search","Text",true);
 }
 else
 {
  s=spec.appendChild("firstauthor","Author surname","Text",true);
 };
   s.changer="checkRef(this)";
   s.width=entryWidth;
   s.hint="First author surname";
 if((ref.firstauthor==newLabel)||(firstauthors.length==0))
 {
  ref.firstauthor="";
  newItem=true;
 }
 else
 {
  s.options=firstauthors;
  newItem=(!ref.firstauthor);
 };
 if((ref.year==newLabel)||(years.length==0))
 {
  ref.year=0;
  s=spec.appendChild("year","Year","Number",true);
  s.readonly=newItem;
  newItem=true;
 }
 else
 {
  s=spec.appendChild("year","Year","Text",true);
  s.options=years;
  s.readonly=newItem;
  newItem=newItem||(!ref.year);
 };
 s.changer="checkRef(this)";
 s.width=entryWidth;
 if((ref.title==newLabel)||((titles.length==0)&&(!ref.title)))
 {
  ref.title="";
  s=spec.appendChild("title","Title","Text",true);
  s.changer="checkRef(this)";
  s.readonly=newItem;
  newItem=true;
 }
 else
 {
  if(ref.title)
  {
   s=spec.appendChild("title","Title","Text",true);
  }
  else
  {
   s=spec.appendChild("titleNo","Title","Number",true);
   s.options=titles;
   s.changer="checkRef(this)";
  };
  s.readonly=newItem;
  newItem=!ref.title;
 };
 s.width=entryWidth;
 if(!ref.reftype)
 {
  ref.reftype="";
 };
 s=spec.appendChild("reftypeNo","Type","Number",true);
  s.changer="checkRef(this)";
  s.options=new Array("");
  s.readonly=newItem;
 s.width=entryWidth;
 ref.reftypeNo=0;
 for(i=2;i<bibtexSpec.children.length;i++)
 {
  if(ref.reftype==bibtexSpec.children[i].name)
  {
   ref.reftypeNo=i-1;
  };
  s.options.push(bibtexSpec.children[i].prompt);
 };
 s=spec.appendChild("reftype","Type","Text",true);
   s.changer="checkRef(this)";
 s.hidden=true;
 for(i=0;i<bibtexData.length;i++)
 {
  switch(bibtexData[i].field)
  {
  case 'year': case 'title':
   continue;
  case 'year': case 'pagefrom': case 'pageto': case 'chapter': case 'edition':
   t='Number';
  default:
   t="Text";
   break;
  };
  switch(bibtexData[i][ref.reftype])
  {
  case 0:
   s=spec.appendChild(bibtexData[i].field,bibtexData[i].title,t);
   s.hidden=true;
   break;
  case 1:case 2:
   s=spec.appendChild(bibtexData[i].field,bibtexData[i].title,t,false);
   if(t=="Text"){s.width=entryWidth;};
   break;
  case 3:
   s=spec.appendChild(bibtexData[i].field,bibtexData[i].title,t,true);
   if(t=="Text"){s.width=entryWidth;};
   break;
  };
  switch(bibtexData[i].field)
  {
  case 'editor':case 'author':
   s.hint="Use form: Libby, W. F., Anderson, E. C., & Arnold, J. R.";
   break;
  };
 };
 s=spec.appendChild("imp","Import from BibTeX","Object");
 s.expand=false;
 ss=s.appendChild("bibtex","BibTeX entry","Pre");
 ss=s.appendChild("importer","Import","Button");
 ss.readonly=true;
 ss.action="doImport()";
 s=spec.appendChild("line","","Page");
 s=spec.appendChild("reference","Reference","Text");
   s.readonly=true;
 s=spec.appendChild("citation","Citation","Text");
   s.readonly=true;
 ref.imp=new Object();
 ref.imp.bibtex=makeBibtex(ref);
 document.getElementById("main").appendChild(spec.createDisplay(ref));
};

function firstWords(str,no)
{
 var i,a,b;
 a=str.replace(/[{}]/g,"").split(/[^a-zA-Z0-9]/);
 b=new Array();
 for(i=0;i<a.length;i++)
 {
  if(a[i].length>4)
  {
   b.push(a[i]);
   if(b.length==no){return b;};
  };
 };
 return b;
};

function bibtexCitation(ref)
{
 var str,i,a;
 str="";
 if(ref.firstauthor && ref.title && ref.year && (ref.title!=newLabel))
 {
  str=ref.firstauthor.toLowerCase().replace(/[^a-z]/g,"");
  str+=ref.year;
  a=firstWords(ref.title,3);
  for(i=0;i<a.length;i++)
  { 
   str+=a[i].substring(0,1).toLowerCase();
  };
 };
 return str;
};

function formatAuthors(str)
{
 var a,b,c,usesStops,i,j,n,w;
 str=strtrimblanks(str.replace(/\s+and\s+/gi,"&"));
 a=str.split(/\s*&\s*/);
 if(a.length>2){return str.replace(/\s*&\s*/g," and ");}; //already in BibTex format
 usesStops=strhasstops(a[0]);
 b=a[0].split(/\s*,\s*/);
 c=new Array();
 for(i=0;i<b.length;i++)
 {
  // check if contains intitials
  w=b[i].split(/\s/)[0];
  if(usesStops)
  {
   c[i]=(strhasstops(b[i]) || w.toUpperCase()==w);
  }
  else
  {
   c[i]=w.toUpperCase()==w;
  };
 };
 c[i]=false;
 j=0;
 n=new Array();
 for(i=0;i<b.length;i++)
 {
  if(c[i])
  {
   n[j]=b[i];
   j++;
  }
  else
  {
   if(c[i+1])
   {
    n[j]=b[i]+", "+b[i+1];
    i++;j++;
   }
   else
   {
    n[j]=b[i];
    j++;
   };
  };
 };
 if(a.length==2)
 {
  n[j]=a[1];
 };
 return n.join(" and ");
};

function makeBibtex(ref)
{
 var str="",i;
 if(ref.reftype && ref.title && ref.year && ref.firstauthor && ref.ref)
 {
  str+="@"+ref.reftype+"{"+ref.ref;
  for(i=0;i<bibtexData.length;i++)
  {
   if(!ref[bibtexData[i].field]){continue;};
   switch(bibtexData[i].field)
   {
   case "pageto":
    break;
   case "pagefrom":
    if(ref.pageto)
    {
     str+=",\n pages={"+ref.pagefrom+"--"+ref.pageto+"}";
    }
    else
    {
     str+=",\n pages={"+ref.pagefrom+"}";
    };
    break
   case "author":
   case "editor":
    str+=",\n "+bibtexData[i].field+"={"+formatAuthors(ref[bibtexData[i].field])+"}";
    break;
   case "title":
    str+=",\n "+bibtexData[i].field+"={{"+strtrimbraces(ref[bibtexData[i].field])+"}}";
    break;
   default:
    str+=",\n "+bibtexData[i].field+"={"+strtrimbraces(ref[bibtexData[i].field])+"}";
    break;
   };
  };
  str+="\n}\n";
 };
 return str;
};

function checkRef(s)
{
 var url="db_ref.php?";
 if(ref.reftypeNo)
 {
  ref.reftype=bibtexSpec.children[ref.reftypeNo+1].name;
 }
 else
 {
  ref.reftype=false;
 };
 if(s)
 {
  switch(s.name)
  {
  case 'title':
   ref.title=s.object;
   break;
  case 'titleNo':
   ref.title=reftitles[ref.titleNo].title;
   ref.ref=reftitles[ref.titleNo].ref;
   ref.created=false;
   ref.reftype="";
   break;
  case 'firstauthor':
   if(ref.firstauthor==searchLabel){ref.firstauthor="";};
   ref.year="";
  case 'year':
   if(ref.year==searchLabel){ref.year="";};
   ref.title="";
   ref.reftype="";
   ref.ref="";
   break;
  };
 };
 if(!ref.ref){ref.ref=bibtexCitation(ref);};
 if(ref.firstauthor)
 {
  url+="firstauthor="+ref.firstauthor+"&";
 };
 if(ref.year)
 {
  url+="year="+ref.year+"&";
 };
 if(ref.title)
 {
  url+="title="+ref.title+"&";
 };
 if(ref.reftype)
 {
  url+="reftype="+ref.reftype+"&";
 };
 if(ref.created)
 {
  url+="created=true&";
 };
 if(ref.ref)
 {
  url+="ref="+ref.ref+"&";
 };
 spec.makeEdit(false);
 document.location.replace(encodeURI(url));
 return false;
};

function doImport()
{
 spec.emptyContainer();
 document.getElementById("bibTeXData").value=ref.imp.bibtex;
 document.getElementById("bibTeXUpload").submit();
};

function checkNotNull(s,rqd)
{
 var msg;
 if(s.object){return true;};
 if(rqd)
 {
  msg="You need to give the ";
 }
 else
 {
  msg="You have not given the ";
 };
 msg+=s.prompt;
 alert(msg);
 return false;
};

function update()
{
 var i,l,ll;
 spec.emptyContainer();
 spec.fillContainer();
 for(i=1;i<4;i++)
 {
  if(!checkNotNull(spec.children[i],true)){return;};
 };
 if(!checkNotNull(spec.children[0],true)){return;};
 for(i=4;i<spec.children.length;i++)
 {
  if(spec.children[i].required)
  {
   checkNotNull(spec.children[i],false);
  };
 };
 spec.emptyContainer();
 if(!ref.author){ref.author=ref.firstauthor;};
 document.getElementById("bibTeXData").value=makeBibtex(ref);
 if(ref.created)
 {
  document.getElementById("bibTeXUpload").action="db_ref.php?refAction=insert&ref="+ref.ref;
  document.getElementById("bibTeXUpload").submit();
  return;
 }
 else
 {
  if(spec.changed)
  {
   document.getElementById("bibTeXUpload").action="db_ref.php?refAction=update";
   document.getElementById("bibTeXUpload").submit();
   return;
  }
  else
  {
  };
 };
 if(!(window.opener && window.opener.refSpec))
 {
  if(ref.ref)
  {
   document.getElementById("bibTeXUpload").action="db_ref.php?refAction=check&ref="+ref.ref;
   document.getElementById("bibTeXUpload").submit();
   return;
  };
  spec.fillContainer();
  return;
 };
 l=spec.object;
 ll=window.opener.refSpec.object;
 ll.ref=l.ref;
 ll.firstauthor=l.firstauthor;
 ll.title=l.title;
 ll.year=l.year;
 ll.citation=l.citation;
 ll.changed=true;
 window.opener.refSpec.changed=true;
 window.close();
};

function folderaction(act)
{
 var sel,fld;
 sel=document.getElementById("Folder");
 fld=sel.options[sel.selectedIndex].value;
 if(ref.ref && fld)
 {
  window.location="db_ref.php?refAction="+act+"&folder="+fld+"&ref="+ref.ref;
 };
};

function deleteref()
{
 if(ref.ref)
 {
  window.location="db_ref.php?refAction=deleteref&ref="+ref.ref;
 };
};

function viewPdf()
{
 window.open("../fs/get_file.php?view=true&filename=PDF:/"+ref.ref+".pdf","pdf");
};
function downloadPdf()
{
 window.location="../fs/get_file.php?filename=PDF:/"+ref.ref+".pdf";
};