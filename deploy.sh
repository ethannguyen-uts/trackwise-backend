#~/bin/bash
echo "WHAT IS THE VERSION?"
read VERSION

docker build -t ethannguyenuts/trackwise:$VERSION . --platform=linux/amd64
docker push ethannguyenuts/trackwise:$VERSION
ssh -i ~/.ssh/id_rsa_digital_ocean root@167.99.234.191 "docker pull ethannguyenuts/trackwise:$VERSION && docker tag ethannguyenuts/trackwise:$VERSION dokku/trackwise:latest && dokku tags:deploy trackwise latest"

