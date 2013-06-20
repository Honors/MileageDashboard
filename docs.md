Get Token
---------
`curl -d "{\"username\":\"matt\", \"password\":\"drowssap\"}" localhost:8080/api/login`

	{"success":true,"error":null,"token":"zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4"}

Make Account
------------
`curl -d "{\"username\":\"matt\", \"password\":\"drowssap\", \"email\":\"neary.matt@gmail.com\"}" localhost:8080/api/register`

	{"success":true,"error":null,"token":"zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4"}


Get Trips
---------
`curl localhost:8080/api/trips/matt?token=zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4`
	
	{"success":true,"error":null,"trips":[{"distance":6300,"purpose":"meeting","purchases":"none","location":"Starbuck's","names":"Matt Neary","id":9089}]}

Post Trip
---------
`curl -d "{\"distance\":6300,\"purpose\":\"meeting\",\"purchases\":\"none\",\"location\":\"Starbuck's\",\"names\":\"Matt Neary\",\"id\":9089}" localhost:8080/api/trip/matt?token=zYcW0HF4ikBN2m3WpjCGzGZSU685XCzmjs4WjFQ4`

	{"success":true,"error":null}

Upload Asset
------------
`curl -F name=12345 -F filedata=@docs.md localhost:8080/api/asset/matt`

	{"success":true,"error":null}

Access Asset
------------
`curl localhost:8080/api/asset/matt/12345`
	
	RAW DATA