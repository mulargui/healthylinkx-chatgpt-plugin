#!/bin/bash

#python3 ../src/main.py

# testing api
URL=http://127.0.0.1:3333/providers

test () { 
    date +"%T.%3N"
    ECHO $1
    curl -L -H 'Content-Type: application/json' "$URL?$1" ; echo
}

# testing params
test "zipcode=98052"
test "zipcode=98052&distance=10" 
test "lastname1=anderson" 
test "lastname1=anderson&lastname2=brock" 
test "lastname1=anderson&lastname2=brock&lastname3=tang-xue" 
test "specialty=Dentist"

test "zipcode=98052&lastname1=anderson" 
test "zipcode=98052&lastname1=anderson&gender=f"
test "zipcode=98052&lastname1=anderson&gender=f&specialty=Counselor"

test "zipcode=98052&distance=10&lastname1=anderson&lastname2=brock&lastname3=tang-xue&gender=f&specialty=Counselor"

# empty result
test "zipcode=98052&distance=10&lastname1=anderson&lastname2=brock&lastname3=tang-xue&gender=f&specialty=Dentist"

# insuficient params
test "gender=m"

# testing resources
URL=http://127.0.0.1:3333

curl -L -H 'Content-Type: text/yaml' "$URL/openapi.yaml"
curl -L -H 'Content-Type: application/json' "$URL/openapi.json"
curl -L -H 'Content-Type: application/json' "$URL/.well-known/ai-plugin.json"
curl -i -L -H 'Content-Type: image/png' "$URL/logo.png"
