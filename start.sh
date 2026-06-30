docker stop mairouter
docker rm mairouter
docker build -t mairouter .
docker run -d --name mairouter -p 20128:20128 --env-file .env -v mairouter-data:/app/data mairouter