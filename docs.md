Get Token
---------
`curl -d "{\"username\":\"matt\", \"password\":\"drowssap\"}" localhost:8080/api/login`

	{"success":true,"error":null,"token":"zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4"}

Get Trips
---------
`curl localhost:8080/api/trips/matt?token=zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4`
	
	{"success":true,"error":null,"trips":[{"distance":6300,"purpose":"meeting","purchases":"none","location":"Starbuck's","names":"Matt Neary","id":9089}]}

Post Trip
---------
`curl -d "{\"distance\":6300,\"purpose\":\"meeting\",\"purchases\":\"none\",\"location\":\"Starbuck's\",\"names\":\"Matt Neary\",\"id\":9089}" localhost:8080/api/trip/matt?token=zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4`

	{"success":true,"error":null}