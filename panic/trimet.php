<?php

//
// Get TRI-MET arrivals data from TRI-MET themselves.
// -Cabel
//


// Ned: 7636 / 19
// Cabel + Les: 13169 / 14
// Mike: 7751 / 4
// Steve: 10792 / 20

$api_key = "D4763B098987904E171CD5766";

$stops = $_REQUEST["stops"];
$routes = $_REQUEST["routes"];

// For offline debugging
// $stops	= "7642,7636,13169,7636,10792";
// $routes	= "4,9,14,19,20";

// Split the passed stops into separate stops

$stop_list = preg_split('/,/', $stops);
$route_list = preg_split('/,/', $routes);

// Build an array of stops, and the routes we want from those stops

while (list($key, $val) = each($stop_list)) {
	$stop_array[$val][$route_list[$key]] = "0";
}

// Make the API Request

if ($stream = fopen("http://developer.trimet.org/ws/V1/arrivals?locIDs=$stops&appID=$api_key", 'r')) {
	$response = stream_get_contents($stream);
	fclose($stream);
} else {
	print '"error":"Couldn\'t connect to Tri-Met API"';
	exit;
}

// Find all of the <arrival>s for this bus stop

preg_match_all('/<arrival (.*?)>/', $response, $arrivals);

// Parse out the arrival detail

foreach($arrivals[0] as $arrival) {
	preg_match('/route=\"(.*?)\"/', $arrival, $route);
	preg_match('/locid=\"(.*?)\"/', $arrival, $locid);
	preg_match('/estimated=\"(.*?)\"/', $arrival, $estimated);
	preg_match('/scheduled=\"(.*?)\"/', $arrival, $scheduled);
		
	// Is this a route we're interested in at this stop?

	if ($stop_array[$locid[1]][$route[1]] != "") {

		// If there's no estimated time, fallback to the scheduled time

		if ($estimated[1] == "") {
			$estimated[1] = $scheduled[1];
		}

		// Convert Java-style milliseconds-since-1970 date object to seconds

		$estimated[1] = $estimated[1] / 1000;
		$scheduled[1] = $scheduled[1] / 1000;
	
		// Calculate number of seconds until event
	
		$estimated[1] = $estimated[1] - time();
		$scheduled[1] = $scheduled[1] - time();

		// Only store the latest, closest bus.
		
		if ($stop_array[$locid[1]][$route[1]] == "0" && $estimated[1] > 0) {
			// print "Storing first data: $estimated[1]\n";
			$stop_array[$locid[1]][$route[1]] = $estimated[1];
		}
		else if($stop_array[$locid[1]][$route[1]] && $estimated[1] < $stop_array[$locid[1]][$route[1]] && $estimated[1] > 0) {
			// print "Bumping: $estimated[1]\n";
			$stop_array[$locid[1]][$route[1]] = $estimated[1];
		} else {
			// print "Ignoring older data: $estimated[1]\n";
		}
	}
}

// Iterate through and prepare a final array with the JSON output

foreach ($stop_array as $stop => $stopdata) {
	foreach ($stopdata as $temp_route => $temp_time) {
		$final_stops[$temp_route] = "\t\t\"stop\":$stop, \"route\":".$temp_route.", \"time\":".$temp_time."\n";
	}
}

// Sort

ksort($final_stops);

// Print the JSON

$numItems = count($final_stops);
$i = 1;

print "[\n";
foreach ($final_stops as $temp_route => $data) {
	print "\t{\n";
	print $data;	
	print "\t}\n";	

	if ($i == $numItems) {
		print "\n";
	} else {
		print ",\n";
	}
	
	$i++;

}
print "]\n";

exit;

function minutes( $seconds )
{
    return sprintf( "%02.2d:%02.2d", floor( $seconds / 60 ), $seconds % 60 );
}

# <resultSet xmlns="urn:trimet:arrivals" queryTime="1267165159884">
# 	<location desc="SW Main &amp; 6th" dir="Westbound" lat="45.5163993975517" lng="-122.679838182103" locid="13169" />
# 	<arrival block="1435" departed="true" dir="1" estimated="1267165647000" fullSign="14  Hawthorne to 94th &amp; Foster" piece="1" route="14" scheduled="1267165720000" shortSign="14 To 94-Foster" status="estimated" locid="13169" detour="false">
# 		<blockPosition at="1267165115000" feet="9491" heading="180" lat="45.5121834" lng="-122.6456095">
# 			<trip desc="Madison &amp; 4th" dir="1" pattern="3" route="14" tripNum="2020" destDist="36917" progress="27426" />
# 		</blockPosition>
# 	</arrival>
# 	<arrival block="1403" departed="true" dir="1" estimated="1267166799000" fullSign="14  Hawthorne to 94th &amp; Foster" piece="2" route="14" scheduled="1267166740000" shortSign="14 To 94-Foster" status="estimated" locid="13169" detour="false">
# 		<blockPosition at="1267165135000" feet="33534" heading="289" lat="45.4827344" lng="-122.5787538">
# 			<trip desc="Madison &amp; 4th" dir="1" pattern="3" route="14" tripNum="2030" destDist="36917" progress="3383" />
# 		</blockPosition>
# 	</arrival>
# 	<arrival block="1034" departed="false" dir="1" fullSign="10  Harold to 94th &amp; Foster" piece="1" route="10" scheduled="1267192780000" shortSign="10 To 94-Foster" status="scheduled" locid="13169" detour="false" />
# </resultSet>
# 

?>