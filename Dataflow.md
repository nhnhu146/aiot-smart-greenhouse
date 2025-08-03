# IoT device

1. Input sensor

	1.1. MQTT publish

 	1.2. Backend receive

  	1.2.1. Automation checking

  	1.2.2. If trigger automation, save Device Status History

  	1.2.3. Alert checking

  	1.2.4. If trigger alert

    	1.2.4.1. Send alert (email, notification)

    	1.2.4.2. Save Alert History

  	1.2.5. Send Web Socket to notice client update Sensor Data

  	1.2.6. Send Web Socket to notice client update status of 1.2.4.2 and 1.2.2

2. Voice Command 

 	2.1. MQTT publish

 	2.2. Backend receive

  	2.2.1. Classify command
  	
		2.2.2. Save Voice History trigger
  	
		2.2.3. Save Device Status history
  	
		2.2.4. Send Web socket to notice client update Latest Voice Command
  	
		2.2.5. Send Web socket to notice client update latest Device Status

# Frontend

## Dashboard

1. User click Device Control
	
	1.1. Send API to backend
	
		1.1.1. Backend update history
	
		1.1.2. Backend send MQTT message to IoT
		
		1.1.3. Backend send Web Socket to notice other clients update status
	
	1.2. Other frontend clients receive web socket, update status and history

2. User click Automation on/off button
	
	2.1. If change to ON
	
		2.1.1. Send API to backend
	
			2.1.1.1. Backend send Web Socket to notice other clients update status
		
			2.1.1.2. Backend update automation config
			
		2.1.3. Other frontend clients receive web socket, update dashboard and automation config
		
		2.1.4. Root frontend client update automation config 

	2.2. If change to OFF

		2.2.1. Send API to backend
			
			2.2.1.1. IMMEDIATELY backend cancel all automation checking and running
			
			2.2.1.2. Backend send Web Socket to notice other clients update status
			
			2.2.1.3. Backend update automation config
		
		2.2.2. Other frontend clients receive web socket, update dashboard and automation config
		
		2.2.3. Root frontend client update automation config 
		
		2.2.4. Root frontend client update automation config 

## AutoMode page
1. User SAVE NEW CONFIGURATION

	1.1. Send API to backend

		1.1.1. Backend send Web Socket to notice other clients update status

		1.1.2. Backend update automation config

	1.2. Other frontend clients receive web socket, update dashboard and automation config

2. User click Automation on/off button
	
	2.1. If change to ON
		
		2.1.1. Send API to backend
			
			2.1.1.1. Backend send Web Socket to notice other clients update status
			
			2.1.1.2. Backend update automation config
		
		2.1.3. Other frontend clients receive web socket, update dashboard and automation config
		
		2.1.4. Root frontend client update automation config 
	
	2.2. If change to OFF
		
		2.2.1. Send API to backend
			
			2.2.1.1. IMMEDIATELY backend cancel all automation checking and running
			
			2.2.1.2. Backend send Web Socket to notice other clients update status
			
			2.2.1.3. Backend update automation config
		
		2.2.2. Other frontend clients receive web socket, update dashboard and automation config
	
		2.2.3. Root frontend client update automation config 
		
		2.2.4. Root frontend client update automation config 

## Alert settings
Same as Automode