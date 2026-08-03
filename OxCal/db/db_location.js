//======================================================================
// November 2005 changes, ver 4.01
// added numonly and numlet functions to stop entry of invalid characters
//
// original code by Roger Muggleton 2005
// modified by Christopher Bronk Ramsey 2007 to provide ngr_lat function only
// ======================================================================
var deg2rad = Math.PI / 180;
var rad2deg = 180.0 / Math.PI;
var pi = Math.PI;
//-------------------------------------------------------------------
//-------------------------------------------------------------------
//===================================================================
//functions for myform2
//===================================================================
//===================================================================
function transform(lat, lon, a, e, h, a2, e2, xp, yp, zp, xr, yr, zr, s)
{
  // convert to cartesian; lat, lon are radians
  sf = s * 0.000001;
  v = a / (sqrt(1 - (e *(sin(lat) * sin(lat)))));
  x = (v + h) * cos(lat) * cos(lon);
  y = (v + h) * cos(lat) * sin(lon);
  z = ((1 - e) * v + h) * sin(lat);

  xrot = (xr / 3600) * deg2rad;
  yrot = (yr / 3600) * deg2rad;
  zrot = (zr / 3600) * deg2rad;
  
  hx = x + (x * sf) - (y * zrot) + (z * yrot) + xp;
  hy = (x * zrot) + y + (y * sf) - (z * xrot) + yp;
  hz = (-1 * x * yrot) + (y * xrot) + z + (z * sf) + zp;

  // Convert back to lat, lon
  lon = atan(hy / hx);
  p = sqrt((hx * hx) + (hy * hy));
  lat = atan(hz / (p * (1 - e2)));
  v = a2 / (sqrt(1 - e2 * (sin(lat) * sin(lat))));
  errvalue = 1.0;
  lat0 = 0;
  while (errvalue > 0.001)
  {
    lat0 = atan((hz + e2 * v * sin(lat)) / p);  
    errvalue = abs(lat0 - lat);
    lat = lat0;
  }
  h = p / cos(lat) - v;
  var geo = { latitude: lat, longitude: lon };
  return(geo);
}
//===================================================================
function ne2ll(north,east,grid)  // (east, north, grid)
{
// converts NGR easting and nothing to lat, lon.
// input metres, output radians

  if (grid == 0)  // no grid specified
    grid = 1;  // default British
  // validate - check all are numbers and something is entered
  if ((String(north) == "NaN") || (String(east) == "NaN"))
  {
//    alert("Invalid northings or eastings");
    return false;
  }  
  
  if (grid == 2)  // Irish
  {
    a = 6377340.189;       // OSGBI semi-major
    b = 6356034.447;        // OSGBI semi-minor
    e0 = 200000;           // easting of false origin
    n0 = 250000;          // northing of false origin
    f0 = 1.000035;     // OSGBI scale factor on central meridian
    e2 = 0.00667054015;  // OSGBI eccentricity squared
    lam0 = -0.13962634015954636615389526147909;  // OSGBI false east
    phi0 = 0.93375114981696632365417456114141;    // OSGBI false north
//    en2ngr(round(eX), round(nX), "Irish");
  }
   if (grid == 1)  // British
  {
    a = 6377563.396;       // OSI semi-major
    b = 6356256.91;        // OSI semi-minor
    e0 = 400000;           // easting of false origin
    n0 = -100000;          // northing of false origin
    f0 = 0.9996012717;     // OSI scale factor on central meridian
    e2 = 0.0066705397616;  // OSI eccentricity squared
    lam0 = -0.034906585039886591;  // OSI false east
    phi0 = 0.85521133347722145;    // OSI false north
//    en2ngr(round(eX), round(nX), "British");
  }
  if (grid == 3)   // Channel Is
  {
    a = 6378388.000;       // INT24 ED50 semi-major
    b = 6356911.946;       // INT24 ED50 semi-minor 
    e0 = 500000;           // easting of false origin
    n0 = 0;                // northing of false origin
    f0 = 0.9996;           // INT24 ED50 scale factor on central meridian
    e2 = 0.0067226700223333;  // INT24 ED50 eccentricity squared
    lam0 = -0.0523598775598;  // INT24 ED50 false east
    phi0 = 0 * deg2rad;    // INT24 ED50 false north 
//    en2ngr(round(eX), round(nX), "Channel Islands");
  }
  var af0 = a * f0;
  var bf0 = b * f0;
  var n = (af0 - bf0) / (af0 + bf0);
  var Et = east - e0;
  var phid = InitialLat(north, n0, af0, phi0, n, bf0);
  var nu = af0 / (sqrt(1 - (e2 * (sin(phid) * sin(phid)))));
  var rho = (nu * (1 - e2)) / (1 - (e2 * (sin(phid)) * (sin(phid))));
  var eta2 = (nu / rho) - 1;
  var tlat2 = tan(phid) * tan(phid);
  var tlat4 = pow(tan(phid), 4);
  var tlat6 = pow(tan(phid), 6);
  var clatm1 = pow(cos(phid), -1);
  var VII = tan(phid) / (2 * rho * nu);
  var VIII = (tan(phid) / (24 * rho * (nu * nu * nu))) * (5 + (3 * tlat2) + eta2 - (9 * eta2 * tlat2));
  var IX = ((tan(phid)) / (720 * rho * pow(nu, 5))) * (61 + (90 * tlat2) + (45 * tlat4));
  var phip = (phid - ((Et * Et) * VII) + (pow(Et, 4) * VIII) - (pow(Et, 6) * IX)); 
  var X = pow(cos(phid), -1) / nu;
  var XI = (clatm1 / (6 * (nu * nu * nu))) * ((nu / rho) + (2 * (tlat2)));
  var XII = (clatm1 / (120 * pow(nu, 5))) * (5 + (28 * tlat2) + (24 * tlat4));
  var XIIA = clatm1 / (5040 * pow(nu, 7)) * (61 + (662 * tlat2) + (1320 * tlat4) + (720 * tlat6));
  var lambdap = (lam0 + (Et * X) - ((Et * Et * Et) * XI) + (pow(Et, 5) * XII) - (pow(Et, 7) * XIIA));

  return convert_to_wgs(grid, phip, lambdap);
}  
//===================================================================
function Marc(bf0, n, phi0, phi)
{
  var Marc = bf0 * (((1 + n + ((5 / 4) * (n * n)) + ((5 / 4) * (n * n * n))) * (phi - phi0))
    - (((3 * n) + (3 * (n * n)) + ((21 / 8) * (n * n * n))) * (sin(phi - phi0)) * (cos(phi + phi0)))
    + ((((15 / 8) * (n * n)) + ((15 / 8) * (n * n * n))) * (sin(2 * (phi - phi0))) * (cos(2 * (phi + phi0))))
    - (((35 / 24) * (n * n * n)) * (sin(3 * (phi - phi0))) * (cos(3 * (phi + phi0)))));
  return(Marc);
}
//=================================================================== 
function InitialLat(north, n0, af0, phi0, n, bf0)
{
  var phi1 = ((north - n0) / af0) + phi0;
  var M = Marc(bf0, n, phi0, phi1);
  var phi2 = ((north - n0 - M) / af0) + phi1;
  var ind = 0;
  while ((abs(north - n0 - M) > 0.00001) && (ind < 20))  // max 20 iterations in case of error
  {  
	ind = ind + 1;
	phi2 = ((north - n0 - M) / af0) + phi1;
    M = Marc(bf0, n, phi0, phi2);
    phi1 = phi2;
  }
  return(phi2);  
}
//===================================================================
function choose_where(lat, lon)
{
var where = "";
if ((lat >= 49) && (lat <= 50) && (lon >= -3) && (lon <= -2))
  where = "Channel Islands"
else if ((lon <= -6) && (lon > -11) && (lat > 51) && (lat <= 54))
  where = "Irish";
else if ((lon < -5.333) && (lon >- 11) && (lat >= 54) && (lat <= 55))
  where = "Irish";
else if ((lon < -5.9) && (lon >= -9) && (lat >= 55) && (lat < 55.5))
  where = "Irish";
else if ((lon < 1.8) && (lon > -9) && (lat > 49.8166) && (lat < 61))
  where = "British";
return where;
}
//===================================================================
function ll_iaru(geo)
// calculate IARU locator from lat, lon
// includes correction to hopefully avoid js fp maths error.
// input is in degrees.
{
    var e=geo.longitude;
    var n=geo.latitude;
	e = e + 180;
	ee = e;
	n = n + 90;
	nn = n;
	var locator = "";
	e = e / 20 + 0.0000001;
	n = n / 10 + 0.0000001;
	locator = locator + chr(65 + e) + chr(65 + n);
	e = e - floor(e);
	n = n - floor(n);
	e = e * 10;
	n = n * 10;
	locator = locator + chr(48 + e) + chr(48 + n);
	e = e - floor(e);
	n = n - floor(n);
	e = e * 24;
	n = n * 24;
	locator = locator + chr(65 + e) + chr(65 + n);
	e = e - floor(e);
	n = n - floor(n);
	e = e * 10;
	n = n * 10;
	locator = locator + chr(48 + e) + chr(48 + n);
	e = e - floor(e);
	n = n - floor(n);
	e = e * 24;
	n = n * 24;
	locator = locator + chr(65 + e) + chr(65 + n);
	return locator;
}
//===================================================================
//===================================================================
function iaru_ll(locator)
{
  var i = 0;
  var locator = locator.toUpperCase();
  var locx = locator;
  var loca = new Array();

  if (locator.length == 6)
	locator = locator + "55AA";
  if (locator.length == 8)
	locator = locator + "LL";
  if (locator.length != 10)
  {
    alert("Locator format incorrect");
    return;
  }

  // check locator format
  var myRegExp = /[A-R]{2}[0-9]{2}[A-X]{2}[0-9]{2}[A-X]{2}/;
  if (! myRegExp.test(locator))
  {
    alert("Locator format incorrect")
    return;
  }
  
  while (i < 10)
  {
    loca[i] = locator.charCodeAt(i) - 65;
    i++;
  }
  loca[2] += 17;
  loca[3] += 17;
  loca[6] += 17;
  loca[7] += 17;
  var lon = (loca[0] * 20 + loca[2] * 2 + loca[4] / 12 + loca[6] / 120 + loca[8] / 2880 - 180);
  var lat = (loca[1] * 10 + loca[3] + loca[5] / 24 + loca[7] / 240 + loca[9] /5760 - 90);
  // modified by cbr
  geo=new Object();
  geo.latitude=lat;
  geo.longitude=lon;
  return geo;
};
//===================================================================
function convert_to_wgs(grid, phip, lambdap)
{
  var WGS84_AXIS = 6378137;
  var WGS84_ECCENTRIC = 0.00669438037928458;
  var OSGB_AXIS = 6377563.396;
  var OSGB_ECCENTRIC = 0.0066705397616;
  var IRISH_AXIS = 6377340.189;
  var IRISH_ECCENTRIC = 0.00667054015;
  var INT24_AXIS = 6378388.000;
  var INT24_ECCENTRIC = 0.0067226700223333;
  var height = 10;  // dummy height
  if (grid == 1)
  {
    var geo = transform(phip, lambdap, OSGB_AXIS, OSGB_ECCENTRIC, height, WGS84_AXIS, WGS84_ECCENTRIC, 446.448, -125.157, 542.06, 0.1502, 0.247, 0.8421, 20.4894);
  }
  if (grid == 2)
  {
    var geo = transform(phip, lambdap, IRISH_AXIS, IRISH_ECCENTRIC, height, WGS84_AXIS, WGS84_ECCENTRIC, 482.53, -130.596, 564.557, -1.042, -0.214, -0.631, -8.15);
  }
  if (grid == 3)
  {  
    var geo = transform(phip, lambdap, INT24_AXIS, INT24_ECCENTRIC, height,  WGS84_AXIS, WGS84_ECCENTRIC, -83.901, -98.127, -118.635, 0, 0, 0, 0);
  } 
  return(geo);
}
//===================================================================
function val_ngr(ngr)
{
  ngr = ngr.toUpperCase();
  var lenngr = ngr.length;
  var i = 0;
  var t = "";

  // replace spaces
  while(i < lenngr)
  {
    if (ngr.charAt(i) != " ")
      t = t + ngr.charAt(i);
  i++;
  }

  // check length, then add leading space if odd - Irish?
  lenngr = t.length;
  if (lenngr >12)
  {
//    alert("NGR too long");
    return false;
  }

  var temp = round(lenngr/2)*2;
  if (lenngr != temp)
    ngr = " " + t;  // possible Irish NGR
  else
    ngr = t;

  // now format to 12 digits
  if (ngr.length == 4)
    t = ngr.substring(0,3) + "5000" + ngr.substring(3) + "5000";
  if (ngr.length == 6)
    t = ngr.substring(0,4) + "000" + ngr.substring(4) + "000";
  if (ngr.length == 8)
    t = ngr.substring(0,5) + "00" + ngr.substring(5) + "00";
  if (ngr.length == 10)
    t = ngr.substring(0,6) + "0" + ngr.substring(6) + "0";
  if (ngr.length == 12)
    t = ngr;
  ngr = t;

  // check ngr has two letters and 10 numbers
  var myRegExp = /[ A-Z]{2}[0-9]{10}/;
  if (! myRegExp.test(ngr))
  {
//    alert("NGR format incorrect")
    return false;
  }

  return conv_ngr_to_ings(ngr);
}
//===================================================================
function conv_ngr_to_ings(ngr)
{
  var grid,gridNumber;
  var myRegExp = /^[A-Z][A-Z][0-9]/;
  if (myRegExp.test(ngr))
    grid = "British";
    
  myRegExp = /^ [A-Z][0-9]/;
  if (myRegExp.test(ngr))
	grid = "Irish";
	
  myRegExp = /^W[AV][0-9]/;
  if (myRegExp.test(ngr))
    grid = "Channel Islands";

  if (grid == "Channel Islands") 
  {
    var eci = "5" + ngr.substring(2,7);
    if (ngr.charAt(1) == "V")
      var nci = "54" + ngr.substring(7,12);
    else
      var nci = "55" + ngr.substring(7,12);
    gridNumber = 3;
    var east = Number(eci);
    var north = Number(nci);
  }
  if ((grid == "British") || (grid == "Irish"))
  {
	gridNumber = 1;  // British for now
    var irish = 0;  //not Irish
    var north = Number(ngr.substring(7));
    var east = Number(ngr.substring(2,7));

    var t1 = ngr.charCodeAt(0) - 65;
    if (t1 < 0)
    {
      t1 = 18;    // S for Irish 83-65
      irish = 1;
    }

    if (t1 > 8)
      t1 = t1 -1;
    var t2 = floor(t1 / 5);
    north = north + 500000 * (3 - t2);
    east = east + 500000 * (t1 - 5 * t2 - 2);

    t1 = ngr.charCodeAt(1) - 65;
    if (t1 > 8)
      t1 = t1 - 1;
    t2 = floor(t1 / 5);
    north = north + 100000 * ( 4 - t2);
    east = east + 100000 * ( t1 - 5 * t2);

    if (irish == 1)
      gridNumber = 2;  //irish	  
  }
  return ne2ll(north,east,gridNumber);
}
//===================================================================

//end of myform2

//-------------------------------------------------------------------
//functions for myform3

//===================================================================
function geo_constants(ellipsoid)
{
// returns ellipsoid values
ellipsoid_axis = new Array();
ellipsoid_eccen = new Array();
ellipsoid_axis[0] = 6377563.396; ellipsoid_eccen[0] = 0.00667054;  //airy
ellipsoid_axis[1] = 6377340.189; ellipsoid_eccen[1] = 0.00667054;  // mod airy
ellipsoid_axis[2] = 6378160; ellipsoid_eccen[2] = 0.006694542;  //aust national
ellipsoid_axis[3] = 6377397.155; ellipsoid_eccen[3] = 0.006674372;  //bessel 1841
ellipsoid_axis[4] = 6378206.4; ellipsoid_eccen[4] = 0.006768658;  //clarke 1866
ellipsoid_axis[5] = 6378249.145; ellipsoid_eccen[5] = 0.006803511;  //clarke 1880
ellipsoid_axis[6] = 6377276.345; ellipsoid_eccen[6] = 0.00637847;  //everest
ellipsoid_axis[7] = 6377304.063; ellipsoid_eccen[7] = 0.006637847;  // mod everest
ellipsoid_axis[8] = 6378166; ellipsoid_eccen[8] = 0.006693422;  //fischer 1960
ellipsoid_axis[9] = 6378150; ellipsoid_eccen[9] = 0.006693422;  //fischer 1968
ellipsoid_axis[10] = 6378155; ellipsoid_eccen[10] = 0.006693422;  // mod fischer
ellipsoid_axis[11] = 6378160; ellipsoid_eccen[11] = 0.006694605;  //grs 1967
ellipsoid_axis[12] = 6378137; ellipsoid_eccen[12] = 0.00669438;  //  grs 1980
ellipsoid_axis[13] = 6378200; ellipsoid_eccen[13] = 0.006693422;  // helmert 1906
ellipsoid_axis[14] = 6378270; ellipsoid_eccen[14] = 0.006693422;  // hough
ellipsoid_axis[15] = 6378388; ellipsoid_eccen[15] = 0.00672267;  // int24
ellipsoid_axis[16] = 6378245; ellipsoid_eccen[16] = 0.006693422;  // krassovsky
ellipsoid_axis[17] = 6378160; ellipsoid_eccen[17] = 0.006694542;  // s america
ellipsoid_axis[18] = 6378165; ellipsoid_eccen[18] = 0.006693422;  // wgs-60
ellipsoid_axis[19] = 6378145; ellipsoid_eccen[19] = 0.006694542;  // wgs-66
ellipsoid_axis[20] = 6378135; ellipsoid_eccen[20] = 0.006694318;  // wgs-72
ellipsoid_axis[21] = 6378137; ellipsoid_eccen[21] = 0.00669438;  //wgs-84

// return values as an object
var ellipsoid = { axis: ellipsoid_axis[ellipsoid], 
                  eccentricity: ellipsoid_eccen[ellipsoid] };
return ellipsoid;
}

//===================================================================
function ll_utm(geo)
{
// modified header by cbr
lat=geo.latitude;
lon=geo.longitude;
// get ellipsoid
var d = 21;  // set to wgs-84 explicitly by cbr 10/7/08
var ellipsoid = geo_constants(d);

if (ellipsoid.axis == 0)
  {
  alert("Ellipsoid must be entered");
  return;
  }
var axis = ellipsoid.axis;
var eccent = ellipsoid.eccentricity;

if (lat >= 84 || lat <= -80)
  {
  alert("UTM latitudes should be between 84N and 80S\nCalculation will proceed anyway as locator will be valid.");
  }

return calc_utm(lat, lon, axis, eccent);
}

//===================================================================
function calc_utm(lat, lon, axis, eccent)
{
var k0 = 0.9996;
var latrad = lat * deg2rad;
var longrad = lon * deg2rad;
var zonenum = floor((lon + 180) / 6) + 1;
if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0 )
  zonenum = 32;
// Special zones for Svalbard
if( lat >= 72.0 && lat < 84.0 ) 
  {
  if (lon >= 0.0  && lon <  9.0 ) zonenum = 31;
  else if ( lon >= 9.0  && lon < 21.0 ) zonenum = 33;
  else if ( lon >= 21.0 && lon < 33.0 ) zonenum = 35;
  else if ( lon >= 33.0 && lon < 42.0 ) zonenum = 37;
 }

var lonorig = (zonenum - 1) * 6 - 180 + 3;  //+3 puts origin in middle of zone
var lonorigrad = lonorig * deg2rad;

//get letter
var letter = get_zoneletter(lat);

var eccPrimeSquared = (eccent) / (1 - eccent);

//calculate
var N = axis / sqrt(1 - eccent * sin(latrad) * sin(latrad));
var T = tan(latrad) * tan(latrad);
var C = eccPrimeSquared * cos(latrad) * cos(latrad);
var A = cos(latrad) * (longrad - lonorigrad);
var M = axis * ((1 - eccent / 4 - 3 * eccent * eccent / 64 - 5 * eccent * eccent * eccent / 256) * latrad - (3 * eccent / 8 + 3 * eccent * eccent / 32 + 45 * eccent * eccent *eccent / 1024) * sin(2 * latrad) + (15 * eccent * eccent / 256 + 45 * eccent * eccent * eccent / 1024) * sin(4 * latrad) - (35 * eccent * eccent * eccent / 3072) * sin(6 * latrad));

var easting = (k0 * N * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120) + 500000.0);
var northing = (k0 * (M + N * tan(latrad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720)));
if (lat < 0)
  northing += 10000000.0; //10000000 meter offset for southern hemisphere

// round up
easting = floor(easting);
northing = floor(northing);

// correlate index with letter
var cx ="C01D02E03F04G05H06J07K08L09M10N11P12Q13R14S15T16U17V18W19X20";
var cxi = cx.indexOf(letter,0);
var zl = Number(cx.substr(cxi + 1, 2));

// modified by cbr to return value
utmobj=new Object;
utmobj.northing = northing;
utmobj.easting = easting;
utmobj.zonenum = zonenum;
utmobj.letter = letter;
utmobj.zl = zl;
return utmobj;
};

//===================================================================
function utm_ll(utmobj)
{
// header modified by cbr
var zone = utmobj.zonenum;
var northing = utmobj.northing;
var easting = utmobj.easting;
var d = 21;  // set to wgs-84 explicitly by cbr 10/7/08
var zl = utmobj.zl;

if (zone == "" || zl == 0)
  {
  alert("You must enter a zone number and letter");
  return;
  }
if (zone == 0 || zone > 60)
  {
  alert("Zone number is out of range.\nMust be between 1 and 60.");
  return;
  }
if (isNaN(northing))
  {
  alert("Northing should be numbers only,\nno letters or spaces.");
  return;
  }
if (isNaN(easting))
  {
  alert("Easting should be numbers only,\nno letters or spaces.");
  return;
  }
if (northing < 0 || northing > 10000000)
  {
  alert("Northing value is out of range");
  return;
  }
if (easting < 160000 || easting > 834000)
  {
  alert("Easting value is out of range");
  return;
  }
ellipsoid = geo_constants(d);
if (ellipsoid.axis == 0)
  {
  alert("Ellipsoid must be entered");
  return;
  }

var axis = ellipsoid.axis;
var eccent = ellipsoid.eccentricity;
var k0 = 0.9996;

var e1 = (1 - sqrt(1 - eccent)) / (1 + sqrt(1 - eccent));
var x = easting - 500000.0; //remove 500,000 meter offset for longitude
var y = northing;

// correlate index with letter
var cx ="1C2D3E4F5G6H7J8K9L10M11N12P13Q14R15S16T17U18V19W20X";
var cxl = String(zl);
var cxi = cx.indexOf(cxl,0);
var zletter = cx.charAt(cxi + cxl.length);

var nhemisphere = 0;
if (zletter >= "N")
  nhemishere = 1;
else
  y -= 10000000.0; //remove 10,000,000 meter offset used for southern hemisphere

var longorig = (zone - 1) * 6 - 180 + 3;  //+3 puts origin in middle of zone

var eccPrimeSquared = (eccent) / (1-eccent);
var M = y / k0;
var mu = M / (axis * (1 - eccent / 4 - 3 * eccent * eccent / 64 - 5 * eccent * eccent * eccent / 256));
var phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * sin(4 * mu) + (151 * e1 * e1 * e1 / 96) * sin(6 * mu);
var phi1 = phi1Rad * rad2deg;
var N1 = axis / sqrt(1 - eccent * sin(phi1Rad) * sin(phi1Rad));

var T1 = tan(phi1Rad) * tan(phi1Rad);
var C1 = eccPrimeSquared * cos(phi1Rad) * cos(phi1Rad);
var R1 = axis * (1 - eccent) / pow(1-eccent * sin(phi1Rad) * sin(phi1Rad), 1.5);
var D = x / (N1 * k0);
var lat = phi1Rad - (N1 * tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720);
lat = lat * rad2deg;
var lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / cos(phi1Rad);
lon = longorig + lon * rad2deg;
geo=new Object();
geo.longitude=lon;
geo.latitude=lat;
return geo;
}

//===================================================================
function get_zoneletter(lat)
{
//This routine determines the correct UTM letter designator for the given latitude
//returns 'Z' if latitude is outside the UTM limits of 84N to 80S
var zoneletter;

if ((84 >= lat) && (lat >= 72)) zoneletter = 'X';
else if ((72 > lat) && (lat >= 64)) zoneletter = 'W';
else if ((64 > lat) && (lat >= 56)) zoneletter = 'V';
else if ((56 > lat) && (lat >= 48)) zoneletter = 'U';
else if ((48 > lat) && (lat >= 40)) zoneletter = 'T';
else if ((40 > lat) && (lat >= 32)) zoneletter = 'S';
else if ((32 > lat) && (lat >= 24)) zoneletter = 'R';
else if ((24 > lat) && (lat >= 16)) zoneletter = 'Q';
else if ((16 > lat) && (lat >= 8)) zoneletter = 'P';
else if (( 8 > lat) && (lat >= 0)) zoneletter = 'N';
else if (( 0 > lat) && (lat >= -8)) zoneletter = 'M';
else if ((-8> lat) && (lat >= -16)) zoneletter = 'L';
else if ((-16 > lat) && (lat >= -24)) zoneletter = 'K';
else if ((-24 > lat) && (lat >= -32)) zoneletter = 'J';
else if ((-32 > lat) && (lat >= -40)) zoneletter = 'H';
else if ((-40 > lat) && (lat >= -48)) zoneletter = 'G';
else if ((-48 > lat) && (lat >= -56)) zoneletter = 'F';
else if ((-56 > lat) && (lat >= -64)) zoneletter = 'E';
else if ((-64 > lat) && (lat >= -72)) zoneletter = 'D';
else if ((-72 > lat) && (lat >= -80)) zoneletter = 'C';
else zoneletter = chr(32 + 66); //This is here as an error flag to show that the Latitude is outside the UTM limits
return zoneletter;
}

//===================================================================

//end of myform3


//===================================================================
// toFixxed()// added cbr
function toFixxed(num,f) 
{
  f = parseInt(f/1 || 0);
  if (f < 0 || f > 20)
    alert("The number of fractional digits is out of range");
  if ((isNaN(num))||(num==null))
    return "-";
  var s = num < 0 ? "-" : "", x = Math.abs(num);
  if (x > Math.pow(10, 21))
    return s+x.toString();
  var m = Math.round(x*Math.pow(10, f)).toString();
  if (!f)
    return s+m;
  while (m.length <= f)
    m = "0"+m;
  return s+m.substring(0, m.length-f)+"."+m.substring(m.length-f);
};

// function for database
function ngr_ll(ngr)
{
 var geo=val_ngr(ngr.replace("NGR","").replace("IG",""));
 if(!geo){return false;};
 geo.longitude*=rad2deg;
 geo.latitude*=rad2deg;
 return geo;
};
function dmsObject(num,m,p)
{
  var v,res;
  res=new Object();
  v=Math.round(Math.abs(num*360000));
  res.frac=v % 100;
  v=(v-res.frac)/100;
  res.sec=v % 60 + res.frac/100;
  v=Math.round((v-res.sec)/60);
  res.min=v % 60;
  v=(v-res.min)/60;
  res.deg=v % 360;
  if(num<0)
  {
   if(m){res.neg=m;};
  }
  else
  {
   if(p){res.neg=p;};
  };
  return res;
};
function dmsString(r)
{
 var str="";
 str+=r.deg;
 if(r.sec || r.min)
 {
  str+=" "+r.min+"'";
  if(r.sec)
  {
   if(r.frac)
   {
    str+=toFixxed(r.sec,2)+'"';
   }
   else
   {
    str+=Math.round(r.sec)+'"';
   };
  };
 };
 str+=r.neg;
 return str;
};
function ll_loc(geo)
{
 if((geo.latitude==0)&&(geo.longitude==0)){return "";};
 return dmsString(dmsObject(geo.latitude,"S","N"))+" "+dmsString(dmsObject(geo.longitude,"W","E"));
};
function loc_ll(loc)
{
 var geo=new Object();
 var long_sign=1,lat_sign=1,long_pos=100,lat_pos=0,spl,lat_spl,long_spl,i,fac;
 if((ps=loc.indexOf('S'))>0){lat_sign=-1;lat_pos=ps;};
 if((ps=loc.indexOf('N'))>0){lat_sign=1;lat_pos=ps;};
 if((ps=loc.indexOf('W'))>0){long_sign=-1;long_pos=ps;};
 if((ps=loc.indexOf('E'))>0){long_sign=1;long_pos=ps;};
 if((long_pos>lat_pos)&&(lat_pos > 0))
 {
  loc=loc.replace(/[WE'":,]/g," ");
  spl=loc.split(/[NS]/);
  lat_spl=spl[0].split(/\s+/);
  long_spl=spl[1].split(/\s+/);
 }
 else
 {
  if((long_pos>lat_pos)&&(long_pos < 100))
  {
   loc=loc.replace(/[NS'":,]/g," ");
   spl=loc.split(/[WE]/);
   lat_spl=spl[1].split(/\s+/);
   long_spl=spl[0].split(/\s+/);
  }
  else
  {
   loc=loc.replace(/[NSWE'":,]/g," ");
   spl=loc.split(/\s+/);
   if(spl.length>5)
   {
   	lat_spl=spl.slice(0,3);
   	long_spl=spl.slice(3,6);
   }
   else
   {
    if(spl.length>3)
    {
   	 lat_spl=spl.slice(0,2);
   	 long_spl=spl.slice(2,4);
    }
    else
    {
     if(spl.length>1)
     {
   	  lat_spl=spl.slice(0,1);
   	  long_spl=spl.slice(1,2);
     }
     else
     {
      return false;
     };
    };
   };
  };
 };
 geo.longitude=0;
 fac=1;
 for(i=0;i<long_spl.length;i++)
 {
  if(long_spl[i]==""){continue;};
  geo.longitude+=long_sign*fac*Number(long_spl[i]);
  fac/=60;
 };
 geo.latitude=0;
 fac=1;
 for(i=0;i<lat_spl.length;i++)
 {
  if(lat_spl[i]==""){continue;};
  geo.latitude+=lat_sign*fac*Number(lat_spl[i]);
  fac/=60;
 };
 if(!geo.longitude && !geo.latitude)
 {
  geo=false;
 };
 return geo;
};
function locationToCoordinates(loc)
{
 var geo;
 geo=ngr_ll(loc);
 if(!geo)
 {
  geo=loc_ll(loc);
 };
 if(geo)
 {
  return geo.longitude+","+geo.latitude;
 };
 return false;
};
function locationToLongLat(loc)
{
 var geo;
 geo=ngr_ll(loc);
 if(!geo)
 {
  geo=loc_ll(loc);
 };
 if(!geo)
 {
  geo=new Object();
  geo.longitude=0;geo.latitude=0;
 };
 return geo;
};
//-------------------------------------------------------------------
// Maths functions

function mod(y, x)
{
if (y >= 0)
  return y - x * floor(y / x);
else
  return y + x * (floor(-y / x) + 1.0);
}

function atan2(y, x)
{
	return Math.atan2(y, x);
}

function sqrt(x)
{
	return Math.sqrt(x);
}

function tan(x)
{
	return Math.tan(x);
}

function sin(x)
{
	return Math.sin(x);
}

function cos(x)
{
	return Math.cos(x);
}

function acos(x)
{
	return Math.acos(x);
}

function floor(x)
{
	return Math.floor(x);
}

function round(x)
{
	return Math.round(x);
}

function ceil(x)
{
	return Math.ceil(x)
}

function ln(x)
{
	return Math.log(x);
}

function abs(x)
{
	return Math.abs(x);
}

function pow(x, y)
{
	return Math.pow(x, y);
}

function atan(x)
{
	return Math.atan(x);
}

function chr(x)
{
return String.fromCharCode(x);
}
