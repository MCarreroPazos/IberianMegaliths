var noaa;

function noaaLink()
{
 this.NoaaStudyURL="https://www.ncei.noaa.gov/access/paleo-search/study/";
};


noaaLink.prototype.parseNoaaDoi=function(str,options)
{
 if(str.indexOf("doi.org")==-1){str=integ.DoiURL+str;};
 app.alert('Finding NOAA study number for '+str,2000);
 getFromServer(str,
 function(txt)
 {
  var ls,i;
  ls=this.links(txt);
  for(i=0;ls.length;i++)
  {
   if(ls[i].indexOf(this.NoaaStudyURL)!=-1)
   {
    this.parseNoaaStudy(Number(ls[i].replace(this.NoaaStudyURL,"")),options);
    return;
   };
  };
 }.bind(this),function(){app.alert("Could not read DOI");});
};

noaaLink.prototype.parseNoaaStudy=function(no,options)
{
 var str=this.NoaaStudyURL+"search.json?NOAAStudyId="+Number(no);
 app.alert('Reading NOAA study '+no,2000);
 getFromServer(str,
 async function(txt)
 {
  var obj,i,j,k,l,study,site,data,file,bib,tar,tstr,aul,record,refs,loc,integ_rec,tst;
  function parseRange(o,prop,min,max)
  {
   if(o[prop]){return;};
   try
   {
    min=Number(min);max=Number(max);
    o[prop]=(min+max)/2;
    if(min!=max){o[prop+"_range"]=Math.abs(max-min);};
   }
   catch(e){};
  };
  try
  {
   obj=JSON.parse(txt);
   app.alert("Reading data files",2000);
   for(i=0;i<obj.study.length;i++)
   {
    study=obj.study[i];
    bib=[{"doi":study.doi,"url":study.doi,"reftype":"misc","title":study.studyName,"author":study.investigators.replace(/;/g," and "),
     "firstauthor":study.investigators.split(',')[0].trim(),"year":Number(study.contributionDate.split('-')[0])}];
    if(bib[0].doi.indexOf('/doi.org/')!=-1){bib[0].doi=bib[0].doi.split('/doi.org/')[1];}else{bib[0].url='';};
    tar=study.studyName.split(/\s/);tstr='';
    for(j=0;(j<tar.length)&&(tstr.length<3);j++){if(tar[j].length>3){tstr+=tar[j].slice(0,1);};};
    bib[0].ref=(bib[0].firstauthor+bib[0].year+tstr).replace(/\s/g,'').toLowerCase();
    aul=study.investigators.split(';');
    bib[0].reference='';
    if(aul.length>1)
    {
     bib[0].citation=bib[0].firstauthor+" et al., "+bib[0].year;
     for(j=0;j<aul.length;j++)
     {
      bib[0].reference+=aul[j].trim();
      if(j<aul.length-2){bib[0].reference+=", "}
      else
      {
       if(j<aul.length-1){bib[0].reference+=" and "};
      };
     };
    }
    else
    {
     bib[0].citation=bib[0].firstauthor+" "+bib[0].year;
     bib[0].reference=aul[0];
    };
    bib[0].reference+=" ("+bib[0].year+ ") "+bib[0].title+". doi:"+bib[0].doi;
    for(j=0;j<study.publication.length;j++)
    {
     if(study.publication[j].identifier.type=='doi')
     {
      bib.push({"doi":study.publication[j].identifier.id});
     };
    };
    integ.addBibliography(bib);
    integ.findAllRefs();
    refs=[];
    for(j=0;j<bib.length;j++)
    {
     if(bib[j].doi){refs[j]="doi:"+bib[j].doi;}else{refs[j]="ref:"+bib[j].ref;};
    };
    for(j=0;j<study.site.length;j++)
    {
     site=study.site[j];
     if(options.record)
     {
      if(j>0){return;}; // only use first site
      integ_rec=integ.findRecord(options.record);
      if(!integ_rec){return;};
      integ.viewRecord(integ_rec);
      record=integ.record;
     }
     else
     {
      if(integ_rec=integ.findRecord(site.siteCode))
      {
       record=integ_rec.file_data;
      }
      else
      {
       record={"refs":[],"header":{"record":site.siteCode,"site":site.siteName,
         "site_type":"Dendrochronological","z_type":"rings","z_units":"rings"}};
       integ_rec={"record":record.header.record,"file_data":record};
      };
      integ.viewRecord(integ_rec);
      integ.onRecordChange(true);
     };
     if(!options.series)
     {
      integ.viewSeries({"series":"Study_"+no,"series_type":"NOAA_NCEI_Study","noaa_ncei_study":no,"refs":refs});
      integ.onSeriesChange();
     }
     else
     {
      if(options.record)
      {
       integ.seriesSpec.emptyContainer();
       options.series.refs=refs;
       integ.seriesSpec.fillContainer();
       integ.onSeriesChange();
      }
      else
      {
       integ.projectSeriesSpec.emptyContainer();
       options.series.refs=refs;
       integ.projectSeriesSpec.fillContainer();
       integ.onProjectSeriesChange();
      };
     };
     integ.recordSpec.emptyContainer();
     tst=JSON.stringify(record.header);
     if(site.geo.properties)
     {
      parseRange(record.header,"longitude",site.geo.properties.westernmostLongitude,site.geo.properties.easternmostLongitude);
      parseRange(record.header,"latitude",site.geo.properties.southernmostLatitude,site.geo.properties.northernmostLatitude);
      parseRange(record.header,"elevation",site.geo.properties.minElevationMeters,site.geo.properties.maxElevationMeters);
     };
     if(site.locationName)
     {
      loc=site.locationName.split(">");
      switch(loc[0])
      {
      case "Continent":
       if((loc.length>2)&&!record.header.country){record.header.country=loc[2];};
       if((loc.length>3)&&!record.header.region){record.header.region=loc[3];};
       break;
      case "Country":
       if((loc.length>1)&&!record.header.country){record.header.country=loc[1];};
       if((loc.length>2)&&!record.header.region){record.header.region=loc[2];};
       break;
      };
      integ.recordSpec.fillContainer();
      if(tst!=JSON.stringify(record.header)){integ.onRecordChange(true);};
     };
     for(k=0;k<site.paleoData.length;k++)
     {
      data=site.paleoData[k];
      if(data.species && data.species.length && data.species[0].scientificName)
      {
       record.header.species=data.species[0].scientificName;
      };
      for(l=0;l<data.dataFile.length;l++)
      {
       file=data.dataFile[l];
       if(options.urlDescription && (file.urlDescription===options.urlDescription))
       {
        getFromServer(file.fileUrl,
         function(rec,txt){dendro.parseTucson(txt,rec);}.bind(this,record),
         function(e){app.alert(e);});
       };
      };
     };
    };
   };
  }
  catch(e){app.alert(e);};
 }.bind(this),function(){app.alert("Could not read NOAA study");}); 
};


(function () {
 noaa=new noaaLink();
})();

