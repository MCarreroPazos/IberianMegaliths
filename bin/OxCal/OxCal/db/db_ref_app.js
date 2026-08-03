var ref,data;

function refApp()
{
 var s;
 this.entryWidth=30;
 this.ref={"reftype":"article"};
 this.searchText="";
 this.search={};
 this.bibtex={};
 this.bibtexFields={};
 this.bibtexData=[];
 this.list=[];
 this.ind='author';
 this.reverse=false;
 this.finished=false;
 this.elements=["ref","firstauthor","year","reftype","author","editor","title","journal","volume","number","pages","series","publisher","address","booktitle","chapter","edition","organization","school","institution","url","doi","isbn","citation","reference"];
 this.reftypes=["article","book","booklet","phdthesis","inbook","inproceedings","incollection","manual","mastersthesis","misc","proceedings","techreport","unpublished"];
 this.specialTex=["\\`A","\\`a","\\'A","\\'a","\\^A","\\^a","\\\"A","\\\"a","\\~A","\\~a","$\\Delta$","$\\delta$","\\`E","\\`e","\\'E","\\'e","\\^E","\\^e","\\\"E","\\\"e","\\\"I","\\\"i","\\'I","\\'i","\\~N","\\~n","\\`O","\\`o","\\'O","\\'o","\\^O","\\^o","\\~O","\\~o","\\\"O","\\\"o","\\ss{}","\\\"U","\\\"u","\\'Y","\\'y","\\&","\\alpha","\\beta","\\gamma","\\delta","\\epsilon","\\zeta","\\eta","\\theta","\\iota","\\kappa","\\lambda","\\mu","\\nu","\\xi","\\o","\\pi","\\rho","\\sigma","\\tau","\\upsilon","\\phi","\\chi","\\psi","\\omega","\\Gamma","\\Delta","\\Theta","\\Lambda","\\Xi","\\Pi","\\Sigma","\\Upsilon","\\Phi","\\Psi","\\Omega"];
 this.specialAscii=["A","a","A","a","A","a","A","a","A","a","D","d","E","e","E","e","E","e","E","e","I","i","I","i","N","n","O","o","O","o","O","o","O","o","O","o","ss","U","u","Y","y","&","a","b","g","d","ea","z","i","th","i","k","l","m","n","x","o","p","r","s","t","u","f","ch","ps","o","G","D","Th","L","X","P","S","U","F","Ps","O"];
 this.specialUtf8=["À","à","Á","á","Â","â","Ä","ä","Ã","ã","Δ","δ","È","è","É","é","Ê","ê","Ë","ë","Ï","ï","Í","í","Ñ","ñ","Ò","ò","Ó","ó","Ô","ô","Õ","õ","Ö","ö","ß","Ü","ü","Ý","ý","&","α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","σ","τ","υ","φ","χ","ψ","ω","Γ","Δ","Θ","Λ","Ξ","Π","Σ","Υ","Φ","Ψ","Ω"];
 this.listSpec=this.genListSpec();
 this.searchSpec=this.genSearchSpec();
 this.index={};
 this.doiIndex={};
 this.repeatDOICheck=false;
 this.actionPos=0;
 this.exchangeType="BibTeX";
 this.exchangeAll=true;
 this.doiOrg='\/doi.org\/';
 this.doiURL='https:\/'+this.doiOrg;
};

refApp.prototype.cleanTex=function(str,ascii)
{
 var t,r,i;
 if(ascii)
 {
  r=this.specialUtf8; 
  t=this.specialAscii;
  for(i in r)  // first replace utf8 specials with plain ascii
  {
   str=str.split(r[i]).join(t[i]);
  };
 }
 else
 {
  t=this.specialUtf8;
 };
 r=this.specialTex;
 for(i in r) // replace LaTeX characters with plain ascii
 {
  str=str.split(r[i]).join(t[i]);
 };
 return str.replace(/[{}]/g,"");
};

refApp.prototype.notUpperCase=function(str)
{
 if(!str){return str;};
 if(str.toUpperCase()!=str){return str;}; // already ok
 function checkWord(w)
 {
  if(!w){return w;};
  if(w.replace(/[0-9]/g,"")!=w){return w;}; // could be isotope etc
  if(w.indexOf(".")==1){return w;}; // could be initials
  return w.slice(0,1)+w.slice(1).toLowerCase();
 };
 var i,wrds=str.split(" ");
 for(i in wrds)
 {
  wrds[i]=checkWord(wrds[i]);
 };
 return wrds.join(" ");
};

refApp.prototype.showCitation=function(spec)
{
 var str=spec.object,a=false,r=spec.parent.object;
 if(r.url || r.doi)
 {
  a=document.createElement("a");
  if(r.url){a.href=r.url;}else{a.href=this.doiURL+r.doi;};
  a.target='_blank';
 };
 if(a)
 {
  spec.appendComplexText(a,str);
  spec.container.appendChild(a);
 }
 else
 {
  spec.appendComplexText(spec.container,str);
 };
 if(r.reference)
 {
  spec.container.title=spec.parent.object.reference;
 };
};

refApp.prototype.showIfPresent=function(spec)
{
 if(spec.object)
 {
  spec.container.appendChild(itemSpec.prototype.control("true"));
 };
};

refApp.prototype.editReference=function(spec)
{
 spec.container.appendChild(itemSpec.prototype.control("edit"));
 spec.container.onclick=function(spec){this.showReference(spec);}.bind(this,spec);
};

refApp.prototype.searchReference=function(spec)
{
 spec.container.appendChild(itemSpec.prototype.control("search"));
 spec.container.onclick=function(spec){window.parent.app.options.bib_search(spec);}.bind(this,spec);
/* var b=document.createElement("INPUT");
 b.type="Button";
 b.value="Search";
 b.onclick=function(spec){window.parent.app.options.bib_search(spec);}.bind(this,spec);
 spec.container.appendChild(b);*/
};

refApp.prototype.addReference=function()
{
  app.menu("Add reference|New|Search")
  .then(function(rpl){
   switch(rpl)
   {
   case 1:
    this.newRef();
    break;
   case 2:
    app.selectFrame("Search");
    break;
   };
  }.bind(this)).catch(function(e){});
};

refApp.prototype.genListSpec=function()
{
 var s,i,search;
 search=(window.parent && window.parent.app && window.parent.app.options.bib_search);
 var spec=new itemSpec("list","References","Array");
 spec.noheader=true;
 spec.database=true;
 s=spec.appendChild('ref',"","Text");
 s.readonly=true;
 s.special=this.editReference.bind(this);
 s=spec.appendChild("citation","Citation","Text");
 s.readonly=true;
 s.special=this.showCitation.bind(this);
 for(i in this.elements)
 {
  switch(this.elements[i])
  {
  case 'ref':
   break;
  case 'citation':
   break;
  case 'doi':case 'url':
   s=spec.appendChild(this.elements[i],this.elements[i].toUpperCase(),"Text");
   s.readonly=true;
   s.special=this.showIfPresent.bind(this);
   break;
  case 'year': case 'chapter': case 'edition':
   s=spec.appendChild(this.elements[i],this.elements[i],"Number");
   s.hidden=true;
   break;
  case 'reference':
   if(search){break;};
  default:
   s=spec.appendChild(this.elements[i],this.elements[i],"Text");
   s.hidden=true;
   break;
  };
 };
 if(search)
 {
  s=spec.appendChild('reference',"","Text");
  s.readonly=true;
  s.special=this.searchReference.bind(this);
 };
 spec.appender=function(ss)
 {
  this.addReference();
 }.bind(this);
 return spec;
};

refApp.prototype.genSearchSpec=function()
{
 var s,spec=new itemSpec("search","","Object");
 spec.edit=true;
 spec.noheader=true;
 s=spec.appendChild("text","Search for","Text");
 s.width=this.entryWidth;
 s=spec.appendChild("year","Year filter","Number");
 s.width=this.entryWidth;
 return spec;
};

refApp.prototype.firstWords=function(str,no)
{
 var i,a,b;
 str=this.cleanTex(str,true);
 a=str.replace(/[{}]/g,"").split(/[^a-zA-Z]/);
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

refApp.prototype.doi=function(str)
{
 if(!str){return str;};
 var a=str.split(this.doiOrg);
 if(a.length==2){return a[1].trim();}
 else
 {
  a=str.split("doi:");
  if(a.length==2){return a[1].trim();}
  return str.trim();
 };
};

refApp.prototype.bibtexCitation=function(r)
{
 var str,i,a;
 str="";
 if(r.fixedID && r.ref){return;};
 if(r.firstauthor && r.title && r.year)
 {
  str=this.cleanTex(r.firstauthor,true).toLowerCase().replace(/[^a-z]/g,"");
  str+=r.year;
  a=this.firstWords(r.title,3);
  for(i=0;i<a.length;i++)
  { 
   str+=a[i].substring(0,1).toLowerCase();
  };
 };
 r.ref=str;
};

refApp.prototype.formatAuthors=function(str)
{
 function strtrimblanks(s) 
 { 
  if(!s.replace){return s;};
  return s.replace(/^\s+/,'').replace(/\s+$/,''); 
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
 function addCommas(a)
 {
  var i,j;
  for(i=0;i<a.length;i++)
  {
   if(a[i].indexOf(",")==-1)
   {
    w=a[i].split(/\s/);
    a[i]=w[w.length-1];
    a[i]+=", ";
    for(j=0;j<w.length-1;j++)
    {
     a[i]+=w[j];
     if(j<w.length-2){a[i]+=" ";};
    };
   };
  };
 };
 var a,b,c,usesStops,i,j,n,w;
 str=strtrimblanks(str.replace(/\s+and\s+/gi,"&"));
 a=str.split(/\s*&\s*/);
 if(a.length>2)
 {
  addCommas(a);
  return a.join(" and ");
 }; //already in BibTex format
 usesStops=strhasstops(a[0]);
 b=a[0].split(/\s*,\s*/);
 if(b.length==1) // split by ; and add remaining item.
 {
  b=a[0].split(/\s*;\s*/);
  if(a.length==2){b.push(a[1]);};
  addCommas(b);
  return b.join(" and ");
 };
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
   if(i+1 < b.length)
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
 for(i in n){n[i]=this.notUpperCase(n[i]);};
 return n.join(" and ");
};

refApp.prototype.citation=function(r)
{
 var a=[],str="";
 if(r.editor){r.editor=this.formatAuthors(r.editor);a=r.editor.split(" and ");};
 if(r.author){r.author=this.formatAuthors(r.author);a=r.author.split(" and ");};
 //check doi:
 if(r.doi)
 {
  if(r.doi.indexOf(this.doiOrg)!=-1)
  {
   r.doi=r.doi.split(this.doiOrg)[1];
  };
  if(!r.url || (r.url.indexOf('http')!=0) || (r.url.indexOf(this.doiURL)==0)){r.url=this.doiURL+r.doi;};
 }
 else
 {
  if(r.url && (r.url.indexOf(this.doiURL)==0)){r.doi=r.url.split(this.doiURL)[1];};
 }; 
 //check url:
 if(r.url)
 {
  if(r.url.indexOf('http')!=0){r.url='';};
 };
 if(a.length && (a[0]!="Anon"))
 {
  str=a[0].split(",")[0];
  r.firstauthor=this.notUpperCase(a[0].split(",")[0]);
  if(a.length>1)
  {
   if(a.length==2){str+=" and "+a[1].split(",")[0];}
   else{str+=" et al."};
  };
  str+=", "+r.year;
  r.citation=str;
 }
 else
 {
  r.author="Anon";
  if(!r.firstauthor)
  {
   r.firstauthor="Anon";
  };
  r.citation=r.firstauthor+", "+r.year;
 };
 r.citation=this.cleanTex(r.citation);
 return r.citation;
};

refApp.prototype.personList=function(s)
{
 var a=[],str="",i,j,n,init;
 s=this.cleanTex(s);
 a=s.split(" and ");
 for(i in a)
 {
  a[i]=this.notUpperCase(a[i]);
  n=a[i].split(",");
  if(!n[0]){continue;};
  if(str)
  {
   if(i==a.length-1){str+=" and ";}else{str+=", ";};
  };
  str+=n[0];
  if((n.length>0)&&(n[1]))
  {
   n=n[1].replace(/\./g," ").split(/\s/);
   init="";
   for(j in n)
   {
    if(n[j]){init+=n[j].slice(0,1)+".";};
   };
   str+=", "+init;
  };
 };
 return str;
};

refApp.prototype.personCount=function(s)
{
 return s.split(" and ").length;
};

refApp.prototype.ordinal=function(intNum) 
{
 var o=[false,"st","nd","rd"];
 return intNum + (o[((intNum = Math.abs(intNum % 100)) - 20) % 10] || o[intNum] || "th");
};

refApp.prototype.pages=function(p)
{
 if(!p){return "";};
 if(p.indexOf("-")==-1){return ", p."+p;};
 return ", pp."+p.replace("--","-");
};

refApp.prototype.editors=function(e)
{
 var str="";
 if(e)
 {
  str=this.personList(e);
  if(this.personCount(e)>1){str+=", Eds.";}
  else{str+=", Ed.";};
 };
 return str;
};

refApp.prototype.reference=function(r,html)
{
 var a=[],e=[],str="",usedInst=false,ref="";
 for(i in this.bibtexFields)
 {
  switch(i)
  {
  case "title":
  case "journal":
  case "series":
  case "publisher":
  case "booktitle":
  case "organisation":
  case "school":
  case "institution":
   r[i]=this.notUpperCase(r[i]);
   break;
  };
 };
 if(r.author)
 {
  ref=this.personList(r.author);
 }
 else
 {
  ref=this.editors(r.editor);
 };
 if((ref=="Anon")&&(r.institution))
 {
  ref=r.institution;
  usedInst=true;
 };
 ref+=" ("+r.year+") ";
 if(html)
 {
  switch(r.reftype)
  {
  case "article":
  case "inproceedings":
  case "inbook":
  case "incollection":
   ref+=r.title+"."; 
   break;
  default:
   ref+="<i>"+r.title+"<\/i>."; 
   break;
  };
 }
 else
 {
  ref+=r.title+".";
 };
 switch(r.reftype)
 {
 case "article":
  if(html)
  {
   ref+=" <i>"+r.journal+"<\/i>";
   if(r.volume){ref+=", <b>"+r.volume+"<\/b>";};
  }
  else
  {
   ref+=" "+r.journal;
   if(r.volume){ref+=", "+r.volume;};
  };
  if(r.number){ref+="("+r.number+")";};
  ref+=this.pages(r.pages);
  break;
 case "booklet":
 case "manual":
 case "techreport":
 case "book":
 case "proceedings":
  if(r.series){ref+=" In "+r.series+".";};
  if(r.volume){ref+=" Vol. "+r.volume;};
  if(r.edition){ref+=" "+this.ordinal(r.edition)+" ed.";};
  if(r.institution && !usedInst){ref+=", "+r.institution;};
  if(r.address){ref+=" "+r.address;};
  if(r.publisher){ref+=", "+r.publisher;};
  if(r.pages){ref+=this.pages(r.pages);};
  if(r.isbn){ref+=". ISBN "+r.isbn;};
  break;
 case "inproceedings":
 case "inbook":
 case "incollection":
  ref+=" In ";
  if(r.editor)
  {
   ref+=this.editors(r.editor);
   ref+=" ";
  };
  if(html)
  {
   if(r.booktitle){ref+="<i>"+r.booktitle+"<\/i>."};
  }
  else
  {
   if(r.booktitle){ref+=r.booktitle+"."};
  };
  if(r.volume){ref+=" Vol. "+r.volume;};
  if(r.edition){ref+=" "+this.ordinal(r.edition)+" ed.";};
  if(r.address){ref+=" "+r.address;};
  if(r.publisher){ref+=", "+r.publisher;};
  if(r.chapter){ref+=", chap. "+r.chapter;};
  ref+=this.pages(r.pages);
  if(r.isbn){ref+=". ISBN "+r.isbn;};
  break;
 case "phdthesis":
  ref+=" Doctoral thesis";
  if(r.school){ref+=", "+r.school;};
  if(r.address){ref+=", "+r.address;};
  break;
 case "mastersthesis":
  ref+=" Masters thesis";
  if(r.school){ref+=", "+r.school;};
  if(r.address){ref+=", "+r.address;};
  break;
 case "misc":
 case "unpublished":
  if(r.url && !r.doi && !html)
  {
   ref+=". "+r.url;
  };
  break;
 };
 if(r.doi)
 {
  if(r.url && html)
  {
   ref+=". <a href='"+r.url+"' target='_blank'>doi:"+r.doi+"<\/a>";
  }
  else
  {
   if(html)
   {
    ref+=". <a href='"+this.doiURL+r.doi+"' target='_blank'>doi:"+r.doi+"<\/a>";
   }
   else
   {
    ref+=". doi:"+r.doi;
   };
  };
 }
 else
 {
  if(r.url && html)
  {
   ref+=". <a href='"+r.url+"' target='_blank'>"+r.url+"<\/a>";
  }
  else
  {
   ref+=".";
  };
 };
 ref=ref.replace(/\.\./g,'.').replace(/,\s,/g,', ');
 ref=this.cleanTex(ref);
 if(!html){r.reference=ref;};
 return ref;
};

refApp.prototype.checkRef=function(s)
{
 var obs,i;
 var area=document.getElementById("refArea");
 if(s)
 {
  this.ref.changed=true;
  switch(s.name)
  {
  case "reftype":
   while(area.firstChild)
   {
    area.removeChild(area.firstChild);
   };
   this.refSpec=this.genRefSpec(this.ref);
   for(i=0;i<this.bibtexData.length;i++)
   {
    if(!this.bibtexData[i][this.ref.reftype])
    {
     this.ref[this.bibtexData[i].field]=undefined;
    };
   };
   this.reference(this.ref);
   document.getElementById("refArea").appendChild(this.refSpec.createDisplay(this.ref));   
   break;
  case "title":
  case "firstauthor":
  case "year":
   this.refSpec.emptyContainer();
   obs=this.ref.ref;
   this.bibtexCitation(this.ref);
   if(this.ref.ref!=obs){this.ref.created=true;};
   this.refSpec.fillContainer();
   break;
  case "author":
   this.refSpec.emptyContainer();
   this.citation(this.ref);
   this.reference(this.ref);
   this.refSpec.fillContainer();
   break;
  default:
   this.refSpec.emptyContainer();
   this.citation(this.ref);
   this.reference(this.ref);
   this.refSpec.fillContainer();
   break;
  };
 };
};

refApp.prototype.showDispRef=function(s)
{
 s.container.style.background="white";
 s.container.innerHTML=this.reference(s.parent.object,true);
};

refApp.prototype.genRefSpec=function(r)
{
 var apec,s,ss,i,t,ll;
 if(!r.reftype)
 {
  r.reftype="article";
 };
 spec=new itemSpec("ref","Reference","Object");
 if(r.changed)
 {
  spec.changed=true;
 };
 spec.noheader=true;
 spec.edit=true;
 spec.edit=(!r.ref)||(r.changed)||(r.created);
 spec.database=true;
 s=spec.appendChild("ref","Ref_ID","Text",true);
   s.editor=function(spc)
   {
    if(!spc.object){return;};
    app.prompt("Fixed Ref_ID",spc.object).then(
     function(rpl)
     {
      if(rpl!=spc.object)
      {
       spc.parent.emptyContainer();
       spc.parent.object.ref=this.cleanTex(rpl).toLowerCase().replace(/[^a-z0-9]/g,"");
       spc.parent.object.created=true;
       spc.parent.fillContainer();
      };
      spc.parent.object.fixedID=true;
     å}.bind(this)).catch(function(e){});
   }.bind(this);
//   s.readonly=true;
   s.width=this.entryWidth;
 s=spec.appendChild("firstauthor","Author surname","Text",true);
   s.changer="ref.checkRef(this)";
   s.width=this.entryWidth;
   s.hint="First author surname";
 s=spec.appendChild("year","Year","Number",true);
   s.changer="ref.checkRef(this)";
   s.width=this.entryWidth;
 s=spec.appendChild("title","Title","Text",true);
   s.changer="ref.checkRef(this)";
   s.width=this.entryWidth;
 s=spec.appendChild("reftype","Type","Text",true);
   s.changer="ref.checkRef(this)";
   s.width=this.entryWidth;
   s.options=this.reftypes;
 for(i=0;i<this.bibtexData.length;i++)
 {
  switch(this.bibtexData[i].field)
  {
  case 'year': case 'title':
   continue;
  case 'chapter': case 'edition':
   t='Number';
   break;
  default:
   t="Text";
   break;
  };
  switch(this.bibtexData[i][r.reftype])
  {
  case 0:
   s=spec.appendChild(this.bibtexData[i].field,this.bibtexData[i].title,t);
   s.hidden=true;
   break;
  case 1:case 2:
   s=spec.appendChild(this.bibtexData[i].field,this.bibtexData[i].title,t,false);
   s.changer="ref.checkRef(this)";
   if(t=="Text"){s.width=this.entryWidth;};
   break;
  case 3:
   s=spec.appendChild(this.bibtexData[i].field,this.bibtexData[i].title,t,true);
   s.changer="ref.checkRef(this)";
   if(t=="Text"){s.width=this.entryWidth;};
   break;
  };
  switch(this.bibtexData[i].field)
  {
  case 'editor':case 'author':
   s.hint="Use form: Libby, W. F., Anderson, E. C., & Arnold, J. R.";
   break;
  };
 };
 s=spec.appendChild("line","","Page");
 s=spec.appendChild("reference","Reference","Text");
   s.special=this.showDispRef.bind(this);
   s.readonly=true;
 s=spec.appendChild("citation","Citation","Text");
   s.readonly=true;
 return spec;
};

refApp.prototype.parseCrossRef=function(r)
{
 function people(ar)
 {
  var i,str="";
  for(i=0;i<ar.length;i++)
  {
   if(i>0){str+=" and ";};
   str+=ar[i].family+", "+ar[i].given;
  };
  return str;
 };
 var i,res={"title":""};
 switch(r.type)
 {
 case "journal-article":
  res.reftype="article";
  break;
 case "edited-book":
 case "proceedings":
 case "book":
 case "monograph":
 case "reference-book":
  res.reftype="book";
  break;
 case "component":
 case "book-chapter":
 case "book-part":
 case "book-section":
  res.reftype="inbook";
  break;
 case "journal-volume":
 case "journal-issue":
  res.reftype="incollection";
  break;
 case "proceedings-article":
  res.reftype="inproceedings";
  break;
 case "dissertation":
  res.reftype="phdthesis";
  break;
 case "report":
  res.reftype="report";
  break;
 default:
  res.reftype="misc";
  break;
 };
 for(i in r)
 {
  switch(i)
  {
  case "publisher":
  case "DOI":
  case "URL":
  case "volume":
   res[i.toLowerCase()]=r[i];
   break;
  case "issue":
   res["number"]=r[i];
   break;
  case "container-title":
   if(!r[i][0]){break;};
   switch(res.reftype)
   {
   case "article":res["journal"]=r[i][0];break;
   case "inbook":res["booktitle"]=r[i][0];break;
   case "incollection":res["series"]=r[i][0];break;
   };
   break;
  case "page":
   res["pages"]=r[i];
   break;
  case "title":
   if(r[i][0]){res[i]=r[i][0];};
   break;
  case "issued":
   if(r[i]["date-parts"] && r[i]["date-parts"][0] && r[i]["date-parts"][0][0])
   {
    res["year"]=r[i]["date-parts"][0][0];
   };
   break;
  case "ISBN":
   if(r[i][0]){res["isbn"]=r[i][0];};
   break;
  case "editor":
  case "author":
   res[i]=people(r[i]);
   break;
  };
 };
 res["url"]=this.doiURL+res["doi"];
 res["created"]=true;
 this.reference(res);
 this.citation(res);
 this.bibtexCitation(res);
 return res;
};

refApp.prototype.crossRefDoiInfo=function(doi)
{
 var url="https://api.crossref.org/works/";
// if(onAServer()){url="crossref.php?doi=";};
 getFromServer(url+doi,function(data){
  var rec;
  try
  {
   data=JSON.parse(data);
   if(data.status=="ok")
   {
    rec=this.parseCrossRef(data.message);
    this.addToList([rec],this.repeatDOICheck);
    this.showReferences();
   }
   else
   {
    app.alert("not found doi:"+doi);
   };
   if(this.repeatDOICheck)
   {
    this.checkDois(true);
   }
   else
   {
    app.endProgress();
   };
  }
  catch(e){app.alert(e);};
 }.bind(this),
 function(err){
  app.log("warning","Error in response from CrossRef on doi:"+doi);
  if(this.repeatDOICheck)
  {
   this.checkDois(true);
  }
  else
  {
   app.endProgress();
  };
 }.bind(this));
};

refApp.prototype.crossRefFind=function(r)
{
 function mainWords(t)
 {
  var i,str="",ta;
  ta=t.split(/\s+/);
  for(i in ta)
  {
   if(ta[i].length>4)
   {
    if(str){str+="+";};str+=ta[i];
   };
  };
  return str;
 };
 var url="https://api.crossref.org/works?";
// if(onAServer()){url="crossref.php?";};
 url+="query.author="+r.firstauthor.replace(/\s+/g,"+");
 url+="&query.bibliographic="+mainWords(r.title);
 if(r.journal){url+="&query.container-title="+r.journal.replace(/\s+/g,"+");};
 url+="&filter=from-pub-date:"+r.year+"-01-01,until-pub-date:"+r.year+"-12-31";
 if(r.journal){url+=",type:journal-article"};
 getFromServer(url,
   function(data)
   {
    var repl,i,res=[];
    try
    {
     repl=JSON.parse(data);
     if(repl.status=="ok")
     {
      for(i=0;i<repl.message.items.length;i++)
      {
       res[i]=this.parseCrossRef(repl.message.items[i]);
      };
     };
     if(res.length)
     {
      this.addToList(res,this.repeatDOICheck);
      this.showReferences();
     };
     if(this.repeatDOICheck)
     {
      this.checkDois();
     }
     else
     {
      app.endProgress();
     };
    }
    catch(e)
    {
     app.alert(e);
     app.endProgress();
    };
   }.bind(this),
   function(err){app.alert(err);app.endProgress();});
};

refApp.prototype.crossRefSearch=function(str,year)
{
 var url="https://api.crossref.org/works?";
// if(onAServer()){url="crossref.php?";};
 str="query.bibliographic="+str.replace(/\s+/g,"+");
 if(year){str+="&filter=from-pub-date:"+year+"-01-01,until-pub-date:"+year+"-12-31";};
 str+="&rows=5";
 app.createProgress("Searching Crossref...");
 getFromServer(url+str,
   function(data)
   {
    var repl,i,res=[];
    try
    {
     app.endProgress();
     repl=JSON.parse(data);
     if(repl.status!="ok"){return;};
     for(i=0;i<repl.message.items.length;i++)
     {
      res[i]=this.parseCrossRef(repl.message.items[i]);
      if(i==0){res[i].selected=true;};
     };
     if(res.length)
     {
      this.addToList(res);
      this.showReferences(res[0]);
     }
     else
     {
      app.alert("No references found");
     };
    }
    catch(e)
    {
     app.endProgress();
     app.alert(e);
    };
   }.bind(this),
   function(err){app.alert(err);app.endProgress();});
};

refApp.prototype.crossRefAuthorSearch=function(str,year)
{
 var url="https://api.crossref.org/works?";
// if(onAServer()){url="crossref.php?";};
 str="query.author="+str.replace(/\s+/g,"+");
 if(year){str+="&filter=from-pub-date:"+year+"-01-01,until-pub-date:"+year+"-12-31";};
 str+="&rows=5";
 app.createProgress("Searching Crossref...");
 getFromServer(url+str,
   function(data)
   {
    var repl,i,res=[];
    try
    {
     repl=JSON.parse(data);
     if(repl.status=="ok")
     {
      for(i=0;i<repl.message.items.length;i++)
      {
       res[i]=this.parseCrossRef(repl.message.items[i]);
      };
     };
     if(res.length)
     {
      this.addToList(res);
      this.showReferences();
     };
     app.endProgress();
    }
    catch(e)
    {
     app.alert(e);
     app.endProgress();
    };
   }.bind(this),
   function(err){app.alert(err);app.endProgress();});
};


refApp.prototype.doSearch=function()
{
 var url,ar,str;
 this.searchSpec.refillContainer();
 if(!this.search.append)
 {
  this.listSpec.emptyContainer();
  this.list.length=0;
  this.index={}
  this.doiIndex={};
  this.listSpec.fillContainer();
 };
 if(this.search.text||this.search.year)
 {
  if(this.search.text.indexOf(" ")!=-1)
  {
   ar=this.search.text.replace(/[.,(){}]/g," ").split(/\s+/);
   str=ar.join(" ");
  }
  else
  {
   str=this.doi(this.search.text);
   ar=[str];
  };
  if(onAServer())
  {
  app.createProgress("Searching database...");
  putToServer("db_ref_app.php",
   JSON.stringify({"action":"search","search":str,"year":this.search.year}),
   function(data){
    var refs,r;
    try
    {
     refs=JSON.parse(data).refs;
    }
    catch(e)
    {
     app.endProgress();
     app.alert(e);
     return;
    };
    app.endProgress();
    if(refs.length)
    {
     this.addToList(refs);
     this.showReferences();
    }
    else
    {
     if(ar.length>3)
     {
      this.crossRefSearch(str,this.search.year);
     }
     else
     {
      if((ar.length==1)&&(ar[0].replace(/[0-9]/g,'')!=ar[0]))
      {
       app.createProgress("Getting data from Crossref...");
   	   this.crossRefDoiInfo(ar[0]);
      }
      else
      {
       if(this.search.year)
       {
        app.createProgress("Getting data from Crossref...");
   	    this.crossRefAuthorSearch(str,this.search.year);
       }
       else
       {
        app.alert("No references found");
       };
      };
     };
    };
   }.bind(this),
   function(err){app.endProgress();app.alert(err);});
  }
  else
  {
     if(ar.length>3)
     {
      this.crossRefSearch(str,this.search.year);
     }
     else
     {
      if((ar.length==1)&&(ar[0].replace(/[0-9]/g,'')!=ar[0]))
      {
       app.createProgress("Getting data from Crossref...");
   	   this.crossRefDoiInfo(ar[0]);
      }
      else
      {
       if(this.search.year)
       {
        app.createProgress("Getting data from Crossref...");
   	    this.crossRefAuthorSearch(str,this.search.year);
       }
       else
       {
        app.alert("No references found");
       };
      };
     };
  };
 };
};

refApp.prototype.checkDois=function(fromDoi)
{
 var i,srch=false;
 if(this.checkingDois){return;};
 this.listSpec.emptyContainer();
 if(this.repeatDOICheck)
 {
  if(this.actionPos>this.list.length)
  {
   if(window.parent && window.parent.app && window.parent.app.options.bib_update_content)
   {
    this.updateReferences(window.parent.app,window.parent.app.options.bib_update_content);
   };
   app.endProgress();
   this.repeatDOICheck=false;
   this.actionPos=0;
   return;
  };
 }
 else
 {
  this.actionPos=0;
 };
 for(this.actionPos;this.actionPos<this.list.length;this.actionPos++)
 {
  i=this.actionPos;
  if(fromDoi)
  {
   if(this.list[i].doi && !this.list[i].ref)
   {
    srch=this.list[i];this.actionPos++;break;
   };
  }
  else
  {
   if(this.list[i].selected && !this.list[i].doi && (this.list[i].reftype=="article"))
   {
    srch=this.list[i];this.actionPos++;break;
   };
   this.list[i].selected=false;
  };
 };
 if(srch)
 {
  this.list[i].selected=false;
  if(!this.repeatDOICheck)
  {
   this.repeatDOICheck=true;
   app.createProgress("Getting data from Crossref...",
    function(){this.repeatDOICheck=false;app.endProgress();this.actionPos=0;}.bind(this),
    (100*this.actionPos/this.list.length));
  }
  else
  {
   app.updateProgress(100*this.actionPos/this.list.length);
  };
  if(fromDoi)
  {
   this.crossRefDoiInfo(srch.doi)
  }
  else
  {
   this.crossRefFind(srch);
  };
 }
 else
 {
  if(window.parent && window.parent.app && window.parent.app.options.bib_update_content)
  {
   if(this.saveListIfNeeded())
   {
    this.updateReferences(window.parent.app,window.parent.app.options.bib_update_content);
   };
  };
  app.endProgress();
  this.repeatDOICheck=false;
  this.actionPos=0;
 };
 this.listSpec.fillContainer();
};

refApp.prototype.checkRefs=function(checkDOI)
{
 var i,cnt=0;
 if(this.list.length==0){return;};
 if(!onAServer())
 {
  this.listSpec.emptyContainer();
  for(i=0;i<this.list.length;i++)
  {
   if(this.list[i].ref && (this.list[i].doi=="") && (this.list[i].citation=="") && (this.list[i].reference==""))
   {
    this.list[i].citation=this.list[i].ref;
    this.list[i].reference="Information not available";
    this.list[i].changed=true;
   };
  };
  this.listSpec.fillContainer();
  this.checkDois(true);
  return;
 };
 // see how many reference strings are missing
 for(i=0;i<this.list.length;i++)
 {
  if((this.list[i].ref || this.list[i].doi) && !this.list[i].reference){cnt++;};
 };
 if(!cnt){return;}; // no need to check
 app.createProgress("Checking references...");
 putToServer("db_ref_app.php",
   JSON.stringify({"action":"check","refs":this.list}),
   function(data){
    var refs,i,str="",rpl;
    try
    {
     rpl=JSON.parse(data);
     refs=rpl.refs;
    }
    catch(e)
    {
     app.endProgress();
     app.alert(e);
     return;
    };
    this.listSpec.emptyContainer();
    this.list=refs;
    this.listSpec.object=refs;
    this.listSpec.fillContainer();
    this.indexReferences();
    this.showReferences();
    app.endProgress();    
    if(!this.repeatDOICheck)
    {
     this.checkDois(!checkDOI);
    };
   }.bind(this),
   function(err){app.endProgress();app.alert(err);});
};

refApp.prototype.reloadRefs=function()
{
 var i;
 for(i in this.list)
 {
  this.list[i].reference="";
 };
 this.checkRefs(false);
};

refApp.prototype.refToBibtex=function(ref)
{
 function strtrimbraces(s) 
 { 
  if(!s.replace){return s;};
  return s.replace(/^\{+/,'').replace(/\}+$/,''); 
 };
 var str="",i;
 if(ref.reftype && ref.title && ref.year && ref.firstauthor && ref.ref)
 {
  str+="@"+ref.reftype+"{"+ref.ref;
  for(i=0;i<this.bibtexData.length;i++)
  {
   if(!ref[this.bibtexData[i].field]){continue;};
   switch(this.bibtexData[i].field)
   {
   case "pages":
    str+=",\n pages={"+ref.pages+"}";
    break
   case "author":
   case "editor":
    str+=",\n "+this.bibtexData[i].field+"={"+this.formatAuthors(ref[this.bibtexData[i].field])+"}";
    break;
   case "title":
    str+=",\n "+this.bibtexData[i].field+"={{"+strtrimbraces(ref[this.bibtexData[i].field])+"}}";
    break;
   default:
    str+=",\n "+this.bibtexData[i].field+"={"+strtrimbraces(ref[this.bibtexData[i].field])+"}";
    break;
   };
  };
  str+="\n}\n";
 };
 return str;
};

refApp.prototype.listToBibtex=function(list,all)
{
 var str="",i,done=false;
 this.listSpec.refillContainer();
 for(i in list)
 {
  if(list[i].selected || all)
  {
   str+=this.refToBibtex(list[i]);
   done=true;
  };
 };
 if(!done && !all){return this.listToBibtex(list,true);};
 return str;
};

refApp.prototype.bibtexToList=function(b)
{
 var entries,e,ff,f,gg,g,hh,h,o,i,end="}",res;
 var list=[];
 entries=b.split("@");
 for(e in entries)
 {
  if(entries[e].indexOf("{")!=-1)
  {
   o={"reftype":entries[e].slice(0,entries[e].indexOf("{")).replace(/\s/g,"").toLowerCase(),"created":true};
   entries[e]=entries[e].slice(entries[e].indexOf("{")+1);
   if((entries[e].indexOf(",")!=-1)&&(entries[e].lastIndexOf("}")!=-1))
   {
    entries[e]=entries[e].slice(entries[e].indexOf(","),entries[e].lastIndexOf("}"));
    ff=entries[e].split(/=\s*{/);
    if(ff.length==1)
    {
     ff=entries[e].split(/=\s*"/);
     end='"';
    };
    gg=[];hh=[];
    for(f=0;f<ff.length;f++)
    {
     if(ff[f].lastIndexOf(end)!=-1)
     {
      g=ff[f].slice(0,ff[f].lastIndexOf(end));
      gg.push(g);
      // check for numerical valuse without "" or {}
      res=ff[f].slice(ff[f].lastIndexOf(end));
      if(res.indexOf('=')!=-1)
      {
       ff.splice(f+1,0,ff[f].slice(ff[f].indexOf('=')+1).replace(",",end+","));
       ff[f]=ff[f].slice(0,ff[f].indexOf('='));
      };
     };
     if(ff[f].lastIndexOf(",")>ff[f].lastIndexOf(end))
     {
      h=ff[f].slice(ff[f].lastIndexOf(",")+1).replace(/\s/g,"");
      hh.push(h);
     };
    };
    for(i=0;(i<hh.length) && (i<gg.length);i++)
    {
     hh[i]=hh[i].toLowerCase();
     switch(hh[i])
     {
     case "abstract":case "keywords":
      break;
     case "edition":case "chapter": case "year":
      o[hh[i]]=Number(gg[i]);
      break;
     case "doi":
      o[hh[i]]=this.doi(gg[i]);
      break;
     default:
      while((gg[i].indexOf("{")==0) && (gg[i].lastIndexOf("}")>0))
      {
       gg[i]=gg[i].slice(1,gg[i].lastIndexOf("}"));
      };
      o[hh[i]]=gg[i];
      break;
     };
    };
   };
   this.citation(o);
   this.reference(o);
   this.bibtexCitation(o);
   list.push(o);
  };
 };
 return list;
};

refApp.prototype.listToDOIs=function(ar,all)
{
 var i,txt="";
 for(i in ar)
 {
  if(ar[i].doi && (ar[i].selected || all))
  {
   txt+=ar[i].doi+"\n";
  };
 };
 if(!txt && !all){return this.listToDOIs(ar,true);};
 return txt;
};

refApp.prototype.DOIsToList=function(txt)
{
 var i,ar=txt.split("\n"),res=[];
 for(i in ar)
 {
  if(ar[i])
  {
   ar[i]=this.doi(ar[i]);
   res.push({"doi":ar[i],"citation":"doi:"+ar[i],"reftype":"article","created":true});
  };
 };
 return res;
};

refApp.prototype.importText=function()
{
 var b;
 b=this.exchange.value;
 if((b.indexOf("{")!=-1)&&(b.indexOf("{")!=-1)&&(b.indexOf("{")!=-1))
 {
  this.exchangeType="BibTeX";
 };
 if((b.indexOf("{")==-1)&&(b.indexOf("{")==-1)&&(b.indexOf("{")==-1))
 {
  this.exchangeType="DOIs";
 };
 switch(this.exchangeType)
 {
 case "BibTeX":
  this.addToList(this.bibtexToList(b));
  break;
 case "DOIs":
  this.addToList(this.DOIsToList(b));
  break;
 };
 this.showReferences();
 if(this.exchangeType=="DOIs")
 {
  this.checkRefs();
 };
};

refApp.prototype.exportText=function(opt)
{
 switch(opt)
 {
 case "BibTeX":
 case "DOIs":
  this.exchangeType=opt;
  break;
 case "All":
 case "Selected":
  this.exchangeAll=(opt=="All");
  break;
 };
 switch(this.exchangeType)
 {
 case "BibTeX":
  this.exchange.value=this.listToBibtex(this.list,this.exchangeAll);
  break;
 case "DOIs":
  this.exchange.value=this.listToDOIs(this.list,this.exchangeAll);
  break;
 };
};

refApp.prototype.downloadText=function()
{
 var text=this.exchange.value;
 var filename="Refs.";
 switch(this.exchangeType)
 {
 case "BibTeX":
  filename+="bib";
  break;
 default:
  filename+="txt";
  break;
 };
 var pom = document.createElement('a');
 pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
 pom.setAttribute('download', filename);
 if(document.createEvent) 
 {
  var event = document.createEvent('MouseEvents');
  event.initEvent('click', true, true);
  pom.dispatchEvent(event);
 }
 else 
 {
  pom.click();
 };
};

refApp.prototype.showReference=function(s)
{
 this.ref=JSON.parse(JSON.stringify(s.parent.object));
 app.reloadFrame(app.frameIndex("Reference"));
 this.refSpec=this.genRefSpec(this.ref);
 this.refSpec.changed=this.ref.changed;
 document.getElementById("refArea").appendChild(this.refSpec.createDisplay(this.ref));
 app.selectFrame("Reference");
};

refApp.prototype.showReferences=function(ref)
{
 if(ref)
 {
  this.ref=JSON.parse(JSON.stringify(ref));
 }
 else
 {
  if(this.list.length)
  {
   this.ref=JSON.parse(JSON.stringify(this.list[0]));
  };
 };
 this.refSpec=this.genRefSpec(this.ref);
 app.reloadFrame("List");
 app.reloadFrame("Reference");
 document.getElementById("listArea").appendChild(this.listSpec.createDisplay(this.list));   
 document.getElementById("refArea").appendChild(this.refSpec.createDisplay(this.ref));
 app.reloadFrame("Display");
 if((this.list.length==1)||ref)
 {
  app.selectFrame("Reference");
 }
 else
 {
  app.selectFrame("List");
 };
 this.exportText("All");
};

refApp.prototype.sortList=function()
{
 this.listSpec.emptyContainer();
 switch(this.ind)
 {
 case 'author':
  this.list.sort(function(a,b){
   if(a.firstauthor==b.firstauthor)
   {
    return a.year-b.year;
   };
   return a.firstauthor.localeCompare(b.firstauthor, undefined, {sensitivity: 'base'});
  });
  break;
 case 'year':
  this.list.sort(function(a,b){
   if(a.year==b.year)
   {
    return a.firstauthor.localeCompare(b.firstauthor, undefined, {sensitivity: 'base'});
   };
   if(ref.reverse){return b.year-a.year;}else{return a.year-b.year;};
  });
  break;
 };
 this.listSpec.fillContainer();
};

refApp.prototype.indexReferences=function()
{
 var i,r;
 this.index={};this.doiIndex={};
 for(i in this.list)
 {
  if(r=this.list[i].ref)
  {
   this.index[r]=this.list[i];
  };
  if(r=this.list[i].doi)
  {
   this.doiIndex[r]=this.list[i];
  };
 };
 this.sortList();
};

refApp.prototype.addToList=function(ar,noadd)
{
 var i,j,r;
 this.listSpec.emptyContainer();
 for(i in ar)
 {
  if((r=this.index[ar[i].ref]) || (r=this.doiIndex[ar[i].doi]))
  {
   for(j in this.bibtexFields)
   {
    if(!r[j] && ar[i][j])
    {
     r[j]=ar[i][j];
     r.changed=true;
     r.selected=true;
    };
   };
   for(j in {"ref":true,"reference":true,"citation":true})
   {
    if(!r[j] && ar[i][j])
    {
     r[j]=ar[i][j];
     r.changed=true;
     r.selected=true;
    };
   };
   if(r.changed)
   {
    if((r.citation.indexOf("doi:")==0)||(r.citation==r.ref)){r.citation=ar[i].citation;};
   };
  }
  else
  {
   if(noadd){continue;};
   if(ar[i].ref){this.index[ar[i].ref]=ar[i];};
   if(ar[i].doi){this.doiIndex[ar[i].doi]=ar[i];};
   ar[i].selected=true;
   this.list.push(ar[i]);
  };
 };
 this.listSpec.fillContainer();
 if(!noadd)
 {
  this.sortList();
 };
};

refApp.prototype.getReferences=function()
{
 var bib;
 if(window.parent && window.parent.app && window.parent.app.options.bib_get_content)
 {
  parent.app.safeEval(window.parent.app.options.bib_get_content);
  bib=JSON.parse(window.parent.app.bibliography)
  this.list=bib.list;
  this.showReferences();
  if(bib.view){app.selectFrame(bib.view);};
 };
};

refApp.prototype.updateReferences=function(a,f)
{
 if(!this.updatingRefs)
 {
  this.updatingRefs=true;
  a.bibliography=JSON.stringify({"finished":this.finished,"list":this.list});
  a.safeEval(f);
  this.updatingRefs=false;
 }
};

refApp.prototype.setReferences=function()
{
 var ret,i,j,k,found,selref=false,ll;
 for(j in this.list)
 {
  if(this.list[j].selected){selref=this.list[j];break;};
 };
 if(window.parent && window.parent.app && window.parent.app.options.bib_set_content)
 {
  this.updateReferences(window.parent.app,window.parent.app.options.bib_set_content);
  this.getReferences();
  return;
 };
 if(window.opener)
 {
  if(selref && window.opener.refSpec)
  {
   ll=window.opener.refSpec.object;
   ll.ref=selref.ref;
   ll.firstauthor=selref.firstauthor;
   ll.title=selref.title;
   ll.year=selref.year;
   ll.citation=selref.citation;
   ll.changed=true;
   window.opener.refSpec.changed=true;
   window.close();
  }
  else
  {
   if(window.opener.addRefList)
   {
    window.opener.addRefList(JSON.stringify(this.list));
    window.close();
   };
  };
 };
};

refApp.prototype.saveListIfNeeded=function()
{
 var i;
 for(i=0;i<this.list.length;i++)
 {
  if(this.list[i].created || this.list[i].changed)
  {
   this.saveList();
   return true;
  };
 };
 return false;
};

refApp.prototype.saveList=function(finished)
{
 this.listSpec.refillContainer();
 if(finished){this.finished=true;};
 if(!onAServer())
 {
  this.setReferences();
  return;
 };
 login.logged_in()
 .then(function(ok){
  if(ok)
  {
   app.createProgress("Saving references...");
   putToServer("db_ref_app.php",
    JSON.stringify({"action":"save","refs":this.list}),
    function(data){
     var refs;
     try
     {
      refs=JSON.parse(data).refs;
     }
     catch(e)
     {
      app.endProgress();
      app.alert(e);
      return;
     };
     this.listSpec.emptyContainer();
     this.list=refs;
     this.listSpec.object=refs;
     this.listSpec.fillContainer();
     this.indexReferences();
     this.showReferences();
     app.endProgress();
     if(finished)
     {
      this.setReferences();
     };
    }.bind(this),
    function(err){app.endProgress();/*leave to later*/});
  }
  else
  {
   login.login('login');
  };
 }.bind(this))
 .catch(function(e){if(e!="overwritten"){app.alert(e)};});
};

refApp.prototype.okList=function()
{
 this.saveList(true);
};

refApp.prototype.newRef=function()
{
 this.ref={};
 app.reloadFrame("Reference");
 this.refSpec=this.genRefSpec(this.ref);
 document.getElementById("refArea").appendChild(this.refSpec.createDisplay(this.ref));
 app.selectFrame("Reference");
};

refApp.prototype.saveRef=function(sel)
{
 var i,r,done=false;
 this.refSpec.emptyContainer();
 this.listSpec.emptyContainer();
 for(i in this.list)
 {
  if(this.ref.ref==this.list[i].ref)
  {
   if(this.ref.created && !this.list[i].created)
   {
    this.ref.created=undefined;
    this.ref.changed=true;
   };
   if(this.ref.created || this.ref.changed)
   {
    this.ref.selected=true;
    r=JSON.parse(JSON.stringify(this.ref));
    this.list[i]=r;
    this.index[this.ref.ref]=r;
    if(r.doi){this.doiIndex[r.doi]=r;};
   }
   else
   {
    this.list[i].selected=true;
   };
   done=true;
  }
  else
  {
   if(sel)
   {
    this.list[i].selected=false;
   };
  };
 };
 if(!done)
 {
  this.ref.created=true;
  this.ref.selected=true;
  r=JSON.parse(JSON.stringify(this.ref));
  this.list.push(r);
  this.index[this.ref.ref]=r;
  if(r.doi){this.doiIndex[r.doi]=r;};
 };
 this.listSpec.fillContainer();
 this.refSpec.fillContainer();
 if(sel)
 {
  this.okList();
 }
 else
 {
  app.selectFrame("List");
  this.saveList();
 };
};

refApp.prototype.okRef=function()
{
 this.saveRef(true);
};

refApp.prototype.cancel=function()
{
 if(window.parent && window.parent.app && window.parent.app.options.bib_set_content)
 {
  window.parent.app.bibliography=JSON.stringify({"finished":true,"list":[]});
  parent.app.safeEval(window.parent.app.options.bib_set_content);
 };
 if(window.opener)
 {
  window.close();
 };
};

refApp.prototype.indexBibtex=function()
{
 var i;
 for(i=0;i<this.elements.length;i++)
 {
  this.bibtexFields[this.elements[i]]=true;
 };
};

refApp.prototype.sortBy=function(ind,context)
{
 if(ind==this.ind)
 {
  this.reverse=!this.reverse;
 };
 this.ind=ind;
 this.sortList();
 if(context=='display'){ app.reloadFrame("Display");};
};

refApp.prototype.initialise=function()
{
 var t,bib=false;
 this.bibtexData=data;
 this.indexBibtex();
 data=false;
 if(window.parent && window.parent.app && window.parent.app.options.bib_get_content)
 {
  parent.app.safeEval(window.parent.app.options.bib_get_content);
  bib=JSON.parse(window.parent.app.bibliography);
  this.list=bib.list;
 };
 if(window.opener && window.opener.refSpec && window.opener.refSpec.object.ref)
 {
  this.list=[JSON.parse(window.opener.JSON.stringify(window.opener.refSpec.object))];
 };
 if(app.getArgs().ref && (app.getArgs().ref!="undefined"))
 {
  this.list=[{"ref":app.getArgs().ref}];
 };
 this.exchange=document.createElement("textarea");
 this.exchange.style="position:fixed;left:0px;top:0px;border:none;width:95%;height:85%;padding:70px 2.5% 40px 2.5%";
 document.getElementById("exchangeArea").appendChild(this.exchange); 
 document.getElementById("searchArea").appendChild(this.searchSpec.createDisplay(this.search));   
 document.getElementById("listArea").appendChild(this.listSpec.createDisplay(this.list));   
 this.refSpec=this.genRefSpec(this.ref);
 document.getElementById("refArea").appendChild(this.refSpec.createDisplay(this.ref)); 
 if(this.list.length)
 {
  this.indexReferences();
  this.showReferences();
  this.checkRefs(false);
 }
 else
 {
  app.selectFrame("Search");
 };
};

(function () {
 ref=new refApp();
})();
