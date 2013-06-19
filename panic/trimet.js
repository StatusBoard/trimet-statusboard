function trimet_init()
{
	trimetRequestData();	
			
	trimetInterval = setInterval("trimetUpdate()", 1000);
}


function trimet_refresh()
{
	trimetRequestData();	
}


function trimet_refresh_secs()
{
	return 60;
}


function trimetRequestData()
{
	var dataSource = new AJAXLoader('trimet.php?stops=7642,7636,13169,7636,10792&routes=4,9,14,19,20');
	dataSource.req.onreadystatechange = dataSource.reqStateChanged.bind(dataSource);
		
	dataSource.fill = function(jsonData)
	{
		cachedJsonData = jsonData;
		
		trimetFillWithData(cachedJsonData);
	}

	dataSource.getData();
}


function trimetFillWithData(jsonData)
{
	var minutesThreshold = 5;

	var container = document.getElementById('trimetContainer');
	
	while ( container.firstChild ) 
		container.removeChild(container.firstChild);

	var html = '';
	
	for ( var i in jsonData )
	{
		var stop = jsonData[i].stop;
		var route = jsonData[i].route;
		var time = jsonData[i].time;
		
		var min = Math.floor(time / 60);
		var sec = time % 60;

		if ( sec < 10 )
			sec = '0' + sec;

		html += '<div class="trimetLine' + (min < minutesThreshold ? " alert" : "") + '">';
		html +=	'<div class="trimetNumber">' + route + '</div>';
		
		if ( min == 0 && sec == 0 )
			html +=	'<div class="trimetTime" id="' + stop + '">Now</div>';
/*		else
 			html +=	'<div class="trimetTime" id="' + stop + '">' + min + 'm ' + sec + 's</div>'; */
		else if (min < minutesThreshold)
		{
			html +=	'<div class="trimetTime" id="' + stop + '">' + min + ':' + sec + '</div>';
		}
		else {
			html +=	'<div class="trimetTime" id="' + stop + '">' + min + ' Min</div>';		
		}
		
		html +=	'</div>';
	}
	
	container.innerHTML = html;
}


function trimetUpdate()
{
	for ( var i in cachedJsonData )
	{
		cachedJsonData[i].time -= 1;
		
		if ( cachedJsonData[i].time < 0 )
			cachedJsonData[i].time = 0;
	}
	
	trimetFillWithData(cachedJsonData);
}