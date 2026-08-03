 var ocd=parent.oxcal.ocd;
 var calib=parent.oxcal.calib;
 var plotOptions=parent.oxcal.plotOptions;
 parent.oxcal.tableWindow=window;
 parent.oxcal.tableContent="";
 var oct=new Array();
 
 function clearCsv()
 {
  parent.oxcal.tableContent="";
 };
 
 function addToCsv(item)
 {
  switch(typeof(item))
  {
  case "string":
   parent.oxcal.tableContent+='"'+item+'"'+',';
   break;
  default:
   parent.oxcal.tableContent+=item+',';
   break;
  };
 };
 
 function skipCsv(no)
 {
  var i;
  for(i=0;i<no;i++){parent.oxcal.tableContent+=',';};
 };
 
 function endCsv()
 {
  parent.oxcal.tableContent+='\n';
 };
 
 function makeVisible(i,vis)
 {
  var j,st;
  if(vis)
  {
   st="table-row";
   oct[i].tableRow.style.display=st;
   if(oct[i].errorRow)
   {
    oct[i].errorRow.style.display=st;
   };
  }
  else
  {
   oct[i].tableRow.style.display="none";
   if(oct[i].errorRow)
   {
    oct[i].errorRow.style.display="none";
   };
  };
  ocd[i].hidden=!vis;
  if(!ocd[i].collapsed)
  {
   for(j=0;j<ocd[i].children.length;j++)
   {
    makeVisible(ocd[i].children[j],vis);
   };
  };
 };
 
 function containsStructure(i)
 {
  var j;
  for(j=0;j<ocd[i].children.length;j++)
  {
   if(ocd[ocd[i].children[j]].children.length)
   {
    if((ocd[ocd[i].children[j]].op=="Calculate")||(ocd[ocd[i].children[j]].op=="Interval"))
    {
    }
    else
    {
     return true;
    };
   };
  };
  return false;
 };
 
 function expand(i,propagate)
 {
  var vis,j;
  ocd[i].collapsed=!(ocd[i].collapsed);
  vis=!(ocd[i].collapsed);
  if(i)
  {
   if(vis)
   {
    if(plotOptions.showReversed)
    {
     oct[i].tableExpand.firstChild.className="up";
    }
    else
    {
     oct[i].tableExpand.firstChild.className="down";
    };
   }
   else
   {
    oct[i].tableExpand.firstChild.className="right";
   };
  };
  for(j=0;j<ocd[i].children.length;j++)
  {
   if(ocd[ocd[i].children[j]].level)
   {
    makeVisible(ocd[i].children[j],vis);
   };
   if(propagate && ((propagate != "structure")||(containsStructure(ocd[i].children[j]))))
   {
    if(ocd[ocd[i].children[j]].children.length)
    {
     if(ocd[i].collapsed!=ocd[ocd[i].children[j]].collapsed)
     {
      expand(ocd[i].children[j],propagate);
     };
    };
   };
  };
 };
 
 function expandAll(i)
 {
  expand(i,true);
 };
 
 function showSelectNo(i)
 {
  var s,txt="";
  if(!oct[i]){return;};
  s=oct[i].tableSelectNo;
  if(ocd[i].selectNo)
  {
   txt+=ocd[i].selectNo;
  };
  txt=document.createTextNode(txt);
  if(s.firstChild)
  {
   s.replaceChild(txt,s.firstChild);
  }
  else
  {
   s.appendChild(txt);
  };
 };
 
 function showAllSelectNo()
 {
  parent.sortSelection()
  for(i=0;i<oct.length;i++)
  {
   showSelectNo(i);
  };
 };
 
 function checkSelect(i)
 {
  if(oct[i].tableSelect.checked)
  {
   parent.oxcal.selectNo++;
   ocd[i].selectNo=parent.oxcal.selectNo;
  }
  else
  {
   if((ocd[i].selectNo==parent.oxcal.selectNo)&&(parent.oxcal.selectNo))
   {
    parent.oxcal.selectNo--;
   };
   ocd[i].selectNo=0;
  };
  showSelectNo(i);
 };
  
 function doSelect(i,value)
 {
  if(!oct[i]){return;};
  oct[i].tableSelect.checked=value;
  if(value)
  {
   parent.oxcal.selectNo++;
   ocd[i].selectNo=parent.oxcal.selectNo;
  }
  else
  {
   if((ocd[i].selectNo==parent.oxcal.selectNo)&&(parent.oxcal.selectNo))
   {
    parent.oxcal.selectNo--;
   };
   ocd[i].selectNo=0;
  };
  showSelectNo(i);
 };
 
 function checkGroup(i,value)
 {
  var j;
  doSelect(i,value);
  for(j=0;j<ocd[i].children.length;j++)
  {
   if(!ocd[ocd[i].children[j]].hidden)
   {
    checkGroup(ocd[i].children[j],value);
   };
  };
 };

 
 function checkNewPage(i)
 {
  ocd[i].newPage=oct[i].tableNewPage.checked;
 };
 
 function showAll()
 {
  expandAll(0);
 };
 
 function showStructure()
 {
  ocd[0].collapsed=false;
  expandAll(0);  
  expand(0,"structure");
};
 
 function selectAll()
 {
  var si,i;
  var tovalue=true;
  var this_is_first=true;
  parent.oxcal.selectNo=0;
  for(i=1;i<ocd.length;i++)
  {
   if(!ocd[i]){continue;};
   if(this_is_first)
   {
    si=oct[i].tableSelect;
    if(si)
    {
     if(this_is_first && si.checked){tovalue=false;this_is_first=false;};
     doSelect(i,tovalue);
    };
   }
   else
   {
    doSelect(i,tovalue);
   };
  };
 };
 
 function selectVisible()
 {
  var si,i,j;
  var tovalue=true;
  parent.oxcal.selectNo=0;
  for(i=1;i<ocd.length;i++)
  {
   if(!ocd[i]){continue;};
   doSelect(i,!ocd[i].hidden);
  };
  if(tovalue){parent.oxcal.selectNo=ocd.length;}else{parent.oxcal.selectNo=0;};
 };
 
 function appendText(str,el)
 {
  el.appendChild(document.createTextNode(str));
  return el;
 };
 
 function createTD(str)
 {
  return appendText(str,document.createElement("TD"));
 };

 function createTH(str)
 {
  var th=document.createElement("TH");
  th.className="sticky";
  return appendText(str,th);
 };
 
 function tableRange(d,j,i,k,el)
 {
  var dist,count,m,n,tot,r,intercept,p,td,str;
  if(j==0){dist=ocd[i].likelihood;}else{dist=ocd[i].posterior;};
  if(!plotOptions.showRange[k]){return;};
  intercept=false;p=0;
  if(dist && dist.range && dist.range[k])
  {
   r=simplifyDateRange(dist.range[k],ocd[i].type,plotOptions.showWhole);
   if(r)
   {
    count=r.length;
    for(n=0;n<count;n++)
    {
     p+=r[n][2];
    };
    if(p<2){intercept=true;};
    for(m=0;m<(plotOptions.showWhole?2:3);m++)
    {
     str="";
     td=document.createElement("TD");
     for(n=0;n<count;n++)
     {
      if(m<2)
      {
       if(dist.range[k][n][m]=="...")
       {
        appendText("...",td);
        str+="...";
       }
       else
       {
        appendText(r[n][m],td);
        str+=r[n][m];
        if(n<count-1)
        {
         td.appendChild(document.createElement("BR"));
         str+=";";
        };
       };
      }
      else
      {
       if(intercept)
       {
        appendText(toFixxed((r[n][m]*100),1),td);
        str+=r[n][m]*100;
        if(n<count-1)
        {
         td.appendChild(document.createElement("BR"));
         str+=";";
        };
       }
       else
       {
        appendText(toFixxed((r[n][m]),1),td);
        str+=r[n][m];
        if(n<count-1)
        {
         td.appendChild(document.createElement("BR"));
         str+=";";
        };
       };
      };
     };
     addToCsv(str);
     el.appendChild(td);
    };
    return;
   };
  };
  skipCsv(2);
  el.appendChild(document.createElement("TD"));
  el.appendChild(document.createElement("TD"));
  if(!plotOptions.showWhole)
  {
   skipCsv(1);
   el.appendChild(document.createElement("TD"));
  };
 };
 
 function sumStat(d,j,i,stat,el)
 {
  var str="",td;
  if(j==0){dist=ocd[i].likelihood;}else{dist=ocd[i].posterior;};
  td=document.createElement("TD");
  if(dist && typeof(dist[stat])!='undefined')
  {
   switch(stat)
   {
   case 'sigma':
    if(ocd[i].type=='date')
    {
     str=showDateT(dist[stat],'interval',0);
     addToCsv(str);
     appendText(str,td);
     break;
    };
   default:
    str=showDateT(dist[stat],ocd[i].type,0);
    addToCsv(str);
    appendText(str,td);
    break;
   };
  }
  else
  {
   addToCsv(str); // add blank space
  };
  el.appendChild(td);
 };
 
 function goRawData()
 {
  parent.oxcal.rawData(this.ind);
 };

 function goPlotData()
 {
  parent.oxcal.goPlotData(this.ind);
 };
 
 function doExpand()
 {
  expand(this.ind);
 };
 
 function doExpandAll()
 {
  expandAll(this.ind);
 };
 
 function doCheckSelect()
 {
  checkSelect(this.ind);
 };
 
 function doCheckGroup()
 {
  checkGroup(this.ind,!oct[this.ind].tableSelect.checked);
  showAllSelectNo();
 };
 
 function doCheckNewPage()
 {
  checkNewPage(this.ind);
 };

 function doEditItem()
 {
  parent.oxcal.editPlotItem(this.ind);
 };
 
 function for_start(){if(!plotOptions.showReversed){return 1;};return ocd.length-1;};
 function for_test(i){if(!plotOptions.showReversed){return i<ocd.length;};return i>0;};
 function for_next(i){if(!plotOptions.showReversed){return i+1;};return i-1;};
 function raw(error)
 {
  var d,dd,ddd;
  d=document.createElement("DIV");
  d.className="objFile";
  dd=document.createElement("DIV");
  dd.className="file";
  d.appendChild(dd);
  ddd=document.createElement("DIV");
  ddd.className="text";
  dd.appendChild(ddd);
  if(error){dd.style.borderColor="red";};
  return d;
 };
 function control(typ)
 {
  var d,dd;
  d=document.createElement("DIV");
  d.className="objIcon";
  if(typ)
  {
   dd=document.createElement("DIV");
   dd.className=typ;
   d.appendChild(dd);
  };
  return d;
};
 
 function drawTable()
 {
  var rangeColumns;
  var units,str,sty,sub;
  var odd=true;
  var i,j,k,d,tab,tb,th,tr,td,sb,img,sd,prop,props=[0,68.3,95.4,99.7];
  switch(plotOptions.reportingStyle)
  {
  case 0:
   units="(BP)";break;
  case 1:
   units="(BC/AD)";break;
  case 2:
   units="(BCE/CE)";break;
  case 3:
   units="(\u00B1CE)";break;
  case 4:
   units="(G)";break;
  default:
   units="";
  };
  rangeColumns=0;
  for(k=1;k<4;k++){if(plotOptions.showRange[k])
  {
   if(plotOptions.showWhole){rangeColumns+=2;}else{rangeColumns+=3;};
  };};
  if(plotOptions.showMean){rangeColumns+=1;};
  if(plotOptions.showSigma){rangeColumns+=1;};
  if(plotOptions.showMedian){rangeColumns+=1;};
  if(rangeColumns==0){rangeColumns=1;};
  // if no data return
  if(!ocd[0]){return;};
  d=document;
  clearCsv();
  tab=document.createElement("TABLE");
  tab.className='param';
  th=document.createElement("THEAD");
  th.id='th';
  tb=document.createElement("TBODY");
  tb.id='tb';
  tr=document.createElement("TR");
  tr.className='header';
  td=document.createElement("TH");
  appendText("Name",td);
  tr.appendChild(td);
  addToCsv("Name");
  if(parent.oxcal.showControls)
  {
   td=document.createElement("TH");
   tr.appendChild(td);
  };
  if(!parent.oxcal.tableDrawn)
  {
   ocd[0].children=new Array();
  };
  if(plotOptions.showLikelihood)
  {
   td=document.createElement("TH");
   td.colSpan=rangeColumns;
   appendText("Unmodelled "+units,td);
   addToCsv("Unmodelled "+units);skipCsv(rangeColumns-1);
   tr.appendChild(td);
  };
  if(plotOptions.showPosterior)
  {
   td=document.createElement("TH");
   td.colSpan=rangeColumns;
   appendText("Modelled "+units,td);
   addToCsv("Modelled "+units);skipCsv(rangeColumns-1);
   tr.appendChild(td);
  };
  if(plotOptions.showIndices)
  {
   td=document.createElement("TH");
   td.colSpan=5;
   appendText("Indices",td);
   str="Indices"
   if(ocd[0].posterior.modelAgreement)
   {
    td.appendChild(document.createElement("BR"));
    appendText("A",td);
    sb=document.createElement("SUB");
    appendText("model",sb);
    td.appendChild(sb);
    appendText("="+ocd[0].posterior.modelAgreement,td);
    str+="\nAmodel "+ocd[0].posterior.modelAgreement;
   };
   if(ocd[0].posterior.overallAgreement)
   {
    td.appendChild(document.createElement("BR"));
    appendText("A",td);
    sb=document.createElement("SUB");
    appendText("overall",sb);
    td.appendChild(sb);
    appendText("="+ocd[0].posterior.overallAgreement,td);
    str+="\nAoverall "+ocd[0].posterior.overallAgreement;
   };
   tr.appendChild(td);
   addToCsv(str);
  };
  if(parent.oxcal.showControls)
  {
   td=document.createElement("TH");
   td.colSpan=3;
   appendText("Controls",td);
   tr.appendChild(td);
  }
  th.appendChild(tr);
  endCsv();
  tr=document.createElement("TR");
  tr.className="header";
  tr.appendChild(createTH(""));
  skipCsv(1);
  if(parent.oxcal.showControls)
  {
   td=document.createElement("TH");
   td.className="sticky";
   td.ind=0;
   if(parent.oxcal.showControls)
   {
    td.onclick=goRawData;
    img=raw((ocd[0].likelihood && ocd[0].likelihood.warning)||(ocd[0].posterior && ocd[0].posterior.warning));
    td.appendChild(img);
   };
   tr.appendChild(td);
  };
  for(j=0;j<2;j++)
  {
   if((j==0)&&(!plotOptions.showLikelihood)){continue;};
   if((j==1)&&(!plotOptions.showPosterior)){continue;};
   if(plotOptions.showMean){tr.appendChild(createTH("\u03BC"));addToCsv("mu");};
   if(plotOptions.showSigma){tr.appendChild(createTH("\u03C3"));addToCsv("sigma");};
   if(plotOptions.showMedian){tr.appendChild(createTH("m"));addToCsv("median");};
   if(rangeColumns==1)
   {
    tr.appendChild(createTH(""));
    skipCsv(1);
   };
   for(k=1;k<4;k++)
   {
    if(plotOptions.showRange[k])
    {
     prop=props[k];
     if(plotOptions.showWhole)
     {
      addToCsv(("from_"+prop).replace(".","_"));addToCsv(("to_"+prop).replace(".","_"));
      tr.appendChild(createTH("from_"+prop));
      tr.appendChild(createTH("to_"+prop));
     }
     else
     {
      addToCsv(("from_"+prop).replace(".","_"));addToCsv(("to_"+prop).replace(".","_"));
      tr.appendChild(createTH("from"));
      tr.appendChild(createTH("to"));
      tr.appendChild(createTH("%"));
      addToCsv("pc_range");
     };
    };
   };
  };
  if(plotOptions.showIndices)
  {
   td=createTH("A");
   sb=document.createElement("SUB");
   appendText("comb",sb);
   td.appendChild(sb);
   tr.appendChild(td);
   addToCsv("Acomb");
   tr.appendChild(createTH("A"));addToCsv("A");
   tr.appendChild(createTH("L"));addToCsv("L");
   tr.appendChild(createTH("P"));addToCsv("P");
   tr.appendChild(createTH("C"));addToCsv("C");
  };
  if(parent.oxcal.showControls)
  {
   td=createTH("Select");
   tr.appendChild(td);
   td=createTH("Page");
   tr.appendChild(td);
   td=createTH("Edit");
   tr.appendChild(td);
  }
  th.appendChild(tr);
  endCsv();
  i=0;
  if(ocd[i])
  {
   if((ocd[i].likelihood && ocd[i].likelihood.warning)||(ocd[i].posterior && ocd[i].posterior.warning))
   {
    tr=document.createElement("TR");
    tr.className='model';
    tr.appendChild(createTD(""));
    if(parent.oxcal.showControls)
    {
     tr.appendChild(createTD(""));
    };
    if(plotOptions.showLikelihood)
    {
     td=document.createElement("TD");
     td.colSpan=rangeColumns;
     td.className='warning';
     if(ocd[i].likelihood&&ocd[i].likelihood.warning)
     {
      for(j=0;j<ocd[i].likelihood.warning.length;j++)
      {
       if(j>0){td.appendChild(document.createElement("BR"));};
       appendText(ocd[i].likelihood.warning[j],td);
      };
     };
     tr.appendChild(td);
    };
    if(plotOptions.showPosterior)
    {
     td=document.createElement("TD");
     td.colSpan=rangeColumns;
     td.className='warning';
     if(ocd[i].posterior&&ocd[i].posterior.warning)
     {
      for(j=0;j < ocd[i].posterior.warning.length;j++)
      {
       if(j>0){td.appendChild(document.createElement("BR"));};
       appendText(ocd[i].posterior.warning[j],td);
      };
     };
     tr.appendChild(td);
    };
    if(plotOptions.showIndices)
    {
     td=document.createElement("TD");
     td.colSpan=5;
     tr.appendChild(td);
    };
    if(parent.oxcal.showControls)
    {
     td=document.createElement("TD");
     td.colSpan=3;
     tr.appendChild(td);
    };
    tb.appendChild(tr);
   };
  };
  for(i=1;i<ocd.length;i++)
  {
   if(!ocd[i]){continue;};
   if((ocd[i].op=="Calculate")||(ocd[i].op=="Depth_Model")||(ocd[i].hidden))
   {
    ocd[i].collapsed=true;
   };
   if(!parent.oxcal.tableDrawn)
   {
    if(ocd[i].level==0){ocd[0].children.push(i);};
    ocd[i].children=new Array();
    for(j=i+1;j < ocd.length;j++)
    {
     if(!ocd[j]){continue;};
     if(ocd[j].level==ocd[i].level+1)
     {
      ocd[i].children.push(j);
      if(ocd[i].collapsed)
      {
       ocd[j].hidden=true;
      };
     }
     else
     {
      if(ocd[j].level<=ocd[i].level)
      {
       break;
      };
     };
    };
   };
  };
  for(i=for_start();for_test(i);i=for_next(i))
  {
   if(!ocd[i]){continue;};
   oct[i]=new Object();
   sty="";
   tr=document.createElement("TR");
   oct[i].tableRow=tr;
   td=document.createElement("TD");
   img=control();
   td.appendChild(img);
   if(ocd[i].hidden){ tr.style.display='none'; };
   if(ocd[i].children && ocd[i].children.length)
   {
    img.style.width=12*ocd[i].level+"px";
    img.style.height=12+"px";
    tr.className='model';
    if(ocd[i].collapsed)
    {
     img=control("right");
    }
    else
    {
     if(plotOptions.showReversed)
     {
      img=control("up");
     }
     else
     {
      img=control("down");
     };
    };
    img.ind=i;
    img.onclick=doExpand;
    img.ondblclick=doExpandAll;
    oct[i].tableExpand=img;
    td.appendChild(img);
    odd=true;
   }
   else
   {
    img.style.width=12*(ocd[i].level+1)+"px";
    img.style.height=12+"px";
    if(odd)
    {
     tr.className='odd';
    }
    else
    {
     tr.className='even';
    };
   };
   appendText("\xA0",td);
   sub=document.createElement("SPAN");
   sub.className='linked';
   sub.ind=i;
   if(ocd[i].order)
   {
    sub.onclick=goRawData;
   }
   else
   {
    sub.onclick=goPlotData;
   };
   str=parent.oxcal.tidyText(makeTitle(ocd[i]));
   addToCsv(str);
   appendText(str,sub);
   td.appendChild(sub);
   tr.appendChild(td);
   if(parent.oxcal.showControls)
   {
    td=document.createElement("TD");
    td.ind=i;
    td.onclick=goRawData
    img=raw((ocd[i].likelihood && ocd[i].likelihood.warning)||(ocd[i].posterior && ocd[i].posterior.warning));
    td.appendChild(img);
    tr.appendChild(td);
   };
   for(j=0;j<2;j++)
   {
    if((j==0)&&(!plotOptions.showLikelihood)){continue;};
    if((j==1)&&(!plotOptions.showPosterior)){continue;};
    if(rangeColumns==1)
    {
     skipCsv(1);
     tr.appendChild(document.createElement("TD"));
    };
    if(plotOptions.showMean){sumStat(d,j,i,'mean',tr);};
    if(plotOptions.showSigma){sumStat(d,j,i,'sigma',tr);};
    if(plotOptions.showMedian){sumStat(d,j,i,'median',tr);};
    for(k=1;k<4;k++)
    {
     tableRange(d,j,i,k,tr);
    };
   };
   if(plotOptions.showIndices)
   {
     if(ocd[i].likelihood && ocd[i].likelihood.overallAgreement)
     {
      tr.appendChild(createTD(ocd[i].likelihood.overallAgreement));
      addToCsv(ocd[i].likelihood.overallAgreement);
     }else{tr.appendChild(document.createElement("TD"));skipCsv(1);};
     if(ocd[i].posterior && ocd[i].posterior.agreement)
     {
      tr.appendChild(createTD(ocd[i].posterior.agreement));
      addToCsv(ocd[i].posterior.agreement);
     }else{tr.appendChild(document.createElement("TD"));skipCsv(1);};
     if(ocd[i].posterior && ocd[i].posterior.likelihood)
     {
      tr.appendChild(createTD(ocd[i].posterior.likelihood));
      addToCsv(ocd[i].posterior.likelihood);
     }else{tr.appendChild(document.createElement("TD"));skipCsv(1);};
     if(ocd[i].posterior && ocd[i].posterior.probability)
     {
      tr.appendChild(createTD(ocd[i].posterior.probability));
      addToCsv(ocd[i].posterior.probability);
     }else{tr.appendChild(document.createElement("TD"));skipCsv(1);};
     if(ocd[i].posterior && ocd[i].posterior.convergence)
     {
      tr.appendChild(createTD(ocd[i].posterior.convergence));
      addToCsv(ocd[i].posterior.convergence);
     }else{tr.appendChild(document.createElement("TD"));skipCsv(1);};
   };
   if(parent.oxcal.showControls)
   {
    td=document.createElement("TD");
    img=document.createElement("INPUT");
    img.type='checkbox';
    img.ind=i;
    oct[i].tableSelect=img;
    img.onchange=doCheckSelect;
    img.ondblclick=doCheckGroup;
    sub=document.createElement("SUP");
    oct[i].tableSelectNo=sub;
    if(ocd[i].selectNo>0)
    {
     appendText(ocd[i].selectNo,sub);
    };
    td.appendChild(img);
    td.appendChild(sub);
    tr.appendChild(td);
    if(ocd[i].selectNo)
    {
     img.setAttribute('checked','checked');
    };
    td=document.createElement("TD");
    img=document.createElement("INPUT");
    img.type='checkbox';
    img.ind=i;
    oct[i].tableNewPage=img;
    img.onchange=doCheckNewPage;
    td.appendChild(img);
    tr.appendChild(td);
    if(ocd[i].newPage)
    {
     img.setAttribute('checked','checked');
    };
    td=document.createElement("TD");
    img=document.createElement("DIV");
    img.title='Edit';
    img.ind=i;
    img.className='objIcon';
    sd=document.createElement("DIV");
    sd.className="circleCyan";
    if(ocd[i].data && ocd[i].data.color){sd.style.backgroundColor=ocd[i].data.color;};
    img.appendChild(sd);
    sd=document.createElement("DIV");
    sd.className="pencil";
    img.appendChild(sd);
    img.onclick=doEditItem;
    td.appendChild(img);
    tr.appendChild(td);
    if(ocd[i].newPage)
    {
     img.setAttribute('checked','checked');
    };
   };
   tb.appendChild(tr);
   endCsv();
   if((ocd[i].likelihood && ocd[i].likelihood.warning)||(ocd[i].posterior && ocd[i].posterior.warning))
   {
    tr=document.createElement("TR");
    if(ocd[i].hidden){ tr.style.display='none'; };
    oct[i].errorRow=tr;
    if(ocd[i].children && ocd[i].children.length)
    {
     tr.className='model';
    }
    else
    {
     if(odd)
     {
      tr.className='odd';
     }
     else
     {
      tr.className='even';
     };
    };
    tr.appendChild(document.createElement("TD"));
    if(parent.oxcal.showControls)
    {
     tr.appendChild(document.createElement("TD"));
    };
    if(plotOptions.showLikelihood)
    {
     td=document.createElement("TD");
     td.colSpan=rangeColumns;
     td.className='warning';
     if(ocd[i].likelihood&&ocd[i].likelihood.warning)
     {
      for(j=0;j<ocd[i].likelihood.warning.length;j++)
      {
       if(j>0){td.appendChild(document.createElement("BR"));};
       appendText(ocd[i].likelihood.warning[j],td);
      };
     };
     tr.appendChild(td);
    };
    if(plotOptions.showPosterior)
    {
     td=document.createElement("TD");
     td.colSpan=rangeColumns;
     td.className='warning';
     if(ocd[i].posterior&&ocd[i].posterior.warning)
     {
      for(j=0;j<ocd[i].posterior.warning.length;j++)
      {
       if(j>0){td.appendChild(document.createElement("BR"));};
       appendText(ocd[i].posterior.warning[j],td);
      };
     };
     tr.appendChild(td);
    };
    if(plotOptions.showIndices)
    {
     td=document.createElement("TD");
     td.colSpan=5;
     tr.appendChild(td);
    };
    if(parent.oxcal.showControls)
    {
     td=document.createElement("TD");
     td.colSpan=3;
     tr.appendChild(td);
    };
    tb.appendChild(tr);
   };
   odd=!odd;
  };
  tab.appendChild(th);
  tab.appendChild(tb);
  parent.oxcal.tableDrawn=true;
  document.getElementById("tableArea").appendChild(tab);
 };
 
