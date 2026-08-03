var integData=false;
var min_t=-48000,max_t=2000;
var alertno=0;

function Proxy(record,record_no,t_scale,z_scale)
{
 this.record=record;
 this.record_no=record_no;
 this.t_scale=t_scale;
 this.z_scale=z_scale;
 this.proxies=new Array();
 this.data=new Array();
};
new Proxy("","","");

function AgeDepth(t_scale,z_scale,data)
{
 this.t_scale=t_scale;
 this.z_scale=z_scale;
 if(data){this.data=data;}else{this.data=new Array();};
};
new AgeDepth("","");

Proxy.prototype.applyAgeDepth=function(age_depths)
{
 var i,j,k,z,dz,t,dt,age_depth=false;
 var ar=new Array();
 for(i=0;i<age_depths.length;i++)
 {
  if(this.z_scale==age_depths[i].z_scale){age_depth=age_depths[i];break;};
 };
 if(!age_depth){return;};
 z=this.z_scale;
 if(!z){return;};
 dz=z.replace("_z","_dz");
 t=age_depth.t_scale;
 dt=t.replace("_t","_dt");
 for(i=0;i<this.data.length;i++)
 {
  ar.push(this.data[i]);
 };
 for(i=0;i<age_depth.data.length;i++)
 {
  ar.push(age_depth.data[i]);
 };
 tscl=age_depth.z_scale;
 ar.sort(tsclSort);
 i=0;
 while((ar[i].z_s!=this.z_scale) && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while((ar[j].z_s!=this.z_scale) && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  interpAgeAgeModel(ar,z,dz,t,dt,k,i,j);
 };
 for(k=j+1;k<ar.length;k++)
 {
  interpAgeAgeModel(ar,z,dz,t,dt,k,i,j);
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while((ar[j].z_s!=this.z_scale) && ((j+1)<ar.length)){j++;};
  for(k=i+1;k<j;k++)
  {
   interpAgeAgeModel(ar,z,dz,t,dt,k,i,j);
  };
  i=j;
 };
};


function AgeAge(t_dash,t_scale,data)
{
 this.t_dash=t_dash;
 this.t_scale=t_scale;
 if(data){this.data=data;}else{this.data=new Array();};
};
new AgeAge("","");

var tscl="";
function tsclSort(a,b)
{
 return a[tscl]-b[tscl];
};

AgeAge.prototype.zipWithScales=function(tscales)
{
 var i;
 this.ar_scale=new Array();
 this.ar_dash=new Array();
 for(i=0;i<this.data.length;i++)
 {
  this.data[i].t_t=true;
  this.ar_scale.push(this.data[i]);
  this.ar_dash.push(this.data[i]);
 };
 for(i=0;i<tscales[this.t_scale].data.length;i++)
 {
  this.ar_scale.push(tscales[this.t_scale].data[i]);
 };
 for(i=0;i<tscales[this.t_dash].data.length;i++)
 {
  this.ar_dash.push(tscales[this.t_dash].data[i]);
 };
 tscl=this.t_scale;
 this.ar_scale.sort(tsclSort);
 tscl=this.t_dash;
 this.ar_dash.sort(tsclSort);
 this.mainTransfer(true);
 this.mainTransfer(false);
 this.ar_pair=new Array();
 for(i=0;i<tscales[this.t_scale].data.length;i++)
 {
  this.ar_pair.push(tscales[this.t_scale].data[i]);
 };
 for(i=0;i<tscales[this.t_dash].data.length;i++)
 {
  this.ar_pair.push(tscales[this.t_dash].data[i]);
 };
 tscl=this.t_dash;
 this.ar_pair.sort(tsclSort);
 this.findErrors();
};

function interpAgeAgeModel(a,t_basis,dt_basis,t_new,dt_new,k,i,j,a_error,suppress_dt3)
{
 var g,gdt,dt=0,dt2=0,dt3=0,dt4=0,dt5=0,newval,newerr;
 if(a[i][t_basis]==a[j][t_basis])
 {
  if(isNaN(a[k][t_new]))
  {
   a[k][t_new]="NaN";a[k][dt_new]="NaN";
  };
  return;
 };
 g=(a[i][t_new]-a[j][t_new])/(a[i][t_basis]-a[j][t_basis]);
 newval=a[i][t_new]+g*(a[k][t_basis]-a[i][t_basis]);
 if(a[i][dt_new])
 {
  gdt=(a[i][dt_new]-a[j][dt_new])/(a[i][t_basis]-a[j][t_basis]);
  dt=a[i][dt_new]+gdt*(a[k][t_basis]-a[i][t_basis]);
 };
 if(a[i][dt_basis])
 {
  gdt=(a[i][dt_basis]-a[j][dt_basis])/(a[i][t_basis]-a[j][t_basis]);
  dt2=g*(a[i][dt_basis]+gdt*(a[k][t_basis]-a[i][t_basis])); //corrected for gradient
 };
 if(a[k][dt_basis] && !suppress_dt3)
 {
  dt3=g*a[k][dt_basis]; //corrected for gradient
 };
 if(a_error)
 {
  dt4=g*a_error[k][dt_basis];
 };
 if(k<i)
 {
  dt5=integ.extrapolation_error*g*(a[k][t_basis]-a[i][t_basis]);
  if(a[i][dt_basis]){dt2=g*a[i][dt_basis];};
 };
 if(k>j)
 {
  dt5=integ.extrapolation_error*g*(a[k][t_basis]-a[j][t_basis]);
  if(a[j][dt_basis]){dt2=g*a[j][dt_basis];};
 };
/* a[k]['dt1']=dt
 a[k]['dt2']=dt2;
 a[k]['dt3']=dt3;
 a[k]['dt4']=dt4;
 a[k]['dt5']=dt5;*/
 newerr=Math.sqrt(dt*dt+dt2*dt2+dt3*dt3+dt4*dt4+dt5*dt5);
 if(isNaN(newval) || isNaN(newerr)){return;};
 if((a[k][dt_new]==null)||isNaN(a[k][dt_new])||(newerr < a[k][dt_new]))
 {
  if(t_new.indexOf("_t")==-1)
  {
   a[k][t_new]=newval; 
   a[k][dt_new]=newerr;
  }
  else
  {
   a[k][t_new]=Math.round(newval); // rounded for speed
   a[k][dt_new]=Math.round(newerr);
  };
 };
};

AgeAge.prototype.mainTransfer=function(dash)
{
 var t_basis,dt_basis,t_new,dt_new,ar,i,j,k;
 if(dash)
 {
  t_basis=this.t_dash;
  dt_basis=this.t_dash.replace("_t","_dt");
  t_new=this.t_scale;
  dt_new=this.t_scale.replace("_t","_dt");
  ar=this.ar_dash;
 }
 else
 {
  t_basis=this.t_scale;
  dt_basis=this.t_scale.replace("_t","_dt");
  t_new=this.t_dash;
  dt_new=this.t_dash.replace("_t","_dt");
  ar=this.ar_scale;
 };
 i=0;
 while(!ar[i].t_t && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while(!ar[j].t_t && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
 };
 for(k=j+1;k<ar.length;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while(!ar[j].t_t && ((j+1)<ar.length)){j++;};
  if(!ar[j].t_t){break;};
  for(k=i+1;k<j;k++)
  {
   interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
  };
  i=j;
 };
};

AgeAge.prototype.findErrors=function()
{
 var t_basis,dt_basis,t_new,dt_new,ar,i,j,k;
 var i,j,k,l,o;
 this.ar_pair_error=new Array();
 t_basis=this.t_dash;
 dt_basis=this.t_dash.replace("_t","_dt");
 t_new=this.t_scale;
 dt_new=this.t_scale.replace("_t","_dt");
 for(i=0;i<this.ar_pair.length;i++)
 {
  o=new Object();
  o[this.t_dash]=this.ar_pair[i][this.t_dash];
  this.ar_pair_error.push(o);
 };
 ar=new Array();
 for(i=0;i<this.data.length;i++)
 {
  ar.push(this.data[i]);
 };
 for(i=0;i<this.ar_pair_error.length;i++)
 {
  ar.push(this.ar_pair_error[i]);
 };
 tscl=t_basis;
 ar.sort(tsclSort);
 i=0;
 while(!ar[i].t_t && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while(!ar[j].t_t && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
 };
 for(k=j+1;k<ar.length;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while(!ar[j].t_t && ((j+1)<ar.length)){j++;};
  if(!ar[j].t_t){break;};
  for(k=i+1;k<j;k++)
  {
   interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j);
  };
  i=j;
 };
 t_basis=this.t_scale;
 dt_basis=this.t_scale.replace("_t","_dt");
 t_new=this.t_dash;
 dt_new=this.t_dash.replace("_t","_dt");
 tscl=t_basis;
 ar.sort(tsclSort);
 i=0;
 while(!ar[i].t_t && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while(!ar[j].t_t && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j,0,true);
 };
 for(k=j+1;k<ar.length;k++)
 {
  interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j,0,true);
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while(!ar[j].t_t && ((j+1)<ar.length)){j++;};
  for(k=i+1;k<j;k++)
  {
   interpAgeAgeModel(ar,t_basis,dt_basis,t_new,dt_new,k,i,j,0,true);
  };
  i=j;
 };
// alert(t_basis+"\n"+t_new+"\n\n"+JSON.stringify(this.ar_pair_error));
};

AgeAge.prototype.crossFertiliseOne=function(dash,tscales)
{
 var el,t_basis,dt_basis,t_to,dt_to,t_new=new Array(),dt_new=new Array(),ar,i,j,k,l;
 ar=this.ar_pair;
 if(dash)
 {
  t_basis=this.t_dash;
  dt_basis=this.t_dash.replace("_t","_dt");
  t_to=this.t_scale;
 }
 else
 {
  t_basis=this.t_scale;
  dt_basis=this.t_scale.replace("_t","_dt");
  t_to=this.t_dash;
  dt_to=this.t_dash.replace("_t","_dt");
 };
 for(el in tscales)
 {
  if((el!=t_basis)&&(el!=t_to))
  {
   if(typeof(tscales[t_basis].data[0][el])!='undefined')
   {
    t_new.push(el);
    dt_new.push(el.replace("_t","_dt"));
   };
  };
 };
 i=0;
 while((ar[i].t_s!=t_basis) && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while((ar[j].t_s!=t_basis) && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  for(l=0;l<t_new.length;l++)
  {
   interpAgeAgeModel(ar,t_basis,dt_basis,t_new[l],dt_new[l],k,i,j,this.ar_pair_error,!dash);
  };
 };
 for(k=j+1;k<ar.length;k++)
 {
  for(l=0;l<t_new.length;l++)
  {
   interpAgeAgeModel(ar,t_basis,dt_basis,t_new[l],dt_new[l],k,i,j,this.ar_pair_error,!dash);
  };
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while((ar[j].t_s!=t_basis) && ((j+1)<ar.length)){j++;};
  for(k=i+1;k<j;k++)
  {
   for(l=0;l<t_new.length;l++)
   {
    interpAgeAgeModel(ar,t_basis,dt_basis,t_new[l],dt_new[l],k,i,j,this.ar_pair_error,!dash);
   };
  };
  i=j;
 };
 //alert(this.t_scale+"\n"+t_basis+"->"+t_to+"\n\n"+JSON.stringify(t_new)+"\n\n"+JSON.stringify(ar));
};

AgeAge.prototype.crossFertilise=function(tscales)
{
 this.crossFertiliseOne(true,tscales);
 this.crossFertiliseOne(false,tscales);
};

function TimeScale(t_scale,source_data)
{
 var dt_scale;
 dt_scale=t_scale.replace("_t","_dt");
 this.t_scale=t_scale;
 this.data=new Array();
 if(!source_data){return;};
 this.addSourceData(source_data);
};
new TimeScale("");

TimeScale.prototype.cleanSourceData=function()
{
 var i;
 this.data.sort(function(a,b){return a[this.t_scale]-b[this.t_scale];}.bind(this));
 for(i=0;i<this.data.length-1;i++)
 {
  if(this.data[i][this.t_scale]==this.data[i+1][this.t_scale])
  {
   this.data.splice(i,1);
  };
 };
};

TimeScale.prototype.equateScales=function(s1,s2)
{
 var i,s1d=s1.replace('_t',"_dt"),s2d=s2.replace('_t',"_dt");
 for(i=0;i<this.data.length;i++)
 {
  this.data[i][s1]=this.data[i][s2];
  this.data[i][s1d]=this.data[i][s2d];
 };
};

TimeScale.prototype.addSourceData=function(source_data)
{
 var i,obj,dt_scale;
 dt_scale=this.t_scale.replace("_t","_dt");
 for(i=0;i<source_data.length;i++)
 {
  obj=new Object();
  obj[this.t_scale]=source_data[i][this.t_scale];
  obj[dt_scale]=0;
  obj.t_s=this.t_scale;
  this.data.push(obj);
 };
 this.cleanSourceData();
};

TimeScale.prototype.getDepths=function(age_depth)
{
 var i,j,k,z,dz,t,dt;
 var ar=new Array();
 z=age_depth.z_scale;
 if(!z){return;};
 dz=z.replace("_z","_dz");
 t=age_depth.t_scale;
 dt=t.replace("_t","_dt");
 for(i=0;i<this.data.length;i++)
 {
  ar.push(this.data[i]);
 };
 for(i=0;i<age_depth.data.length;i++)
 {
  ar.push(age_depth.data[i]);
 };
 tscl=age_depth.t_scale;
 ar.sort(tsclSort);
 i=0;
 while((ar[i].t_s==this.t_scale) && ((i+1)<ar.length)){i++;};
 j=ar.length-1;
 while((ar[j].t_s==this.t_scale) && (j>0)){j--;};
 for(k=0;k<i;k++)
 {
  interpAgeAgeModel(ar,t,dt,z,dz,k,i,j);
 };
 for(k=j+1;k<ar.length;k++)
 {
  interpAgeAgeModel(ar,t,dt,z,dz,k,i,j);
 };
 while((i+1)<ar.length)
 {
  j=i+1;
  while((ar[j].t_s==this.t_scale) && ((j+1)<ar.length)){j++;};
  for(k=i+1;k<j;k++)
  {
   interpAgeAgeModel(ar,t,dt,z,dz,k,i,j);
  };
  i=j;
 };
};

TimeScale.prototype.applyScales=function(proxy)
{
 var i,j,k,l,nw,d_nw,t,dt,zfix;
 var ar=new Array();
 zfix=proxy.z_scale;
 t=proxy.t_scale;
 dt=t.replace("_t","_dt");
 if(this.data.length<2){return;};
 for(i=0;i<this.data.length;i++)
 {
  ar.push(this.data[i]);
 };
 for(i=0;i<proxy.data.length;i++)
 {
  ar.push(proxy.data[i]);
 };
 tscl=proxy.t_scale;
 ar.sort(tsclSort);
 for(l in this.data[0])
 {
  if(l.indexOf("_t")>0)
  {
   nw=l;d_nw=nw.replace("_t","_dt");
  }
  else
  {
   if(l.indexOf("_z")>0)
   {
    if(l==zfix){continue;}; // don't change primary z scale
    nw=l;d_nw=nw.replace("_z","_dz");
   }
   else
   {
    continue;
   };
  };
  i=0;
  while((ar[i].t_s!=this.t_scale) && ((i+1)<ar.length)){i++;};
  j=ar.length-1;
  while((ar[j].t_s!=this.t_scale) && (j>0)){j--;};
  for(k=0;k<i;k++)
  {
   interpAgeAgeModel(ar,t,dt,nw,d_nw,k,i,j);
  };
  for(k=j+1;k<ar.length;k++)
  {
   interpAgeAgeModel(ar,t,dt,nw,d_nw,k,i,j);
  };
  while((i+1)<ar.length)
  {
   j=i+1;
   while((ar[j].t_s!=this.t_scale) && ((j+1)<ar.length)){j++;};
   for(k=i+1;k<j;k++)
   {
    interpAgeAgeModel(ar,t,dt,nw,d_nw,k,i,j);
   };
   i=j;
  };
 };
};

function Integrator()
{
 this.proxies=new Array();
 this.ageDepths=new Array();
 this.ageAges=new Array();
 this.sites=new Array();
 this.timeScales=new Object();
 this.depthScales=new Object();
 this.refs=new Array();
};
new Integrator();

Integrator.prototype.findTimeScales=function()
{
 var i,base_tss={},ts,aa,obj;
 // first try all original age-depth models
 this.timeScales["Years_t"]=new TimeScale("Years_t",null);
 for(i=0;i<this.ageDepths.length;i++)
 {
  if((this.ageDepths[i].z_scale.replace("_z","_t")==this.ageDepths[i].t_scale)
    ||(!this.ageDepths[i].z_scale))
  {
   if(!this.timeScales[this.ageDepths[i].t_scale])
   {
    this.timeScales[this.ageDepths[i].t_scale]=
    	new TimeScale(this.ageDepths[i].t_scale,this.ageDepths[i].data);
   }
   else
   {
    this.timeScales[this.ageDepths[i].t_scale].addSourceData(this.ageDepths[i].data);
   };
  };
 };
 // then any derivative age-depth models
 for(i=0;i<this.ageDepths.length;i++)
 {
  if(!this.timeScales[this.ageDepths[i].t_scale])
  {
   this.timeScales[this.ageDepths[i].t_scale]=
    	new TimeScale(this.ageDepths[i].t_scale,this.ageDepths[i].data);
  }
  else
  {
   this.timeScales[this.ageDepths[i].t_scale].addSourceData(this.ageDepths[i].data);
  };
 };
 // apply age_depth models
 for(i=0;i<this.ageAges.length;i++)
 {
  base_tss[this.ageAges[i].t_scale]=true;
 };
 for(i=0;i<this.ageAges.length;i++)
 {
  base_tss[this.ageAges[i].t_dash]=false;
 };
 // finally all age-age relationships
 for(i=0;i<this.ageAges.length;i++)
 {
  if(!this.timeScales[this.ageAges[i].t_scale])
  {
   this.timeScales[this.ageAges[i].t_scale]=new TimeScale(this.ageAges[i].t_scale,this.ageAges[i].data);
  }
  else
  {
   this.timeScales[this.ageAges[i].t_scale].addSourceData(this.ageAges[i].data);
  };
  if(!this.timeScales[this.ageAges[i].t_dash])
  {
   this.timeScales[this.ageAges[i].t_dash]=new TimeScale(this.ageAges[i].t_dash,this.ageAges[i].data);
  }
  else
  {
   this.timeScales[this.ageAges[i].t_dash].addSourceData(this.ageAges[i].data);
  };
 };
 for(ts in base_tss)
 {
  if((ts!="Years_t")&&(base_tss[ts]))
  {
   aa=new AgeAge("Years_t",ts);
   for(i=0;i<this.timeScales[ts].data.length;i++)
   {
    obj=new Object();
    obj[ts]=this.timeScales[ts].data[i][ts];
    obj["Years_t"]=this.timeScales[ts].data[i][ts];
    obj["Years_dt"]=0;
    aa.data.push(obj);
    obj=new Object();
    obj["Years_t"]=this.timeScales[ts].data[i][ts];
    obj["Years_dt"]=0;
    obj["t_s"]="Years_t";
    this.timeScales["Years_t"].data.push(obj);
   };
   this.ageAges.push(aa);
  };
 };
};
// link all root timeScales

Integrator.prototype.importData=function()
{
 var i,j,k,obj,arD,arA,arT,r,r_dash,t_scale,dt_scale,z_scale,t_dash,dt_dash,ts;
 var indEr,tempT;
 var evnt,lbl,warm,cold;
 // gather the proxy data
 k=0;
 for(i=0;i<integ.proxies.length;i++)
 {
  if(integ.proxies[i].length==0){continue;};
  if(integ.proxy_info[i].suppress_t)
  {
   if(integ.proxy_info[i].suppress_z)
   {
    this.proxies[k]=new Proxy(integ.proxy_info[i].record,integ.proxy_info[i].record_no,
    	integ.proxy_info[i].t_source+"_t","");
   }
   else
   {
    this.proxies[k]=new Proxy(integ.proxy_info[i].record,integ.proxy_info[i].record_no,
    	integ.proxy_info[i].t_source+"_t",integ.proxy_info[i].record+"_z");
   };
  }
  else
  {
   if(integ.proxy_info[i].suppress_z)
   {
    this.proxies[k]=new Proxy(integ.proxy_info[i].record,integ.proxy_info[i].record_no,
    	integ.proxy_info[i].record+"_t","");
   }
   else
   {
    this.proxies[k]=new Proxy(integ.proxy_info[i].record,integ.proxy_info[i].record_no,
    	integ.proxy_info[i].record+"_t",integ.proxy_info[i].record+"_z");
   };
  };
  for(el in integ.proxies[i][0])
  {
   switch(el)
   {
   case "t":
   case "t_sigma":
   case "z":
   case "z_range":
    break;
   default:
    this.proxies[k].proxies.push(el);
    break;
   };
  };
  for(j=0;j<integ.proxies[i].length;j++)
  {
   if((integ.proxies[i][j].t!=null)&&((integ.proxies[i][j].t<min_t)||(integ.proxies[i][j].t>max_t))){continue;};
   obj=new Object();
   if(integ.proxy_info[i].suppress_t)
   {
    obj[integ.proxy_info[i].t_source+"_t"]=integ.proxies[i][j]["t"];
    obj[integ.proxy_info[i].t_source+"_dt"]=integ.proxies[i][j]["t_sigma"];
   }
   else
   {
    obj[integ.proxy_info[i].record+"_t"]=integ.proxies[i][j]["t"];
    obj[integ.proxy_info[i].record+"_dt"]=integ.proxies[i][j]["t_sigma"];
   };
   if(!integ.proxy_info[i].suppress_z)
   {
    obj[integ.proxy_info[i].record+"_z"]=integ.proxies[i][j]["z"];
    obj[integ.proxy_info[i].record+"_dz"]=integ.proxies[i][j]["z_range"]*0.288;
   };
   for(el in integ.proxies[i][j])
   {
    switch(el)
    {
    case "t":
    case "t_sigma":
    case "z":
    case "z_range":
     break;
    default:
     obj[el]=integ.proxies[i][j][el];
     break;
    };
   };
   this.proxies[k].data.push(obj);
  };
  k++;
 };
 if(integ.events)
 {
  for(i=0;i<integ.events.length;i++)
  {
   if((i==0)||(integ.events[i].t_source!=integ.events[i-1].t_source))
   {
    this.proxies[k]=new Proxy("Events",0,integ.events[i].t_source+"_t","");
    this.proxies[k].proxies=["events"];
    evnt=k;
    k++;
    this.proxies[k]=new Proxy("EventLabels",0,integ.events[i].t_source+"_t","");
    this.proxies[k].proxies=["events"];
    lbl=k;
    k++;
    this.proxies[k]=new Proxy("Warm",0,integ.events[i].t_source+"_t","");
    this.proxies[k].proxies=["events","events_sigma"];
    warm=k;
    k++;
    this.proxies[k]=new Proxy("Cold",0,integ.events[i].t_source+"_t","");
    this.proxies[k].proxies=["events","events_sigma"];
    cold=k;
    k++;
   };
   if(integ.events[i].period)
   {
    obj=new Object();
    obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
    obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
    obj.events=0.5;
    obj.label=integ.events[i].event;
    this.proxies[lbl].data.push(obj);
   }
   else
   {
    obj=new Object();
    obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
    obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
    obj.events=0.0;
    this.proxies[evnt].data.push(obj);
    obj=new Object();
    obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
    obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
    obj.events=1.0;
    this.proxies[evnt].data.push(obj);
    obj=new Object();
    obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
    obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
    obj.events="NaN";
    this.proxies[evnt].data.push(obj);
   }; 
   obj=new Object();
   obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
   obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
   if(integ.events[i].warm){obj.events=0.5;obj.events_sigma=0.5;}
   else{obj.events="NaN";obj.events_sigma="NaN";};
   obj.label=integ.events[i].event;
   this.proxies[warm].data.push(obj);
   obj=new Object();
   obj[integ.events[i].t_source+"_t"]=integ.events[i].t;
   obj[integ.events[i].t_source+"_dt"]=integ.events[i].t_sigma;
   if(integ.events[i].cold){obj.events=0.5;obj.events_sigma=0.5;}
   else{obj.events="NaN";obj.events_sigma="NaN";};
   obj.label=integ.events[i].event;
   this.proxies[cold].data.push(obj);
  };
 };
 if(integ.tephra)
 {
  arT=new Array();
  tempT=new Array();
  indEr=new Array();
  for(i=0;i<integ.tephra.length;i++)
  {
   if(!integ.tephra[i].t_source){integ.tephra[i].t_source="Years";};
   obj=new Object;
   obj[integ.tephra[i].t_source+"_t"]=integ.tephra[i].t;
   obj[integ.tephra[i].t_source+"_dt"]=integ.tephra[i].t_sigma;
   indEr[integ.tephra[i].eruption_no]=tempT.length;
   tempT.push(obj);
  };
  if(integ.tephra_insites)
  {
   for(i=0;i<integ.tephra_insites.length;i++)
   {
    if(typeof(j=indEr[integ.tephra_insites[i].eruption_no])!='undefined')
    {
     if(tempT[j])
     {
      tempT[j][integ.tephra_insites[i].t_source+"_t"]=integ.tephra_insites[i].t;
      tempT[j][integ.tephra_insites[i].t_source+"_dt"]=integ.tephra_insites[i].t_sigma;
     };
    };
   };
  };
  for(i=0;i<integ.tephra.length;i++)
  {
   if((i==0)||(integ.tephra[i].t_source!=integ.tephra[i-1].t_source))
   {
    this.proxies[k]=new Proxy("Tephra",0,integ.tephra[i].t_source+"_t","");
    this.proxies[k].proxies=["tephra"];
    evnt=k;
    k++;
    this.proxies[k]=new Proxy("TephraLabels",0,integ.tephra[i].t_source+"_t","");
    this.proxies[k].proxies=["tephra"];
    lbl=k;
    k++;
   };
   obj=new Object();
   for(x in tempT[i]){obj[x]=tempT[i][x];};
   obj.tephra=0.0;
   this.proxies[evnt].data.push(obj);
   obj=new Object();
   for(x in tempT[i]){obj[x]=tempT[i][x];};
   obj.tephra=1.0;
   this.proxies[evnt].data.push(obj);
   obj=new Object();
   for(x in tempT[i]){obj[x]=tempT[i][x];};
   obj.tephra="NaN";
   this.proxies[evnt].data.push(obj);
   obj=new Object();
   for(x in tempT[i]){obj[x]=tempT[i][x];};
   obj.tephra=integ.tephra[i].t; // used for sort
   obj.label=integ.tephra[i].eruption;
   this.proxies[lbl].data.push(obj);
   arT.push(obj);
  };
  tscl="tephra";
  arT.sort(tsclSort);
  for(i=0;i<arT.length;i++)
  {
   arT[i].tephra=(i%5)/10;
  };
 };
 // gather AgeDepth data
 arA=new Array();arD=new Array();
 r="";t_scale="";z_scale="";
 for(i=0;i<integ.ageDepth.length;i++)
 {
  if((integ.ageDepth[i].t<min_t)||(integ.ageDepth[i].t>max_t)){continue;};
  if(r!=integ.ageDepth[i].record)
  {
   if(arA.length){this.ageAges.push(new AgeAge(t_dash,t_scale,arA));};
   arA=new Array();
   if(arD.length)
   {
    if(t_dash)
    {
     this.ageDepths.push(new AgeDepth(t_dash,z_scale,arD));
    }
    else
    {
     this.ageDepths.push(new AgeDepth(t_scale,z_scale,arD));
    };
   };
   arD=new Array();
   r=integ.ageDepth[i].record;
   if(integ.ageDepth[i].suppress_z)
   {
    z_scale="";
   }
   else
   {
    z_scale=r+"_z";
   };
   if(integ.ageDepth[i].suppress_t)
   {
    t_scale=integ.ageDepth[i].t_source+"_t";
    dt_scale=integ.ageDepth[i].t_source+"_dt";
    t_dash="";
    dt_dash="";
   }
   else
   {
    t_dash=r+"_t";
    dt_dash=r+"_dt";
    t_scale=integ.ageDepth[i].t_source+"_t";
    dt_scale=integ.ageDepth[i].t_source+"_dt";
   };
  }
  if(z_scale)
  {
   this.depthScales[z_scale]=true;
   obj=new Object();
   if(t_dash)
   {
    obj[t_dash]=integ.ageDepth[i]["t"];
    obj[dt_dash]=0;
   }
   else
   {
    obj[t_scale]=integ.ageDepth[i]["t"];
    obj[dt_scale]=integ.ageDepth[i]["t_sigma"];
   };
   obj["z_s"]=z_scale;
   obj[z_scale]=integ.ageDepth[i]["z"];
   arD.push(obj);
  }
  else
  {
   obj=new Object();
   if(t_dash)
   {
    obj[t_dash]=integ.ageDepth[i]["t"];
    obj[dt_dash]=0;
    arD.push(obj);
   };
  };
  if(t_dash)
  {
   obj=new Object();
   obj[t_dash]=integ.ageDepth[i]["t"];
   obj[t_scale]=integ.ageDepth[i]["t"];
   obj[dt_scale]=integ.ageDepth[i]["t_sigma"];
   arA.push(obj);
  };
 };
 if(arA.length){this.ageAges.push(new AgeAge(t_dash,t_scale,arA));};
 if(arD.length)
 {
  if(t_dash)
  {
   this.ageDepths.push(new AgeDepth(t_dash,z_scale,arD));
  }
  else
  {
   this.ageDepths.push(new AgeDepth(t_scale,z_scale,arD));
  };
 };
 // gather direct Age-Age data
 r="";r_dash="";arA=new Array();
 for(i=0;i<integ.ageAge.length;i++)
 {
  if((integ.ageAge[i].t<min_t)||(integ.ageAge[i].t>max_t)){continue;};
  if((r!=integ.ageAge[i].source_record)||(r_dash!=integ.ageAge[i].dest_record))
  {
   if(arA.length){this.ageAges.push(new AgeAge(t_dash,t_scale,arA));};
   arA=new Array();
   r=integ.ageAge[i].source_record;
   r_dash=integ.ageAge[i].dest_record;
   t_scale=r+"_t";
   dt_scale=r+"_dt";
   t_dash=r_dash+"_t";
  };
  obj=new Object();
  obj[t_dash]=integ.ageAge[i]["t_dash"];
  obj[t_scale]=integ.ageAge[i]["t"];
  obj[dt_scale]=integ.ageAge[i]["t_sigma"];
  arA.push(obj);
 };
 if(arA.length){this.ageAges.push(new AgeAge(t_dash,t_scale,arA));};
 // gather site data 
 for(i=0;i<integ.sites.length;i++)
 {
  obj=new Object();
  obj.label=integ.sites[i].site;
  obj.longitude=integ.sites[i].longitude;
  obj.latitude=integ.sites[i].latitude;
  obj.id=integ.sites[i].record+"_loc";
  this.sites.push(obj);
 };
 //
};

Integrator.prototype.integrate=function()
{
 var i,j,ts;
 for(i=0;i<this.proxies.length;i++)
 {
  this.proxies[i].applyAgeDepth(this.ageDepths);
 };
 for(i=0;i<this.ageAges.length;i++)
 {
  this.ageAges[i].zipWithScales(this.timeScales);
 };
 for(j=0;j<this.ageAges.length;j++) // repeat to allow full propagation
 {
  for(i=0;i<this.ageAges.length;i++)
  {
   this.ageAges[i].crossFertilise(this.timeScales);
  };
 };
 for(ts in this.timeScales)
 {
  for(i=0;i<this.ageDepths.length;i++)
  {
   this.timeScales[ts].getDepths(this.ageDepths[i]);
  };
 };
 for(i=0;i<this.proxies.length;i++)
 {
  if(typeof(this.timeScales[this.proxies[i].t_scale])!='undefined')
  {
   this.timeScales[this.proxies[i].t_scale].applyScales(this.proxies[i]);
  };
 };
};




