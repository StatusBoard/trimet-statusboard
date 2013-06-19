<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<?php
	$ip = $_SERVER['REMOTE_ADDR'];
	$remoteHost = gethostbyaddr($ip);

	if ( !preg_match('/^38\.103\.165\./', $ip) && !preg_match('/rev\.home\.ne\.jp/', $remoteHost) )
	{
		print "ACCESS DENIED, YO. {$_SERVER['REMOTE_ADDR']}";
		exit;
	}
	
	$modules = array(
			'supportgraph',
			'projects',
			'countdown',
			'revenue',
			'teamticker',
			'trimet',
			'calendar'
			);
?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<title>The Board</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf8" />
		<meta http-equiv="Cache-control" content="no-cache" />
		<!--<meta http-equiv="refresh" content="60" />-->
		
		<style type="text/css">
			@import url(css/3dboard.css);

			<?php	
			echo "\n";	
			foreach ( $modules as $module )
			{
				if ( file_exists("modules/$module/$module.css") )
					echo "\t\t\t@import url(modules/$module/$module.css);\n";
			}
			?>
		</style>
		
		<script type="text/javascript" src="js/main.js"></script>

		<?php		
		echo "\n";

		foreach ( $modules as $module )
		{
			if ( file_exists("modules/$module/$module.js") )
				echo "\t\t<script type=\"text/javascript\" src=\"modules/$module/$module.js\"></script>\n";
		}
		?>

		<script type="text/javascript">
			
			function init()
			{
				<?php
				echo "\n";

				foreach ( $modules as $module )
				{
					echo "\t\t\t\tif ( typeof({$module}_init) == 'function' )\n\t\t\t\t\t{$module}_init();\n\n";
					echo "\t\t\t\tif ( typeof({$module}_refresh) == 'function' )\n\t\t\t\t\tif ( {$module}_refresh_secs() != 0 ) \n\t\t\t\t\t\tsetInterval(\"{$module}_refresh()\", 1000 * {$module}_refresh_secs());\n\n";
				}
				
				if ( $_REQUEST["scroll"] )
				{
				?> 
					var elements = document.getElementsByTagName('html');
					for ( i = 0; i < elements.length; ++i )
						elements[i].style.overflow = 'auto';
				<?php
				}
				?>
			}
		</script>
	</head>
	<body onload="init()" bgcolor="#000000">
		<div id="main">
			<?php
			echo "\n";
			foreach ( $modules as $module )
			{
				if ( file_exists("modules/$module/$module.html") )
					require("modules/$module/$module.html");
			}
			?>
		</div><!-- main -->
	</body>
</html>
