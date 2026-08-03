function LoginInterface(obj)
{
 if(!obj){obj={}};
 if(!obj.server){obj.server="root";};
 if(!obj.link){obj.link="../login/connect.php";};
 logins[obj.server]=this;
 this.link=obj.link;
 this.server=obj.server;
 this.trialCount=0;
 if(obj.icon){this.icon=obj.icon;};
 this.dialog=false;
};

LoginInterface.prototype.connect=function(data)
{
 return new Promise(function (resolve,reject)
 {
  try
  {
   putToServer(this.link,JSON.stringify(data),resolve,reject);
  }
  catch(e)
  {
   reject(e);
  };
 }.bind(this));
};

LoginInterface.prototype.connectRes=function(data)
{
 return new Promise(async function (resolve,reject)
 {
  var res;
  try
  {
   res=await this.connect(data);
   res=JSON.parse(res);
   if(res.status){resolve(res.data);}else{reject(res.error);};
  }
  catch(e)
  {
   app.alert(res);
   reject(e);
  };
 }.bind(this));
};


LoginInterface.prototype.logged_in=function()
{
 return new Promise(function (resolve,reject)
 {
  var repl;
  try
  {
   resolve(this.connect({"action":"check"})
   .then(function(repl)
   {
    var dta=JSON.parse(repl);
    this.data=dta.data;
    return dta.status;
   }.bind(this)));
  }
  catch(e)
  {
   reject(e);
  };
 }.bind(this));
};

LoginInterface.prototype.loginTry=function(action)
{
 var spec,s,pr,nm,init,surn,us,repl;
 this.loginObj={"icon":this.icon};
 switch(action)
 {
 case 'login':
  pr="Login";
  if(this.server!="root"){pr=this.server+": "+pr}
  spec=new itemSpec('login',pr,"Object");
  spec.noheader=true;
  spec.edit=true;
  spec.className="objBlank";
  if(this.icon)
  {
   s=spec.appendChild('icon',"","Image");
   s.height=(APP_HEAD*2)+"px";
   s.readonly=true;
  };
  spec.appendChild('username',"Username","Text");
  spec.appendChild('password',"Password","Text");
  s=spec.appendChild('new',"New user","Button");
  s.readonly=true;
  s.action=this.login.bind(this,"new");
  s=spec.appendChild('reset',"Reset password","Button");
  s.readonly=true;
  s.action=this.login.bind(this,"reset");
  break;
 case 'change':
  pr="Change password";
  spec=new itemSpec('login',pr,"Object");
  spec.noheader=true;
  spec.edit=true;
  spec.className="objBlank";
  spec.appendChild('username',"Username","Text");
  spec.appendChild('password',"Old password","Text");
  spec.appendChild('password1',"Your password","Text");
  spec.appendChild('password2',"Repeat password","Text");
  break;
 case 'new':
  pr="New user";
  spec=new itemSpec('login',pr,"Object");
  spec.noheader=true;
  spec.edit=true;
  spec.className="objBlank";
  nm=spec.appendChild('name',"Name","Text");
  nm.readonly=true;
  us=spec.appendChild('username',"Username","Text");
  us.readonly=true;
  init=spec.appendChild('initials',"Initials","Text");
  init.hint="Not including surname";
  init.changer=function()
  { 
   init.emptyContainer();
   init.object=init.object.toUpperCase();
   init.object=init.object.replace(/\s/g,'');
   init.fillContainer();
   nm.emptyContainer();
   nm.object=init.object+" "+surn.object;
   nm.fillContainer();
   us.emptyContainer();
   us.object=nm.object.toLowerCase().replace(/[^a-z0-9]/g,'');
   us.fillContainer();
  };
  surn=spec.appendChild('surname',"Surname","Text");
  surn.changer=function()
  {
   nm.emptyContainer();
   nm.object=init.object+" "+surn.object;
   nm.fillContainer();
   us.emptyContainer();
   us.object=nm.object.toLowerCase().replace(/[^a-z0-9]/g,'');
   us.fillContainer();
  };
  spec.appendChild('email',"Email","Text");
  s=spec.appendChild('icon',"","Image");
  s.width="150px";s.height="45px";s.hint="Loading code...";
  s.readonly=true;
  this.loginObj.icon='../login/logintest.php?trial='+(Math.random()+(this.trialCount++));
  s=spec.appendChild('test',"Enter code","Text");
  s.hint="Enter code from image above";
  break;
 case 'reset':
  pr="Reset password";
  spec=new itemSpec('login',pr,"Object");
  spec.noheader=true;
  spec.edit=true;
  spec.appendChild('username',"Your username/email","Text");
  spec.className="objBlank";
  s=spec.appendChild('icon',"","Image");
  s.width="150px";s.height="45px";s.hint="Loading code...";
  s.readonly=true;
  this.loginObj.icon='../login/logintest.php?trial='+(Math.random()+(this.trialCount++));
  s=spec.appendChild('test',"Enter code","Text");
  s.hint="Enter code from image above";
  break;
 default:
  return false;
 };
 this.loginSpec=spec;
 this.loginAction=action;
 if(this.dialog){this.dialog.reject("overwritten");this.dialog.cancel();this.dialog=false;};
 this.dialog={"spec":spec};
 repl=app.prompt(pr,this.loginObj,this.dialog);
 return repl;
};

LoginInterface.prototype.details=async function()
{
 var spec,det,pr="User details";
 try
 {
  if(!(await this.logged_in())){app.alert("No logged in");return;};
  det=await this.connect({"action":"getuserdetails"});
  det=JSON.parse(det)['data'];
  spec=new itemSpec('login',pr,"Object");
  spec.noheader=true;
  spec.edit=true;
  spec.className="objBlank";
  spec.appendChild('prefix',"Title","Text");
  spec.appendChild('initials',"Initials","Text");
  spec.appendChild('surname',"Surname","Text");
  spec.appendChild('firstname',"First name","Text");
  spec.appendChild('address',"Address","TextArea");
  spec.appendChild('tel',"Telephone","Text");
  spec.appendChild('email',"email","Text");
  det=await app.prompt(pr,det,spec);
  det=await this.connect({"action":"setuserdetails","data":det});
  det=JSON.parse(det);
  if(det.status){app.alert("Details updated");}else{app.alert(det.message);};
 }
 catch(e){app.alert(e);};
};

LoginInterface.prototype.share=function(action,dir,key)
{
 return new Promise(async function (resolve,reject)
 {
  var list,listSpec,chooseSpec,keySpec,rpl;
  listSpec=new itemSpec("dirs","Directories","Array");
  listSpec.transparent=true;
  listSpec.readonly=true;
  listSpec.appendChild("dir","Dir","Text");
  chooseSpec=new itemSpec("dir","Directory","Text");
  try
  {
   switch(action)
   {
   case "getLinked":
    resolve((await this.connectRes({"action":"getLinked"})));
    break;
   case "getShared":
    resolve((await this.connectRes({"action":"getShared"})));
    break;
   case "deleteLink":
    resolve((await this.connectRes({"action":"deleteLink","data":{"dir":dir}})));
    break;
   case "deleteShare":
    resolve((await this.connectRes({"action":"deleteShare","data":{"dir":dir}})));
    break;
   case "createShare":
    keySpec=new itemSpec("data","Share","Object");
    keySpec.transparent=true;
    keySpec.appendChild("dir","Directory","Text");
    keySpec.appendChild("key","Key","Text");
    rpl={"dir":dir,"key":key};
    rpl=await app.prompt("Share directory",rpl,keySpec);
    resolve(await this.connectRes({"action":"createShare","data":{"dir":rpl.dir,"key":rpl.key}}));
    break;
   case "createLink":
    if(dir)
    {
     await app.prompt("Create link for directory",dir);
    }
    else
    {
     chooseSpec.options=(await app.dir("/")).dirs;
     if(chooseSpec.options.length==0){reject("No directories to share");break;};
     dir=await app.prompt("Create link for directory","",chooseSpec);
    };
    if(dir)
    {
     rpl=await this.connectRes({"action":"createLink","data":{"dir":dir,"single":0}});
     await app.prompt("Copy link",window.location.href.split(/[?#]/)[0]+"?share="+rpl.dir+"&key="+rpl.key,"copy");
     resolve(rpl.dir);
    }
    else
    {
     resolve(false);
    };    
    break;
   case "deleteLinks":
    chooseSpec.options=await this.share("getLinked");
    if(chooseSpec.options.length==0){reject("Nothing to delete");break;};
    dir=await app.prompt("Delete linked","",chooseSpec);
    if(dir)
    {
     list=await this.share("deleteLink",dir);
     resolve(await app.prompt("Shared by me",list,listSpec));
    }
    else
    {
     resolve(false);
    };
    break;
   case "deleteShares":
    chooseSpec.options=await this.share("getShared");
    if(chooseSpec.options.length==0){reject("Nothing to delete");break;};
    dir=await app.prompt("Delete shared","",chooseSpec);
    if(dir)
    {
     list=await this.share("deleteShare",dir);
     resolve(await app.prompt("Shared with me",list,listSpec));
    }
    else
    {
     resolve(false);
    };
    break;
   case "showLinked":
    list=await this.share("getLinked");
    resolve(await app.prompt("Shared by me",list,listSpec));
    break;
   case "showShared":
    list=await this.share("getShared");
    resolve(await app.prompt("Shared with me",list,listSpec));
    break;
   default:
    while(rpl=await app.menu("Sharing|Shared by me|Ceate share link|Unshare||Shared with me|Share|Delete shared"))
    {
     try
     {
      switch(rpl)
      {
      case 1:await this.share("showLinked");break;
      case 2:await this.share("createLink");break;
      case 3:await this.share("deleteLinks");break;
      case 5:await this.share("showShared");break;
      case 6:await this.share("createShare");break;
      case 7:await this.share("deleteShares");break;
      };
     }
     catch(e){await app.alert(e);};
    };
    break;
   };
  }
  catch(e)
  {
   if(!action){resolve();}else{reject(e);};
  };
 }.bind(this));
};

LoginInterface.prototype.createLoginMenu=function()
{
 if(onAServer())
 {
  app.appendToMenu("ProjectFile","Spacer","",false,false);
  app.appendToMenu("ProjectFile","MenuSub","Login",login.login.bind(login,"login"),false);
  app.appendToMenu("ProjectFile","MenuSub","New user",login.login.bind(login,"new"),false);
  app.appendToMenu("ProjectFile","MenuSub","User details",login.login.bind(login,"details"),false);
  app.appendToMenu("ProjectFile","MenuSub","Forgotten password",login.login.bind(login,"reset"),false);
  app.appendToMenu("ProjectFile","MenuSub","Change password",login.login.bind(login,"change"),false);
  app.appendToMenu("ProjectFile","MenuSub","Logout",login.login.bind(login,"logout"),false);
  app.appendToMenu("ProjectFile","Spacer","",false,false);
  app.appendToMenu("ProjectFile","MenuSub","Sharing...",login.share.bind(login),false);
 };
};

LoginInterface.prototype.login=function(action)
{
 return new Promise(function (resolve,reject)
 {
  var rpl,dta;
  try
  {
   switch(action)
   {
   case "details":
    this.details();
    resolve(true);
    return true;
   case "logout":
    resolve(this.connect({"action":"logout"})
    .then(function(rpl){
     var dta=JSON.parse(rpl);
     window.location=window.location.href.split(/[?#]/)[0];
     if(dta.error)
     {
      return app.alert(dta.error).then(function(){return dta.status;});
     }
     else
     {
      return dta.status;
     };
    }));
    break;
   case "login":
   case "new":
   case "reset":
   case "change":
    resolve(this.loginTry(action)
    .then(function(rpl){
     this.loginObj=rpl;
     this.dialog=false;
     return this.connect({"action":action,"data":this.loginObj})
     .then(function(rpl){
      try
      {
       this.loginObj.password="";
       var dta=JSON.parse(rpl);
       this.data=dta.data;
      }
      catch(e){app.alert(rpl);return;};
      if(dta.error)
      {
       return app.alert(dta.error).then(function(){return dta.status;});
      }
      else
      {
       if(dta.data && dta.data.message)
       {
        app.alert(dta.data.message);
       };
       return dta.status;
      };
     }.bind(this));  
    }.bind(this)));
    break;
   default:
    resolve(this.logged_in()
    .then(function(ok){
     if(ok)
     {
      return true;
     }
     else
     {
      return this.login('login').then(function(ok){return ok;});
     };
    }.bind(this)));
   };
  }
  catch(e)
  {
   if(e!="overwritten")
   {
    this.dialog=false;
   };
   reject(e);
  };
 }.bind(this));
};

var logins={};
var login=new LoginInterface();
