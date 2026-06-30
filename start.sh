docker stop mairouter
docker rm mairouter
docker build -t mairouter .
docker run -d --name mairouter -p 12890:12890 --env-file .env -v mairouter-data:/app/data mairouter