var fileDialogWindow;
var filecontent="";
var filename="";
var nodeJS=false;

function getArgs()
{
 var args = new Object();
 var query = document.location.search.substring(1);
 var pairs = query.split("\&");
 for(var i=0;i < pairs.length; i++)
 {
  var pos=pairs[i].indexOf('=');
  if(pos==-1){ continue;};
  var argname = pairs[i].substring(0,pos);
  var value = pairs[i].substring(pos+1);
  args[argname]=decodeURIComponent(value);
 };
 return args;
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
function delCookie(name)
{
 var expireDate = new Date();
 expireDate.setFullYear(expireDate.getFullYear()-1);
 document.cookie=name+"=;expires="+expireDate.toGMTString()+";path=/";
};
function setCookie(name,value)
{
 var expireDate = new Date();
 expireDate.setFullYear(expireDate.getFullYear()+1);
 document.cookie=name+"="+encodeURIComponent(value)+";expires="+expireDate.toGMTString()+";path=/";
};
function onAServer()
{
 var re=/^http/i;
 if(nodeJS){return false;};
 return re.test(document.location);
};
function fileDialog(action,ext)
{
 if(onAServer() || localFilePossible())
 {
  if(!action)
  {
   if(window.app)
   {
    app.iFrame("Files","../fs/filedialog.html?ext="+ext,"600px","550px");    
   }
   else
   {
    window.open("../fs/filedialog.html", "","width=650,height=700,toolbar=no,location=no,menubar=no,resizable=no,status=no,scrollbars=yes");
   };
  }
  else
  {
   if(fileDialogWindow)
   {
    if(!fileDialogWindow.closed){fileDialogWindow.close();};
   };
   if(document.getElementById('fileFrame'))
   {
    document.getElementById('fileFrame').src="../fs/filedialog.html?action="+action+"&ext="+ext;
   }
   else
   {
    fileDialogWindow=window.open("../fs/filedialog.html?action="+action+"&ext="+ext, "FileDialog","width=450,height=680,toolbar=no,location=no,menubar=no,resizable=no,status=no,scrollbars=yes");
   };
  };
 }
 else
 {
  alert("Local file operations not possible with this browser");
  return false;
 };
 return true;
};
function saveFileAs(ext)
{
 return fileDialog("Save",ext);
};
function editFile(filename,ext)
{
 if(onAServer())
 {
  window.open("../fs/Edit.php?filename="+encodeURIComponent(filename)+"&ext="+ext, "EditWindow","width=650,height=650,toolbar=no,location=no,menubar=no,resizable=no,status=no");
 }
 else
 {
  if(localFilePossible())
  {
   window.open("../fs/Edit.html?filename="+encodeURIComponent(filename)+"&ext="+ext, "EditWindow","width=650,height=650,toolbar=no,location=no,menubar=no,resizable=no,status=no");
  }
  else
  {
   alert("operation not possible with this browser");
  };
 };
};
function newFile(typ)
{
 if(!typ){typ="../oxcal/OxCal.html?Mode=Input&";};
 window.open(typ,"", "toolbar=yes,location=yes,menubar=no,resizable=yes,status=yes");
};
function localFilePossible()
{
 return nodeJS;
};
function getFromServer(url,action,err,header)
{
 var xmlhttp = new XMLHttpRequest(),err_str;
 var ha;
 if(!url){err("Get error: no url");return;};
 xmlhttp.onreadystatechange = function() 
 {
   if (this.readyState == 4)
   {
     if(this.status == 200)
     {
      action(this.responseText);
     }
     else
     {
      err_str=this.status+" ";
      if(this.statusText)
      {
       err_str+=this.statusText;
      }
      else
      {
       err_str+="HttpRequest error";
      };
      if(this.responseText)
      {
       err_str+="\n"+this.responseText;
      }
      else
      {
       err_str+="\n"+url;
      };
      if(err){err(err_str);}
      else
      {
       alert(err_str);
      };
     };
   };
 };
 xmlhttp.open("GET", url, true);
 if(header)
 {
  ha=header.split(":");
  xmlhttp.setRequestHeader(ha[0],ha[1]);
 };
 xmlhttp.send();
};
function putToServer(url,data,action,err)
{
 var xmlhttp = new XMLHttpRequest(),err_str;
 if(!url){err("Put error: no url");return;};
 xmlhttp.onreadystatechange = function() 
 {
   if (this.readyState == 4)
   {
     if(this.status == 200)
     {
      action(this.responseText);
     }
     else
     {
      err_str=this.status+" ";
      if(this.statusText)
      {
       err_str+=this.statusText;
      }
      else
      {
       err_str+="HttpRequest error";
      };
      if(this.responseText)
      {
       err_str+="\n"+this.responseText;
      }
      else
      {
       err_str+="\n"+url;
      };
      if(err){err(err_str);}
      else
      {
       alert(err_str);
      };
     };
   };
 };
 xmlhttp.open("POST", url, true);
 xmlhttp.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
 xmlhttp.send(data);
};
function oxcalCall(filename,cmd,batch,action,error)
{
 var fn=myDataUrl(filename);
 putToServer(fn,cmd,function(txt){ 
   var source=fn.replace(".oxcal",".js");
   getFromServer(fn+"?action=oxcal&lock="+(!batch),function(txt){
    if(!batch)
    {
     getFromServer(source,action,error);
    }
    else
    {
     action();
    };
   },error);
  },error);
 return true;
};
function myDataUrl(fname)
{
 if(!fname){return false;};
 if(fname.indexOf('http')==0){return fname;}; // already a full url
 if(fname.indexOf('../')==0)
 {
  fname=window.location.href.substring(0,window.location.href.substring(0,window.location.href.lastIndexOf('/')).lastIndexOf('/'))+
  	fname.substring(fname.indexOf(('/')));
  return fname;
 };
 if(fname.indexOf('/mydata/')!=-1){return fname;}; // already translated
 if(fname.indexOf(":")!=-1)
 {
  fname="/drive/"+fname.split(":")[0]+fname.split(":")[1];
 };
 if(fname.indexOf('/')!=0){fname='/'+fname;};
 return '../mydata'+fname;
};
if(getCookie("NodeJs")=="true")
{
 nodeJS=true;
 document.writeln('<script type="text\/javascript" src="../fs/nodejs_extensions.js"><\/script>');
};